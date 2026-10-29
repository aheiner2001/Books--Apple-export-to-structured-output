const fs = require('fs');
const assert = require('assert');
const { parseEmlNotes, stitchContinuousProse } = require('../js/eml-parser.js');
const { generateEpub } = require('../js/epub-generator.js');

async function runEndToEndVerification() {
  console.log('Running End-to-End Verification with real sample file...');
  const samplePath = '/Users/aaronheiner/Downloads/Notes from “The Craving Mind_ From Cigarettes to Smartphones to Love - Why We Get Hooked and How We Can Break Bad Habits” by Judson Brewer.eml';

  const rawEml = fs.readFileSync(samplePath, 'utf8');
  const parsed = parseEmlNotes(rawEml);

  // 1. Verify Title & Author
  console.log(`Parsed Title: "${parsed.title}"`);
  console.log(`Parsed Author: "${parsed.author}"`);
  assert.ok(parsed.title.includes('The Craving Mind'), 'Title correctly parsed');
  assert.strictEqual(parsed.author, 'Judson Brewer', 'Author correctly parsed');

  // 2. Verify Annotations count
  assert.ok(parsed.annotations.length > 50, `Expected over 50 highlights, found ${parsed.annotations.length}`);
  console.log(`✓ Total highlights found: ${parsed.annotations.length}`);

  // 3. Verify Date Stripping & Order
  // Earliest highlight in the book should be at index 0 now
  const firstHighlight = parsed.annotations[0].text;
  console.log(`First continuous highlight begins with: "${firstHighlight.slice(0, 60)}..."`);
  assert.ok(!firstHighlight.includes('October 29, 2026'), 'Date stripped from highlight');

  // 4. Verify Continuous Prose Stitching
  const stitched = stitchContinuousProse(parsed.annotations);
  assert.ok(stitched.length > 0, 'Stitched blocks exist');
  console.log(`✓ Stitched into ${stitched.length} coherent reading blocks`);

  // 5. Generate Real EPUB
  const epub = await generateEpub({
    title: parsed.title,
    author: parsed.author,
    blocks: stitched
  });
  assert.ok(epub.length > 10000, `Generated EPUB size: ${epub.length} bytes`);
  console.log(`✓ Generated valid EPUB 3 of size: ${(epub.length / 1024).toFixed(1)} KB`);

  console.log('End-to-End verification successful!');
}

runEndToEndVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
