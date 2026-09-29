export type GuideSection = { heading: string; paragraphs: string[]; bullets?: string[] };

export type TravelGuide = {
  slug: string;
  title: string;
  description: string;
  category: string;
  location: string;
  image: string;
  imageAlt: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  intro: string;
  sections: GuideSection[];
  relatedTourQuery: string;
};

export const travelGuides: TravelGuide[] = [
  {
    slug: "7-day-ethiopia-itinerary-first-time-visitors",
    title: "A Practical 7-Day Ethiopia Itinerary for First-Time Visitors",
    description: "Plan one rewarding week in Ethiopia with a realistic route through Addis Ababa, Lalibela, Gondar, and the Simien Mountains.",
    category: "Itineraries",
    location: "Addis Ababa to Northern Ethiopia",
    image: "/images/eth-photo-4.jpg",
    imageAlt: "Historic landscape on a journey through northern Ethiopia",
    publishedAt: "2026-09-29",
    updatedAt: "2026-09-29",
    readingMinutes: 8,
    intro: "Seven days is enough for a memorable introduction to Ethiopia, but not enough to cover the whole country. The best first itinerary chooses one connected region, protects time for delays, and leaves room to understand each place. This route combines the capital with Lalibela, Gondar, and a short Simien Mountains experience.",
    sections: [
      {
        heading: "Before you choose this route",
        paragraphs: [
          "This itinerary relies on domestic flights or an equivalent organized transport plan. Flight times, routes, road conditions, and site access can change, so confirm the sequence with your provider before paying for non-refundable arrangements. Avoid planning a same-day international connection after a domestic journey.",
          "The route also involves high elevations, uneven walking, and several transfers. Travelers who prefer a slower pace should remove either Gondar or the Simien Mountains and add the extra night to Lalibela or Addis Ababa.",
        ],
        bullets: [
          "Arrive with at least six full sightseeing days",
          "Keep the final night in Addis Ababa before departure",
          "Confirm baggage limits on every domestic flight",
        ],
      },
      {
        heading: "Day 1: arrive and settle into Addis Ababa",
        paragraphs: [
          "Treat your first day as an arrival day rather than a race through the capital. Check in, hydrate, and adjust to Addis Ababa's elevation. If your arrival time and energy allow, take a guided neighborhood walk or visit one carefully chosen museum instead of crossing the city repeatedly.",
          "Use the evening to review the week with your provider. Confirm tomorrow's pickup, luggage arrangements, emergency contacts, and any recent schedule changes. A relaxed first night makes the early travel days easier.",
        ],
      },
      {
        heading: "Days 2 and 3: Lalibela's living heritage",
        paragraphs: [
          "Travel to Lalibela and spend the first afternoon orienting yourself in town or visiting one church group with a licensed local guide. The rock-hewn churches are active places of worship, so access can shift around services and religious events.",
          "Use the second day for the remaining principal churches and the context that connects them. Wear clothing that covers shoulders and knees, bring socks for walking on stone after removing your shoes, and ask permission before photographing people or ceremonies.",
          "If you prefer landscapes to a full second day around the main complex, discuss a nearby highland excursion. Do not squeeze a distant monastery and every central church into the same rushed schedule.",
        ],
        bullets: [
          "Allow more time than a quick photo stop",
          "Carry water, sun protection, and easy-off shoes",
          "Let worship take priority over sightseeing",
        ],
      },
      {
        heading: "Day 4: travel to Gondar",
        paragraphs: [
          "Continue to Gondar, allowing most of the day for the transfer and check-in. If timing permits, begin with a gentle introduction to the city rather than attempting every major site before closing time.",
          "Gondar works as both a historical destination and the practical gateway for many Simien Mountains trips. Ask your provider to confirm the next morning's vehicle, park arrangements, guide, meals, and the clothing you should keep in your daypack.",
        ],
      },
      {
        heading: "Day 5: Gondar's royal history",
        paragraphs: [
          "Spend the morning exploring Gondar's royal and religious heritage with a guide who can connect the architecture to the city's wider history. Focus on a few sites with proper context instead of treating the day as a checklist.",
          "Keep the afternoon flexible. Depending on the following day's departure plan, you may need to prepare for an early drive, reorganize luggage, or rest before reaching higher ground.",
        ],
      },
      {
        heading: "Day 6: a first look at the Simien Mountains",
        paragraphs: [
          "A day trip can introduce the escarpment scenery and highland wildlife, although it cannot replace a multi-day trek. Travel times are significant, and conditions affect how much walking is sensible. Ask for the expected driving time, walking distance, elevation, and return hour in advance.",
          "Bring warm layers, rain protection, sun protection, water, and walking shoes with dependable grip. Move slowly and tell your guide if you develop a headache, dizziness, nausea, or unusual fatigue. Never feed or crowd geladas or other wildlife for photographs.",
        ],
        bullets: [
          "Choose viewpoints and walks that match your fitness",
          "Expect quick changes in highland weather",
          "Follow your guide's wildlife-distance instructions",
        ],
      },
      {
        heading: "Day 7: return to Addis Ababa",
        paragraphs: [
          "Return to Addis Ababa and keep the night in the capital. This buffer protects your international departure from delays elsewhere in the itinerary. If you arrive early, use the remaining time for a relaxed meal, coffee experience, or locally made gifts from a reputable shop.",
          "If your international flight leaves late that evening, confirm the connection carefully rather than assuming it is safe. Separate tickets, baggage collection, traffic, and schedule changes can all consume more time than expected.",
        ],
      },
      {
        heading: "How to adapt the itinerary",
        paragraphs: [
          "For a gentler cultural trip, skip the Simien day and add time in Lalibela or Gondar. For stronger hikers, replace Gondar sightseeing with a properly planned multi-day Simien trek and extend the total journey beyond one week. Travelers interested in Harar, the Omo Valley, Bale Mountains, or Danakil should build a separate regional itinerary rather than adding another long transfer.",
          "Before departure, review official travel advice, local conditions, insurance coverage, health needs, and every transport booking. The strongest itinerary is not the one with the most pins on a map; it is the one that still works when a journey takes longer than expected.",
        ],
      },
    ],
    relatedTourQuery: "Lalibela",
  },
  {
    slug: "best-time-to-visit-ethiopia",
    title: "Best Time to Visit Ethiopia: A Month-by-Month Guide",
    description: "Choose the best season for Ethiopia based on weather, trekking conditions, festivals, landscapes, and the regions you want to explore.",
    category: "Trip planning",
    location: "Ethiopia",
    image: "/images/beautiful-shot-building-near-forested-mountains.jpg",
    imageAlt: "Green Ethiopian highlands beneath a clear sky",
    publishedAt: "2026-09-15",
    updatedAt: "2026-09-28",
    readingMinutes: 7,
    intro: "Ethiopia can be visited throughout the year, but the right month depends on where you are going. The northern highlands, the hot Danakil lowlands, and the rainy southwest do not share one climate. Use your route—not a single national forecast—to choose your dates.",
    sections: [
      { heading: "October to January: clear highland days", paragraphs: ["For many first-time visitors, October through January offers the easiest conditions in Addis Ababa and the northern highlands. The main rains have usually eased, visibility is good, and daytime temperatures are comfortable at destinations such as Lalibela, Gondar, and the Simien Mountains.", "This period also includes major celebrations. Ethiopian Christmas is observed in early January, while Timkat usually follows later in the month. Festival dates create memorable journeys but can also mean fuller hotels and busy transport, so reserve early."], bullets: ["Good for the northern historical route", "Clearer views for highland trekking", "Book early around major religious festivals"] },
      { heading: "February to May: warmer and often quieter", paragraphs: ["February and March remain strong months for highland travel. Trails are generally drier, visitor numbers may be lower than during the January festival period, and days become gradually warmer.", "Short rains can arrive in parts of the country during March, April, and May. They rarely affect every region in the same way. Leave flexibility for road journeys and ask your local provider about current conditions before departing."], bullets: ["Consider February or March for trekking", "Carry a light waterproof layer", "Confirm road conditions for remote routes"] },
      { heading: "June to September: green season", paragraphs: ["The main rainy season affects much of the central and northern highlands from roughly June into September. Landscapes become intensely green and waterfalls grow more powerful, but cloud, rain, and rough roads can complicate hikes and long drives.", "This is not a universal reason to avoid Ethiopia. The east and parts of the south follow different patterns, and the green season can reward flexible travelers. September is especially significant because Ethiopian New Year and Meskel bring public celebrations."], bullets: ["Build buffer time into road itineraries", "Use waterproof luggage protection", "Do not assume conditions are identical nationwide"] },
      { heading: "Match the season to the destination", paragraphs: ["For Danakil, prioritize the cooler part of the year and use an experienced operator. For the Simien and Bale Mountains, ask about trail and visibility conditions. For the Omo Valley, road access and local rain matter more than the forecast in Addis Ababa.", "Before booking, compare the climate of every stop, the altitude changes, and any festival dates. A well-timed regional itinerary is more valuable than chasing one supposedly perfect month for the whole country."] },
    ],
    relatedTourQuery: "Ethiopia",
  },
  {
    slug: "lalibela-travel-guide",
    title: "Lalibela Travel Guide: Churches, Culture, and Practical Tips",
    description: "Plan a respectful visit to Lalibela’s rock-hewn churches with practical advice on timing, local guides, clothing, walking, and longer stays.",
    category: "Cultural travel",
    location: "Lalibela",
    image: "/images/pexels-ludo-van-den-nouweland-214324419-12344920.jpg",
    imageAlt: "Historic rock-hewn architecture in Lalibela, Ethiopia",
    publishedAt: "2026-09-16",
    updatedAt: "2026-09-28",
    readingMinutes: 6,
    intro: "Lalibela is a living place of worship, not an open-air museum. Its rock-hewn churches reward unhurried exploration, a knowledgeable local guide, and consideration for the people who pray and serve there every day.",
    sections: [
      { heading: "Give the churches enough time", paragraphs: ["The churches are arranged in groups connected by paths, trenches, and passages. A rushed stop can reduce the experience to photographs. Allow at least a full day for the principal sites; two days create room for deeper context, changing light, and a less hurried pace.", "Opening conditions and religious services can affect access. A local guide can sequence the visit sensibly and explain the engineering, religious symbolism, and continuing traditions without interrupting worship."], bullets: ["Wear shoes that are easy to remove", "Carry socks for hot or rough stone", "Ask before photographing people or services"] },
      { heading: "Dress and behave respectfully", paragraphs: ["Choose clothing that covers shoulders and knees. Women may wish to carry a light scarf for church visits. Speak quietly near worshippers and follow instructions from clergy, attendants, and your guide.", "Photography rules can change by location or occasion. Never assume that a camera ticket permits every kind of image. Avoid flashes during services and request permission before photographing clergy or worshippers at close range."] },
      { heading: "Explore beyond the main complex", paragraphs: ["Lalibela’s surrounding highlands include monasteries, viewpoints, villages, and hiking routes. These excursions can turn a checklist visit into a more complete understanding of the landscape that shaped the town.", "Distances and trail difficulty vary. Discuss transport, elevation, meals, and return times before setting out. Use an established local provider for remote sites rather than arranging an unclear route on arrival."], bullets: ["Add a highland excursion if your schedule allows", "Carry water and sun protection", "Confirm what entrance fees and transport are included"] },
      { heading: "Plan around festivals carefully", paragraphs: ["Major religious celebrations can make Lalibela extraordinary and extremely busy. Accommodation, guides, and transport may sell out well in advance. Expect crowds and accept that worship takes priority over sightseeing.", "If you prefer quieter observation, travel outside peak festival dates. You will still encounter a living religious landscape, with more space to understand individual churches and speak with your guide."] },
    ],
    relatedTourQuery: "Lalibela",
  },
  {
    slug: "simien-mountains-trekking-guide",
    title: "Simien Mountains Trekking Guide for First-Time Visitors",
    description: "Prepare for a Simien Mountains trek with advice on routes, altitude, weather, equipment, wildlife, guides, and responsible travel.",
    category: "Trekking",
    location: "Simien Mountains",
    image: "/images/pexels-malaydi-7941708.jpg",
    imageAlt: "Mountain ridges and valleys in the Ethiopian highlands",
    publishedAt: "2026-09-17",
    updatedAt: "2026-09-28",
    readingMinutes: 7,
    intro: "The Simien Mountains combine dramatic escarpments, high-altitude trails, and distinctive wildlife. The scenery is accessible on short visits, but a safe and satisfying trek still requires realistic distances, warm layers, and time to adjust to elevation.",
    sections: [
      { heading: "Choose a route for your time and fitness", paragraphs: ["Day trips can reveal major viewpoints, while multi-day routes provide a stronger sense of the landscape. Longer is not automatically better: elevation, repeated climbs, and basic camps can make modest daily distances tiring.", "Tell your provider honestly about your hiking experience and any health concerns. Ask for daily distance, expected ascent, sleeping arrangements, vehicle support, and the highest elevation—not simply the number of days."], bullets: ["Compare elevation gain as well as distance", "Include an easier first day where possible", "Keep buffer time after the trek"] },
      { heading: "Prepare for cold nights and strong sun", paragraphs: ["Highland weather changes quickly. Days may feel warm in direct sun while evenings and exposed ridges become cold. Pack layered clothing, a waterproof shell, a warm hat, gloves, and dependable walking shoes.", "Sun exposure is strong at altitude. Carry sunscreen, sunglasses, water, and a brimmed hat. Your operator should explain water treatment, meals, sleeping equipment, and what you must bring yourself."], bullets: ["Break in footwear before traveling", "Keep rain gear in your daypack", "Bring a headlamp and personal medication"] },
      { heading: "Take altitude seriously", paragraphs: ["Move slowly, drink regularly, and report headaches, nausea, unusual fatigue, or dizziness to your guide. Fitness does not prevent altitude illness. The safest response may be to rest, change the route, or descend.", "Arriving directly from low elevation and attempting a demanding route immediately increases strain. If your itinerary permits, spend time at moderate altitude before the highest walking days." ] },
      { heading: "Watch wildlife without crowding it", paragraphs: ["Gelada groups are often seen in the Simiens, alongside highland birds and other endemic wildlife. Keep the distance set by your guide, do not feed animals, and avoid blocking their movement for photographs.", "Choose operators who manage waste, respect park instructions, and employ local teams fairly. Responsible trekking protects both the landscape and the communities whose work makes these journeys possible."] },
    ],
    relatedTourQuery: "Simien Mountains",
  },
  {
    slug: "danakil-depression-travel-guide",
    title: "Danakil Depression Travel Guide: What to Expect",
    description: "Understand the heat, remoteness, safety planning, equipment, and operator support required for a journey into Ethiopia’s Danakil Depression.",
    category: "Adventure",
    location: "Danakil Depression",
    image: "/images/pexels-atypeek-12131129.jpg",
    imageAlt: "Otherworldly desert landscape in Ethiopia",
    publishedAt: "2026-09-18",
    updatedAt: "2026-09-28",
    readingMinutes: 6,
    intro: "Danakil is visually extraordinary and physically demanding. Extreme heat, long drives, limited facilities, and changing access conditions mean this is not an independent sightseeing trip. Your operator, vehicle, water plan, and current local information are central to the journey.",
    sections: [
      { heading: "Travel with an experienced operator", paragraphs: ["Routes and permissions can change, and many locations are far from reliable services. Choose a provider that explains transport, drivers, local coordination, communication, water, meals, sleeping arrangements, and contingency plans in detail.", "Ask what happens if a vehicle fails or conditions prevent access. A responsible operator will discuss limitations clearly rather than promise that every stop is guaranteed."], bullets: ["Confirm the vehicle and backup plan", "Ask how drinking water is managed", "Check current official travel advice before departure"] },
      { heading: "Prepare for heat and basic conditions", paragraphs: ["The heat can be intense even for experienced travelers. Lightweight loose clothing, sun protection, electrolyte replacement, and disciplined hydration are essential. Alcohol and unnecessary exertion can worsen dehydration.", "Accommodation may be very simple, and privacy can be limited. Ask exactly where you will sleep and whether bedding is provided. Pack personal hygiene supplies, a headlamp, dust protection, and any medication you rely on." ] },
      { heading: "Treat geothermal areas with caution", paragraphs: ["Colorful mineral formations and geothermal features can be fragile and dangerous. Surfaces may be thin, unstable, or extremely hot. Walk only where your guide directs and never step away from the group for a photograph.", "Do not touch pools, vents, or mineral deposits. Carry out everything you bring in, and avoid collecting rocks or salt as souvenirs unless your guide confirms that doing so is permitted and appropriate." ] },
      { heading: "Decide whether the trip suits you", paragraphs: ["Travelers with conditions affected by heat, dehydration, rough roads, or limited medical access should seek professional medical advice before booking. Be candid with your operator about mobility and health needs.", "The Danakil rewards preparation and patience, but it is not a comfort-focused trip. If the physical demands do not suit you, Ethiopia offers highland landscapes, cultural routes, and wildlife experiences with easier logistics."] },
    ],
    relatedTourQuery: "Danakil",
  },
  {
    slug: "ethiopia-packing-list",
    title: "What to Pack for Ethiopia: A Practical Travel Checklist",
    description: "Pack for Ethiopia’s altitude, sun, rain, cultural sites, road journeys, and regional climates with this adaptable travel checklist.",
    category: "Trip planning",
    location: "Ethiopia",
    image: "/images/beautiful-woman-with-backpack-smiling-holding-binoculars.jpg",
    imageAlt: "Traveler carrying a backpack and binoculars",
    publishedAt: "2026-09-19",
    updatedAt: "2026-09-28",
    readingMinutes: 6,
    intro: "Packing for Ethiopia is mainly an exercise in layers. A single itinerary can move from cool highland mornings to strong midday sun, dusty roads, rain, and hot lowlands. Start with your exact route and season, then keep the essentials light and adaptable.",
    sections: [
      { heading: "Clothing for changing elevation", paragraphs: ["Bring breathable everyday clothing plus a warm layer for highland evenings. A light insulated jacket or fleece, a compact waterproof shell, and long trousers cover many common routes. Hotter regions require loose sun-protective clothing rather than only shorts.", "For churches and conservative communities, pack clothing that covers shoulders and knees. A lightweight scarf is useful for sun, dust, and religious visits."], bullets: ["Breathable shirts and comfortable trousers", "Warm mid-layer and waterproof outer layer", "Modest clothing for religious and community visits"] },
      { heading: "Footwear and day equipment", paragraphs: ["Comfortable walking shoes are sufficient for many cultural routes. Trekking itineraries require footwear with suitable grip that you have already worn. Pack sandals or easy-off shoes if your route includes frequent church visits.", "Use a small daypack for water, sun protection, rain gear, medication, and documents. A reusable bottle, sunglasses, hat, and compact headlamp are valuable across many regions."], bullets: ["Broken-in shoes", "Small daypack and reusable bottle", "Headlamp with spare power"] },
      { heading: "Health and personal essentials", paragraphs: ["Carry enough prescribed medication for the full journey, with a copy of the prescription where appropriate. Add a personal first-aid kit suited to your itinerary. Discuss vaccinations, malaria risk, altitude, and other individual health needs with a qualified travel-health professional.", "Sun protection and hydration matter at altitude as well as in hot areas. Hand sanitizer, tissues, and a small supply of hygiene products are useful during long drives and in remote accommodation." ] },
      { heading: "Documents, power, and backups", paragraphs: ["Keep secure digital and paper copies of important travel documents. Carry more than one way to access money and do not depend on continuous mobile data outside major towns.", "A power bank and universal adapter can help during long travel days. Download key bookings, maps, and contact information before leaving reliable internet access. Ask your provider what connectivity and charging to expect on remote routes." ] },
    ],
    relatedTourQuery: "Ethiopia",
  },
  {
    slug: "ethiopia-cultural-etiquette",
    title: "Ethiopia Cultural Etiquette: A Respectful Traveler’s Guide",
    description: "Travel more thoughtfully in Ethiopia with practical guidance on greetings, hospitality, photography, religious sites, food, and local customs.",
    category: "Culture",
    location: "Ethiopia",
    image: "/images/pexels-lara-jameson-8828585.jpg",
    imageAlt: "People sharing a cultural experience in Ethiopia",
    publishedAt: "2026-09-20",
    updatedAt: "2026-09-28",
    readingMinutes: 6,
    intro: "Ethiopia is culturally and linguistically diverse, so no short list describes every community. Respect begins with observation, patience, and asking when you are unsure. A local guide can explain regional expectations far better than a universal rulebook.",
    sections: [
      { heading: "Greetings and everyday interaction", paragraphs: ["Greetings matter and may take more time than a quick hello. Follow the other person’s lead on handshakes or other gestures, particularly across age, gender, and religious contexts. Learning a few words in the locally used language is usually appreciated.", "Use polite titles when introduced, listen before making assumptions, and expect ideas about time or personal space to vary. Calm, patient communication works better than visible frustration." ] },
      { heading: "Hospitality, meals, and coffee", paragraphs: ["An invitation to eat or share coffee may carry real social meaning. Accept what you comfortably can, show appreciation, and ask your guide if you are uncertain about etiquette. In many settings, eating from a shared dish is normal.", "Wash your hands when the opportunity is offered and follow your hosts. Dietary customs vary, including frequent fasting traditions in Orthodox Christian communities and halal practice in Muslim communities. Avoid treating these traditions as curiosities or inconveniences." ] },
      { heading: "Religious sites and ceremonies", paragraphs: ["Dress modestly, remove shoes where instructed, and keep your voice low. Some spaces may have access restrictions. Services and ceremonies belong to worshippers first; visitors should avoid obstructing entrances, processions, or prayer.", "Always ask before photographing people, clergy, interiors, or ceremonies. Permission from a guide is not necessarily permission from the person in front of the camera."], bullets: ["Carry a scarf and easy-off shoes", "Turn off flash and intrusive sounds", "Accept restricted access without argument"] },
      { heading: "Photography and community visits", paragraphs: ["Ask clearly before taking a portrait and respect a refusal without bargaining. Discuss any expected photography fee before taking the image. Be especially cautious with children: seek appropriate adult permission and never use gifts to pressure participation.", "Choose experiences that create genuine local benefit and avoid staged encounters presented without context. Your provider should be able to explain who organized the visit, how the community participates, and where your payment goes." ] },
    ],
    relatedTourQuery: "Cultural",
  },
];

export function getGuide(slug: string) {
  return travelGuides.find((guide) => guide.slug === slug);
}
