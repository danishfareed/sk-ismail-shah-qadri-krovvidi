#!/usr/bin/env python3
"""Generate family-tree.pdf as a GRAPHICAL org-chart (boxes + connectors),
in the spirit of the original hand-drawn chart. One large landscape page;
users zoom in. Falls back to readable size; small text is expected."""
import json, os
import fitz  # PyMuPDF

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TREE = json.load(open(os.path.join(HERE, "scripts", "tree.json")))
META, NODES = TREE["meta"], TREE["nodes"]

byid = {n["id"]: n for n in NODES}
children = {}
roots = []
for n in NODES:
    children.setdefault(n["id"], [])
for n in NODES:
    p = n.get("parent")
    if p and p in byid: children.setdefault(p, []).append(n["id"])
    else: roots.append(n["id"])

# ---------- tidy tree layout (leaf units) ----------
pos = {}; xc = [0.0]; maxdepth = [0]
import sys; sys.setrecursionlimit(10000)
def layout(nid, depth):
    maxdepth[0] = max(maxdepth[0], depth)
    kids = children.get(nid, [])
    if not kids:
        x = xc[0]; xc[0] += 1
    else:
        xs = [layout(k, depth + 1) for k in kids]
        x = (xs[0] + xs[-1]) / 2.0
    pos[nid] = (x, depth)
    return x
for r in roots: layout(r, 0)
nleaves = xc[0]; depth_n = maxdepth[0] + 1

# ---------- size the page within PDF limits (<= 14000 pt) ----------
COLW = min(64.0, 13600.0 / max(1, nleaves))   # horizontal pt per leaf
ROWH = max(40.0, min(64.0, COLW * 1.3))        # vertical pt per generation
BOXW = COLW * 0.92
BOXH = ROWH * 0.5
MX, MTOP = 40.0, 150.0
PW = MX * 2 + nleaves * COLW
PH = MTOP + depth_n * ROWH + 60
PW = min(PW, 14000); PH = min(PH, 14000)
FS = max(2.4, min(7.0, COLW * 0.135))

GREEN=(0.055,0.318,0.208); GREENDEEP=(0.04,0.23,0.15); GOLD=(0.69,0.55,0.23)
GOLDBG=(0.953,0.918,0.823); OWN=(0.60,0.20,0.07); OWNBG=(0.99,0.925,0.89)
INK=(0.11,0.15,0.13); LINE=(0.80,0.78,0.73); SOFT=(0.36,0.40,0.38); WHITE=(1,1,1)

doc = fitz.open()
page = doc.new_page(width=PW, height=PH)

def cx(nid): return MX + (pos[nid][0] + 0.5) * COLW
def cyt(nid): return MTOP + pos[nid][1] * ROWH            # box top
def cyb(nid): return cyt(nid) + BOXH                       # box bottom

# ---------- connectors (orthogonal) ----------
for nid, kids in children.items():
    if not kids or nid not in pos: continue
    px = cx(nid); pyb = cyb(nid)
    bus = pyb + (ROWH - BOXH) * 0.5
    page.draw_line(fitz.Point(px, pyb), fitz.Point(px, bus), color=LINE, width=0.6)
    xs = [cx(k) for k in kids]
    page.draw_line(fitz.Point(min(xs), bus), fitz.Point(max(xs), bus), color=LINE, width=0.6)
    for k in kids:
        page.draw_line(fitz.Point(cx(k), bus), fitz.Point(cx(k), cyt(k)), color=LINE, width=0.6)

# ---------- boxes ----------
for n in NODES:
    nid = n["id"]
    if nid not in pos: continue
    x = cx(nid); top = cyt(nid)
    d = pos[nid][1]
    isroot = n.get("parent") is None
    w = BOXW * (1.7 if isroot else 1.0)
    rect = fitz.Rect(x - w/2, top, x + w/2, top + BOXH)
    if isroot:
        fill, border, txt = GREEN, GREENDEEP, WHITE; bw = 1.0
    elif n.get("owner"):
        fill, border, txt = OWNBG, OWN, OWN; bw = 1.1
    elif n.get("style") == "folder":
        fill, border, txt = (0.97,0.96,0.93), GOLD, SOFT; bw = 0.8
    elif d == 1:
        fill, border, txt = GOLDBG, GOLD, GREENDEEP; bw = 0.7
    else:
        fill, border, txt = WHITE, LINE, INK; bw = 0.6
    page.draw_rect(rect, color=border, fill=fill, width=bw, radius=0.18)
    name = n["name"] + (" ?" if n.get("uncertain") else "") + (" *" if n.get("owner") else "")
    fs = FS * (1.7 if isroot else 1.0)
    page.insert_textbox(fitz.Rect(rect.x0+1, rect.y0+0.5, rect.x1-1, rect.y1+2),
                        name, fontsize=fs, color=txt, align=1,
                        fontname="hebo" if (isroot or d<=1 or n.get("owner")) else "helv")

# ---------- title block (top-left) ----------
page.insert_text((MX, 40), "Hazrat Qutubul Aarfeen  Sirajul Saalikeen", fontsize=12, color=GOLD, fontname="hebo")
page.insert_text((MX, 72), "Shaik Ismail Shah Qadri", fontsize=30, color=GREENDEEP, fontname="hebo")
page.insert_text((MX, 94), "Family Tree & Lineage  ·  Krovvidi, Andhra Pradesh", fontsize=11, color=SOFT, fontname="helv")
page.insert_text((MX, 118), "From Baghdad with his four brothers for tableegh of Deen-e-Islam · Mosque founded 1524 A.D. · d. 1001 Hijri / 1592 A.D.",
                  fontsize=9, color=INK, fontname="helv")
page.insert_text((MX, 132), f"{len(NODES)} people · Original chart by Sufi S.M. Mujeeb · reconstructed by Mohammed Danish · add a name: WhatsApp +91 92901 69960",
                  fontsize=8.5, color=SOFT, fontname="helv")

out = os.path.join(HERE, "family-tree.pdf")
doc.save(out, deflate=True)
print(f"wrote {out}  page {PW:.0f}x{PH:.0f}pt  leaves={nleaves:.0f} depth={depth_n} colw={COLW:.1f} fs={FS:.1f}")
