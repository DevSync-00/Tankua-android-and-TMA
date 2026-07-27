INSERT INTO public.destinations (
    name,
    description,
    region,
    city,
    distance,
    location,
    images,
    tags,
    category
) VALUES
-- =================================================================
-- 1. RELIGIOUS & SACRED MONASTERIES / CHURCHES
-- =================================================================
(
    'Church of St. George (Biete Ghiorgis)',
    'The iconic monolith rock-hewn church carved from red volcanic tuff in the shape of a Greek cross. The most famous symbol of Lalibela.',
    'Amhara',
    'Lalibela',
    680,
    '{"lat": 12.0319, "lng": 39.0411}'::jsonb,
    ARRAY[
        'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=1000',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Bete_Giyorgis_Lalibela_Ethiopia.jpg/1024px-Bete_Giyorgis_Lalibela_Ethiopia.jpg'
    ],
    ARRAY['UNESCO', 'Monolith', 'Rock-Hewn', 'Pilgrimage'],
    'religious'
),
(
    'Abuna Yemata Guh Cliff Church',
    'A dramatic 5th-century rock-cut church situated 200 meters up a sheer vertical rock face in the Gheralta Mountains, famous for its preserved ceiling frescoes.',
    'Tigray',
    'Hawzen',
    780,
    '{"lat": 13.9142, "lng": 39.3602}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Abuna_Yemata_Guh_church.jpg/1024px-Abuna_Yemata_Guh_church.jpg'
    ],
    ARRAY['Gheralta', 'Climbing', 'Frescoes', 'Extreme'],
    'religious'
),
(
    'Debre Libanos Monastery',
    'Historic 13th-century monastery founded by Saint Saint Tekle Haymanot, overlooking the Jamma River Gorge near the Portuguese Bridge.',
    'Oromia',
    'Debre Libanos',
    105,
    '{"lat": 9.7140, "lng": 38.8540}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Debre_Libanos_Monastery_01.jpg/1024px-Debre_Libanos_Monastery_01.jpg'
    ],
    ARRAY['Day Trip', 'Monastery', 'Gelada Baboons', 'Gorge'],
    'religious'
),
(
    'Debre Birhan Selassie Church',
    'Celebrated 17th-century church in Gondar famed for its ceiling decorated with hundreds of painted winged angel faces.',
    'Amhara',
    'Gondar',
    720,
    '{"lat": 12.6122, "lng": 37.4722}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Debre_Berhan_Selassie_Church_Gondar_Ethiopia.jpg/1024px-Debre_Berhan_Selassie_Church_Gondar_Ethiopia.jpg'
    ],
    ARRAY['Angels', 'Art', 'Frescoes', 'Gondar'],
    'religious'
),
(
    'Ura Kidane Mehret Monastery',
    'Famous 14th-century circular island monastery on the Zege Peninsula of Lake Tana, renowned for vivid biblical wall murals and religious relics.',
    'Amhara',
    'Bahir Dar',
    560,
    '{"lat": 11.6975, "lng": 37.3312}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Ura_Kidane_Mehret_01.jpg/1024px-Ura_Kidane_Mehret_01.jpg'
    ],
    ARRAY['Lake Tana', 'Island', 'Murals', 'Boat Tour'],
    'religious'
),
(
    'Holy Trinity Cathedral (Kidist Selassie)',
    'The highest-ranking Orthodox Cathedral in Addis Ababa, holding the tombs of Emperor Haile Selassie and Empress Menen Asfaw.',
    'Addis Ababa',
    'Addis Ababa',
    0,
    '{"lat": 9.0305, "lng": 38.7618}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Holy_Trinity_Cathedral_Addis_Ababa.jpg/1024px-Holy_Trinity_Cathedral_Addis_Ababa.jpg'
    ],
    ARRAY['Addis Ababa', 'Royal Tomb', 'Cathedral', 'Architecture'],
    'sacred'
),

