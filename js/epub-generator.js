/**
 * EPUB 3 Generator
 * Works with JSZip in both browser and Node.js environments
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const JSZip = require('jszip');
    module.exports = factory(JSZip);
  } else {
    root.EPUBGenerator = factory(root.JSZip);
  }
})(typeof self !== 'undefined' ? self : this, function (JSZip) {

  function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, function (c) {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  }

  function generateUuid() {
    return 'urn:uuid:' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generates a valid EPUB 3 zip buffer or blob
   * @param {Object} options
   * @param {string} options.title
   * @param {string} options.author
   * @param {Array<{type: 'prose'|'note', content: string}>} options.blocks
   * @param {string|Uint8Array} [options.coverData] - Base64 or byte array
   * @param {string} [options.coverMime] - e.g. 'image/jpeg' or 'image/png'
   * @returns {Promise<Blob|Buffer>}
   */
  async function generateEpub(options) {
    if (!JSZip) {
      throw new Error('JSZip library is required to generate EPUB files.');
    }

    const title = options.title || 'Untitled Notes';
    const author = options.author || 'Unknown';
    const blocks = options.blocks || [];
    const bookId = generateUuid();
    const coverData = options.coverData;
    const coverMime = options.coverMime || 'image/jpeg';
    const hasCover = Boolean(coverData);

    const zip = new JSZip();

    // 1. mimetype file: MUST be first, uncompressed
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    // 2. META-INF/container.xml
    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    zip.file('META-INF/container.xml', containerXml);

    // 3. OEBPS/style.css
    const bookCss = `body {
  font-family: Georgia, Palatino, "Times New Roman", serif;
  line-height: 1.6;
  margin: 5% 8%;
  color: #111;
}
h1.book-title {
  text-align: center;
  font-size: 2em;
  margin-top: 1.5em;
  margin-bottom: 0.3em;
}
p.book-author {
  text-align: center;
  font-size: 1.2em;
  font-style: italic;
  color: #555;
  margin-bottom: 2.5em;
}
hr.divider {
  border: 0;
  height: 1px;
  background: #ccc;
  margin: 2em auto;
  width: 50%;
}
p.prose-paragraph {
  text-align: justify;
  text-indent: 1.5em;
  margin: 0 0 0.8em 0;
}
.user-note {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: #f8f9fa;
  border-left: 4px solid #007aff;
  padding: 12px 16px;
  margin: 1.5em 0;
  font-style: italic;
  color: #333;
}
.user-note::before {
  content: "Note: ";
  font-weight: bold;
  font-style: normal;
  color: #007aff;
}
.cover-img {
  max-width: 100%;
  max-height: 90vh;
  display: block;
  margin: auto;
}`;
    zip.file('OEBPS/style.css', bookCss);

    // 4. Handle Cover
    let coverExt = 'jpg';
    if (coverMime.includes('png')) coverExt = 'png';
    else if (coverMime.includes('webp')) coverExt = 'webp';

    if (hasCover) {
      let rawData = coverData;
      if (typeof coverData === 'string' && coverData.includes('base64,')) {
        rawData = coverData.split('base64,')[1];
        zip.file(`OEBPS/cover.${coverExt}`, rawData, { base64: true });
      } else {
        zip.file(`OEBPS/cover.${coverExt}`, rawData);
      }

      // cover.xhtml
      const coverHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Cover</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
  <style>body { margin: 0; padding: 0; text-align: center; }</style>
</head>
<body>
  <div style="text-align: center; height: 100vh;">
    <img src="cover.${coverExt}" alt="Cover" class="cover-img"/>
  </div>
</body>
</html>`;
      zip.file('OEBPS/cover.xhtml', coverHtml);
    }

    // 5. OEBPS/chapter1.xhtml (Continuous reading content)
    let bodyHtml = `<h1 class="book-title">${escapeXml(title)}</h1>\n`;
    bodyHtml += `<p class="book-author">${escapeXml(author)}</p>\n`;
    bodyHtml += `<hr class="divider"/>\n`;

    for (const block of blocks) {
      if (block.type === 'prose') {
        bodyHtml += `<p class="prose-paragraph">${escapeXml(block.content)}</p>\n`;
      } else if (block.type === 'note') {
        bodyHtml += `<div class="user-note">${escapeXml(block.content)}</div>\n`;
      }
    }

    const chapterHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
${bodyHtml}
</body>
</html>`;
    zip.file('OEBPS/chapter1.xhtml', chapterHtml);

    // 6. Navigation Document: OEBPS/nav.xhtml
    const navHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Navigation</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      ${hasCover ? '<li><a href="cover.xhtml">Cover</a></li>' : ''}
      <li><a href="chapter1.xhtml">${escapeXml(title)}</a></li>
    </ol>
  </nav>
</body>
</html>`;
    zip.file('OEBPS/nav.xhtml', navHtml);

    // 7. NCX for backwards compatibility: OEBPS/toc.ncx
    const ncxXml = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <docAuthor><text>${escapeXml(author)}</text></docAuthor>
  <navMap>
    ${hasCover ? `<navPoint id="navpoint-cover" playOrder="1"><navLabel><text>Cover</text></navLabel><content src="cover.xhtml"/></navPoint>` : ''}
    <navPoint id="navpoint-1" playOrder="${hasCover ? 2 : 1}">
      <navLabel><text>${escapeXml(title)}</text></navLabel>
      <content src="chapter1.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;
    zip.file('OEBPS/toc.ncx', ncxXml);

    // 8. OEBPS/content.opf
    const opfXml = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:identifier id="BookId">${bookId}</dc:identifier>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.[0-9]+Z$/, 'Z')}</meta>
    ${hasCover ? `<meta name="cover" content="cover-image"/>` : ''}
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="style" href="style.css" media-type="text/css"/>
    ${hasCover ? `<item id="cover-image" href="cover.${coverExt}" media-type="${coverMime}" properties="cover-image"/>` : ''}
    ${hasCover ? `<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>` : ''}
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    ${hasCover ? '<itemref idref="cover"/>' : ''}
    <itemref idref="chapter1"/>
  </spine>
</package>`;
    zip.file('OEBPS/content.opf', opfXml);

    // Generate output
    if (typeof window !== 'undefined') {
      return await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
    } else {
      return await zip.generateAsync({ type: 'nodebuffer', mimeType: 'application/epub+zip' });
    }
  }

  return {
    generateEpub
  };
});
