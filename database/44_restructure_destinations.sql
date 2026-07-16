-- ========================================================
-- RESTRUCTURE DESTINATIONS
-- Clean up duplicates, delete less relevant churches, vary images,
-- and add scenic, adventure, historic, and city destinations.
-- ========================================================

-- 1. Remove duplicate destinations by name (keeping the one with the smallest ID)
DELETE FROM public.destinations a
USING public.destinations b
WHERE a.id > b.id AND a.name = b.name;

-- 2. Delete bookings and trips associated with the obsolete churches to satisfy FK constraints
DELETE FROM public.bookings
WHERE trip_id IN (
  SELECT id FROM public.trips 
  WHERE destination_id IN (
    SELECT id FROM public.destinations 
    WHERE name IN (
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
      'Kebran Gabriel Monastery (Women\'s Section)',
      'Kebran Gabriel Monastery',
      'Mikael Imba Monastery',
      'Midda Abune Melke Tsedik Monastery',
      'Narga Selassie Monastery',
      'Tsadkane Mariam Monastery',
      'Washa Mikael Rock-Hewn Church',
      'Wonchet Monastery',
      'የጎንደር ደብረ ብርሃን ሥላሴ ቤተክርስቲያን',
      'የባሕር ዳር ጊዮርጊስ ቤተክርስቲያን'
    )
  )
) OR destination_id IN (
  SELECT id FROM public.destinations 
  WHERE name IN (
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
    'Kebran Gabriel Monastery (Women\'s Section)',
    'Kebran Gabriel Monastery',
    'Mikael Imba Monastery',
    'Midda Abune Melke Tsedik Monastery',
    'Narga Selassie Monastery',
    'Tsadkane Mariam Monastery',
    'Washa Mikael Rock-Hewn Church',
    'Wonchet Monastery',
    'የጎንደር ደብረ ብርሃን ሥላሴ ቤተክርስቲያን',
    'የባሕር ዳር ጊዮርጊስ ቤተክርስቲያን'
  )
);

DELETE FROM public.trips 
WHERE destination_id IN (
  SELECT id FROM public.destinations 
  WHERE name IN (
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
    'Kebran Gabriel Monastery (Women\'s Section)',
    'Kebran Gabriel Monastery',
    'Mikael Imba Monastery',
    'Midda Abune Melke Tsedik Monastery',
    'Narga Selassie Monastery',
    'Tsadkane Mariam Monastery',
    'Washa Mikael Rock-Hewn Church',
    'Wonchet Monastery',
    'የጎንደር ደብረ ብርሃን ሥላሴ ቤተክርስቲያን',
    'የባሕር ዳር ጊዮርጊስ ቤተክርስቲያን'
  )
);

-- 3. Delete less relevant / minor churches from destinations table
DELETE FROM public.destinations 
WHERE name IN (
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
  'Kebran Gabriel Monastery (Women\'s Section)',
  'Kebran Gabriel Monastery',
  'Mikael Imba Monastery',
  'Midda Abune Melke Tsedik Monastery',
  'Narga Selassie Monastery',
  'Tsadkane Mariam Monastery',
  'Washa Mikael Rock-Hewn Church',
  'Wonchet Monastery',
  'የጎንደር ደብረ ብርሃን ሥላሴ ቤተክርስቲያን',
  'የባሕር ዳር ጊዮርጊስ ቤተክርስቲያን'
);

-- 3. Pre-delete new destinations to ensure clean insertion
DELETE FROM public.destinations
WHERE name IN (
  'Simien Mountains National Park',
  'Dallol & Danakil Depression',
  'Fasil Ghebbi (Gondar Castles)',
  'Bale Mountains National Park',
  'Blue Nile Falls (Tis Abay)',
  'Unity Park (Addis Ababa)'
);

