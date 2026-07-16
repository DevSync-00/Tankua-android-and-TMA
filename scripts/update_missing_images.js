const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env file manually
const parseEnv = () => {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env file not found in root directory.');
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] ? match[2].trim() : '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      env[match[1]] = value;
    }
  });
  return env;
};

const env = parseEnv();
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
// Use service role key if available, otherwise fall back to anon key
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be defined in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Placeholders matching src/services/database.js
const PLACEHOLDER_IMAGES = {
  nature: [
    'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800',
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800'
  ],
  adventure: [
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800'
  ],
  historical: [
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800'
  ],
  religious: [
    'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800',
    'https://images.unsplash.com/photo-1605106901227-991bd663255c?w=800'
  ],
  city: [
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800'
  ],
  other: [
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800'
  ]
};

const getPlaceholderImage = (id, name, category) => {
  let list = PLACEHOLDER_IMAGES.other;
  if (category) {
    const cat = String(category).toLowerCase();
    if (cat.includes('nature') || cat.includes('park')) {
      list = PLACEHOLDER_IMAGES.nature;
    } else if (cat.includes('adventure')) {
      list = PLACEHOLDER_IMAGES.adventure;
    } else if (cat.includes('historical') || cat.includes('monument') || cat.includes('museum') || cat.includes('cultural')) {
      list = PLACEHOLDER_IMAGES.historical;
    } else if (cat.includes('religious') || cat.includes('sacred') || cat.includes('church')) {
      list = PLACEHOLDER_IMAGES.religious;
    } else if (cat.includes('city')) {
      list = PLACEHOLDER_IMAGES.city;
    }
  }

  let hash = 0;
  const str = String(id || name || '');
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % list.length;
  return list[index];
};

async function updateMissingImages() {
  try {
    console.log('Fetching destinations...');
    const { data: destinations, error } = await supabase
      .from('destinations')
      .select('id, name, category, images');

    if (error) throw error;

    console.log(`Found ${destinations.length} destinations.`);
    console.log('--- Database Destinations List ---');
    destinations.forEach(d => console.log(`- "${d.name}": images = ${JSON.stringify(d.images)}, category = "${d.category}"`));
    console.log('----------------------------------');
    
    let updatedCount = 0;

    for (const dest of destinations) {
      const images = dest.images;
      const hasValidImage = Array.isArray(images) && images.length > 0 && images.some(img => 
        typeof img === 'string' && 
        img.trim().length > 0 && 
        !img.includes('wikimedia.org') && 
        !img.includes('wikipedia.org')
      );

      if (!hasValidImage) {
        const placeholder = getPlaceholderImage(dest.id, dest.name, dest.category);
        console.log(`Updating "${dest.name}" (${dest.category || 'no category'}) with placeholder image: ${placeholder}`);
        
        const { error: updateError } = await supabase
          .from('destinations')
          .update({ images: [placeholder] })
          .eq('id', dest.id);

        if (updateError) {
          console.error(`Failed to update "${dest.name}":`, updateError.message);
          if (updateError.message.includes('row-level security')) {
            console.log('\n⚠️  RLS violation: To write/update table rows directly via this script, you must add your SUPABASE_SERVICE_ROLE_KEY to the .env file.');
            console.log('Alternatively, you can run the SQL script "database/42_add_destination_placeholder_images.sql" inside your Supabase dashboard SQL editor.');
            return;
          }
        } else {
          updatedCount++;
        }
      }
    }

    console.log(`\nSuccess! Updated ${updatedCount} destinations with placeholder images.`);
  } catch (err) {
    console.error('Fatal error during execution:', err.message);
  }
}

updateMissingImages();
