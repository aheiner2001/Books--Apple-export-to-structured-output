/**
 * Switch Notes Converter - Controller
 * Fully integrated with switchMenu-main carousel layout, animations, and sound effects
 */

document.addEventListener('DOMContentLoaded', () => {
  const clock = document.getElementById('clock');

  // Switch Sound Effects from switchMenu-main
  const klickSound = document.getElementById('klick');
  const popupSound = document.getElementById('audio');
  const profileSound = document.getElementById('profileSound');
  const newsSound = document.getElementById('news');
  const homeSound = document.getElementById('home-sound');

  function playSound(sound) {
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }

  // Authentic Switch Time Loop
  function time() {
    const d = new Date();
    let m = d.getMinutes();
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    clock.textContent = ('0' + hours).substr(-2) + ':' + ('0' + m).substr(-2) + ' ' + ampm;
  }
  time();
  setInterval(time, 1000);

  // Profile icon sound
  const profile = document.getElementById('profile');
  if (profile) {
    profile.addEventListener('click', () => playSound(profileSound));
  }

  // Carousel & Bubbles Sound Feedback
  const clickables = document.querySelectorAll('.is-clickable');
  clickables.forEach(elem => {
    elem.addEventListener('mouseenter', () => playSound(klickSound));
  });

  // Tile 1: EML Drop / Input
  const tileEml = document.getElementById('tile-eml');
  const emlFileInput = document.getElementById('eml-file-input');
  const tileEmlLabel = document.getElementById('tile-eml-label');
  const emlSubtext = document.getElementById('eml-subtext');

  tileEml.addEventListener('click', () => emlFileInput.click());
  tileEml.addEventListener('dragover', (e) => { e.preventDefault(); tileEml.classList.add('is-highlighted'); });
  tileEml.addEventListener('dragleave', () => tileEml.classList.remove('is-highlighted'));
  tileEml.addEventListener('drop', (e) => {
    e.preventDefault();
    tileEml.classList.remove('is-highlighted');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleEmlFile(e.dataTransfer.files[0]);
    }
  });
  emlFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleEmlFile(e.target.files[0]);
    }
  });

  // Tile 2: Cover Drop / Input
  const tileCover = document.getElementById('tile-cover');
  const coverFileInput = document.getElementById('cover-file-input');
  const coverTileImg = document.getElementById('cover-tile-img');
  const coverTileIcon = document.getElementById('cover-tile-icon');
  const coverTileText = document.getElementById('cover-tile-text');
  const coverSubtext = document.getElementById('cover-subtext');

  tileCover.addEventListener('click', () => coverFileInput.click());
  tileCover.addEventListener('dragover', (e) => { e.preventDefault(); tileCover.classList.add('is-highlighted'); });
  tileCover.addEventListener('dragleave', () => tileCover.classList.remove('is-highlighted'));
  tileCover.addEventListener('drop', (e) => {
    e.preventDefault();
    tileCover.classList.remove('is-highlighted');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCoverFile(e.dataTransfer.files[0]);
    }
  });
  coverFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleCoverFile(e.target.files[0]);
    }
  });

  // Tile 3: Preview Scroll Target
  const tilePreview = document.getElementById('tile-preview');
  const readerPreviewBox = document.getElementById('reader-preview-box');
  tilePreview.addEventListener('click', () => {
    playSound(popupSound);
    readerPreviewBox.scrollIntoView({ behavior: 'smooth' });
  });

  // Tile 4 & Bubble 3: Stepped Discrete Break Interval Modal
  const tileSlider = document.getElementById('tile-slider');
  const btnOpenSlider = document.getElementById('btn-open-slider');
  const dialogSlider = document.getElementById('dialog-slider');
  const btnCloseSlider = document.getElementById('btn-close-slider');
  const sliderSubtext = document.getElementById('slider-subtext');
  const stopBlockBtns = document.querySelectorAll('.stop-block-btn');

  let currentBreakFrequency = 50; // Default Step 3: Standard Breaks

  function openSliderModal() {
    playSound(popupSound);
    dialogSlider.classList.add('is-visible');
  }
  function closeSliderModal() {
    playSound(klickSound);
    dialogSlider.classList.remove('is-visible');
  }

  tileSlider.addEventListener('click', openSliderModal);
  btnOpenSlider.addEventListener('click', openSliderModal);
  btnCloseSlider.addEventListener('click', closeSliderModal);

  // Stepped block clicks (5 discrete stops)
  stopBlockBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound(klickSound);
      stopBlockBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const step = btn.getAttribute('data-step');
      const val = parseInt(btn.getAttribute('data-val'), 10);
      currentBreakFrequency = val;

      const desc = btn.querySelector('.stop-block-desc').textContent;
      sliderSubtext.textContent = `${desc} (Step ${step})`;

      if (currentParsedData) {
        recalculateAndRender();
      }
    });
  });

  // Divider Style Select
  const dividerStyleSelect = document.getElementById('divider-style-select');
  const customDividerWrapper = document.getElementById('custom-divider-wrapper');
  const customDividerInput = document.getElementById('custom-divider-input');

  dividerStyleSelect.addEventListener('change', () => {
    playSound(klickSound);
    if (dividerStyleSelect.value === 'custom') {
      customDividerWrapper.style.display = 'flex';
    } else {
      customDividerWrapper.style.display = 'none';
    }
    renderLivePreview();
  });

  customDividerInput.addEventListener('input', () => {
    renderLivePreview();
  });

  // Tile 5 & Bubble 4: Metadata Modal
  const tileMeta = document.getElementById('tile-meta');
  const btnOpenMeta = document.getElementById('btn-open-meta');
  const dialogMeta = document.getElementById('dialog-meta');
  const btnCloseMeta = document.getElementById('btn-close-meta');
  const titleInput = document.getElementById('book-title-input');
  const authorInput = document.getElementById('book-author-input');
  const filenameInput = document.getElementById('output-filename-input');
  const metaSubtext = document.getElementById('meta-subtext');

  function openMetaModal() {
    playSound(popupSound);
    dialogMeta.classList.add('is-visible');
  }
  function closeMetaModal() {
    playSound(klickSound);
    dialogMeta.classList.remove('is-visible');
    renderLivePreview();
  }

  tileMeta.addEventListener('click', openMetaModal);
  btnOpenMeta.addEventListener('click', openMetaModal);
  btnCloseMeta.addEventListener('click', closeMetaModal);

  titleInput.addEventListener('input', () => {
    metaSubtext.textContent = titleInput.value ? titleInput.value.slice(0, 18) + '...' : 'Edit Title';
    renderLivePreview();
  });
  authorInput.addEventListener('input', renderLivePreview);

  // Close modals on overlay click
  [dialogSlider, dialogMeta].forEach(dialog => {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.classList.remove('is-visible');
        playSound(klickSound);
      }
    });
  });

  // App State
  let currentParsedData = null;
  let currentCoverData = null;
  let currentCoverMime = null;
  let structuredBlocks = [];

  // DOM Elements for Live Reader & Stats
  const readerEmpty = document.getElementById('reader-empty');
  const readerLive = document.getElementById('reader-live');
  const previewTitle = document.getElementById('preview-title');
  const previewAuthor = document.getElementById('preview-author');
  const previewBlocks = document.getElementById('preview-blocks');
  const previewCardTitle = document.getElementById('preview-card-title');
  const previewCardSub = document.getElementById('preview-card-sub');

  const statAnnotations = document.getElementById('stat-annotations');
  const statPages = document.getElementById('stat-pages');
  const statWords = document.getElementById('stat-words');

  const btnDownloadEpub = document.getElementById('btn-download-epub');
  const btnDownloadPdf = document.getElementById('btn-download-pdf');
  const btnReset = document.getElementById('btn-reset');

  function handleEmlFile(file) {
    tileEmlLabel.textContent = file.name;
    emlSubtext.textContent = 'Loaded: ' + file.name.slice(0, 16) + '...';
    playSound(newsSound);
    const reader = new FileReader();
    reader.onload = (e) => {
      processEml(e.target.result);
    };
    reader.readAsText(file);
  }

  function handleCoverFile(file) {
    playSound(popupSound);
    const reader = new FileReader();
    reader.onload = (e) => {
      currentCoverData = e.target.result;
      currentCoverMime = file.type || 'image/jpeg';
      coverTileImg.src = currentCoverData;
      coverTileImg.style.display = 'block';
      coverTileIcon.style.display = 'none';
      coverTileText.textContent = 'Cover Attached';
      coverSubtext.textContent = file.name.slice(0, 14);
    };
    reader.readAsDataURL(file);
  }

  function processEml(rawEml) {
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

      previewCardTitle.textContent = (parsed.title || 'Book Notes').slice(0, 18) + '...';
      previewCardSub.textContent = `${parsed.annotations.length} highlights`;

      const totalWords = parsed.annotations.reduce((acc, curr) => {
        const words = (curr.text + ' ' + curr.note).trim().split(/\s+/).filter(Boolean).length;
        return acc + words;
      }, 0);

      statAnnotations.textContent = `${parsed.annotations.length} highlights`;
      statWords.textContent = `${totalWords.toLocaleString()} words`;

      recalculateAndRender();

      btnDownloadEpub.classList.remove('disabled');
      btnDownloadPdf.classList.remove('disabled');
    } catch (err) {
      console.error(err);
      alert('Could not parse .eml file. Please verify it is a valid Apple Books export.');
    }
  }

  function recalculateAndRender() {
    if (!currentParsedData) return;

    structuredBlocks = window.EMLParser.stitchContinuousProse(currentParsedData.annotations, {
      breakFrequency: currentBreakFrequency,
      wordsPerPage: 350
    });

    const totalPages = structuredBlocks.filter(b => b.type === 'page-break').length || 1;
    statPages.textContent = `${totalPages} pages`;

    renderLivePreview();
  }

  function getDividerLabelText(pageNumber) {
    const style = dividerStyleSelect.value;
    if (style === 'none') return '';
    if (style === 'custom') {
      const customPrefix = (customDividerInput.value || '').trim();
      return customPrefix ? `${customPrefix} ${pageNumber}` : `${pageNumber}`;
    }
    return `${style} ${pageNumber}`;
  }

  function renderLivePreview() {
    if (!currentParsedData) return;

    readerEmpty.style.display = 'none';
    readerLive.style.display = 'block';

    previewTitle.textContent = titleInput.value || 'Untitled Notes';
    previewAuthor.textContent = authorInput.value ? `by ${authorInput.value}` : '';

    previewBlocks.innerHTML = '';

    for (const block of structuredBlocks) {
      if (block.type === 'page-break') {
        const div = document.createElement('div');
        div.className = 'book-page-marker-block';
        const labelText = getDividerLabelText(block.pageNumber);
        if (labelText) {
          div.textContent = labelText;
        } else {
          div.style.fontSize = '0';
          div.innerHTML = '&nbsp;';
        }
        previewBlocks.appendChild(div);
      } else if (block.type === 'prose') {
        const p = document.createElement('p');
        p.className = 'book-prose-block';
        p.textContent = block.content;
        previewBlocks.appendChild(p);
      } else if (block.type === 'note') {
        const div = document.createElement('div');
        div.className = 'book-user-note-block';
        div.textContent = block.content;
        previewBlocks.appendChild(div);
      }
    }
  }

  // Reset Studio
  btnReset.addEventListener('click', () => {
    playSound(homeSound);
    currentParsedData = null;
    currentCoverData = null;
    currentCoverMime = null;
    structuredBlocks = [];

    tileEmlLabel.textContent = 'Insert .eml File';
    emlSubtext.textContent = 'Click or Drop file';
    coverTileImg.style.display = 'none';
    coverTileIcon.style.display = 'block';
    coverTileText.textContent = 'Optional Cover';
    coverSubtext.textContent = 'PNG, JPG, WEBP';

    previewCardTitle.textContent = 'Book Notes';
    previewCardSub.textContent = 'Waiting for file...';

    titleInput.value = '';
    authorInput.value = '';
    filenameInput.value = '';
    metaSubtext.textContent = 'Edit Title / Author';

    statAnnotations.textContent = '0 highlights';
    statPages.textContent = '0 pages';
    statWords.textContent = '0 words';

    readerEmpty.style.display = 'block';
    readerLive.style.display = 'none';

    btnDownloadEpub.classList.add('disabled');
    btnDownloadPdf.classList.add('disabled');
  });

  // Export EPUB
  btnDownloadEpub.addEventListener('click', async () => {
    if (!currentParsedData) return;
    playSound(popupSound);
    btnDownloadEpub.classList.add('disabled');

    try {
      const blob = await window.EPUBGenerator.generateEpub({
        title: titleInput.value || 'Untitled Notes',
        author: authorInput.value || 'Unknown',
        blocks: structuredBlocks,
        coverData: currentCoverData,
        coverMime: currentCoverMime,
        dividerLabel: dividerStyleSelect.value,
        customDividerText: customDividerInput.value
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
      console.error(err);
      alert('Failed to generate EPUB: ' + err.message);
    } finally {
      btnDownloadEpub.classList.remove('disabled');
    }
  });

  // Export PDF
  btnDownloadPdf.addEventListener('click', async () => {
    if (!currentParsedData) return;
    playSound(popupSound);
    btnDownloadPdf.classList.add('disabled');

    try {
      const filename = (filenameInput.value || 'book-notes').replace(/\.pdf$/i, '') + '.pdf';
      await window.PDFGenerator.generatePdf({
        element: readerLive,
        filename: filename
      });
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      btnDownloadPdf.classList.remove('disabled');
    }
  });
});
