# AiSec Lab Website

Static, ai-folio-inspired layout for AiSec Lab. Each section lives on its own page for easier content management:

- `index.html` — short about + links
- `news.html` — pulls from `data/news.json`
- `papers.html` — pulls numbered `.bib` files from `papers/` (1.bib, 2.bib, …)
- `projects.html` — pulls from `data/projects.json`
- `people.html` — pulls from `data/people.json`
- `gallery.html` — pulls from `data/gallery.json`
- `grants.html` — hidden for now; only linked from its footer

Home page extras:
- Hero news card scrolls updates from `data/news.json`.
- Terminal-style panel supports commands: `help`, `news`, `papers`, `projects`, `people`, `gallery`, `clear` (reads from the JSON/Bib data).

## Edit content
- Update lab name/text in the HTML headers; most content comes from the JSON/Bib files in `data/` and `papers/`.
- Papers: drop or replace `papers/1.bib`, `2.bib`, … (stop numbering where you want the list to end).
- News/Projects/People/Gallery: edit the respective JSON files; fields are self-describing. Optional `"image": "relative/path.jpg"` fields allow thumbnails (news, projects, people, papers) and backgrounds (gallery).
- Store images under `assets/images/<news|projects|people|gallery|papers>/` for easy organization.
- Navigation: add a link to `grants.html` if you want to surface the grants page.

## Local preview
Serve the folder with any static server, e.g.:

```bash
python3 -m http.server 4000
```

Then open `http://localhost:4000` in your browser.

Or run the helper script (builds then serves `dist/`):

```bash
./scripts/local-preview.sh
```

## Static build (pre-render data into HTML)
- Run `node build.js` to render pages with data into `dist/` (copies assets, data, papers).
- The output can be served directly (e.g., GitHub Pages) without needing runtime fetches for the data.

## GitHub Actions
- `.github/workflows/build.yml` runs `node build.js` on push and uploads the `dist` artifact.
- The same workflow deploys to GitHub Pages; site will publish at `https://sayederfanarefin.github.io/aisec-lab-website/`.

## Deploying to GitHub Pages
- The workflow deploys automatically on push to `main`/`master`. Expected URL: `https://sayederfanarefin.github.io/aisec-lab-website/`.
- If disabled, enable Pages (Source: GitHub Actions) in repo settings.
