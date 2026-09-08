# Contributing to DocuHighlight PWA

Thank you for your interest in contributing to **DocuHighlight PWA**! This document provides technical guidelines for developers on maintaining the project's zero-build architecture, adding new vendor script dependencies, extending file parsing capabilities, and modifying text analysis regex rules.

---

## 1. Core Architectural Principles

All contributions must adhere to the following strict architectural constraints:

1. **Zero Build Step**:
   - No transpile, bundle, or compile steps (no Babel, Webpack, Vite, Rollup, Parcel, or npm build scripts).
   - The application must be instantly runnable directly from any static web server by pointing to `index.html`.

2. **No ES Modules**:
   - Do **NOT** use `import` or `export` statements.
   - Do **NOT** use `type="module"` in `<script>` tags.
   - All scripts must be classic JavaScript files that attach functions or modules to global namespaces (e.g., `window.BlobManager`, `window.TextHighlighter`, `window.FileParser`).

3. **Offline-First PWA Integrity**:
   - All assets (HTML, CSS, JS, vendor scripts) must be cached locally by the Service Worker (`sw.js`).
   - Zero external runtime API dependencies. All parsing and processing must occur 100% client-side in the browser.

---

## 2. Adding or Updating Classic Vendor Scripts

When adding a new library to `js/vendor/`:

1. Download the standalone **UMD** or **IIFE** production build (`.min.js`) of the library and place it under `js/vendor/`.
2. Add the script tag to `index.html` in the correct dependency order before application logic scripts:
   ```html
   <script src="js/vendor/my-library.min.js"></script>
   ```
3. Add the file path to the `ASSETS_TO_CACHE` array in `sw.js`:
   ```javascript
   const ASSETS_TO_CACHE = [
     // ...
     './js/vendor/my-library.min.js',
     // ...
   ];
   ```

---

## 3. Extending File Format Parsers (`js/parser.js`)

To add support for a new file extension or format:

1. Open `js/parser.js`.
2. Update the routing logic inside `FileParser.parseFile`:
   ```javascript
   if (ext === 'myext') {
     return this.parseMyCustomFormat(file, name, result);
   }
   ```
3. Implement the parsing handler function returning a Promise:
   ```javascript
   parseMyCustomFormat: function(file, fileName, result) {
     return new Promise(function(resolve, reject) {
       // Perform client-side arrayBuffer or FileReader extraction
       var extractedText = '...';
       result.rawText = extractedText;
       result.stats = window.TextHighlighter ? window.TextHighlighter.getAnalysisStats(extractedText) : {};
       result.htmlContent = window.TextHighlighter ? window.TextHighlighter.highlightText(extractedText) : extractedText;
       resolve(result);
     });
   }
   ```
4. Register the extension in `index.html`'s `<input accept="...">` attribute and Alpine.js tab filters in `js/app.js`.

---

## 4. Modifying or Adding Text Analysis Highlighting Rules (`js/highlighter.js`)

Highlighting rules are managed inside `js/highlighter.js` within the `TextHighlighter.patterns` array.

To add a new critical passage highlight rule:

```javascript
{
  type: 'custom_type',
  class: 'md-highlight md-highlight-custom',
  regex: /\b(CUSTOM_KEYWORD|PATTERN)\b/gi
}
```

Then define corresponding CSS variables and token classes in `css/material-theme.css` and `css/app.css`:

```css
/* material-theme.css */
:root {
  --md-highlight-custom-bg: #e0f2fe;
  --md-highlight-custom-color: #0369a1;
}

/* app.css */
mark.md-highlight-custom {
  background-color: var(--md-highlight-custom-bg);
  color: var(--md-highlight-custom-color);
}
```

---

## 5. Testing & Verification

Before submitting changes:

1. **Local HTTP Server Test**: Run `python -m http.server 8080` and test file uploads (Word, Excel, PowerPoint, PDF, ZIP archives, and plain text).
2. **Offline Verification**: Open Browser DevTools -> Network tab -> Select **Offline**. Refresh the page to verify that the Service Worker serves all assets cleanly.
3. **Print Layout Verification**: Open Print Preview (`Ctrl+P`) and confirm that headers/toolbars are hidden and cards render cleanly without broken page breaks.
