# CLAUDE.md

Personal site of Pranay Yelugam (pranayyelugam.com). React 18 + Vite 7, react-router-dom v5,
SCSS, deployed to GitHub Pages. See README.md for the public overview.

## Commands

```bash
npm start                         # dev server (Vite, :5173)
npm run lint -- --max-warnings=0  # must pass clean
npm run build                     # must pass; read the output (precache size, warnings)
npm run preview                   # serve dist/ to check the production build
npm run deploy                    # build + push dist/ to gh-pages (outward-facing: only when asked)
```

There is no test runner. A change is verified by lint + build + looking at it: headless Chrome
(puppeteer-core against the system Chrome) screenshots in **both themes** and at **390px mobile**,
plus zero console errors. Set the theme before load with
`localStorage.setItem('portfolio-theme', 'professional' | 'futuristic')`.

## Layout

- `src/App.jsx`: routes (`/`, `/publications`, `/projects`, `/photography`, `/blog`, `/blog/:slug`),
  lazy-loaded pages.
- `src/Components/Content.jsx`: home hero (photo, name, bio) + `CareerTree` (timeline data lives in
  that file).
- `src/Components/Projects.jsx`, `Publications.jsx`: data arrays at the top of each file.
- `src/Components/images.jsx`: photography gallery list. Only imported images ship.
- `src/Components/Header.jsx`: nav. The Blog link shows only when `src/posts/*.md` exists.
- `src/styles/global.scss`: design tokens per theme (`body.theme-professional` = light,
  `body.theme-futuristic` = dark), incl. `--card-bg` / `--card-border`, shared `.page-head` and
  `.tag-pill` styles. Use tokens, not hard-coded colors.
- `src/context/ThemeContext.jsx`: theme state, persisted under `portfolio-theme`.

### Optimizer lab (home page background)

- `LossLandscape.jsx`: engine (camera, picking, sculpting, drawing), input handling and the panel.
  Mounted only on `/`, lazy-loaded.
- `lossLandscape/math.js`: pure (no DOM): surfaces, optimizers, sculpt heightfield, URL-hash state
  (`#lab&...`, validated on decode). Safe to test in plain node.
- `lossLandscape/glRenderer.js`: WebGL2 mesh. Its vertex shader must stay in sync with `proj()`
  in `LossLandscape.jsx`, or the 2D overlay (trails, slice, brush) drifts off the mesh.
- Canvas 2D fallback when WebGL2 is missing or the context is lost; `prefers-reduced-motion`
  renders static frames. Check both paths after renderer changes.
- The sheet's horizon is anchored below the hero bio (`HERO_SEL`, `HORIZON_GAP`), so the mesh never
  sits behind the intro copy; it rises with the page on scroll.

## Content facts

- Software engineer at Verkada (Apr 2025 to present), building data infrastructure.
- AutoDiscovery is **independent research**, not a Verkada project.
- M.S. at UMass Amherst; NLP research at IESL with Prof. Andrew McCallum.
- Papers: ACL 2024 (Every Answer Matters / CFC), NAACL 2022 (DISAPERE), CICT 2017 (ego networks).
  Author lists spell the name "Pranay Kumar Yelugam" or "Yelugam Pranay Kumar".
- Never invent metrics or achievements in copy. Ask for specifics instead.

## Preferences

- Implement directly; don't write plan files.
- No blur halos, dimming masks or white cards behind the hero text. Keep the background out from
  behind the copy instead. Solid cards are fine for timeline entries.
- Timeline icons are transparent webp (dark ink on alpha) so they work in both themes.
- Commit only when asked. `public/tracking.js` is a local untracked file: never stage or commit it.

## Deployment notes

- Custom domain via `public/CNAME`; Vite `base` is `/`.
- `public/404.html` + the script in `index.html` restore deep links on GitHub Pages.
- PWA (`vite-plugin-pwa`, auto-update): precache is the app shell only; images are cached at
  runtime. Keep an eye on the `precache` size in the build output when adding assets.
