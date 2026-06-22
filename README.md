# Bahia's Coffee Shop Website

Static website for Bahia's Coffee Shop, built with HTML, CSS, and vanilla JavaScript.

## Files

- `index.html` - page markup and SEO metadata
- `style.css` - responsive visual design and layout (base "Glass" look)
- `script.js` - navigation, reveal effects, review marquee, and contact form behavior

## Style Preview

Open `preview.html` to compare three UI/UX directions on the same content via a
bottom style switcher (the choice is remembered in `localStorage`):

- **Glass** - warm, frosted, rounded (the current production look in `index.html`)
- **Editorial** - flat paper & ink, sharp corners, hairline rules (`theme-editorial.css`)
- **Noir** - dark espresso surfaces with gold accents (`theme-noir.css`)

Each theme is an override layer loaded on top of `style.css`, swapped by
`theme-switch.js`. `preview.html` is a demo page and is excluded from indexing.

## Run Locally

Open `index.html` in a browser, or serve the folder with any static web server.

## Notes

The contact section includes a Google Maps embed and the review carousel uses duplicated hidden cards so the loop stays continuous.
The site is static and can be deployed directly from the repository root.
