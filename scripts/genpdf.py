#!/usr/bin/env python3
"""Generate family-tree.pdf (clean, paginated outline) from tree.json."""
import json, sys, os
import fitz  # PyMuPDF

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TREE = json.load(open(os.path.join(HERE, "scripts", "tree.json")))
META = TREE["meta"]; NODES = TREE["nodes"]

# build tree
byid = {n["id"]: dict(n, children=[]) for n in NODES}
roots = []
for n in byid.values():
    p = n.get("parent")
    if p and p in byid: byid[p]["children"].append(n)
    else: roots.append(n)

GREEN = (0.055, 0.318, 0.208); GREENDEEP=(0.04,0.23,0.15)
GOLD = (0.69, 0.55, 0.23); OWN=(0.60,0.20,0.07); INK=(0.11,0.15,0.13); SOFT=(0.36,0.40,0.38)

doc = fitz.open()
PW, PH = fitz.paper_size("a4")
MARGIN = 48
LINE = 13.2
y = 0; page = None

def new_page():
    global page, y
    page = doc.new_page(width=PW, height=PH)
    y = MARGIN

def ensure(space=LINE):
    global y
    if page is None or y + space > PH - MARGIN:
        new_page()

def text(x, s, size=9.5, color=INK, font="helv"):
    global y
    page.insert_text((x, y), s, fontsize=size, color=color, fontname=font)

# ---------- title page ----------
new_page()
page.draw_rect(fitz.Rect(0, 0, PW, 150), color=None, fill=(0.98,0.97,0.94))
y = 60
page.insert_text((MARGIN, y), "Hazrat Qutubul Aarfeen  Sirajul Saalikeen", fontsize=11, color=GOLD, fontname="hebo")
y += 34
page.insert_text((MARGIN, y), "Shaik Ismail Shah Qadri", fontsize=30, color=GREENDEEP, fontname="hebo")
y += 24
page.insert_text((MARGIN, y), "Family Tree & Lineage  ·  Krovvidi, Andhra Pradesh", fontsize=11, color=SOFT, fontname="helv")
y = 175
story = [
    "Shaik Ismail Shah Qadri came from Baghdad together with his four brothers to spread the",
    "tableegh of Deen-e-Islam. The ruler of the time sent him to South India, and so he came to",
    "settle in Krovvidi, Andhra Pradesh, where his dargah and a mosque stand to this day.",
    "",
    "Mosque founded 1524 A.D.  ·  His mazaar lies on the north side of the mosque.",
    "Passed away 1001 Hijri / 1592 A.D., during the reign of Quli Qutub Shah of the Deccan.",
]
for ln in story:
    page.insert_text((MARGIN, y), ln, fontsize=10.5, color=INK, fontname="helv"); y += 16
y += 10
page.insert_text((MARGIN, y), f"{len(NODES)} people recorded across the chart.", fontsize=10, color=SOFT, fontname="helv"); y+=15
page.insert_text((MARGIN, y), "Original chart composed & designed by Sufi S.M. Mujeeb.", fontsize=10, color=SOFT, fontname="helv"); y+=14
page.insert_text((MARGIN, y), "Reconstructed & built into this online version by Mohammed Danish.", fontsize=10, color=SOFT, fontname="helv"); y+=14
page.insert_text((MARGIN, y), "To add or correct a name: WhatsApp +91 92901 69960", fontsize=10, color=GREEN, fontname="helv")

# ---------- outline pages ----------
new_page()
page.insert_text((MARGIN, y), "The Family Tree", fontsize=15, color=GREENDEEP, fontname="hebo"); y += 22

def render(n, depth):
    global y
    ensure()
    x = MARGIN + depth * 15
    size = 13 if depth == 0 else (10.5 if depth == 1 else 9.3)
    font = "hebo" if depth <= 1 or n.get("owner") else "helv"
    col = GREENDEEP if depth == 0 else (GREEN if depth == 1 else (OWN if n.get("owner") else INK))
    bullet = "" if depth == 0 else ("•  " if depth == 1 else "–  ")
    label = n["name"] + (" ?" if n.get("uncertain") else "") + ("  ★" if n.get("owner") else "")
    # connector dots
    if depth >= 2:
        page.draw_line(fitz.Point(MARGIN + (depth-1)*15 + 3, y-3), fitz.Point(x-3, y-3), color=(0.85,0.83,0.78), width=0.5)
    page.insert_text((x, y), bullet + label, fontsize=size, color=col, fontname=font)
    y += LINE if depth else LINE+6
    for c in n["children"]:
        render(c, depth+1)

for r in roots:
    render(r, 0)

# page numbers
for i, pg in enumerate(doc):
    if i == 0: continue
    pg.insert_text((PW/2 - 10, PH - 24), str(i), fontsize=8, color=SOFT, fontname="helv")

out = os.path.join(HERE, "family-tree.pdf")
doc.save(out, deflate=True)
print("wrote", out, "pages:", doc.page_count)
