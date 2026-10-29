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

    const boundaryMatch = emlText.match(/boundary=["']?([^"';\r\n]+)["']?/i);
    if (boundaryMatch) {
      const boundary = boundaryMatch[1];
      const parts = emlText.split('--' + boundary);

      for (const part of parts) {
        if (/Content-Type:\s*text\/html/i.test(part)) {
          const bodyIndex = part.search(/\r?\n\r?\n/);
          if (bodyIndex !== -1) {
            return part.slice(bodyIndex).trim();
          }
        }
      }
    }

    const htmlStart = emlText.indexOf('<html');
    if (htmlStart !== -1) {
      return emlText.slice(htmlStart);
    }

    return emlText;
  }

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

    let doc;
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      doc = parser.parseFromString(htmlString, 'text/html');
    } else {
      return parseAnnotationsWithRegex(htmlString);
    }

    const titleEl = doc.querySelector('.booktitle');
    if (titleEl) {
      title = cleanText(titleEl.textContent);
    }

    const h2Elements = doc.querySelectorAll('h2');
    for (const h2 of h2Elements) {
      const text = cleanText(h2.textContent);
      if (text) {
        author = text;
        break;
      }
    }

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

    return {
      title,
      author,
      annotations: rawAnnotations.reverse()
    };
  }

  function parseAnnotationsWithRegex(htmlString) {
    let title = '';
    let author = '';
    const rawAnnotations = [];

    const titleMatch = htmlString.match(/<h1[^>]*class=["'][^"']*booktitle[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i);
    if (titleMatch) {
      title = cleanText(titleMatch[1].replace(/<[^>]+>/g, ''));
    }

    const authorMatch = htmlString.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (authorMatch) {
      author = cleanText(authorMatch[1].replace(/<[^>]+>/g, ''));
    }

    const annotationBlocks = htmlString.split(/<div[^>]*class=["'][^"']*annotation["'][^>]*>/i);
    for (let i = 1; i < annotationBlocks.length; i++) {
      const block = annotationBlocks[i];
      let text = '';
      const textMatch = block.match(/<p[^>]*class=["'][^"']*annotationrepresentativetext[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
      if (textMatch) {
        text = cleanText(textMatch[1].replace(/<[^>]+>/g, ''));
      }

      let note = '';
      const noteMatch = block.match(/<p[^>]*class=["'][^"']*annotationnote[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
      if (noteMatch) {
        note = cleanText(noteMatch[1].replace(/<[^>]+>/g, ''));
      }

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

  function parseEmlNotes(emlText) {
    const rawHtml = extractHtmlFromEml(emlText);
    const decodedHtml = decodeQuotedPrintable(rawHtml);
    return parseHtmlAnnotations(decodedHtml);
  }

  /**
   * Helper: Splits long text into evenly-sized paragraphs (approx targetWords)
   * while preserving natural sentence boundaries (. ! ?)
   */
  function splitIntoParagraphs(text, targetWords = 110) {
    if (!text) return [];

    const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [text];
    const paragraphs = [];
    let current = [];
    let currentCount = 0;

    for (const sent of sentences) {
      const trimmed = sent.trim();
      if (!trimmed) continue;
      const count = trimmed.split(/\s+/).length;

      if (currentCount > 0 && (currentCount + count) > targetWords) {
        paragraphs.push(current.join(' '));
        current = [trimmed];
        currentCount = count;
      } else {
        current.push(trimmed);
        currentCount += count;
      }
    }

    if (current.length > 0) {
      paragraphs.push(current.join(' '));
    }

    return paragraphs;
  }

  /**
   * Stitches annotations into paragraphs and pages based on slider value (0 to 100):
   * - At slider = 100 (Max Right): Every single note/highlight is separated into its own paragraph.
   * - At slider = 0 (Max Left): Highlights are maximally combined into continuous long prose.
   * - In between: Balanced paragraphs scaled smoothly between ~400 words (fewest breaks) to 40 words (frequent breaks).
   */
  function stitchContinuousProse(annotations, options = {}) {
    if (!annotations || annotations.length === 0) return [];

    // sliderValue: 0 (most combined) to 100 (each highlight separate)
    const breakFrequency = typeof options.breakFrequency === 'number' ? options.breakFrequency : 50;
    const targetWordsPerPage = options.wordsPerPage || 350;

    const rawBlocks = [];

    if (breakFrequency >= 100) {
      // Maximum breaks: Every single annotation gets its own paragraph
      for (const ann of annotations) {
        if (ann.text) {
          rawBlocks.push({ type: 'prose', content: ann.text });
        }
        if (ann.note) {
          rawBlocks.push({ type: 'note', content: ann.note });
        }
      }
    } else {
      // Calculate target words per paragraph smoothly:
      // slider 0 -> 450 words (almost no internal breaks, continuous text)
      // slider 50 -> ~115 words (normal standard book paragraph)
      // slider 99 -> ~40 words (frequent paragraph breaks)
      const targetWords = Math.round(450 - (breakFrequency / 100) * 410);

      let currentContinuousText = [];
      let currentWordCount = 0;

      for (const ann of annotations) {
        if (ann.text) {
          const annWords = ann.text.split(/\s+/).length;
          currentContinuousText.push(ann.text);
          currentWordCount += annWords;

          // If reached target size, break into paragraph
          if (currentWordCount >= targetWords) {
            const combined = currentContinuousText.join(' ');
            const paras = splitIntoParagraphs(combined, targetWords);
            for (const p of paras) {
              rawBlocks.push({ type: 'prose', content: p });
            }
            currentContinuousText = [];
            currentWordCount = 0;
          }
        }

        if (ann.note) {
          // Flush any pending text before the note
          if (currentContinuousText.length > 0) {
            const combined = currentContinuousText.join(' ');
            const paras = splitIntoParagraphs(combined, targetWords);
            for (const p of paras) {
              rawBlocks.push({ type: 'prose', content: p });
            }
            currentContinuousText = [];
            currentWordCount = 0;
          }
          rawBlocks.push({ type: 'note', content: ann.note });
        }
      }

      // Flush remaining text
      if (currentContinuousText.length > 0) {
        const combined = currentContinuousText.join(' ');
        const paras = splitIntoParagraphs(combined, targetWords);
        for (const p of paras) {
          rawBlocks.push({ type: 'prose', content: p });
        }
      }
    }

    // Phase 2: Insert page break markers
    const structuredItems = [];
    let pageNumber = 1;
    let accumulatedWordsOnPage = 0;

    structuredItems.push({ type: 'page-break', pageNumber: pageNumber });

    for (const block of rawBlocks) {
      const words = block.content.split(/\s+/).length;

      if (accumulatedWordsOnPage > 0 && (accumulatedWordsOnPage + words) > targetWordsPerPage) {
        pageNumber++;
        structuredItems.push({ type: 'page-break', pageNumber: pageNumber });
        accumulatedWordsOnPage = 0;
      }

      structuredItems.push(block);
      accumulatedWordsOnPage += words;
    }

    return structuredItems;
  }

  return {
    decodeQuotedPrintable,
    extractHtmlFromEml,
    parseHtmlAnnotations,
    parseEmlNotes,
    splitIntoParagraphs,
    stitchContinuousProse
  };
});
