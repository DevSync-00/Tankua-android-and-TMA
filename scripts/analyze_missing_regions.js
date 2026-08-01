/**
 * Analyze destinations CSV to find rows missing region and/or city.
 */
const fs = require('fs');
const path = require('path');

const csvPath = path.resolve(__dirname, '..', 'destinations_rows (2).csv');
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n').filter(l => l.trim());

// Parse CSV header
const header = lines[0].split(',');
// Find column indices
const idIdx = header.indexOf('id');
const nameIdx = header.indexOf('name');
const regionIdx = header.indexOf('region');
const cityIdx = header.indexOf('city');
const tagsIdx = header.indexOf('tags');
const locationIdx = header.indexOf('location');
const categoryIdx = header.indexOf('category');

// Simple CSV parser that handles quoted fields
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

let missingBoth = [];
let missingRegionOnly = [];
let missingCityOnly = [];
let hasAll = 0;
let total = 0;

for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  if (fields.length < 5) continue;
  total++;
  
  const id = fields[idIdx];
  const name = fields[nameIdx];
  const region = fields[regionIdx]?.trim();
  const city = fields[cityIdx]?.trim();
  const tags = fields[tagsIdx] || '';
  const location = fields[locationIdx] || '';
  
  const noRegion = !region;
  const noCity = !city;
  
  if (noRegion && noCity) {
    missingBoth.push({ id, name, tags, location });
  } else if (noRegion) {
    missingRegionOnly.push({ id, name, city, tags, location });
  } else if (noCity) {
    missingCityOnly.push({ id, name, region, tags, location });
  } else {
    hasAll++;
  }
}

console.log(`\nTotal destinations: ${total}`);
console.log(`Have both region & city: ${hasAll}`);
console.log(`Missing BOTH region & city: ${missingBoth.length}`);
console.log(`Missing region only: ${missingRegionOnly.length}`);
console.log(`Missing city only: ${missingCityOnly.length}`);

console.log('\n=== MISSING BOTH REGION AND CITY ===');
missingBoth.forEach(d => {
  console.log(`ID: ${d.id}`);
  console.log(`  Name: ${d.name}`);
  console.log(`  Tags: ${d.tags}`);
  console.log(`  Location: ${d.location}`);
});

console.log('\n=== MISSING CITY ONLY (have region) ===');
missingCityOnly.forEach(d => {
  console.log(`ID: ${d.id}`);
  console.log(`  Name: ${d.name}`);
  console.log(`  Region: ${d.region}`);
  console.log(`  Tags: ${d.tags}`);
  console.log(`  Location: ${d.location}`);
});

console.log('\n=== MISSING REGION ONLY (have city) ===');
missingRegionOnly.forEach(d => {
  console.log(`ID: ${d.id}`);
  console.log(`  Name: ${d.name}`);
  console.log(`  City: ${d.city}`);
  console.log(`  Tags: ${d.tags}`);
  console.log(`  Location: ${d.location}`);
});