-- =================================================================
-- 2. HISTORICAL CASTLES, PALACES & ANCIENT RUINS
-- =================================================================
(
    'Fasil Ghebbi (Royal Enclosure of Gondar)',
    '17th-century fortress city built by Emperor Fasilides, featuring stone castles, palaces, libraries, and banquet halls known as the Camelot of Africa.',
    'Amhara',
    'Gondar',
    725,
    '{"lat": 12.6080, "lng": 37.4670}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Fasilides_Castle_Gondar_01.jpg/1024px-Fasilides_Castle_Gondar_01.jpg'
    ],
    ARRAY['UNESCO', 'Castles', 'Emperor Fasilides', 'Architecture'],
    'historical'
),
(
    'Northern Stelae Field & Obelisks of Axum',
    'Monolithic granite obelisks dating back to the ancient Kingdom of Aksum (3rd–4th century AD), including the 24-meter King Ezana Stela.',
    'Tigray',
    'Axum',
    980,
    '{"lat": 14.1311, "lng": 38.7194}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Axum_Stele.jpg/1024px-Axum_Stele.jpg'
    ],
    ARRAY['UNESCO', 'Ancient Empire', 'Obelisk', 'Archeology'],
    'monument'
),
(
    'Temple of Yeha',
    'The oldest standing structure in Ethiopia, dating to roughly 700 BC. Built in the Sabaean style with mortarless stone block walls.',
    'Tigray',
    'Yeha',
    930,
    '{"lat": 14.2831, "lng": 39.0161}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Yeha_Great_Temple.jpg/1024px-Yeha_Great_Temple.jpg'
    ],
    ARRAY['Ancient History', 'Sabaean', 'Archeology'],
    'historical'
),
(
    'Fasilides Bathing Palace',
    'Historic sunken bathing pavilion in Gondar surrounded by ancient banyan trees, central to the annual Timkat (Epiphany) celebrations.',
    'Amhara',
    'Gondar',
    723,
    '{"lat": 12.6105, "lng": 37.4589}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Fasilides_Baths_Gondar.jpg/1024px-Fasilides_Baths_Gondar.jpg'
    ],
    ARRAY['Timkat', 'Gondar', 'Pool', 'Heritage'],
    'historical'
),
(
    'Dungur Palace (Queen of Sheba Palace)',
    'Ruins of a grand 6th-century mansion in Axum traditionally associated with the Queen of Sheba.',
    'Tigray',
    'Axum',
    982,
    '{"lat": 14.1285, "lng": 38.7072}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Dungur_Palace_Axum.jpg/1024px-Dungur_Palace_Axum.jpg'
    ],
    ARRAY['Queen of Sheba', 'Axum', 'Palace', 'Ancient'],
    'historical'
),

-- =================================================================
-- 3. NATIONAL PARKS, WILDLIFE & NATURE RESERVES
-- =================================================================
(
    'Simien Mountains National Park',
    'UNESCO World Heritage wilderness featuring dramatic plateau escarpments, deep gorges, and endemic wildlife like the Gelada monkey and Walia ibex.',
    'Amhara',
    'Debark',
    780,
    '{"lat": 13.1833, "lng": 38.0667}'::jsonb,
    ARRAY[
        'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=1000'
    ],
    ARRAY['UNESCO', 'Trekking', 'Gelada Monkeys', 'Mountains'],
    'park'
),
(
    'Bale Mountains National Park',
    'High-altitude afro-alpine wilderness with glacial lakes, Harenna Cloud Forest, and home to the endangered Ethiopian wolf and Mountain Nyala.',
    'Oromia',
    'Dinsho',
    400,
    '{"lat": 6.9000, "lng": 39.7500}'::jsonb,
    ARRAY[
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000'
    ],
    ARRAY['Afroalpine', 'Ethiopian Wolf', 'Sanetti Plateau', 'Wildlife'],
    'park'
),
(
    'Awash National Park',
    'One of Ethiopia''s oldest national parks, encompassing the Awash River Falls, Fantale Volcano, acacia savannas, and abundant birdlife.',
    'Afar',
    'Awash',
    225,
    '{"lat": 8.8833, "lng": 40.0000}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Awash_Falls_Ethiopia.jpg/1024px-Awash_Falls_Ethiopia.jpg'
    ],
    ARRAY['Waterfalls', 'Savanna', 'Oryx', 'Safari'],
    'park'
),
(
    'Nechisar National Park & Bridge of God',
    'Stunning park located between Lake Abaya and Lake Chamo, famous for plains zebras, giant Nile crocodiles, and the narrow neck of land known as the Bridge of God.',
    'SNNPR',
    'Arba Minch',
    500,
    '{"lat": 5.9333, "lng": 37.5500}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Nechisar_National_Park.jpg/1024px-Nechisar_National_Park.jpg'
    ],
    ARRAY['Lakes', 'Crocodiles', 'Zebras', 'Arba Minch'],
    'park'
),
(
    'Blue Nile Falls (Tis Abay)',
    'A spectacular 42-meter waterfall on the Blue Nile river located 30km downstream from Lake Tana.',
    'Amhara',
    'Bahir Dar',
    590,
    '{"lat": 11.4850, "lng": 37.5925}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Nile_Falls_Ethiopia.jpg/1024px-Blue_Nile_Falls_Ethiopia.jpg'
    ],
    ARRAY['Waterfall', 'Blue Nile', 'Hiking', 'Nature'],
    'nature'
),

