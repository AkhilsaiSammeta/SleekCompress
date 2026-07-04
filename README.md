# Browser-Based Image Compressor

A private, fast, and local image compressor that runs entirely in the browser using Rust compiled to WebAssembly (WASM). No server uploads, no APIs, and absolute privacy.

## Features

- **Local Processing**: All images stay on your device (processed via WebAssembly inside a Web Worker).
- **Format Support**: JPEG, PNG, and WebP.
- **Controls**: Change compression quality, resize dimensions (retaining aspect ratio), and strip EXIF metadata.
- **Visual Previews**: Live side-by-side comparison slider showing original and compressed images with size stats.
- **Batch Processing**: Select multiple images, compress them sequentially, and download them as a ZIP file.
- **Offline Capable**: Progressive Web App (PWA) installable and usable completely offline.

## Project Structure

```
project/
├── Cargo.toml          # Rust dependencies & lib config
├── package.json        # NPM scripts & packages (Vite)
├── vite.config.js      # Vite compilation configuration
├── index.html          # Web layout container
├── README.md           # Project documentation
├── PROJECT_RULES.md    # Coding guidelines and standards
├── ARCHITECTURE.md     # System architecture and data flow
├── CHANGELOG.md        # Change log
├── wasm/
│   ├── lib.rs          # WASM entry points and interfaces
│   ├── compress.rs     # Image compression and resizing functions
│   ├── formats.rs      # Format handlers (JPEG, PNG, WebP)
│   └── utils.rs        # Console logging and panic hook utilities
└── src/
    ├── main.js         # UI controllers and Worker bridge
    ├── styles.css      # CSS styling (glassmorphism/theme variables)
    └── worker.js       # Background Web Worker (WASM execution)
```

## Getting Started

### Prerequisites

You need the following installed:
1. **Rust & Cargo** (Stable)
2. **Node.js** (v18+) & **npm**
3. **wasm-pack** (`cargo install wasm-pack` or through global installers)

### Installation

1. Clone or copy this directory.
2. Install npm dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server (which compiles the WASM module and reloads on changes):
```bash
npm run dev
```

### Production Build

Compile the WASM binary and bundle the production assets into `dist/`:
```bash
npm run build
```
The output can be deployed as static files directly to GitHub Pages, Cloudflare Pages, Vercel, or Netlify.
