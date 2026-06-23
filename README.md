# Shaik Ismail Shah Qadri — Family Tree

An interactive, reconstructed family tree of **Hazrat Qutubul Aarfeen Sirajul Saalikeen
Shaik Ismail Shah Qadri** of **Krovvidi, Andhra Pradesh** — who came from Baghdad with
his four brothers for the tableegh of Deen-e-Islam and settled in South India.

- **Interactive chart** (zoom / pan / collapse branches) + **outline view**
- **Search** any name · **Jump to my lineage**
- **Download / Print PDF** (bundled `family-tree.pdf` + live print)
- White, clean, mobile-friendly · no build step · pure static site

Original ~4ft chart **composed & designed by Sufi S.M. Mujeeb**.
Reconstructed and built into this online version by **Mohammed Danish**.

## Files
| File | Purpose |
|------|---------|
| `index.html` | The page |
| `styles.css` | Styling + print/PDF layout |
| `app.js` | Tree engine (chart, outline, search, pan/zoom, PDF) |
| `data.js` | **The whole family tree as editable data** — edit here to add/fix names |
| `assets/` | Web-optimised scans + thumbnails |
| `family-tree.pdf` | Pre-generated downloadable PDF |
| `source/` | Original photographs & CamScanner PDF of the chart (provenance) |
| `docs/spec.md` | Design notes |

## Editing the tree
Open `data.js`. Each person is one line:
```js
{ id: "n123", name: "Some Name Saheb", parent: "n045", note: "optional", uncertain: false }
```
- `parent` is the `id` of the father. The patriarch has `parent: null`.
- `uncertain: true` shows a small “?” for names that were faint on the scan.
- `style: "handwritten"` marks pen additions; `owner: true` highlights a person.

To **add a name**: copy a line, give it a new unique `id`, set `name` and the correct
`parent` id. Save — done. (Or message **WhatsApp +91 92901 69960** and it’ll be added.)

## Run locally
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
(Any static server works; or just open `index.html` in a browser.)

## Deploy on Cloudflare Pages (via GitHub)
1. Push this repo to GitHub (already configured):
   ```bash
   git add -A && git commit -m "Family tree site"
   git push -u origin main
   ```
2. In the **Cloudflare dashboard → Workers & Pages → Create → Pages →
   Connect to Git**, pick this repository.
3. Build settings: **Framework preset = None**, **Build command = (leave empty)**,
   **Build output directory = `/`** (the repo root). Save & Deploy.
4. Every `git push` to `main` redeploys automatically.

That’s it — no framework, no build, just static files.
