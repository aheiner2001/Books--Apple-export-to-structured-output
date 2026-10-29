# Design Specification: Apple Books EML to EPUB/PDF Converter

- **Project Location**: `/Users/aaronheiner/Books--Apple-export-to-structured-output`
- **Date**: 2026-10-29
- **Status**: Approved

## 1. Overview & Purpose
A static, client-side web application (`index.html`, `style.css`, `app.js`) that takes Apple Books exported `.eml` notes files, parses highlights and personal notes, reverses the order from newest-first to book-chronological order, removes all dates, and stitches the highlights into a continuous readable book format. Users can customize the title, author, cover image, and export to **EPUB 3** (ready to import back into Apple Books) and **PDF**.

## 2. User Experience & Architecture
1. **File Upload & Parsing**:
   - Accepts `.eml` files via drag-and-drop or file picker.
   - Decodes MIME multipart boundaries and quoted-printable encoding (handling `=xx` hex values and soft line wraps `=\r\n`).
   - Parses the HTML part (`text/html`) using the browser's native `DOMParser`.
   - Extracts:
     - Book Title from `h1.booktitle` or Subject header.
     - Author from `h2` below title.
     - All `.annotation` elements:
       - Excerpt / highlight from `.annotationrepresentativetext`.
       - Personal note from `.annotationnote` (if present).
   - Reverses the annotations array (`reverse()`) so reading order matches the book from start to finish.
   - Strips all dates (`.annotationdate`).

2. **Metadata & Customization Panel**:
   - Editable Book Title.
   - Editable Author Name.
   - Editable Output Filename.
   - Optional Book Cover uploader (with visual preview).
   - Word count and highlight count statistics.

3. **Continuous Prose Stitched Layout**:
   - Consecutive highlights are stitched into coherent reading paragraphs.
   - Personal user notes are visually formatted as stylized callouts/reflections with subtle italicization and borders, distinguishing them from the author's original text.

4. **Live In-Browser Preview**:
   - Realistic book typography (serif font, comfortable line height, proper margins, page simulation).

5. **Export Engines**:
   - **EPUB 3 Generation**:
     - Built with `JSZip`.
     - Standard EPUB package: `mimetype` (`application/epub+zip`, uncompressed), `META-INF/container.xml`, `OEBPS/content.opf`, `OEBPS/toc.ncx`, `OEBPS/nav.xhtml`, `OEBPS/cover.xhtml` (if cover provided), and `OEBPS/chapter1.xhtml` (continuous body).
     - Directly importable into Apple Books and e-readers.
   - **PDF Generation**:
     - Built using client-side `html2pdf.js` / `jsPDF`.
     - Standard letter/A5 page size, clean page numbering, cover page, and formatted text body.

## 3. Directory Structure
```
Books--Apple-export-to-structured-output/
├── index.html              # Main UI, dropzones, metadata inputs, preview container
├── style.css               # Clean Apple-inspired modern book styling & responsive layout
├── app.js                  # EML MIME/Quoted-Printable parser, state management, preview renderer
├── js/
│   ├── epub-generator.js   # EPUB 3 zip packager
│   └── pdf-generator.js    # PDF renderer
└── docs/
    └── superpowers/specs/
        └── 2026-10-29-apple-books-notes-converter-design.md
```

## 4. Error Handling & Edge Cases
- Quoted-printable character decoding issues (handles UTF-8 multi-byte sequences gracefully).
- EML files with missing HTML parts (falls back to plain-text regex parsing if needed).
- Highlights that end with hyphens or broken sentences: preserves original text spacing cleanly.
- High-resolution cover images: scales smoothly in both preview, EPUB, and PDF.
- Large exports (hundreds of highlights): fast asynchronous DOM rendering.
