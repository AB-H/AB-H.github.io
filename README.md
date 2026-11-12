# AB-H.github.io

Personal website of Avner Bar-Hen — <https://www.bar-hen.net>, built with [Quarto](https://quarto.org).

## Editing

| Page | File |
|---|---|
| Home | `index.qmd` |
| Publications | `publications.yml` (one entry per paper; the page is `publications.qmd`) |
| Outreach | `outreach.yml` (books, The Conversation, Images des maths, press) |
| Teaching | `teaching.qmd` (PDFs in `files/polys/`) |
| Career | `past.qmd` |
| Co-authors (network analysis, R) | `coauthors.qmd`, `assets/coauthors.js` |
| Contact | `contact.qmd` |
| Menu, theme | `_quarto.yml`, `styles.scss` |

Preview locally with `quarto preview` (or the *Render* button in RStudio).
The co-author page needs R with the packages `rmarkdown`, `knitr`, `yaml`, `igraph` and `jsonlite`;
it is recomputed from `publications.yml` at every build.

## Unlisted files

Files put in `Perso/` are published as is, without any link from the site
and without appearing in the sitemap or the site search, e.g.
`Perso/outil_formations.html` → <https://www.bar-hen.net/Perso/outil_formations.html>.
They remain public for anyone who knows the address.

## Publishing

Every push to `master` renders the site and deploys it with GitHub Actions
(`.github/workflows/publish.yml`), which also reports broken links in the job log.
In the repository settings, *Pages → Source* must be set to **GitHub Actions**.
