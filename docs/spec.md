# Ismail Shah Qadri Family Tree — Online Reconstruction

## Goal
Reconstruct a ~4ft hand-composed genealogical chart (photographed in 4 overlapping
batches) into a clean, white-background static website with an interactive tree,
an outline view, search, and a downloadable PDF. Deployable to Cloudflare Pages
from GitHub.

## Source
- Root patriarch: **Hazrat Qutubul Aarfeen Sirajul Salikeen SK Ismail Shah Qadri**,
  who came from Baghdad with his 4 brothers for tableegh of deen-e-Islam, was sent
  by the ruler to South India, and settled in **Krovvidi, Andhra Pradesh**.
- A mosque sits beside the dargah: https://maps.app.goo.gl/qhEz8VM44VQ7t6y17
- Original chart "Composed & Designed by Sufi S.M. Mujeeb".
- 4 batch photos + a CamScanner PDF (4 pages). High-res images extracted from PDF.

## Owner's lineage (to anchor)
Fareeduddin (grandfather, printed on chart) -> Mohammed Ansar Pasha (father) ->
**Mohammed Danish** (owner, handwritten on chart) -> **Mohammed Hussain Ali** (son).

## Decisions
- Tree view: interactive zoom/pan org-chart **and** an expandable outline; toggle.
- Search, expand-all/collapse-all, "jump to my lineage".
- PDF: pre-generated `family-tree.pdf` **and** a print-to-PDF button.
- Language: English (Roman) only.
- Delivery: small static site in repo root (index.html, styles.css, app.js, data.js,
  assets/, family-tree.pdf, README with Cloudflare Pages steps).
- Footer credits: original chart by **Sufi S.M. Mujeeb**; reconstructed & built into
  this online version by **Mohammed Danish**. "Add a name" -> WhatsApp +91 92901 69960.

## Reconstruction method
1. Slice each batch into overlapping, upscaled tiles (54 total) for legibility.
2. Multi-agent workflow: one agent per tile transcribes every name box ->
   {text, parent_text, style (printed/pen), normalized position, edge-cut flag}.
3. Per-page consolidation agents dedupe and link into page subtrees.
4. Synthesize the master tree, aligning pages via overlap and the patriarch spine.
5. Mark uncertain names with "?". Data lives in editable `data.js`.

## Accuracy note
The scan is degraded and partly handwritten. Several hundred names; a few will be
uncertain (marked "?"). The editable data file + WhatsApp contact enable corrections.
