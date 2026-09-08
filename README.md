# DocuHighlight PWA

**DocuHighlight** is a high-performance, offline-first single-page Progressive Web Application (PWA) designed for client-side file parsing, text extraction, key passage detection, and BLOB handle management.

Built with **Google Material Design 3 (Material You)** principles, DocuHighlight requires **zero build step or bundlers** (no Webpack, Vite, Rollup, or npm scripts) and uses **classic global namespace scripts** with **zero ES Modules** (`import`/`export` and `type="module"` are forbidden).

---

## Key Features & Capabilities

- 🔌 **100% Offline-First Architecture**: Powered by a Service Worker with Cache-First / Stale-While-Revalidate caching. Zero external runtime API calls or backend server required.
- 📦 **ZIP Archive Extraction (`.zip`)**: Recursively unpacks internal directory trees using `JSZip`, routes extracted child files to their respective parsers, and creates direct client-side BLOB handles.
- 📄 **Microsoft Word (`.docx`, `.doc`)**: Full HTML text extraction via `Mammoth.js`.
- 📊 **Microsoft Excel (`.xlsx`, `.xls`, `.csv`)**: Sheet-by-sheet spreadsheet parsing and conversion into interactive Material HTML tables via `SheetJS`.
- 📽️ **Microsoft PowerPoint (`.pptx`, `.ppt`)**: Extracts slide text and speaker notes directly via zip-compressed XML decoding.
- 📑 **PDF & Plain Text (`.pdf`, `.txt`, `.md`)**: Renders PDF text content page-by-page via `pdf.js`.
- 🔍 **Automated Text Analysis & Highlighting**: Scans parsed text to automatically detect and wrap critical passages (dates, monetary amounts, emails, action items such as `TODO`/`IMPORTANT`, and section headings) in high-contrast Material `<mark class="md-highlight">` tags.
- 💾 **Client-Side BLOB Management**: Creates `URL.createObjectURL()` download links for both uploaded root files and individual extracted archive items, complete with `URL.revokeObjectURL()` memory garbage collection.
- 🖨️ **Dual View & Clean Print Layout**: Responsive on-screen Material Card grid paired with an optimized print stylesheet (`css/print.css`) for continuous document exports and PDF reports.

---

## Repository Layout & Architecture

```text
.
├── index.html              # Main HTML entry point with classic script inclusions
├── manifest.json           # Web App Manifest for standalone PWA mode
├── sw.js                   # Cache-First / Stale-While-Revalidate Service Worker
├── css/
│   ├── material-theme.css  # Material Design 3 CSS custom properties & design tokens
│   ├── app.css             # Application UI layout, drop zone, and card grid
│   └── print.css           # Clean @media print rules & continuous page layout
├── js/
│   ├── vendor/             # Standalone classic IIFE/UMD vendor scripts
│   │   ├── jszip.min.js
│   │   ├── mammoth.browser.min.js
│   │   ├── xlsx.full.min.js
│   │   ├── pdf.min.js
│   │   ├── pdf.worker.min.js
│   │   └── alpine.min.js
│   ├── blob-manager.js     # Global BLOB store and object URL management
│   ├── highlighter.js      # Text analysis engine and pattern matcher
│   ├── parser.js           # Multi-format detection and routing engine
│   └── app.js              # Alpine.js state controller & UI bindings
├── README.md               # Project overview and architecture documentation
├── USAGE.md                # User guide and instructions
└── CONTRIBUTING.md         # Developer guide for adding formats and regex rules
```

---

## Zero-Build & Classic Script Architecture

DocuHighlight strictly adheres to a classic global-namespace browser architecture:
- All vendor scripts and application logic scripts load using standard `<script src="...">` tags in strict dependency order in `index.html`.
- No transpilation or bundle step is required.
- Scripts attach methods and objects to global namespaces (e.g., `window.BlobManager`, `window.TextHighlighter`, `window.FileParser`).

---

## How to Run

Because DocuHighlight is zero-build, you can serve it immediately with any static file server.

### Option 1: Python HTTP Server (Recommended)

```bash
# Python 3
python -m http.server 8080
```

Open your browser and navigate to `http://localhost:8080`.

### Option 2: Node.js static server (`npx serve` or `http-server`)

```bash
npx serve -p 8080 .
```

### Option 3: PHP Built-in Server

```bash
php -S localhost:8080
```

---

## Supported File Formats

| Format | Extension | Library / Mechanism | Feature Highlight |
|---|---|---|---|
| **Archive** | `.zip` | JSZip | Unpacks files, parses child content, exposes isolated BLOB downloads |
| **Word** | `.docx`, `.doc` | Mammoth.js | Extracts structured HTML & plain text |
| **Excel** | `.xlsx`, `.xls`, `.csv` | SheetJS (xlsx) | Converts sheets into styled Material HTML tables |
| **PowerPoint**| `.pptx`, `.ppt` | JSZip XML Parser | Extracts slide body text and speaker notes |
| **PDF** | `.pdf` | PDF.js | Extracts text page-by-page |
| **Text** | `.txt`, `.md`, `.json`, `.log` | FileReader API | Text escaping & formatting |

---

## Browser Support

DocuHighlight works on all modern, standards-compliant desktop and mobile browsers supporting:
- Service Workers & Cache API
- HTML5 Drag & Drop
- Blob & URL.createObjectURL APIs
- Standard ES6+ JS features (without ES Modules requirement)
