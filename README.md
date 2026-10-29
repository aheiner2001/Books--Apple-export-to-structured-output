# Apple Books Notes to EPUB / PDF Converter

A client-side web application built with HTML, CSS, and JavaScript that transforms Apple Books exported `.eml` notes into clean, continuous **EPUB 3** and **PDF** books.

## Features
- **Client-Side & 100% Private**: Runs entirely in your browser; your notes and highlights are never uploaded to any remote server.
- **Apple Books Notes Parsing**: Automatically decodes quoted-printable MIME `.eml` exports from Apple Books.
- **Chronological Reading Order**: Apple Books exports notes newest-first. The app reverses them so the text flows naturally from the beginning to the end of the book.
- **Date Stripping**: Removes dates and unnecessary clutter.
- **Continuous Reading Prose**: Highlights are stitched together into smooth reading paragraphs, with personal user notes styled distinctively as reflections.
- **Custom Book Cover**: Upload any image (PNG, JPG, WEBP) to use as the book cover.
- **Editable Metadata**: Edit the book title, author, and output filename before exporting.
- **Live Reader Preview**: See typography and layout instantly in real time.
- **EPUB 3 & PDF Export**:
  - **EPUB**: Valid EPUB 3 format with cover art that opens directly in Apple Books, Kindle, or any e-reader.
  - **PDF**: Book-formatted printable PDF.

## How to Run

1. Open `index.html` in your web browser (double click or open via browser).
2. Drag and drop your exported Apple Books `.eml` file into the upload box.
3. (Optional) Drag and drop a book cover image.
4. Review the live preview or customize the Title/Author.
5. Click **Download EPUB (Apple Books)** or **Download PDF**.
