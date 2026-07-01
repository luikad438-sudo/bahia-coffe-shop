# Bahia's Coffee Shop Website

Static website for Bahia's Coffee Shop, built with HTML, CSS, and vanilla JavaScript.

## Files

- `index.html` - page markup and SEO metadata
- `style.css` - responsive visual design and layout
- `script.js` - navigation, reveal effects, review marquee, and contact form behavior
- `brewlab/` - BrewLab, a standalone guided brewing companion app (see below)

## BrewLab (`brewlab/`)

A small web app for brewing filter coffee at home: pick a method (V60, Chemex,
French Press, AeroPress), set coffee amount and ratio, then follow a guided
step timer with per-pour target weights and audio cues. Finished brews can be
rated and are stored in a local brew log (`localStorage`, no backend).

It is an installable PWA: when served over HTTP(S), a service worker caches
the app shell for offline use and the manifest enables "add to home screen".
While a brew is running, the Screen Wake Lock API keeps the display awake
(where supported). The app is linked from the main site's footer.

Open `brewlab/index.html` in a browser to use it (the service worker only
activates when served over HTTP, e.g. with any static web server).

## Run Locally

Open `index.html` in a browser, or serve the folder with any static web server.

## Notes

The contact section includes a Google Maps embed and the review carousel uses duplicated hidden cards so the loop stays continuous.
The site is static and can be deployed directly from the repository root.
