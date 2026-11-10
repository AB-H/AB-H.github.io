# AB-H.github.io

Personal website of Avner Bar-Hen — <https://www.bar-hen.net>, built with [Quarto](https://quarto.org).

## Editing

| Page | File |
|---|---|
| Home | `index.qmd` |
| Publications | `publications.yml` (one entry per paper; the page is `publications.qmd`) |
| Teaching | `teaching.qmd` (PDFs in `files/polys/`) |
| Career | `past.qmd` |
| Co-authors (network analysis, R) | `coauthors.qmd`, `assets/coauthors.js` |
| Contact | `contact.qmd` |
| Menu, theme | `_quarto.yml`, `styles.scss` |

Preview locally with `quarto preview` (or the *Render* button in RStudio).
The co-author page needs R with the packages `rmarkdown`, `knitr`, `yaml`, `igraph` and `jsonlite`;
it is recomputed from `publications.yml` at every build.

## Publishing

Every push to `master` renders the site and deploys it with GitHub Actions
(`.github/workflows/publish.yml`), which also reports broken links in the job log.
In the repository settings, *Pages → Source* must be set to **GitHub Actions**.
