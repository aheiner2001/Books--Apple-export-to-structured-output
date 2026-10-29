# Apple Books EML to EPUB/PDF Converter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side HTML/CSS/JavaScript web application that parses Apple Books `.eml` exports, reverses highlights to book-chronological order, removes dates, stitches continuous prose with styled notes, and exports to EPUB 3 and PDF with custom cover support.

**Architecture:** Client-side static application split into modular units: an EML/MIME Quoted-Printable parser (`js/eml-parser.js`), an EPUB 3 zip packager (`js/epub-generator.js`), a PDF generator (`js/pdf-generator.js`), an interactive application controller (`app.js`), styled with clean Apple-inspired aesthetics (`style.css`) and an intuitive single-page layout (`index.html`).

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, CSS3, JSZip (for EPUB packaging), html2pdf.js / jsPDF, Node test runner for parser unit testing.

## Global Constraints
- Target location: `/Users/aaronheiner/Books--Apple-export-to-structured-output`
- Pure client-side processing: zero backend required, all user notes remain private in the browser.
- Date removal: all annotation dates must be removed from the generated book body.
- Chronological ordering: Apple Books exports newest first; the application must reverse them to flow from beginning to end.
- Continuous prose: consecutive highlights flow seamlessly into reading paragraphs; personal notes styled distinctly as callouts.

---

### Task 1: Create and Verify EML / Quoted-Printable Parser Unit
**Files:**
- `js/eml-parser.js`
- `test/test-parser.js`

- [ ] Write unit test in `test/test-parser.js` testing Quoted-Printable decoding and parsing of the sample Apple Books EML file (`Notes from “The Craving Mind...”.eml`).
- [ ] Run unit test and observe failure.
- [ ] Implement `js/eml-parser.js` with:
  - Quoted-printable decoder (handling `=XX` hex byte decoding and soft breaks `=\r?\n`).
  - MIME multipart extractor (isolating `text/html` or `text/plain`).
  - HTML annotation parser extracting title, author, and each highlight + personal note.
  - Reversal logic (bottom-to-top / chronological order) and date stripping.
- [ ] Run test again to verify all highlights and metadata are accurately extracted.
- [ ] Commit changes with message `feat: implement EML quoted-printable parser and annotator extractor`.

---

### Task 2: Build EPUB 3 Generator
**Files:**
- `js/epub-generator.js`
- `test/test-epub.js`

- [ ] Write unit test in `test/test-epub.js` checking EPUB 3 structure generation (valid `mimetype` without compression, `META-INF/container.xml`, `content.opf`, `toc.ncx`, `nav.xhtml`, and XHTML content).
- [ ] Implement `js/epub-generator.js` using `JSZip` to assemble a valid EPUB 3 archive with cover image support and proper metadata.
- [ ] Run `test/test-epub.js` to ensure generated zip matches EPUB 3 standards.
- [ ] Commit changes with message `feat: implement EPUB 3 archive generator`.

---

### Task 3: Build PDF Generator
**Files:**
- `js/pdf-generator.js`

- [ ] Implement `js/pdf-generator.js` configuring clean book-layout styling, title page with optional cover image, continuous paragraph flow, and proper page breaks.
- [ ] Support both direct print-to-PDF styles and `html2pdf.js` client-side download.
- [ ] Commit changes with message `feat: implement PDF export generator`.

---

### Task 4: Build User Interface & Live Book Preview
**Files:**
- `index.html`
- `style.css`
- `app.js`

- [ ] Create `index.html` with:
  - Drag-and-drop dropzones for `.eml` and cover image.
  - Metadata form (editable Title, Author, Output Filename).
  - Quick action buttons (Download EPUB, Download PDF).
  - Live Book Reader Preview container.
- [ ] Create `style.css` with responsive, modern Apple-like UI and authentic serif book typography for the preview.
- [ ] Create `app.js` wiring together drag-and-drop events, parser invocation, DOM preview rendering, and export buttons.
- [ ] Commit changes with message `feat: implement web UI, preview renderer, and application wiring`.

---

### Task 5: End-to-End Verification with Real Sample Data
**Files:**
- All application files

- [ ] Run a test using the user's actual sample `.eml` file (`Notes from “The Craving Mind...”.eml`).
- [ ] Verify that:
  - Title and author are accurately populated.
  - Dates are completely absent.
  - Highlights flow in reading order from chapter/book start to finish.
  - User notes are clearly distinguished.
  - Generated EPUB and PDF download cleanly.
- [ ] Commit final updates and document instructions in `README.md`.
