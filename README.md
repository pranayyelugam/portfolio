# Pranay Yelugam - Portfolio

Personal website of Pranay Yelugam.

## 🚀 Performance & Optimizations

### 🖼️ Image Optimization Pipeline
- **Automated Processing**: Custom Python script (`optimize_images.py`) automates asset optimization.
- **Format Conversion**: All assets are converted to **WebP** for superior compression.
- **Intelligent Resizing**: Images are automatically downscaled (max-width: 300px for icons/profile) to reduce payload size while maintaining visual fidelity.
- **Explicit Dimensions**: All `<img>` tags have explicit `width` and `height` attributes to prevent **Cumulative Layout Shift (CLS)** and ensure a stable rendering experience.

### ⚡️ Core Performance
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
