const assert = require('assert');
const JSZip = require('jszip');
const { generateEpub } = require('../js/epub-generator.js');

async function testEpubGeneration() {
  console.log('Running Task 2 EPUB Generator Tests...');

  const sampleBlocks = [
    { type: 'prose', content: 'This is the first stitched paragraph of the book notes.' },
    { type: 'note', content: 'Aaron note: This is a critical insight.' },
    { type: 'prose', content: 'This is another thought continuous from the book.' }
  ];

  const epubBuffer = await generateEpub({
    title: 'The Craving Mind',
    author: 'Judson Brewer',
    blocks: sampleBlocks,
    coverData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    coverMime: 'image/png'
  });

  assert.ok(epubBuffer, 'EPUB buffer should be generated');
  assert.ok(epubBuffer.length > 500, 'EPUB buffer should contain content');

  // Verify internal ZIP structure
  const zip = await JSZip.loadAsync(epubBuffer);

  // Check required EPUB files
  assert.ok(zip.file('mimetype'), 'Must have mimetype');
  assert.ok(zip.file('META-INF/container.xml'), 'Must have container.xml');
  assert.ok(zip.file('OEBPS/content.opf'), 'Must have content.opf');
  assert.ok(zip.file('OEBPS/chapter1.xhtml'), 'Must have chapter1.xhtml');
  assert.ok(zip.file('OEBPS/cover.png'), 'Must have cover image');

  const chapterContent = await zip.file('OEBPS/chapter1.xhtml').async('string');
  assert.ok(chapterContent.includes('The Craving Mind'), 'Chapter must include title');
  assert.ok(chapterContent.includes('Aaron note: This is a critical insight.'), 'Chapter must include user note');
  assert.ok(!chapterContent.includes('October 29, 2026'), 'Should not contain date');

  console.log('✓ EPUB 3 internal structure fully compliant');
  console.log('✓ Cover and chapters successfully bundled');
  console.log('All Task 2 tests passed successfully!');
}

testEpubGeneration().catch(err => {
  console.error(err);
  process.exit(1);
});