-- 4. Insert new non-religious destinations
INSERT INTO public.destinations (name, description, region, city, distance, images, tags, location, category)
VALUES
  (
    'Simien Mountains National Park',
    'Stunning UNESCO World Heritage site known for its dramatic cliffs, deep valleys, and rare wildlife like the Gelada baboons.',
    'Amhara',
    'Debark',
    800,
    ARRAY['https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1200&q=80', 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&q=80'],
    ARRAY['National Park', 'Hiking', 'UNESCO', 'Nature', 'Wildlife'],
    '{"lat": 13.1833, "lng": 38.3000}'::jsonb,
    'nature'
  ),
  (
    'Dallol & Danakil Depression',
    'One of the lowest and hottest places on Earth, famous for its bizarre, brightly colored hydrothermal terraces and sulfur springs.',
    'Afar',
    'Dallol',
    1100,
    ARRAY['https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=80'],
    ARRAY['Volcano', 'Adventure', 'Extreme Landscape', 'Salt Flat'],
    '{"lat": 14.2410, "lng": 40.2980}'::jsonb,
    'adventure'
  ),
  (
    'Fasil Ghebbi (Gondar Castles)',
    'A spectacular 17th-century fortress city enclosing palaces, castles, and banqueting halls of Emperor Fasilides.',
    'Amhara',
    'Gondar',
    738,
    ARRAY['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80'],
    ARRAY['UNESCO', 'Castle', 'Fortress', 'Royal Palace', 'Historic'],
    '{"lat": 12.6080, "lng": 37.4697}'::jsonb,
    'historical'
  ),
  (
    'Bale Mountains National Park',
    'High-altitude plateau featuring pristine forests, alpine lakes, and volcanic peaks. Home to the endangered Ethiopian wolf.',
    'Oromia',
    'Goba',
    400,
    ARRAY['https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80'],
    ARRAY['National Park', 'Wildlife', 'Nature', 'Highlands'],
    '{"lat": 6.7000, "lng": 39.7500}'::jsonb,
    'nature'
  ),
  (
    'Blue Nile Falls (Tis Abay)',
    'Majestic waterfalls on the Blue Nile River that create a mist feeding a lush surrounding rainforest.',
    'Amhara',
    'Bahir Dar',
    590,
    ARRAY['https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1200&q=80'],
    ARRAY['Waterfall', 'River', 'Scenic', 'Nature'],
    '{"lat": 11.4909, "lng": 37.5878}'::jsonb,
    'nature'
  ),
  (
    'Unity Park (Addis Ababa)',
    'A modern urban park located inside the Grand Palace complex, featuring pavilions, gardens, and rich historical exhibits.',
    'Addis Ababa',
    'Addis Ababa',
    2,
    ARRAY['https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80'],
    ARRAY['Urban Park', 'Addis Ababa', 'Palace', 'Gardens', 'Museum'],
    '{"lat": 9.0232, "lng": 38.7635}'::jsonb,
    'city'
  );

-- 5. Vary and set verified working Unsplash images for the main remaining churches
UPDATE public.destinations 
SET images = ARRAY['https://images.unsplash.com/photo-1605106901227-991bd663255c?w=1200&q=80']
WHERE name IN ('Debre Damo Monastery', 'Ura Kidane Mehret Monastery', 'Tana Cherkos Monastery');

UPDATE public.destinations 
SET images = ARRAY['https://images.unsplash.com/photo-1578922746317-aac19659f663?w=1200&q=80']
WHERE name IN ('Abuna Yemata Guh', 'Lalibela Rock-Hewn Churches', 'Beta Giyorgis (St. George) Church');

UPDATE public.destinations 
SET images = ARRAY['https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1200&q=80']
WHERE name = 'Debre Libanos Monastery (Shewa)';

UPDATE public.destinations 
SET images = ARRAY['https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80']
WHERE name IN ('የአክሱም ጽዮን ቅድስተ ቅዱሳን ቤተክርስቲያን', 'የዳብረ ብርሃን ቅዱስ ሥላሴ ቤተክርስቲያን', 'Abune Gebre Mikael Monastery');
