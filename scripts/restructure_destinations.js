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
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
// Use service role key if available for administrative writes, otherwise fallback to anon
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY must be defined.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const newDestinations = [
  {
    name: 'Simien Mountains National Park',
    description: 'Stunning UNESCO World Heritage site known for its dramatic cliffs, deep valleys, and rare wildlife like the Gelada baboons.',
    region: 'Amhara',
    city: 'Debark',
    distance: 800,
    images: ['https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1200&q=80', 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&q=80'],
    tags: ['National Park', 'Hiking', 'UNESCO', 'Nature', 'Wildlife'],
    location: { lat: 13.1833, lng: 38.3000 },
    category: 'nature'
  },
  {
    name: 'Dallol & Danakil Depression',
    description: 'One of the lowest and hottest places on Earth, famous for its bizarre, brightly colored hydrothermal terraces and sulfur springs.',
    region: 'Afar',
    city: 'Dallol',
    distance: 1100,
    images: ['https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=80'],
    tags: ['Volcano', 'Adventure', 'Extreme Landscape', 'Salt Flat'],
    location: { lat: 14.2410, lng: 40.2980 },
    category: 'adventure'
  },
  {
    name: 'Fasil Ghebbi (Gondar Castles)',
    description: 'A spectacular 17th-century fortress city enclosing palaces, castles, and banqueting halls of Emperor Fasilides.',
    region: 'Amhara',
    city: 'Gondar',
    distance: 738,
    images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80'],
    tags: ['UNESCO', 'Castle', 'Fortress', 'Royal Palace', 'Historic'],
    location: { lat: 12.6080, lng: 37.4697 },
    category: 'historical'
  },
  {
    name: 'Bale Mountains National Park',
    description: 'High-altitude plateau featuring pristine forests, alpine lakes, and volcanic peaks. Home to the endangered Ethiopian wolf.',
    region: 'Oromia',
    city: 'Goba',
    distance: 400,
    images: ['https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80'],
    tags: ['National Park', 'Wildlife', 'Nature', 'Highlands'],
    location: { lat: 6.7000, lng: 39.7500 },
    category: 'nature'
  },
  {
    name: 'Blue Nile Falls (Tis Abay)',
    description: 'Majestic waterfalls on the Blue Nile River that create a mist feeding a lush surrounding rainforest.',
    region: 'Amhara',
    city: 'Bahir Dar',
    distance: 590,
    images: ['https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1200&q=80'],
    tags: ['Waterfall', 'River', 'Scenic', 'Nature'],
    location: { lat: 11.4909, lng: 37.5878 },
    category: 'nature'
  },
  {
    name: 'Unity Park (Addis Ababa)',
    description: 'A modern urban park located inside the Grand Palace complex, featuring pavilions, gardens, and rich historical exhibits.',
    region: 'Addis Ababa',
    city: 'Addis Ababa',
    distance: 2,
    images: ['https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80'],
    tags: ['Urban Park', 'Addis Ababa', 'Palace', 'Gardens', 'Museum'],
    location: { lat: 9.0232, lng: 38.7635 },
    category: 'city'
  }
];

const obsoleteChurches = [
  'Abba Garima Monastery',
  'Azwa Mariam Monastery',
  'Beta Maryam Church',
  'Beta Emmanuel Church',
  'Beta Abba Libanos Church',
  'Beta Medhane Alem Church',
  'Daga Estifanos Monastery',
  'Daniel Korkor Monastery',
  'Debre Tsehai Selassie Monastery',
  'Gorgora Debre Sina Monastery',
  "Kebran Gabriel Monastery (Women's Section)",
  'Kebran Gabriel Monastery',
  'Mikael Imba Monastery',
  'Midda Abune Melke Tsedik Monastery',
  'Narga Selassie Monastery',
  'Tsadkane Mariam Monastery',
  'Washa Mikael Rock-Hewn Church',
  'Wonchet Monastery',
  'የጎንደር ደብረ ብርሃን ሥላሴ ቤተክርስቲያን',
  'የባሕር ዳር ጊዮርጊስ ቤተክርስቲያን'
];

async function restructureDestinations() {
  try {
    console.log('Starting destinations restructuring...');

    // 1. Delete duplicate records
    console.log('Fetching destinations to check for duplicates...');
    const { data: allDests, error: fetchErr } = await supabase
      .from('destinations')
      .select('id, name');
    
    if (fetchErr) throw fetchErr;

    const seenNames = new Set();
    const duplicateIds = [];
    for (const d of allDests) {
      if (seenNames.has(d.name)) {
        duplicateIds.push(d.id);
      } else {
        seenNames.add(d.name);
      }
    }

    if (duplicateIds.length > 0) {
      console.log(`Deleting ${duplicateIds.length} duplicate destination records...`);
      const { error: delDupErr } = await supabase
        .from('destinations')
        .delete()
        .in('id', duplicateIds);
      if (delDupErr) console.warn('Note: Could not delete duplicates via client, error:', delDupErr.message);
    }

    // 2. Delete obsolete/less relevant churches (with cascading deletes for bookings and trips)
    console.log('Resolving obsolete destinations and their dependencies...');
    const { data: destsToDel, error: selectDelErr } = await supabase
      .from('destinations')
      .select('id, name')
      .in('name', obsoleteChurches);
    
    if (selectDelErr) throw selectDelErr;

    if (destsToDel && destsToDel.length > 0) {
      const destIds = destsToDel.map(d => d.id);
      
      // Fetch associated trips to get their IDs for booking deletion
      const { data: tripsToDel, error: selectTripsErr } = await supabase
        .from('trips')
        .select('id')
        .in('destination_id', destIds);
      
      if (selectTripsErr) throw selectTripsErr;

      const tripIds = tripsToDel ? tripsToDel.map(t => t.id) : [];

      if (tripIds.length > 0) {
        console.log(`Deleting bookings referencing ${tripIds.length} obsolete trips...`);
        const { error: delBookingsErr } = await supabase
          .from('bookings')
          .delete()
          .in('trip_id', tripIds);
        if (delBookingsErr) console.warn('Could not delete bookings referencing obsolete trips:', delBookingsErr.message);
      }

      console.log(`Deleting bookings directly referencing obsolete destinations...`);
      const { error: delDirectBookingsErr } = await supabase
        .from('bookings')
        .delete()
        .in('destination_id', destIds);
      if (delDirectBookingsErr) console.warn('Could not delete bookings referencing obsolete destinations:', delDirectBookingsErr.message);

      if (tripIds.length > 0) {
        console.log(`Deleting ${tripIds.length} obsolete trips...`);
        const { error: delTripsErr } = await supabase
          .from('trips')
          .delete()
          .in('id', tripIds);
        if (delTripsErr) console.warn('Could not delete obsolete trips:', delTripsErr.message);
      }

      console.log(`Deleting ${destsToDel.length} obsolete destinations...`);
      const { error: delChurchesErr } = await supabase
        .from('destinations')
        .delete()
        .in('id', destIds);
      
      if (delChurchesErr) {
        console.error('Failed to delete obsolete destinations:', delChurchesErr.message);
      } else {
        console.log('Obsolete destinations successfully deleted.');
      }
    } else {
      console.log('No obsolete destinations found to delete.');
    }

    // 3. Upsert new varied destinations
    console.log('Upserting new varied destinations...');
    for (const item of newDestinations) {
      // Delete if already exists to ensure fresh insertion
      await supabase.from('destinations').delete().eq('name', item.name);
      
      const { error: insErr } = await supabase
        .from('destinations')
        .insert([item]);
      
      if (insErr) {
        console.error(`Failed to insert "${item.name}":`, insErr.message);
      } else {
        console.log(`Successfully added: "${item.name}"`);
      }
    }

    // 4. Vary images of remaining churches
    console.log('Varying images of remaining churches...');
    
    await supabase.from('destinations').update({
      images: ['https://images.unsplash.com/photo-1605106901227-991bd663255c?w=1200&q=80']
    }).in('name', ['Debre Damo Monastery', 'Ura Kidane Mehret Monastery', 'Tana Cherkos Monastery']);

    await supabase.from('destinations').update({
      images: ['https://images.unsplash.com/photo-1578922746317-aac19659f663?w=1200&q=80']
    }).in('name', ['Abuna Yemata Guh', 'Lalibela Rock-Hewn Churches', 'Beta Giyorgis (St. George) Church']);

    await supabase.from('destinations').update({
      images: ['https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1200&q=80']
    }).eq('name', 'Debre Libanos Monastery (Shewa)');

    await supabase.from('destinations').update({
      images: ['https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80']
    }).in('name', ['የአክሱም ጽዮን ቅድስተ ቅዱሳን ቤተክርስቲያን', 'የዳብረ ብርሃን ቅዱስ ሥላሴ ቤተክርስቲያን', 'Abune Gebre Mikael Monastery']);

    console.log('\nDone restructuring database destinations.');
  } catch (err) {
    console.error('Restructuring script error:', err.message);
  }
}

restructureDestinations();
