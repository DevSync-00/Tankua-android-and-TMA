/**
 * Analyze missing images in the destinations CSV.
 */
const fs = require('fs');
const path = require('path');

const csvPath = path.resolve(__dirname, '..', 'destinations_rows (2).csv');
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n').filter(l => l.trim());

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

const header = lines[0].split(',');
const idIdx = header.indexOf('id');
const nameIdx = header.indexOf('name');
const imagesIdx = header.indexOf('images');
const categoryIdx = header.indexOf('category');
const regionIdx = header.indexOf('region');

let hasImages = 0;
let emptyImages = 0;
let emptyArrayImages = 0;
let total = 0;

const byCategory = {};
const sampleMissing = [];

for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  if (fields.length < 5) continue;
  total++;

  const id = fields[idIdx];
  const name = fields[nameIdx];
  const images = fields[imagesIdx]?.trim();
  const category = fields[categoryIdx]?.trim();
  const region = fields[regionIdx]?.trim();

  // Check if images field is empty or just []
  const isEmpty = !images || images === '[]' || images === '"[]"';

  if (!byCategory[category]) byCategory[category] = { total: 0, missing: 0 };
  byCategory[category].total++;

  if (isEmpty) {
    emptyImages++;
    byCategory[category].missing++;
    if (sampleMissing.length < 30) {
      sampleMissing.push({ id, name, category, region });
    }
  } else {
    hasImages++;
    // Check what kind of images
    if (images.includes('unsplash')) {
      // external unsplash
    } else if (images.includes('supabase')) {
      // supabase stored
    }
  }
}

console.log(`\n=== IMAGE ANALYSIS ===`);
console.log(`Total destinations: ${total}`);
console.log(`Have images: ${hasImages}`);
console.log(`Missing images: ${emptyImages}`);
console.log(`Coverage: ${((hasImages/total)*100).toFixed(1)}%`);

console.log(`\n=== BY CATEGORY (missing / total) ===`);
Object.entries(byCategory)
  .sort((a, b) => b[1].missing - a[1].missing)
  .forEach(([cat, data]) => {
    console.log(`  ${cat}: ${data.missing}/${data.total} missing`);
  });

console.log(`\n=== SAMPLE MISSING (first 30) ===`);
sampleMissing.forEach(d => {
  console.log(`  ${d.name} [${d.category}] (${d.region})`);
});

// Also check what images look like for those that have them
let unsplashCount = 0;
let supabaseCount = 0;
let wikiCount = 0;
let otherCount = 0;

for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  const images = fields[imagesIdx]?.trim();
  if (!images || images === '[]' || images === '"[]"') continue;

  if (images.includes('unsplash')) unsplashCount++;
  if (images.includes('supabase') || images.includes('dotjlikaurcjw')) supabaseCount++;
  if (images.includes('wikimedia') || images.includes('wikipedia') || images.includes('upload.wikimedia')) wikiCount++;
  if (!images.includes('unsplash') && !images.includes('supabase') && !images.includes('dotjlikaurcjw') && !images.includes('wikimedia') && !images.includes('wikipedia')) otherCount++;
}

console.log(`\n=== IMAGE SOURCES (among those with images) ===`);
console.log(`  Unsplash: ${unsplashCount}`);
console.log(`  Supabase storage: ${supabaseCount}`);
console.log(`  Wikimedia/Wikipedia: ${wikiCount}`);
console.log(`  Other: ${otherCount}`);
