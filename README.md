Personal website of Pranay Yelugam.

## 🚀 Performance & Optimizations


- **Code Splitting**: Heavy components (e.g., Photography) are lazy-loaded to keep the initial bundle size small.
- **Route-Based Preloading**: Critical assets for upcoming routes can be preloaded on hover.
- **Zero-Layout Shift**: Strict dimensioning and layout reservation ensure the UI never "jumps" during loading.

## 🛠️ Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Dev Server**
   ```bash
   npm start
   ```
   Runs the app in development mode at `http://localhost:5173`.

## 📦 Deployment

This project uses **GitHub Pages** for hosting.

To deploy a new version:

```bash
npm run deploy
```

This command will automatically:
1.  Run `npm run build` to generate the production optimized bundle in `/dist`.
2.  Push the contents of `/dist` to the `gh-pages` branch.
