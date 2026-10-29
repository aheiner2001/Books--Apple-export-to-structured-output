/**
 * Application Controller
 * Handles UI interactions, file drops, live preview rendering, and export triggers
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const emlDropzone = document.getElementById('eml-dropzone');
  const emlFileInput = document.getElementById('eml-file-input');
  const emlDropLabel = document.getElementById('eml-drop-label');

  const coverDropzone = document.getElementById('cover-dropzone');
  const coverFileInput = document.getElementById('cover-file-input');
  const coverPreviewContainer = document.getElementById('cover-preview-container');
  const coverImgPreview = document.getElementById('cover-img-preview');
  const btnRemoveCover = document.getElementById('btn-remove-cover');

  const breakIntervalSlider = document.getElementById('break-interval-slider');
  const sliderIntervalLabel = document.getElementById('slider-interval-label');

  const titleInput = document.getElementById('book-title-input');
  const authorInput = document.getElementById('book-author-input');
  const filenameInput = document.getElementById('output-filename-input');

  const statsBox = document.getElementById('stats-box');
  const statAnnotations = document.getElementById('stat-annotations');
  const statPages = document.getElementById('stat-pages');
  const statWords = document.getElementById('stat-words');

  const btnDownloadEpub = document.getElementById('btn-download-epub');
  const btnDownloadPdf = document.getElementById('btn-download-pdf');

  const emptyState = document.getElementById('empty-state');
  const bookContent = document.getElementById('book-content');
  const previewCoverCenter = document.getElementById('preview-cover-center');
  const previewCoverElement = document.getElementById('preview-cover-element');
  const previewTitle = document.getElementById('preview-title');
  const previewAuthor = document.getElementById('preview-author');
  const previewBodyBlocks = document.getElementById('preview-body-blocks');

  // App State
  let currentParsedData = null;
  let currentCoverData = null; // Data URL
  let currentCoverMime = null;
  let structuredBlocks = [];

  // ============================
  // File Drop / Selection Handlers
  // ============================

  function setupDropzone(dropzone, fileInput, onFileSelected) {
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    ['dragleave', 'dragend'].forEach(event => {
      dropzone.addEventListener(event, () => dropzone.classList.remove('dragover'));
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onFileSelected(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        onFileSelected(e.target.files[0]);
      }
    });
  }

  // Setup EML Dropper
  setupDropzone(emlDropzone, emlFileInput, (file) => {
    emlDropLabel.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      processEmlContent(content, file.name);
    };
    reader.readAsText(file);
  });

  // Setup Cover Dropper
  setupDropzone(coverDropzone, coverFileInput, (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      currentCoverData = e.target.result;
      currentCoverMime = file.type || 'image/jpeg';
      renderCoverPreview();
    };
    reader.readAsDataURL(file);
  });

  btnRemoveCover.addEventListener('click', () => {
    currentCoverData = null;
    currentCoverMime = null;
    coverFileInput.value = '';
    renderCoverPreview();
  });

  function renderCoverPreview() {
    if (currentCoverData) {
      coverImgPreview.src = currentCoverData;
      coverPreviewContainer.style.display = 'flex';
      previewCoverElement.src = currentCoverData;
      previewCoverCenter.style.display = 'block';
    } else {
      coverPreviewContainer.style.display = 'none';
      previewCoverCenter.style.display = 'none';
    }
  }

  // ============================
  // Slider / Interval Controls
  // ============================

  function updateSliderLabel(val) {
    if (val >= 95) {
      sliderIntervalLabel.textContent = 'Every Note Separated';
    } else if (val >= 65) {
      sliderIntervalLabel.textContent = 'Frequent Breaks';
    } else if (val >= 35) {
      sliderIntervalLabel.textContent = 'Balanced Breaks';
    } else if (val > 5) {
      sliderIntervalLabel.textContent = 'Fewer Breaks';
    } else {
      sliderIntervalLabel.textContent = 'Maximum Combined';
    }
  }

  breakIntervalSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    updateSliderLabel(val);
    if (currentParsedData) {
      recalculateAndRender();
    }
  });

  function recalculateAndRender() {
    if (!currentParsedData) return;

    const breakFrequency = parseInt(breakIntervalSlider.value, 10);

    // Re-stitch using user-controlled break frequency
    structuredBlocks = window.EMLParser.stitchContinuousProse(currentParsedData.annotations, {
      breakFrequency: breakFrequency,
      wordsPerPage: 350
    });

    const totalPages = structuredBlocks.filter(b => b.type === 'page-break').length || 1;
    statPages.textContent = `${totalPages} pages`;

    renderLivePreview();
  }

  // ============================
  // EML Processing & Rendering
  // ============================

  function processEmlContent(rawEml, originalFilename) {
    try {
      const parsed = window.EMLParser.parseEmlNotes(rawEml);
      currentParsedData = parsed;

      const safeTitle = (parsed.title || 'book-notes')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      titleInput.value = parsed.title || '';
      authorInput.value = parsed.author || '';
      filenameInput.value = safeTitle || 'notes';

      const totalWords = parsed.annotations.reduce((acc, curr) => {
        const words = (curr.text + ' ' + curr.note).trim().split(/\s+/).filter(Boolean).length;
        return acc + words;
      }, 0);

      statAnnotations.textContent = `${parsed.annotations.length} highlights`;
      statWords.textContent = `${totalWords.toLocaleString()} words`;
      statsBox.style.display = 'flex';

      recalculateAndRender();

      btnDownloadEpub.disabled = false;
      btnDownloadPdf.disabled = false;
    } catch (err) {
      console.error('Error parsing EML:', err);
      alert('Could not parse this .eml file. Please verify it is a valid Apple Books export.');
    }
  }

  function renderLivePreview() {
    if (!currentParsedData) return;

    emptyState.style.display = 'none';
    bookContent.style.display = 'block';

    previewTitle.textContent = titleInput.value || 'Untitled Notes';
    previewAuthor.textContent = authorInput.value ? `by ${authorInput.value}` : '';

    previewBodyBlocks.innerHTML = '';

    for (const block of structuredBlocks) {
      if (block.type === 'page-break') {
        const div = document.createElement('div');
        div.className = 'page-marker-ui';
        div.textContent = `Page ${block.pageNumber}`;
        previewBodyBlocks.appendChild(div);
      } else if (block.type === 'prose') {
        const p = document.createElement('p');
        p.className = 'book-prose-p';
        p.textContent = block.content;
        previewBodyBlocks.appendChild(p);
      } else if (block.type === 'note') {
        const div = document.createElement('div');
        div.className = 'book-user-note';
        div.textContent = block.content;
        previewBodyBlocks.appendChild(div);
      }
    }
  }

  titleInput.addEventListener('input', () => {
    previewTitle.textContent = titleInput.value || 'Untitled Notes';
  });

  authorInput.addEventListener('input', () => {
    previewAuthor.textContent = authorInput.value ? `by ${authorInput.value}` : '';
  });

  // ============================
  // Export Handlers
  // ============================

  // EPUB Export
  btnDownloadEpub.addEventListener('click', async () => {
    if (!currentParsedData) return;

    btnDownloadEpub.disabled = true;
    const originalText = btnDownloadEpub.innerHTML;
    btnDownloadEpub.innerHTML = '<span>Generating EPUB...</span>';

    try {
      const blob = await window.EPUBGenerator.generateEpub({
        title: titleInput.value || 'Untitled Notes',
        author: authorInput.value || 'Unknown',
        blocks: structuredBlocks,
        coverData: currentCoverData,
        coverMime: currentCoverMime
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = (filenameInput.value || 'book-notes').replace(/\.epub$/i, '') + '.epub';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('EPUB Generation error:', err);
      alert('Failed to generate EPUB: ' + err.message);
    } finally {
      btnDownloadEpub.disabled = false;
      btnDownloadEpub.innerHTML = originalText;
    }
  });

  // PDF Export
  btnDownloadPdf.addEventListener('click', async () => {
    if (!currentParsedData) return;

    btnDownloadPdf.disabled = true;
    const originalText = btnDownloadPdf.innerHTML;
    btnDownloadPdf.innerHTML = '<span>Generating PDF...</span>';

    try {
      const filename = (filenameInput.value || 'book-notes').replace(/\.pdf$/i, '') + '.pdf';
      await window.PDFGenerator.generatePdf({
        element: bookContent,
        filename: filename
      });
    } catch (err) {
      console.error('PDF Generation error:', err);
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      btnDownloadPdf.disabled = false;
      btnDownloadPdf.innerHTML = originalText;
    }
  });
});
