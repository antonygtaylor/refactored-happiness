# DocuHighlight PWA User Guide

Welcome to **DocuHighlight**, an offline-first Progressive Web Application for document parsing, client-side BLOB management, and key passage highlighting.

This guide provides step-by-step instructions on how to use DocuHighlight to view, analyze, download, and print document reports.

---

## 1. Getting Started & Offline Usage

1. **Opening the App**: Launch DocuHighlight by navigating to your local web server URL (e.g., `http://localhost:8080`).
2. **Offline Installation**:
   - The application automatically registers a Service Worker (`sw.js`).
   - Once loaded, all CSS, JavaScript, and vendor assets are stored in your browser's Cache Storage.
   - You can disconnect your internet connection or switch your browser to Offline Mode; DocuHighlight will continue to function fully.
   - On supported desktop and mobile browsers (Chrome, Edge, Safari, Firefox), click the "Install App" or "Add to Home Screen" prompt to install DocuHighlight as a standalone desktop application.

---

## 2. Uploading & Processing Documents

DocuHighlight supports drag-and-drop as well as traditional file picking.

### Drag and Drop
1. Locate your files or ZIP archives in your system file manager (Finder / File Explorer).
2. Drag one or multiple files directly onto the **"Drag & Drop Files or ZIP Archives Here"** area.
3. The upload drop zone will highlight with an animated active border state. Release the mouse button to process.

### File Selector
1. Click anywhere inside the upload drop zone or click the **"Select Files Client-Side"** button.
2. Select one or more supported files (`.docx`, `.xlsx`, `.pptx`, `.pdf`, `.zip`, `.txt`, `.md`) from the system file dialog.

---

## 3. Working with Extracted Documents

Once processed, each document or unpacked archive file is rendered inside its own **Material Card** (`elevation-1` container).

### Viewing Parsed Content
- **Word (`.docx`)**: Displays formatted document body text and headings.
- **Excel (`.xlsx`, `.csv`)**: Displays individual worksheet tables styled with Material Design borders and alternating row colors.
- **PowerPoint (`.pptx`)**: Displays slide-by-slide text content along with extracted **Speaker Notes** highlighted in italicized callouts.
- **PDF (`.pdf`)**: Displays page-by-page extracted text content.
- **ZIP Archives (`.zip`)**: Lists the extracted archive summary and renders each contained sub-file inside a nested child card.

---

## 4. Key Passage Highlighting Tokens

DocuHighlight automatically scans all parsed document text and highlights critical passages using distinct Material Design colors:

| Highlight Type | Visual Appearance | Pattern Detected |
|---|---|---|
| **Action Items** | Amber (`md-highlight-action`) | `TODO`, `IMPORTANT`, `ACTION REQUIRED`, `NOTE`, `WARNING`, `CRITICAL`, `DEADLINE` |
| **Monetary Amounts** | Green (`md-highlight-money`) | `$100`, `$1,234.50`, `€50`, `£10.99`, `500 USD`, `200 EUR` |
| **Dates** | Blue (`md-highlight-date`) | `2026-09-08`, `09/08/2026`, `Sept 8, 2026`, `8th September 2026` |
| **Emails** | Purple (`md-highlight-email`) | `user@example.com`, `contact@organization.org` |

---

## 5. Summary Toolbar & Filtering

- **Stats Toolbar**: The top toolbar displays total file counts and aggregate metrics for detected actions, monetary values, dates, and email addresses.
- **Search Bar**: Type any search query into the filter field to instantly narrow down visible file cards or search for specific text passages across loaded documents.

---

## 6. Downloading Source BLOB Handles & Memory Management

- **Isolated BLOB Downloads**: Every file card features a **"Download Source File"** button. This button is bound directly to an in-memory `URL.createObjectURL(blob)` link, allowing you to re-download the raw file or extracted ZIP child item without hitting any network server.
- **Removing Single Files**: Click the **X** button on any card toolbar to remove the card and revoke its associated BLOB object URL handle.
- **Clearing Memory**: Click the **"Clear Memory"** button in the header bar to immediately invoke `URL.revokeObjectURL()` on all active handles and clear all loaded document state from memory.

---

## 7. Printing & Exporting PDF Reports

1. Click the **"Print / Export"** button in the header bar (or press `Ctrl+P` / `Cmd+P`).
2. DocuHighlight applies `css/print.css`, which:
   - Hides top app headers, drag drop zones, search bars, and action buttons.
   - Formats file cards into a clean continuous document with `break-inside: avoid` rules to prevent awkward page splits across cards.
   - Transforms color highlights into high-contrast grayscale badges with text labels for high-legibility print reports.
3. Select **"Save as PDF"** in your browser's print dialog to export a clean report.
