# Changelog

All notable changes to this project will be documented in this file.

## [0.5.1] - 2026-07-04
### Fixed
- Fixed JPEG encoding failure when input image contains transparency (an alpha channel, color type `Rgba8`). If the input contains alpha and output format is JPEG, the engine automatically converts the image to `Rgb8` (stripping alpha/transparency details) in the WASM compression thread, preventing crash prompts.

## [0.5.0] - 2026-07-04
### Added
- Created vector icon logo [public/favicon.svg](file:///data/ubuntu/rust%20webapp/public/favicon.svg) and configured app manifest [public/manifest.json](file:///data/ubuntu/rust%20webapp/public/manifest.json) for standalone local installation.
- Implemented Service Worker [public/sw.js](file:///data/ubuntu/rust%20webapp/public/sw.js) using dynamic stale-while-revalidate caching of static pages, icons, and WASM binary modules for robust offline support.
- Added install banner prompts in [index.html](file:///data/ubuntu/rust%20webapp/index.html) and registered install triggers inside [src/main.js](file:///data/ubuntu/rust%20webapp/src/main.js).

## [0.4.0] - 2026-07-04
### Added
- Integrated lightweight client-side zip creation library `fflate` into dependencies.
- Added multiple file input capability to [index.html](file:///data/ubuntu/rust%20webapp/index.html) and created a dedicated Batch Workspace list view displaying loaded files, completion status, size savings, and a global settings sidebar.
- Added queue container styling, status badges, and transition layouts to [src/styles.css](file:///data/ubuntu/rust%20webapp/src/styles.css).
- Implemented a sequential queue processor in [src/main.js](file:///data/ubuntu/rust%20webapp/src/main.js) that runs each compression job sequentially in the Web Worker, tracks batch sessions, downscales files exceeding max bounds preserving aspect ratio, and bundles completed results into a downloadable ZIP archive using `fflate.zipSync`.

## [0.3.0] - 2026-07-04
### Added
- Created a sleek, responsive HTML5 structure in [index.html](file:///data/ubuntu/rust%20webapp/index.html) featuring a file upload drop zone, responsive workspace grid, settings controls, and statistics columns.
- Implemented a custom glassmorphism stylesheet in [src/styles.css](file:///data/ubuntu/rust%20webapp/src/styles.css) with HSL css variables, theme transitions, mobile responsive grid media rules, active focus visual indicators, and a dual-layered image comparison slider.
- Rewrote [src/main.js](file:///data/ubuntu/rust%20webapp/src/main.js) to manage user inputs, clipboard paste (`Ctrl+V`) listener, quality/format range triggers, aspect-ratio locked sizing recalculations, background worker updates, comparison overlay math, and browser downloading.

## [0.2.0] - 2026-07-04
### Added
- Integrated pure-Rust `image` crate with minimal format support (JPEG, PNG, WebP).
- Added `zenwebp` crate for pure-Rust lossy WebP encoding on the `wasm32-unknown-unknown` target without C toolchain dependencies (avoiding `clang` requirements).
- Implemented core decoding, aspect-ratio-locked resizing, and encoding pipeline in [wasm/compress.rs](file:///data/ubuntu/rust%20webapp/wasm/compress.rs) and [wasm/formats.rs](file:///data/ubuntu/rust%20webapp/wasm/formats.rs).
- Added panic hook utility in [wasm/utils.rs](file:///data/ubuntu/rust%20webapp/wasm/utils.rs) for clean browser console debugging.
- Created Rust unit test suite and verified via `cargo test`.

## [0.1.0] - 2026-07-04
### Added
- Project documentation files: [README.md](file:///data/ubuntu/rust%20webapp/README.md), [PROJECT_RULES.md](file:///data/ubuntu/rust%20webapp/PROJECT_RULES.md), [ARCHITECTURE.md](file:///data/ubuntu/rust%20webapp/ARCHITECTURE.md), and [CHANGELOG.md](file:///data/ubuntu/rust%20webapp/CHANGELOG.md).
- Rust configuration [Cargo.toml](file:///data/ubuntu/rust%20webapp/Cargo.toml) with WASM and `wasm-bindgen` configurations.
- Node configuration [package.json](file:///data/ubuntu/rust%20webapp/package.json) with Vite dev server and wasm-pack build scripts.
- Vite configuration [vite.config.js](file:///data/ubuntu/rust%20webapp/vite.config.js).
- Skeleton WebAssembly entrypoint [wasm/lib.rs](file:///data/ubuntu/rust%20webapp/wasm/lib.rs) and web container integration.
