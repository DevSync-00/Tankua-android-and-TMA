/**
 * Extract all keywords from missing destinations to map them.
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
const regionIdx = header.indexOf('region');
const cityIdx = header.indexOf('city');
const tagsIdx = header.indexOf('tags');
const descIdx = header.indexOf('description');

// Collect all destination names/tags missing both
let missingBoth = [];
let missingCity = [];

for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  if (fields.length < 5) continue;
  
  const id = fields[idIdx];
  const name = fields[nameIdx];
  const region = fields[regionIdx]?.trim();
  const city = fields[cityIdx]?.trim();
  const tags = fields[tagsIdx] || '';
  const desc = fields[descIdx] || '';
  
  if (!region && !city) {
    missingBoth.push({ id, name, tags, desc: desc.substring(0, 100) });
  } else if (region && !city) {
    missingCity.push({ id, name, region, tags, desc: desc.substring(0, 100) });
  }
}

// Print condensed for analysis - just names
console.log(`=== MISSING BOTH (${missingBoth.length}) - Names only ===`);
missingBoth.forEach(d => {
  console.log(`${d.name} | ${d.tags}`);
});

console.log(`\n=== MISSING CITY ONLY (${missingCity.length}) ===`);
missingCity.forEach(d => {
  console.log(`${d.name} | region=${d.region} | ${d.tags}`);
});
