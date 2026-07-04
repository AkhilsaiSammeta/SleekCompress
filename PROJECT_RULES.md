# Project Rules and Guidelines

## Core Principles
1. **Simplicity First**: Always choose the simplest implementation. Avoid over-engineering and premature abstraction.
2. **Readability & Maintainability**: Write self-documenting code with descriptive names. Never sacrifice readability just to make the code shorter.
3. **Privacy by Design**: No backend, no API, no external uploads. All file operations and compression must occur in the client browser (Rust/WASM).
4. **Performance & Memory Efficiency**: Perform high-intensity image rendering inside a Web Worker. Transfer binary files via Transferable Objects (ArrayBuffers) to avoid copying data.

## Architectural Boundaries
- Do not create directories like: `core`, `services`, `repositories`, `providers`, `contexts`, `hooks`, `modules`, `application`, `domain`, `infrastructure`, `adapters` unless they are explicitly approved or become absolutely necessary.
- Keep the folder structure flat:
  - `wasm/` for Rust WASM modules.
  - `src/` for frontend JS and CSS.
  - `assets/` for static assets like icons.

## Coding Styles

### Rust
- Write pure, idiomatic Rust. Do not use `unsafe` code block scopes.
- Avoid macro-heavy code. Keep traits and generics straightforward.
- Proper error handling: Return clear `Result<T, String>` (or custom errors) instead of using `unwrap()` or `expect()`.
- Add comments only where the business or compression math logic is complex.

### JavaScript (ES6+)
- Use modern JavaScript features (const/let, modules, arrow functions, async/await, destructuring).
- Separate UI orchestration logic (`src/main.js`) from WASM interface/Worker logic (`src/worker.js`).
- Never use global variables. Use modules to pass state or configure elements.
- Keep functions small and focused on one task.

### CSS
- Maintain standard vanilla CSS in `src/styles.css`.
- Do not use styling frameworks (Tailwind, Bootstrap, Tailwind-in-JS).
- Use CSS Custom Properties (CSS variables) for the color scheme, sizing grid, transitions, and dark/light modes.
- Implement responsive grids and Flexbox layouts. Provide clear `:focus-visible` and interactive active states.

## Documentation
- Keep `README.md`, `PROJECT_RULES.md`, `ARCHITECTURE.md`, and `CHANGELOG.md` updated as the system evolves.
