/**
 * Nintendo Switch Notes Studio Controller
 * Progressive disclosure (initial centered slot -> loaded carousel)
 * Live Reader with side-by-side break steps & metadata panel
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

  // Active Title Banner & Cards
  const activeTitleBanner = document.getElementById('active-title-banner');
  const cardEml = document.getElementById('card-eml');
  const cardBook = document.getElementById('card-book');
  const cardCover = document.getElementById('card-cover');
  const cardChangeFile = document.getElementById('card-change-file');

  const emlFileInput = document.getElementById('eml-file-input');
  const coverFileInput = document.getElementById('cover-file-input');

  const cardEmlTitle = document.getElementById('card-eml-title');
  const emlSubtext = document.getElementById('eml-subtext');
  const emlBadge = document.getElementById('eml-badge');

  const bookCardTitle = document.getElementById('book-card-title');
  const bookCardSub = document.getElementById('book-card-sub');

  const coverThumb = document.getElementById('cover-thumb');
  const coverIcon = document.getElementById('cover-icon');
  const coverTitleText = document.getElementById('cover-title-text');
  const coverSubtext = document.getElementById('cover-subtext');
  const coverBadge = document.getElementById('cover-badge');

  const footerStats = document.getElementById('footer-stats');

  const btnEpub = document.getElementById('btn-epub');
  const btnPdf = document.getElementById('btn-pdf');
  const btnRead = document.getElementById('btn-read');
  const btnReset = document.getElementById('btn-reset');

  // Reader Modal Elements
  const modalReader = document.getElementById('modal-reader');
  const btnCloseReader = document.getElementById('btn-close-reader');
  const readerModalTitleText = document.getElementById('reader-modal-title-text');
  const previewTitle = document.getElementById('preview-title');
  const previewAuthor = document.getElementById('preview-author');
  const previewBlocks = document.getElementById('preview-blocks');

  // Side Controls Inside Reader Modal
  const stepBlockItems = document.querySelectorAll('.step-block-item');
  const dividerSelect = document.getElementById('divider-select');
  const customDividerWrapper = document.getElementById('custom-divider-wrapper');
  const customDividerInput = document.getElementById('custom-divider-input');

  const titleInput = document.getElementById('book-title-input');
  const authorInput = document.getElementById('book-author-input');
  const filenameInput = document.getElementById('output-filename-input');

  // App State
  let currentParsedData = null;
  let currentCoverData = null;
  let currentCoverMime = null;
  let structuredBlocks = [];
  let currentBreakFrequency = 50; // Step 3 Standard

  // Helper to select card
  function selectCard(card) {
    document.querySelectorAll('.switch-card').forEach(c => c.classList.remove('is-selected'));
    card.classList.add('is-selected');
    const title = card.getAttribute('data-title') || '';
    if (activeTitleBanner) {
      activeTitleBanner.textContent = title;
    }
    playSound(klickSound);
  }

  [cardEml, cardBook, cardCover, cardChangeFile].forEach(card => {
    card.addEventListener('mouseenter', () => selectCard(card));
  });

  // Card 1: Initial EML Selector
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

  // Card: Change File Click
  cardChangeFile.addEventListener('click', () => emlFileInput.click());

  // Card: Book Click -> Opens Reader
  cardBook.addEventListener('click', openReaderModal);
  btnRead.addEventListener('click', openReaderModal);

  // Card 2: Cover Art Slot
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

  function handleEmlFile(file) {
    playSound(newsSound);
    const reader = new FileReader();
    reader.onload = (e) => {
      processEml(e.target.result, file.name);
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
      coverTitleText.textContent = 'Cover Set';
      coverSubtext.textContent = file.name.slice(0, 14);
      cardCover.classList.add('is-loaded');
    };
    reader.readAsDataURL(file);
  }

  function processEml(rawEml, filename) {
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

      // Update Card Labels
      bookCardTitle.textContent = (parsed.title || 'Book Notes').slice(0, 16) + '...';
      bookCardSub.textContent = `${parsed.annotations.length} highlights`;

      const totalWords = parsed.annotations.reduce((acc, curr) => {
        const words = (curr.text + ' ' + curr.note).trim().split(/\s+/).filter(Boolean).length;
        return acc + words;
      }, 0);

      // Progressive disclosure: Hide cardEml, show cardBook, cardCover, cardChangeFile
      cardEml.style.display = 'none';
      cardBook.style.display = 'flex';
      cardCover.style.display = 'flex';
      cardChangeFile.style.display = 'flex';

      // Select Book Card as active
      selectCard(cardBook);

      // Enable Action Buttons
      btnEpub.classList.remove('disabled');
      btnPdf.classList.remove('disabled');
      btnRead.classList.remove('disabled');

      recalculateAndRender();

      // Update Footer Stats
      footerStats.textContent = `${parsed.annotations.length} highlights • ${structuredBlocks.filter(b => b.type === 'page-break').length} pages • ${totalWords.toLocaleString()} words`;
    } catch (err) {
      console.error(err);
      alert('Could not parse .eml file. Please verify it is a valid Apple Books export.');
    }
  }

  // Open / Close Reader Modal
  function openReaderModal() {
    if (!currentParsedData) return;
    playSound(popupSound);
    readerModalTitleText.textContent = titleInput.value || 'Book Reader';
    modalReader.classList.add('is-open');
  }

  function closeReaderModal() {
    playSound(klickSound);
    modalReader.classList.remove('is-open');
  }

  btnCloseReader.addEventListener('click', closeReaderModal);
  modalReader.addEventListener('click', (e) => {
    if (e.target === modalReader) {
      closeReaderModal();
    }
  });

  // 5 Stepped Stop Click Listeners inside the Reader Modal
  stepBlockItems.forEach(item => {
    item.addEventListener('click', () => {
      playSound(klickSound);
      stepBlockItems.forEach(b => b.classList.remove('is-active'));
      item.classList.add('is-active');

      const val = parseInt(item.getAttribute('data-val'), 10);
      currentBreakFrequency = val;

      recalculateAndRender();
    });
  });

  // Divider format change
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

  // Metadata input changes live inside Reader Modal
  titleInput.addEventListener('input', () => {
    bookCardTitle.textContent = titleInput.value ? titleInput.value.slice(0, 16) + '...' : 'Book Notes';
    readerModalTitleText.textContent = titleInput.value || 'Book Reader';
    renderLivePreview();
  });
  authorInput.addEventListener('input', renderLivePreview);

  function recalculateAndRender() {
    if (!currentParsedData) return;

    structuredBlocks = window.EMLParser.stitchContinuousProse(currentParsedData.annotations, {
      breakFrequency: currentBreakFrequency,
      wordsPerPage: 350
    });

    const totalPages = structuredBlocks.filter(b => b.type === 'page-break').length || 1;
    const totalWords = currentParsedData.annotations.reduce((acc, curr) => {
      const words = (curr.text + ' ' + curr.note).trim().split(/\s+/).filter(Boolean).length;
      return acc + words;
    }, 0);

    footerStats.textContent = `${currentParsedData.annotations.length} highlights • ${totalPages} pages • ${totalWords.toLocaleString()} words`;

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

  // Reset Studio Button
  btnReset.addEventListener('click', () => {
    playSound(homeSound);
    currentParsedData = null;
    currentCoverData = null;
    currentCoverMime = null;
    structuredBlocks = [];

    // Reset Carousel to Initial Single Card
    cardEml.style.display = 'flex';
    cardBook.style.display = 'none';
    cardCover.style.display = 'none';
    cardChangeFile.style.display = 'none';

    selectCard(cardEml);

    coverThumb.style.display = 'none';
    coverIcon.style.display = 'block';
    coverTitleText.textContent = 'Cover Image';
    coverSubtext.textContent = 'Optional Art';
    cardCover.classList.remove('is-loaded');

    titleInput.value = '';
    authorInput.value = '';
    filenameInput.value = '';

    btnEpub.classList.add('disabled');
    btnPdf.classList.add('disabled');
    btnRead.classList.add('disabled');

    footerStats.textContent = 'Awaiting Apple Books export cartridge';
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
        element: document.getElementById('reader-book-container'),
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