-- =================================================================
-- 4. ADVENTURE & VOLCANIC WONDERS
-- =================================================================
(
    'Danakil Depression & Dallol Salt Springs',
    'One of the hottest and lowest places on Earth (-125m), filled with psychedelic neon-green sulfur hot springs, salt flats, and active hydrothermal chimneys.',
    'Afar',
    'Semera',
    820,
    '{"lat": 14.2417, "lng": 40.2989}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Dallol_Afar_Ethiopia.jpg/1024px-Dallol_Afar_Ethiopia.jpg'
    ],
    ARRAY['Volcanic', 'Geothermal', 'Extreme Nature', 'Salt Flats'],
    'adventure'
),
(
    'Erta Ale Volcano Lava Lake',
    'A continuously active basaltic shield volcano featuring one of the world''s few persistent lava lakes in the Danakil desert.',
    'Afar',
    'Amedela',
    850,
    '{"lat": 13.6000, "lng": 40.6667}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Erta_Ale_lava_lake.jpg/1024px-Erta_Ale_lava_lake.jpg'
    ],
    ARRAY['Lava Lake', 'Volcano', 'Night Trekking', 'Extreme'],
    'adventure'
),
(
    'Wenchi Crater Lake',
    'A stunning extinct volcanic caldera lake located at 3,000m altitude surrounded by waterfalls, mineral springs, and an island monastery.',
    'Oromia',
    'Ambo',
    155,
    '{"lat": 8.7833, "lng": 37.9000}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Wenchi_Crater_Lake_Ethiopia.jpg/1024px-Wenchi_Crater_Lake_Ethiopia.jpg'
    ],
    ARRAY['Crater Lake', 'Horse Riding', 'Eco Tourism', 'Day Trip'],
    'adventure'
),

-- =================================================================
-- 5. RESORTS, LAKES & WELLNESS
-- =================================================================
(
    'Bishoftu Crater Lakes (Lake Babogaya & Kuriftu)',
    'A cluster of scenic volcanic crater lakes 45 minutes from Addis Ababa, known for luxury lakeside resorts, kayaking, and weekend getaways.',
    'Oromia',
    'Bishoftu (Debre Zeit)',
    45,
    '{"lat": 8.7500, "lng": 38.9833}'::jsonb,
    ARRAY[
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000'
    ],
    ARRAY['Resorts', 'Crater Lakes', 'Weekend Getaway', 'Relaxation'],
    'other'
),
(
    'Haile Resort Hawassa (Lake Hawassa)',
    'Premier resort along the shores of Lake Hawassa, offering bird watching, boat tours to see hippos, and scenic lakeside dining.',
    'Sidama',
    'Hawassa',
    275,
    '{"lat": 7.0667, "lng": 38.4667}'::jsonb,
    ARRAY[
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1000'
    ],
    ARRAY['Lake Hawassa', 'Resort', 'Fish Market', 'Hippos'],
    'other'
),
(
    'Sabana Beach Resort (Lake Langano)',
    'Popular beach resort along Lake Langano, one of the few bilharzia-free lakes in Ethiopia safe for swimming, water sports, and beach camping.',
    'Oromia',
    'Langano',
    200,
    '{"lat": 7.6000, "lng": 38.7167}'::jsonb,
    ARRAY[
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000'
    ],
    ARRAY['Beach', 'Swimming', 'Rift Valley', 'Resort'],
    'other'
),

