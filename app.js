/**
 * Application Controller - Nintendo Switch Style UI
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const switchClock = document.getElementById('switch-clock');
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

  const statAnnotations = document.getElementById('stat-annotations');
  const statPages = document.getElementById('stat-pages');
  const statWords = document.getElementById('stat-words');

  const btnDownloadEpub = document.getElementById('btn-download-epub');
  const btnDownloadPdf = document.getElementById('btn-download-pdf');
  const btnReset = document.getElementById('btn-reset');

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

  // Clock Update (Switch Status Bar)
  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    if (switchClock) {
      switchClock.textContent = `${hours}:${minutes} ${ampm}`;
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Setup Dropzone
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
    emlDropzone.classList.add('is-loaded');
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
      coverDropzone.classList.add('is-loaded');
    } else {
      coverPreviewContainer.style.display = 'none';
      previewCoverCenter.style.display = 'none';
      coverDropzone.classList.remove('is-loaded');
    }
  }

  // Slider Interval Logic
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

    structuredBlocks = window.EMLParser.stitchContinuousProse(currentParsedData.annotations, {
      breakFrequency: breakFrequency,
      wordsPerPage: 350
    });

    const totalPages = structuredBlocks.filter(b => b.type === 'page-break').length || 1;
    statPages.textContent = `${totalPages} pages`;

    renderLivePreview();
  }

  // EML Processing
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

      recalculateAndRender();

      // Enable Switch Action Bubbles
      btnDownloadEpub.classList.remove('disabled');
      btnDownloadPdf.classList.remove('disabled');
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
        div.className = 'book-page-marker';
        div.textContent = `Page ${block.pageNumber}`;
        previewBodyBlocks.appendChild(div);
      } else if (block.type === 'prose') {
        const p = document.createElement('p');
        p.className = 'book-prose';
        p.textContent = block.content;
        previewBodyBlocks.appendChild(p);
      } else if (block.type === 'note') {
        const div = document.createElement('div');
        div.className = 'book-note';
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

  // Reset Button
  btnReset.addEventListener('click', () => {
    currentParsedData = null;
    currentCoverData = null;
    currentCoverMime = null;
    structuredBlocks = [];
    emlDropLabel.textContent = 'Insert .eml Export';
    emlDropzone.classList.remove('is-loaded');
    coverDropzone.classList.remove('is-loaded');
    coverPreviewContainer.style.display = 'none';
    previewCoverCenter.style.display = 'none';
    titleInput.value = '';
    authorInput.value = '';
    filenameInput.value = '';
    statAnnotations.textContent = '0 highlights';
    statPages.textContent = '0 pages';
    statWords.textContent = '0 words';
    emptyState.style.display = 'block';
    bookContent.style.display = 'none';
    btnDownloadEpub.classList.add('disabled');
    btnDownloadPdf.classList.add('disabled');
  });

  // Export EPUB
  btnDownloadEpub.addEventListener('click', async () => {
    if (!currentParsedData) return;

    btnDownloadEpub.classList.add('disabled');

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
      btnDownloadEpub.classList.remove('disabled');
    }
  });

  // Export PDF
  btnDownloadPdf.addEventListener('click', async () => {
    if (!currentParsedData) return;

    btnDownloadPdf.classList.add('disabled');

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
      btnDownloadPdf.classList.remove('disabled');
    }
  });
});
