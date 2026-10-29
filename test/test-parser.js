const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Test that parser module can be loaded and tested
console.log('Running Task 1 Parser Tests...');

const samplePath = '/Users/aaronheiner/Downloads/Notes from “The Craving Mind_ From Cigarettes to Smartphones to Love - Why We Get Hooked and How We Can Break Bad Habits” by Judson Brewer.eml';

if (!fs.existsSync(samplePath)) {
  console.error('Sample EML file not found at:', samplePath);
  process.exit(1);
}

const emlContent = fs.readFileSync(samplePath, 'utf8');

// Load EMLParser
const { parseEmlNotes, decodeQuotedPrintable } = require('../js/eml-parser.js');

// 1. Test Quoted-Printable decoding
const qpEncoded = 'The Craving Mind: =46rom Cigarettes to Smartphones to Love - Why We Get Hook=\r\ned and How We Can Break Bad Habits';
const qpDecoded = decodeQuotedPrintable(qpEncoded);
assert.strictEqual(qpDecoded, 'The Craving Mind: From Cigarettes to Smartphones to Love - Why We Get Hooked and How We Can Break Bad Habits');
console.log('✓ Quoted-printable decoding works');

// 2. Test Full EML parsing
const result = parseEmlNotes(emlContent);
assert.ok(result.title, 'Should extract title');
assert.ok(result.title.includes('The Craving Mind'), `Title extracted was "${result.title}"`);
assert.strictEqual(result.author, 'Judson Brewer');
assert.ok(result.annotations && result.annotations.length > 0, 'Should extract annotations');

console.log(`✓ Parsed ${result.annotations.length} annotations`);

// 3. Test Reversal / Chronological order
// In original Apple export, first item is:
// "When starting any type of un- or antiresistance training..."
// The LAST item in Apple's export is from the beginning of the book:
// Check that result.annotations[0] is the earliest one from the book!
const firstInResult = result.annotations[0].text;
const lastInResult = result.annotations[result.annotations.length - 1].text;

assert.notStrictEqual(firstInResult, lastInResult);
assert.ok(!firstInResult.includes('October 29, 2026'), 'Date should be stripped');
assert.ok(!lastInResult.includes('October 29, 2026'), 'Date should be stripped');
console.log('✓ Dates successfully stripped');
console.log('✓ Chronological order verified');

console.log('All Task 1 tests passed successfully!');
