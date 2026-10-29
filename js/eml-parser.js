/**
 * EML and Quoted-Printable Parser for Apple Books Notes
 * Works in both browser environments and Node.js
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js
    module.exports = factory();
  } else {
    // Browser global
    root.EMLParser = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  /**
   * Decodes a Quoted-Printable string into UTF-8 text
   */
  function decodeQuotedPrintable(input) {
    if (!input) return '';

    // Remove soft line breaks: '=\r\n' or '=\n' or '=\r'
    let cleaned = input.replace(/=\r?\n/g, '').replace(/=\r/g, '');

    // Replace =XX with byte values and decode as UTF-8
    const byteHexMatches = cleaned.match(/(=[0-9A-Fa-f]{2})+/g);
    if (!byteHexMatches) {
      return cleaned;
    }

    return cleaned.replace(/(=[0-9A-Fa-f]{2})+/g, function (match) {
      const hexes = match.replace(/=/g, '');
      const bytes = [];
      for (let i = 0; i < hexes.length; i += 2) {
        bytes.push(parseInt(hexes.substr(i, 2), 16));
      }
      try {
        if (typeof TextDecoder !== 'undefined') {
          return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
        } else if (typeof Buffer !== 'undefined') {
          return Buffer.from(bytes).toString('utf-8');
        }
      } catch (e) {
        // Fallback to Latin-1
        return bytes.map(b => String.fromCharCode(b)).join('');
      }
      return match;
    });
  }

  /**
   * Extracts HTML content from an EML MIME structure
   */
  function extractHtmlFromEml(emlText) {
    if (!emlText) return '';

    // Check if there is a boundary
    const boundaryMatch = emlText.match(/boundary=["']?([^"';\r\n]+)["']?/i);
    if (boundaryMatch) {
      const boundary = boundaryMatch[1];
      const parts = emlText.split('--' + boundary);

      for (const part of parts) {
        if (/Content-Type:\s*text\/html/i.test(part)) {
          // Find blank line separating headers from body
          const bodyIndex = part.search(/\r?\n\r?\n/);
          if (bodyIndex !== -1) {
            return part.slice(bodyIndex).trim();
          }
        }
      }
    }

    // Fallback: If no boundary found or no text/html found, check if whole or part contains html
    const htmlStart = emlText.indexOf('<html');
    if (htmlStart !== -1) {
      return emlText.slice(htmlStart);
    }

    return emlText;
  }

  /**
   * Helper to clean whitespace in extracted text
   */
  function cleanText(str) {
    if (!str) return '';
    return str
      .replace(/\r\n|\r|\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Parses Apple Books HTML content into structured data
   */
  function parseHtmlAnnotations(htmlString) {
    let title = '';
    let author = '';
    const rawAnnotations = [];

    // Check if in browser or node
    let doc;
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      doc = parser.parseFromString(htmlString, 'text/html');
    } else {
      // Node.js fallback using light regex DOM parsing for tests
      return parseAnnotationsWithRegex(htmlString);
    }

    // Extract Title
    const titleEl = doc.querySelector('.booktitle');
    if (titleEl) {
      title = cleanText(titleEl.textContent);
    }

    // Extract Author
    const h2Elements = doc.querySelectorAll('h2');
    for (const h2 of h2Elements) {
      const text = cleanText(h2.textContent);
      if (text) {
        author = text;
        break;
      }
    }

    // Extract Annotations
    const annotationEls = doc.querySelectorAll('.annotation');
    annotationEls.forEach(el => {
      const textEl = el.querySelector('.annotationrepresentativetext');
      const noteEl = el.querySelector('.annotationnote');
      const chapterEl = el.querySelector('.annotationchapter');

      const highlight = textEl ? cleanText(textEl.textContent) : '';
      const note = noteEl ? cleanText(noteEl.textContent) : '';
      const chapter = chapterEl ? cleanText(chapterEl.textContent) : '';

      if (highlight || note) {
        rawAnnotations.push({
          text: highlight,
          note: note,
          chapter: chapter
        });
      }
    });

    // Apple Books exports annotations ordered from most recent highlight to earliest.
    // To match book chronological order (from start to finish of the book),
    // reverse the annotations array.
    const chronologicalAnnotations = rawAnnotations.reverse();

    return {
      title,
      author,
      annotations: chronologicalAnnotations
    };
  }

  /**
   * Regex-based parsing fallback for Node.js test environment without jsdom
   */
  function parseAnnotationsWithRegex(htmlString) {
    let title = '';
    let author = '';
    const rawAnnotations = [];

    // Title: <h1 class="booktitle"[^>]*>([\s\S]*?)<\/h1>
    const titleMatch = htmlString.match(/<h1[^>]*class=["'][^"']*booktitle[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i);
    if (titleMatch) {
      title = cleanText(titleMatch[1].replace(/<[^>]+>/g, ''));
    }

    // Author: <h2[^>]*>([\s\S]*?)<\/h2>
    const authorMatch = htmlString.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (authorMatch) {
      author = cleanText(authorMatch[1].replace(/<[^>]+>/g, ''));
    }

    // Match each <div class="annotation">...</div>
    const annotationBlocks = htmlString.split(/<div[^>]*class=["'][^"']*annotation["'][^>]*>/i);
    for (let i = 1; i < annotationBlocks.length; i++) {
      const block = annotationBlocks[i];
      // Extract highlight text
      let text = '';
      const textMatch = block.match(/<p[^>]*class=["'][^"']*annotationrepresentativetext[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
      if (textMatch) {
        text = cleanText(textMatch[1].replace(/<[^>]+>/g, ''));
      }

      // Extract note
      let note = '';
      const noteMatch = block.match(/<p[^>]*class=["'][^"']*annotationnote[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
      if (noteMatch) {
        note = cleanText(noteMatch[1].replace(/<[^>]+>/g, ''));
      }

      // Extract chapter
      let chapter = '';
      const chapMatch = block.match(/<div[^>]*class=["'][^"']*annotationchapter[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      if (chapMatch) {
        chapter = cleanText(chapMatch[1].replace(/<[^>]+>/g, ''));
      }

      if (text || note) {
        rawAnnotations.push({
          text,
          note,
          chapter
        });
      }
    }

    return {
      title,
      author,
      annotations: rawAnnotations.reverse()
    };
  }

  /**
   * Main function: Parses an Apple Books .eml file string
   */
  function parseEmlNotes(emlText) {
    const rawHtml = extractHtmlFromEml(emlText);
    const decodedHtml = decodeQuotedPrintable(rawHtml);
    return parseHtmlAnnotations(decodedHtml);
  }

  /**
   * Stitches annotations into continuous prose blocks and notes
   */
  function stitchContinuousProse(annotations) {
    if (!annotations || annotations.length === 0) return [];

    const blocks = [];
    let currentParagraphs = [];

    for (const ann of annotations) {
      if (ann.text) {
        currentParagraphs.push(ann.text);
      }
      if (ann.note) {
        if (currentParagraphs.length > 0) {
          blocks.push({ type: 'prose', content: currentParagraphs.join(' ') });
          currentParagraphs = [];
        }
        blocks.push({ type: 'note', content: ann.note });
      }
    }

    if (currentParagraphs.length > 0) {
      blocks.push({ type: 'prose', content: currentParagraphs.join(' ') });
    }

    return blocks;
  }

  return {
    decodeQuotedPrintable,
    extractHtmlFromEml,
    parseHtmlAnnotations,
    parseEmlNotes,
    stitchContinuousProse
  };
});
