/**
 * Nintendo Switch Notes Studio Controller
 * Fullscreen Switch OS UI with audio, 5-step discrete intervals, and live live reader
 */

document.addEventListener('DOMContentLoaded', () => {
  const clock = document.getElementById('clock');

  // Audio elements
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

  // Switch Live Clock
  function updateClock() {
    const d = new Date();
    let m = d.getMinutes();
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    if (clock) {
      clock.textContent = `${hours}:${m < 10 ? '0' + m : m} ${ampm}`;
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Profile click
  const profileBtn = document.getElementById('profile-btn');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => playSound(profileSound));
  }

  // Carousel Active Title & Selection
  const activeTitleBanner = document.getElementById('active-title-banner');
  const cards = document.querySelectorAll('.switch-card');

  function selectCard(card) {
    cards.forEach(c => c.classList.remove('is-selected'));
    card.classList.add('is-selected');
    const title = card.getAttribute('data-title') || '';
    if (activeTitleBanner) {
      activeTitleBanner.textContent = title;
    }
    playSound(klickSound);
  }

  cards.forEach(card => {
    card.addEventListener('mouseenter', () => selectCard(card));
  });

  // Card 1: EML File Selector
  const cardEml = document.getElementById('card-eml');
  const emlFileInput = document.getElementById('eml-file-input');
  const emlSubtext = document.getElementById('eml-subtext');
  const emlBadge = document.getElementById('eml-badge');

  cardEml.addEventListener('click', () => emlFileInput.click());
  cardEml.addEventListener('dragover', (e) => { e.preventDefault(); cardEml.classList.add('is-selected'); });
  cardEml.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleEmlFile(e.dataTransfer.files[0]);
    }
  });
  emlFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleEmlFile(e.target.files[0]);
    }
  });

  // Card 2: Book Cover Selector
  const cardCover = document.getElementById('card-cover');
  const coverFileInput = document.getElementById('cover-file-input');
  const coverThumb = document.getElementById('cover-thumb');
  const coverIcon = document.getElementById('cover-icon');
  const coverTitleText = document.getElementById('cover-title-text');
  const coverSubtext = document.getElementById('cover-subtext');
  const coverBadge = document.getElementById('cover-badge');

  cardCover.addEventListener('click', () => coverFileInput.click());
  cardCover.addEventListener('dragover', (e) => { e.preventDefault(); cardCover.classList.add('is-selected'); });
  cardCover.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCoverFile(e.dataTransfer.files[0]);
    }
  });
  coverFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleCoverFile(e.target.files[0]);
    }
  });

  // Card 3 & Option Button 3: Reader Modal
  const cardReader = document.getElementById('card-reader');
  const btnReaderOpen = document.getElementById('btn-reader-open');
  const modalReader = document.getElementById('modal-reader');
  const btnCloseReader = document.getElementById('btn-close-reader');

  function openReaderModal() {
    playSound(popupSound);
    modalReader.classList.add('is-open');
  }
  function closeReaderModal() {
    playSound(klickSound);
    modalReader.classList.remove('is-open');
  }

  cardReader.addEventListener('click', openReaderModal);
  btnReaderOpen.addEventListener('click', openReaderModal);
  btnCloseReader.addEventListener('click', closeReaderModal);

  // Card 4 & Option Button 4: Break Steps Modal
  const cardBreaks = document.getElementById('card-breaks');
  const btnStepsOpen = document.getElementById('btn-steps-open');
  const modalBreaks = document.getElementById('modal-breaks');
  const btnCloseBreaks = document.getElementById('btn-close-breaks');
  const breaksCardSub = document.getElementById('breaks-card-sub');
  const stepBtns = document.querySelectorAll('.step-btn');

  let currentBreakFrequency = 50; // Step 3 Standard

  function openBreaksModal() {
    playSound(popupSound);
    modalBreaks.classList.add('is-open');
  }
  function closeBreaksModal() {
    playSound(klickSound);
    modalBreaks.classList.remove('is-open');
  }

  cardBreaks.addEventListener('click', openBreaksModal);
  btnStepsOpen.addEventListener('click', openBreaksModal);
  btnCloseBreaks.addEventListener('click', closeBreaksModal);

  stepBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound(klickSound);
      stepBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const step = btn.getAttribute('data-step');
      const val = parseInt(btn.getAttribute('data-val'), 10);
      currentBreakFrequency = val;

      const name = btn.querySelector('.step-name').textContent;
      breaksCardSub.textContent = `${name} (Step ${step})`;

      if (currentParsedData) {
        recalculateAndRender();
      }
    });
  });

  // Divider style selection
  const dividerSelect = document.getElementById('divider-select');
  const customDividerWrapper = document.getElementById('custom-divider-wrapper');
  const customDividerInput = document.getElementById('custom-divider-input');

  dividerSelect.addEventListener('change', () => {
    playSound(klickSound);
    if (dividerSelect.value === 'custom') {
      customDividerWrapper.style.display = 'flex';
    } else {
      customDividerWrapper.style.display = 'none';
    }
    renderLivePreview();
  });

  customDividerInput.addEventListener('input', () => {
    renderLivePreview();
  });

  // Card 5: Metadata Modal
  const cardMeta = document.getElementById('card-meta');
  const modalMeta = document.getElementById('modal-meta');
  const btnCloseMeta = document.getElementById('btn-close-meta');
  const titleInput = document.getElementById('book-title-input');
  const authorInput = document.getElementById('book-author-input');
  const filenameInput = document.getElementById('output-filename-input');
  const metaCardSub = document.getElementById('meta-card-sub');

  function openMetaModal() {
    playSound(popupSound);
    modalMeta.classList.add('is-open');
  }
  function closeMetaModal() {
    playSound(klickSound);
    modalMeta.classList.remove('is-open');
    renderLivePreview();
  }

  cardMeta.addEventListener('click', openMetaModal);
  btnCloseMeta.addEventListener('click', closeMetaModal);

  titleInput.addEventListener('input', () => {
    metaCardSub.textContent = titleInput.value ? titleInput.value.slice(0, 16) + '...' : 'Edit Details';
    renderLivePreview();
  });
  authorInput.addEventListener('input', renderLivePreview);

  // Close modals on overlay backdrop click
  [modalReader, modalBreaks, modalMeta].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('is-open');
        playSound(klickSound);
      }
    });
  });

  // State Management
  let currentParsedData = null;
  let currentCoverData = null;
  let currentCoverMime = null;
  let structuredBlocks = [];

  // DOM Preview & Stats elements
  const readerEmpty = document.getElementById('reader-empty');
  const readerLive = document.getElementById('reader-live');
  const previewTitle = document.getElementById('preview-title');
  const previewAuthor = document.getElementById('preview-author');
  const previewBlocks = document.getElementById('preview-blocks');
  const readerCardTitle = document.getElementById('reader-card-title');
  const readerCardSub = document.getElementById('reader-card-sub');

  const statAnnotations = document.getElementById('stat-annotations');
  const statPages = document.getElementById('stat-pages');
  const statWords = document.getElementById('stat-words');

  const btnEpub = document.getElementById('btn-epub');
  const btnPdf = document.getElementById('btn-pdf');
  const btnReset = document.getElementById('btn-reset');

  function handleEmlFile(file) {
    emlSubtext.textContent = file.name.slice(0, 16) + '...';
    cardEml.classList.add('is-loaded');
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
      coverThumb.src = currentCoverData;
      coverThumb.style.display = 'block';
      coverIcon.style.display = 'none';
      coverTitleText.textContent = 'Cover Attached';
      coverSubtext.textContent = file.name.slice(0, 14);
      cardCover.classList.add('is-loaded');
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

      readerCardTitle.textContent = (parsed.title || 'Book Reader').slice(0, 16) + '...';
      readerCardSub.textContent = `${parsed.annotations.length} highlights`;

      const totalWords = parsed.annotations.reduce((acc, curr) => {
        const words = (curr.text + ' ' + curr.note).trim().split(/\s+/).filter(Boolean).length;
        return acc + words;
      }, 0);

      statAnnotations.textContent = `${parsed.annotations.length} highlights`;
      statWords.textContent = `${totalWords.toLocaleString()} words`;

      recalculateAndRender();

      // Enable EPUB and PDF buttons
      btnEpub.classList.remove('disabled');
      btnPdf.classList.remove('disabled');
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
    const style = dividerSelect.value;
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
        div.className = 'book-marker-tag';
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
        p.className = 'book-p';
        p.textContent = block.content;
        previewBlocks.appendChild(p);
      } else if (block.type === 'note') {
        const div = document.createElement('div');
        div.className = 'book-note-card';
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

    emlSubtext.textContent = 'Click or Drop file';
    cardEml.classList.remove('is-loaded');

    coverThumb.style.display = 'none';
    coverIcon.style.display = 'block';
    coverTitleText.textContent = 'Cover Image';
    coverSubtext.textContent = 'PNG, JPG, WEBP';
    cardCover.classList.remove('is-loaded');

    readerCardTitle.textContent = 'Book Reader';
    readerCardSub.textContent = 'Click to Open';

    titleInput.value = '';
    authorInput.value = '';
    filenameInput.value = '';
    metaCardSub.textContent = 'Edit Details';

    statAnnotations.textContent = '0 highlights';
    statPages.textContent = '0 pages';
    statWords.textContent = '0 words';

    readerEmpty.style.display = 'block';
    readerLive.style.display = 'none';

    btnEpub.classList.add('disabled');
    btnPdf.classList.add('disabled');
  });

  // Export EPUB
  btnEpub.addEventListener('click', async () => {
    if (!currentParsedData) return;
    playSound(popupSound);
    btnEpub.classList.add('disabled');

    try {
      const blob = await window.EPUBGenerator.generateEpub({
        title: titleInput.value || 'Untitled Notes',
        author: authorInput.value || 'Unknown',
        blocks: structuredBlocks,
        coverData: currentCoverData,
        coverMime: currentCoverMime,
        dividerLabel: dividerSelect.value,
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
      btnEpub.classList.remove('disabled');
    }
  });

  // Export PDF
  btnPdf.addEventListener('click', async () => {
    if (!currentParsedData) return;
    playSound(popupSound);
    btnPdf.classList.add('disabled');

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
      btnPdf.classList.remove('disabled');
    }
  });
});
