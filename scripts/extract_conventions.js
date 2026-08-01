/**
 * Extract unique region and city values from the CSV to understand naming conventions.
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
const regionIdx = header.indexOf('region');
const cityIdx = header.indexOf('city');

const regions = new Map();
const cities = new Map();
const regionCityPairs = new Map();

for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  const region = fields[regionIdx]?.trim();
  const city = fields[cityIdx]?.trim();
  
  if (region) {
    regions.set(region, (regions.get(region) || 0) + 1);
  }
  if (city) {
    cities.set(city, (cities.get(city) || 0) + 1);
  }
  if (region && city) {
    const key = `${region} → ${city}`;
    regionCityPairs.set(key, (regionCityPairs.get(key) || 0) + 1);
  }
}

console.log('=== UNIQUE REGIONS ===');
[...regions.entries()].sort((a, b) => b[1] - a[1]).forEach(([r, c]) => {
  console.log(`  ${r}: ${c} destinations`);
});

console.log('\n=== UNIQUE CITIES (top 80) ===');
[...cities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 80).forEach(([c, n]) => {
  console.log(`  ${c}: ${n}`);
});

console.log('\n=== ALL REGION → CITY PAIRS ===');
[...regionCityPairs.entries()].sort((a, b) => b[1] - a[1]).forEach(([pair, n]) => {
  console.log(`  ${pair}: ${n}`);
});
