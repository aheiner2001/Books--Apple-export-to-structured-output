/**
 * PDF Generator for Apple Books Notes
 * Supports client-side rendering with html2pdf / jsPDF and clean print styling
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PDFGenerator = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  /**
   * Generates and triggers download of a styled book PDF
   * @param {Object} options
   * @param {HTMLElement} options.element - The element container to convert to PDF
   * @param {string} options.filename - Output filename (e.g., 'The Craving Mind.pdf')
   */
  async function generatePdf(options) {
    const filename = options.filename || 'Book-Notes.pdf';
    const element = options.element;

    if (!element) {
      throw new Error('Element to render into PDF is required.');
    }

    // Check if html2pdf is available
    if (typeof window !== 'undefined' && window.html2pdf) {
      const opt = {
        margin: [15, 15, 15, 15],
        filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      return await window.html2pdf().set(opt).from(element).save();
    } else if (typeof window !== 'undefined') {
      // Fallback: Use browser print engine
      window.print();
    } else {
      console.warn('PDF generation in non-browser environment requires a headless renderer.');
    }
  }

  return {
    generatePdf
  };
});
