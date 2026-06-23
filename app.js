/* ============================================================
   Family tree engine — chart + outline, search, pan/zoom, PDF
   Consumes window.FAMILY_DATA = { meta, nodes:[{id,name,parent,note?,style?,uncertain?,owner?}] }
   ============================================================ */
(function () {
  "use strict";
  const DATA = window.FAMILY_DATA || { meta: {}, nodes: [] };
  const META = DATA.meta || {};
  const INITIAL_DEPTH = 2; // chart/outline expanded to this depth by default

  /* ---------- Build the tree ---------- */
  const byId = new Map();
  DATA.nodes.forEach(n => byId.set(n.id, Object.assign({ children: [] }, n)));
  let roots = [];
  byId.forEach(n => {
    if (n.parent && byId.has(n.parent)) byId.get(n.parent).children.push(n);
    else roots.push(n);
  });
  // depth + owner path
  const ownerPath = new Set();
  (function assignDepth(list, depth, ancestors) {
    list.forEach(n => {
      n.depth = depth;
      if (n.owner) ancestors.concat(n.id).forEach(id => ownerPath.add(id));
      assignDepth(n.children, depth + 1, ancestors.concat(n.id));
    });
  })(roots, 0, []);
  // re-run owner path so ancestors of owner are captured even if owner deep
  ownerPath.clear();
  (function markOwner(list, ancestors) {
    list.forEach(n => {
      const chain = ancestors.concat(n.id);
      if (n.owner) chain.forEach(id => ownerPath.add(id));
      markOwner(n.children, chain);
    });
  })(roots, []);

  const totalPeople = byId.size;

  /* ---------- Helpers ---------- */
  const esc = s => (s == null ? "" : String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));
  function nameHTML(n) {
    let nm = esc(n.name);
    if (n.uncertain) nm += ' <span class="q">?</span>';
    return nm;
  }
  function descCount(n) {
    let c = 0;
    (function walk(x) { x.children.forEach(k => { c++; walk(k); }); })(n);
    return c;
  }

  /* ============================================================
     CHART VIEW
     ============================================================ */
  const treeRoot = document.getElementById("tree-root");
  function buildChart(list, container) {
    list.forEach(n => {
      const li = document.createElement("li");
      li.dataset.id = n.id;
      const card = document.createElement("div");
      let cls = "node";
      if (n.depth === 0) cls += " root";
      else if (n.depth === 1) cls += " gen1";
      if (n.style === "handwritten") cls += " handwritten";
      if (n.owner) cls += " owner";
      card.className = cls;
      const kids = n.children.length;
      card.innerHTML = '<span class="nm">' + nameHTML(n) + "</span>" +
        (kids ? '<span class="kids-badge">' + kids + (kids === 1 ? " child" : " children") + "</span>" : "");
      if (n.note) card.title = n.note;
      li.appendChild(card);
      if (kids) {
        const ul = document.createElement("ul");
        buildChart(n.children, ul);
        li.appendChild(ul);
        // collapse beyond initial depth (but keep owner path open)
        if (n.depth >= INITIAL_DEPTH && !ownerPath.has(n.id)) {
          li.classList.add("collapsed");
          card.classList.add("collapsed-flag");
        }
        card.addEventListener("click", e => {
          e.stopPropagation();
          const collapsed = li.classList.toggle("collapsed");
          card.classList.toggle("collapsed-flag", collapsed);
        });
      }
      container.appendChild(li);
    });
  }
  buildChart(roots, treeRoot);

  /* ---------- Pan & zoom ---------- */
  const viewport = document.getElementById("chart-viewport");
  const canvas = document.getElementById("chart-canvas");
  let scale = 1, panX = 20, panY = 0;
  function applyTransform() {
    canvas.style.transform = "translate(" + panX + "px," + panY + "px) scale(" + scale + ")";
  }
  function clampScale(s) { return Math.min(2.2, Math.max(0.18, s)); }
  applyTransform();

  let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0, moved = false;
  viewport.addEventListener("mousedown", e => {
    if (e.target.closest(".node")) return; // let card clicks through
    dragging = true; moved = false; sx = e.clientX; sy = e.clientY; ox = panX; oy = panY;
    viewport.classList.add("grabbing");
  });
  window.addEventListener("mousemove", e => {
    if (!dragging) return;
    panX = ox + (e.clientX - sx); panY = oy + (e.clientY - sy);
    if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 3) moved = true;
    applyTransform();
  });
  window.addEventListener("mouseup", () => { dragging = false; viewport.classList.remove("grabbing"); });

  viewport.addEventListener("wheel", e => {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const prev = scale;
    scale = clampScale(scale * (e.deltaY < 0 ? 1.12 : 0.89));
    // zoom toward cursor
    panX = mx - (mx - panX) * (scale / prev);
    panY = my - (my - panY) * (scale / prev);
    applyTransform();
  }, { passive: false });

  // touch pan/pinch
  let touchDist = 0;
  viewport.addEventListener("touchstart", e => {
    if (e.touches.length === 1) { dragging = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY; ox = panX; oy = panY; }
    else if (e.touches.length === 2) { touchDist = dist2(e); }
  }, { passive: true });
  viewport.addEventListener("touchmove", e => {
    if (e.touches.length === 1 && dragging) {
      panX = ox + (e.touches[0].clientX - sx); panY = oy + (e.touches[0].clientY - sy); applyTransform();
    } else if (e.touches.length === 2) {
      const d = dist2(e); if (touchDist) { scale = clampScale(scale * d / touchDist); applyTransform(); } touchDist = d;
      e.preventDefault();
    }
  }, { passive: false });
  viewport.addEventListener("touchend", () => { dragging = false; });
  function dist2(e) { const a = e.touches[0], b = e.touches[1]; return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }

  document.getElementById("zoom-in").onclick = () => { scale = clampScale(scale * 1.18); applyTransform(); };
  document.getElementById("zoom-out").onclick = () => { scale = clampScale(scale * 0.85); applyTransform(); };
  document.getElementById("zoom-reset").onclick = () => { scale = 1; panX = 20; panY = 0; applyTransform(); };

  /* ============================================================
     OUTLINE VIEW
     ============================================================ */
  const outlineRoot = document.getElementById("outline-root");
  outlineRoot.innerHTML = "";
  (function buildOutlineRoot() {
    const ul = document.createElement("ul");
    function rec(list, parentEl) {
      const u = document.createElement("ul");
      list.forEach(n => {
        const li = document.createElement("li");
        li.dataset.id = n.id;
        const hasKids = n.children.length > 0;
        const row = document.createElement("div");
        row.className = "o-row" + (n.depth === 0 ? " is-root" : n.depth === 1 ? " is-gen1" : "") + (n.owner ? " is-owner" : "");
        let tags = "";
        if (n.owner) tags += '<span class="o-tag owner">You</span>';
        else if (n.style === "handwritten") tags += '<span class="o-tag hand">added</span>';
        const badge = hasKids ? '<span class="o-badge">· ' + n.children.length + (n.children.length === 1 ? " child" : " children") + "</span>" : "";
        const note = n.note ? ' <span class="o-note">— ' + esc(n.note) + "</span>" : "";
        row.innerHTML = '<button class="o-caret' + (hasKids ? "" : " leaf") + '">▶</button>' +
          '<span class="o-name">' + nameHTML(n) + "</span> " + tags + badge + note;
        li.appendChild(row);
        if (hasKids) {
          rec(n.children, li);
          const caretEl = row.querySelector(".o-caret");
          const open = n.depth < INITIAL_DEPTH || ownerPath.has(n.id);
          if (!open) li.classList.add("collapsed"); else caretEl.classList.add("open");
          caretEl.addEventListener("click", () => {
            const c = li.classList.toggle("collapsed");
            caretEl.classList.toggle("open", !c);
          });
        }
        u.appendChild(li);
      });
      parentEl.appendChild(u);
    }
    rec(roots, outlineRoot);
  })();

  /* ============================================================
     VIEW TOGGLE
     ============================================================ */
  const chartView = document.getElementById("chart-view");
  const outlineView = document.getElementById("outline-view");
  const vChart = document.getElementById("view-chart");
  const vOutline = document.getElementById("view-outline");
  const zoomGroup = document.getElementById("zoom-group");
  function setView(which) {
    const chart = which === "chart";
    chartView.classList.toggle("hidden", !chart);
    outlineView.classList.toggle("hidden", chart);
    vChart.classList.toggle("active", chart);
    vOutline.classList.toggle("active", !chart);
    zoomGroup.style.visibility = chart ? "visible" : "hidden";
  }
  vChart.onclick = () => setView("chart");
  vOutline.onclick = () => setView("outline");

  /* ============================================================
     EXPAND / COLLAPSE ALL
     ============================================================ */
  function setAll(collapsed) {
    // chart
    treeRoot.querySelectorAll("li").forEach(li => {
      if (li.querySelector(":scope > ul")) {
        li.classList.toggle("collapsed", collapsed);
        const card = li.querySelector(":scope > .node");
        if (card) card.classList.toggle("collapsed-flag", collapsed);
      }
    });
    // outline
    outlineRoot.querySelectorAll("li").forEach(li => {
      if (li.querySelector(":scope > ul")) {
        li.classList.toggle("collapsed", collapsed);
        const c = li.querySelector(":scope > .o-row > .o-caret");
        if (c) c.classList.toggle("open", !collapsed);
      }
    });
  }
  document.getElementById("expand-all").onclick = () => setAll(false);
  document.getElementById("collapse-all").onclick = () => setAll(true);

  /* ============================================================
     SEARCH
     ============================================================ */
  const searchEl = document.getElementById("search");
  const searchWrap = searchEl.closest(".search-wrap");
  const searchCount = document.getElementById("search-count");
  function ancestorsOf(id) {
    const out = [];
    let n = byId.get(id);
    while (n && n.parent) { out.push(n.parent); n = byId.get(n.parent); }
    return out;
  }
  function expandAncestorsChart(id) {
    ancestorsOf(id).forEach(aid => {
      const li = treeRoot.querySelector('li[data-id="' + cssId(aid) + '"]');
      if (li) { li.classList.remove("collapsed"); const c = li.querySelector(":scope > .node"); if (c) c.classList.remove("collapsed-flag"); }
    });
  }
  function expandAncestorsOutline(id) {
    ancestorsOf(id).forEach(aid => {
      const li = outlineRoot.querySelector('li[data-id="' + cssId(aid) + '"]');
      if (li) { li.classList.remove("collapsed"); const c = li.querySelector(":scope > .o-row > .o-caret"); if (c) c.classList.add("open"); }
    });
  }
  function cssId(id) { return String(id).replace(/"/g, '\\"'); }

  let searchTimer = null;
  function runSearch() {
    const q = searchEl.value.trim().toLowerCase();
    searchWrap.classList.toggle("has-text", q.length > 0);
    // clear
    treeRoot.querySelectorAll(".node.match,.node.dim").forEach(el => el.classList.remove("match", "dim"));
    outlineRoot.querySelectorAll(".o-row.match").forEach(el => el.classList.remove("match"));
    if (!q) { searchCount.textContent = ""; return; }
    const matches = [];
    byId.forEach(n => { if (n.name.toLowerCase().includes(q)) matches.push(n); });
    searchCount.textContent = matches.length ? matches.length + " found" : "no match";
    if (!matches.length) return;
    // dim all chart nodes, highlight matches + expand
    treeRoot.querySelectorAll(".node").forEach(el => el.classList.add("dim"));
    matches.forEach(n => {
      expandAncestorsChart(n.id); expandAncestorsOutline(n.id);
      const li = treeRoot.querySelector('li[data-id="' + cssId(n.id) + '"]');
      if (li) { const c = li.querySelector(":scope > .node"); if (c) { c.classList.add("match"); c.classList.remove("dim"); } }
      const oli = outlineRoot.querySelector('li[data-id="' + cssId(n.id) + '"] > .o-row');
      if (oli) oli.classList.add("match");
    });
    // scroll first match into view (outline) / center (chart)
    const first = matches[0];
    const oFirst = outlineRoot.querySelector('li[data-id="' + cssId(first.id) + '"]');
    if (oFirst && !outlineView.classList.contains("hidden")) oFirst.scrollIntoView({ behavior: "smooth", block: "center" });
    if (!chartView.classList.contains("hidden")) centerChartNode(first.id);
  }
  function centerChartNode(id) {
    const li = treeRoot.querySelector('li[data-id="' + cssId(id) + '"] > .node');
    if (!li) return;
    const vpRect = viewport.getBoundingClientRect();
    const nodeRect = li.getBoundingClientRect();
    // current node center in viewport coords -> move pan so it centers
    const cx = nodeRect.left + nodeRect.width / 2 - vpRect.left;
    const cy = nodeRect.top + nodeRect.height / 2 - vpRect.top;
    panX += (vpRect.width / 2 - cx);
    panY += (vpRect.height / 2 - cy);
    applyTransform();
  }
  searchEl.addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(runSearch, 140); });
  document.getElementById("search-clear").onclick = () => { searchEl.value = ""; runSearch(); searchEl.focus(); };

  /* ============================================================
     JUMP TO MY LINEAGE
     ============================================================ */
  document.getElementById("jump-mine").onclick = () => {
    let owner = null; byId.forEach(n => { if (n.owner) owner = n; });
    if (!owner) { alert("Owner node not marked yet."); return; }
    expandAncestorsChart(owner.id); expandAncestorsOutline(owner.id);
    if (!chartView.classList.contains("hidden")) {
      scale = 1; applyTransform();
      setTimeout(() => centerChartNode(owner.id), 30);
    } else {
      const oli = outlineRoot.querySelector('li[data-id="' + cssId(owner.id) + '"]');
      if (oli) oli.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  /* ============================================================
     PRINT / PDF
     ============================================================ */
  function buildPrintTree() {
    const host = document.getElementById("print-tree");
    host.innerHTML = "";
    function rec(list, parent) {
      const ul = document.createElement("ul");
      list.forEach(n => {
        const li = document.createElement("li");
        const cls = n.depth === 0 ? "p-root" : n.depth === 1 ? "p-gen1" : n.owner ? "p-owner" : "";
        let nm = esc(n.name) + (n.uncertain ? ' <span class="p-q">?</span>' : "") + (n.owner ? " ★" : "");
        li.innerHTML = '<div class="p-row"><span class="p-name ' + cls + '">' + nm + "</span></div>";
        if (n.children.length) rec(n.children, li);
        ul.appendChild(li);
      });
      parent.appendChild(ul);
    }
    rec(roots, host);
  }
  document.getElementById("download-pdf").onclick = () => { buildPrintTree(); window.print(); };

  /* ============================================================
     META WIRING
     ============================================================ */
  const wa = (META.whatsapp || "+919290169960").replace(/[^0-9]/g, "");
  const waMsg = encodeURIComponent("Assalamu Alaikum, I'd like to add/correct a name in the Shaik Ismail Shah Qadri family tree.");
  const waUrl = "https://wa.me/" + wa + "?text=" + waMsg;
  const addBtn = document.getElementById("add-name-btn"); if (addBtn) addBtn.href = waUrl;
  const footWa = document.getElementById("footer-wa"); if (footWa) footWa.href = waUrl;
  const pc = document.getElementById("people-count");
  function maxGen() { let m = 0; byId.forEach(n => { if (n.depth > m) m = n.depth; }); return m; }
  if (pc) pc.textContent = totalPeople + " people · " + (maxGen() + 1) + " generations recorded";

  setView("chart");
  // start centered-ish
  requestAnimationFrame(() => { panX = Math.max(20, viewport.clientWidth / 2 - 180); applyTransform(); });
})();
