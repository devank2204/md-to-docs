# md.to.docs

md.to.docs is an advanced Markdown-to-human-document compiler. 
It does not simply convert Markdown into basic HTML or DOCX; instead, it parses Markdown into a strongly-typed Intermediate Representation (IR), verifies the semantic structure, applies layout policies, and renders beautiful, high-fidelity documents (HTML, PDF, DOCX, etc.) retaining advanced typography and vector diagrams (Mermaid).

## System Architecture

The repository is built as a strict monorepo containing individual, decoupled packages:

### Packages (`/packages/*`)

*   **`@mdtodocs/compiler-core`**: The heart of the system.
    *   **Parser (`src/parser`)**: Wraps `remark` to produce a raw AST, resolving GFM and directives.
    *   **Normalizer (`src/normalizer`)**: Transforms the AST into our robust, strongly-typed IR (`src/ir`).
    *   **Planner (`src/planner`)**: Evaluates destination constraints and compiles a representation plan (e.g., converting Mermaid text to SVG, enforcing depth limits).
*   **`@mdtodocs/renderers`**: Consumes the optimized IR and generates specific output formats.
    *   `html.ts`: Renders clean, highly styled HTML. Features precise Mermaid SVG injection.
    *   `docx.ts`: Generates high-fidelity Microsoft Word `.docx` documents. 
    *   `clipboard.ts`: Packages HTML with inline CSS targeted for pasting directly into Google Docs or Word.
*   **`@mdtodocs/asset-pipeline`**: Manages heavy asynchronous assets (like Mermaid diagrams) *before* rendering. Resolves and compiles blocks concurrently.
*   **`@mdtodocs/validation`**: Validates the structural integrity of the IR against destination constraints, reporting warnings and generating a fidelity score.
*   **`@mdtodocs/capability-graph`**: Defines the constraints and matrices of supported features for each export target (e.g., `google-docs`, `word`, `pdf`).
*   **`@mdtodocs/fidelity-lab`**: Our regression testing suite ensuring zero IR drift and formatting stability across 14+ benchmark fixtures.

### Applications (`/apps/*`)

*   **`web`**: The main frontend React 19 application.
    *   Powered by Vite, TailwindCSS, and a strict design system.
    *   Features real-time client-side compilation and rendering.
    *   Includes a document inspector and fidelity check drawer.

## Local Development

Requires Node.js 24.15.0 or newer within the 24.x release line and pnpm 9.15.9.
The locked Vitest and jsdom versions do not support Node.js 20.

```bash
# Select Node.js 24 and activate the pinned pnpm version
nvm install
nvm use
corepack enable
corepack prepare pnpm@9.15.9 --activate

# Install dependencies
pnpm install --frozen-lockfile

# Build all packages and prerender pages required by validation tests
pnpm build

# Run validation and fidelity regression tests
pnpm --filter @mdtodocs/validation test
pnpm test

# Lint the web application
pnpm --filter web lint

# Start the local development web server
pnpm dev
```

## Aesthetic Philosophy

md.to.docs avoids raw browser defaults. It implements a strict design system inspired by high-end typography, leveraging optimized Tailwind spacing, Söhne/Inter fallbacks, precise border radiuses, and tactile micro-animations to create a world-class documentation experience.

## Mobile workspace

On phones and tablets below 1024px, paste or import Markdown, switch between
full-width Edit and Preview, then choose a destination at the bottom. Word and
HTML are prepared before download/share; Google Docs uses formatted copy with a
Word-file fallback. PDF uses your browser's Print / Save as PDF flow.

Text and recent documents stay in this browser on this device. Export important
work before clearing browser storage. File imports and pastes are limited to
1 MB and are never truncated. See [mobile verification](docs/MOBILE_QA.md) for
browser-test commands and the real-device release checklist.
