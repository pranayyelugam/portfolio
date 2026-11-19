# pranayyelugam.com

Personal website of Pranay Yelugam, built with React 18 and Vite, deployed to GitHub Pages.

## Highlights

- **Optimizer lab background** (home page only): an interactive loss landscape with GD, Momentum,
  Nesterov, RMSProp and Adam racing to the minimum. WebGL2 renderer with a Canvas 2D fallback,
  live loss curves, SGD noise, terrain sculpting (shift-drag), and shareable setups via the URL.
  Lazy-loaded so it never delays first paint, and respects `prefers-reduced-motion`.
- **Two themes**: light ("professional") and dark ("futuristic"), toggled in the header.
- **Route-level code splitting** with hover preloading for the photography page.
- **Offline support** through a Workbox service worker (`vite-plugin-pwa`).

## Development

```bash
npm install
npm start          # dev server at http://localhost:5173
npm run lint       # ESLint (flat config, React hooks rules)
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

## Project layout

```
src/
  App.jsx                      routes and lazy loading
  Components/                  pages and UI (Content, CareerTree, Projects, ...)
  Components/LossLandscape.jsx optimizer lab: engine, input, panel
  Components/lossLandscape/    math.js (surfaces, optimizers, URL state), glRenderer.js (WebGL2)
  context/ThemeContext.jsx     theme state
  styles/global.scss           design tokens for both themes
  posts/                       blog posts as Markdown with front matter
```

The Blog link appears in the nav automatically once `src/posts/` contains a post.

## Deployment

```bash
npm run deploy
```

Builds the site and pushes `dist/` to the `gh-pages` branch. `public/404.html` and the script in
`index.html` restore deep links (e.g. `/projects`) on GitHub Pages. A `Dockerfile` (nginx) is also
included for container hosting.