-- =================================================================
-- 6. CULTURAL HERITAGE, TOWNS & MUSEUMS
-- =================================================================
(
    'Harar Jugol (Historic Walled City)',
    'A UNESCO World Heritage fortified historic Islamic town with 82 mosques, narrow alleyways, vibrant markets, and the famous Hyena Feeding tradition.',
    'Harari',
    'Harar',
    520,
    '{"lat": 9.3100, "lng": 42.1300}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Streets_of_Harar.jpg/1024px-Streets_of_Harar.jpg'
    ],
    ARRAY['UNESCO', 'Walled City', 'Hyena Man', 'Islamic Heritage'],
    'cultural'
),
(
    'National Museum of Ethiopia',
    'Primary national museum housing world-famous hominid fossil skeletons including "Lucy" (Dinkinesh) and "Selam".',
    'Addis Ababa',
    'Addis Ababa',
    0,
    '{"lat": 9.0382, "lng": 38.7617}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/National_Museum_of_Ethiopia.jpg/1024px-National_Museum_of_Ethiopia.jpg'
    ],
    ARRAY['Lucy', 'Fossils', 'Museum', 'Addis Ababa'],
    'museum'
),
(
    'Unity Park & Grand Palace',
    'A massive public eco-park and museum inside the historic 19th-century Menelik II Imperial Palace complex in Addis Ababa.',
    'Addis Ababa',
    'Addis Ababa',
    0,
    '{"lat": 9.0233, "lng": 38.7633}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Unity_Park_Addis_Ababa.jpg/1024px-Unity_Park_Addis_Ababa.jpg'
    ],
    ARRAY['Palace', 'Zoo', 'Addis Ababa', 'Gardens'],
    'park'
),
(
    'Entoto Park & Mountain Peak',
    'Surrounded by eucalyptus forests at 3,200m elevation overlooking Addis Ababa, offering ziplining, hiking, and Emperor Menelik II''s historical palace.',
    'Addis Ababa',
    'Addis Ababa',
    15,
    '{"lat": 9.0833, "lng": 38.7667}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Entoto_Mountain_View.jpg/1024px-Entoto_Mountain_View.jpg'
    ],
    ARRAY['Viewpoint', 'Zipline', 'Mountain', 'Eucalyptus'],
    'park'
),
(
    'Tiya Megalithic Stelae Field',
    'UNESCO World Heritage site containing 36 carved standing stones/monuments marking ancient burial grounds dating between the 12th and 14th centuries.',
    'SNNPR',
    'Tiya',
    85,
    '{"lat": 8.4347, "lng": 38.6278}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Tiya_Stelae_Ethiopia.jpg/1024px-Tiya_Stelae_Ethiopia.jpg'
    ],
    ARRAY['UNESCO', 'Megalithic', 'Carvings', 'Archaeology'],
    'monument'
),
(
    'Konso Cultural Landscape',
    'UNESCO site featuring stone-walled terraced agricultural fields, wooden grave markers (Waga), and fortified hilltop villages.',
    'SNNPR',
    'Konso',
    590,
    '{"lat": 5.3333, "lng": 37.4333}'::jsonb,
    ARRAY[
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Konso_village_Ethiopia.jpg/1024px-Konso_village_Ethiopia.jpg'
    ],
    ARRAY['UNESCO', 'Terraces', 'Waga Monuments', 'Culture'],
    'cultural'
);
