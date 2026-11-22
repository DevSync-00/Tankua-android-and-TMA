import { getAddisToday } from "./weekend-dates";

export type WeekendPlanDuration = "half-day" | "full-day" | "overnight";
export type WeekendPlanMood = "culture" | "nature" | "food" | "family";

interface Source {
  label: string;
  url: string;
}

interface WeekendStop {
  name: string;
  description: string;
  mapUrl: string;
}

export interface WeekendPlan {
  slug: string;
  title: string;
  description: string;
  area: string;
  duration: WeekendPlanDuration;
  mood: WeekendPlanMood;
  timeEstimate?: string;
  budgetEtb: number | null;
  budgetNote?: string;
  image: string;
  imageAlt?: string;
  stops: readonly WeekendStop[];
  tips: readonly string[];
  sources: readonly Source[];
  tourSearch?: string;
}

export interface WeekendEvent {
  slug: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string;
  source: Source;
  mapUrl?: string;
}

const cityGuide = {
  label: "Tankua’s Addis Ababa guide",
  url: "/guides/best-things-to-do-addis-ababa",
};
const cityTourism = {
  label: "Addis Ababa Tourism Commission",
  url: "https://aatc.gov.et/",
};
const ethiopiaTours = {
  label: "Visit Ethiopia’s suggested outings",
  url: "https://visitethiopia.et/themes/mytravel/ass/AU%202026%20English%20Brochure.pdf",
};
const entotoPark = {
  label: "Entoto Park visitor information",
  url: "https://www.entotopark.gov.et/",
};
const cityImage = {
  image: "/images/pexels-fanuel-33019023.jpg",
  imageAlt: "A busy avenue in Addis Ababa after rain",
};
const coffeeImage = {
  image: "/images/ethiopian-coffee-ceremony.jpg",
  imageAlt: "Coffee poured from a decorated clay pot into a small cup",
};
const highlandImage = {
  image: "/images/pexels-christian-alemu-127251395-31047251.jpg",
  imageAlt: "Traditional buildings surrounded by green landscape in Ethiopia",
};

function mapSearch(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function stop(name: string, description: string, mapQuery = `${name}, Addis Ababa, Ethiopia`): WeekendStop {
  return { name, description, mapUrl: mapSearch(mapQuery) };
}

export const weekendPlans: readonly WeekendPlan[] = [
  {
    slug: "entoto-and-shiro-meda",
    title: "Entoto views and Shiro Meda textiles",
    description: "Spend the morning on Entoto’s marked park paths, then stop for handwoven textiles on the way back into the city.",
    area: "Northern Addis",
    duration: "half-day",
    mood: "nature",
    timeEstimate: "Allow a morning for the park and market.",
    budgetEtb: 200,
    budgetNote: "Published Entoto Park admission for one domestic adult. Allow extra for transport and purchases.",
    ...highlandImage,
    stops: [
      stop("Entoto Park", "Choose a marked walking route and pause at a viewpoint for a look over Addis."),
      stop("Shiro Meda Market", "Browse woven scarves and clothing and ask stallholders about the fabrics."),
    ],
    tips: ["Use the Shiro Meda gate if your route takes you past the market.", "Bring a light layer and comfortable shoes."],
    sources: [entotoPark, cityGuide],
    tourSearch: "Entoto",
  },
  {
    slug: "arat-kilo-museum-morning",
    title: "A museum morning around Arat Kilo",
    description: "Take in Ethiopia’s archaeology at the National Museum, then see the Ethnological Museum on the Addis Ababa University campus.",
    area: "Arat Kilo and Sidist Kilo",
    duration: "half-day",
    mood: "culture",
    timeEstimate: "Allow a half-day for both museums and the transfer.",
    budgetEtb: null,
    ...cityImage,
    stops: [
      stop("National Museum of Ethiopia", "Start in the archaeology galleries, then pick a floor of historical objects or art."),
      stop("Ethnological Museum", "Visit the collections at Addis Ababa University to see objects and traditions from across the country."),
    ],
    tips: ["Check entry hours for both museums before setting out.", "Allow a buffer for transfers so you can take your time inside each museum."],
    sources: [cityTourism, ethiopiaTours, cityGuide],
    tourSearch: "Addis Ababa",
  },
  {
    slug: "unity-park-with-family",
    title: "Unity Park with the family",
    description: "Build a full day around the palace grounds, choosing a few exhibits, the gardens, and breaks for the group.",
    area: "Arat Kilo",
    duration: "full-day",
    mood: "family",
    timeEstimate: "Set aside most of the day for park access, exhibits, and breaks.",
    budgetEtb: 300,
    budgetNote: "Published Unity Park regular admission for one domestic adult. Allow extra for transport and food.",
    ...cityImage,
    stops: [
      stop("Unity Park", "Start with the restored buildings and an exhibition your group can explore together."),
      stop("Unity Park gardens", "Spend the second part of the visit outside, with time to pause between the gardens and wildlife areas.", "Unity Park, Addis Ababa, Ethiopia"),
    ],
    tips: ["Check which areas your ticket includes and bring any ID required at entry.", "Pick your first stops before entering so younger travelers can set the pace."],
    sources: [
      { label: "Visit Addis Ababa’s Unity Park information", url: "https://visitaddisababa.et/things-to-do/unity-park" },
      { label: "Unity Park’s package and price guide", url: "https://b.id.et/how_to/" },
      { label: "Unity Park ticketing", url: "https://ticket.ethiotelecom.et/unitypark/ticket/" },
    ],
    tourSearch: "Unity Park",
  },
  {
    slug: "piassa-coffee-and-merkato",
    title: "Piassa coffee and a Merkato shop",
    description: "Start with coffee around Piassa and spend the rest of the morning looking for a specific ingredient, fabric, or piece of kitchenware in Merkato.",
    area: "Piassa and Merkato",
    duration: "half-day",
    mood: "food",
    timeEstimate: "Set aside a Saturday morning for coffee and the market.",
    budgetEtb: null,
    ...coffeeImage,
    stops: [
      stop("Tomoca Coffee on Wavel Street", "Start at Tomoca’s original café before taking a little time to explore the neighborhood.", "Tomoca Coffee Wavel Street, Piassa, Addis Ababa, Ethiopia"),
      stop("Addis Mercato", "Pick a section of the market before arriving so you have time to talk with vendors and compare what’s available."),
    ],
    tips: ["Bring a small shopping list and confirm stall hours for the weekend.", "Ask before taking photos around shops and stalls."],
    sources: [cityGuide, { label: "Tomoca’s outlet directory", url: "https://tomocacoffee.et/locations" }],
    tourSearch: "Addis Ababa",
  },
  {
    slug: "adwa-and-old-piassa",
    title: "Adwa history and old Piassa",
    description: "Give the Adwa Victory Memorial the center of your visit, with time for coffee and a walk around Piassa afterward.",
    area: "Piassa",
    duration: "half-day",
    mood: "culture",
    timeEstimate: "Allow a half-day for the museum and time nearby.",
    budgetEtb: null,
    ...cityImage,
    stops: [
      stop("Adwa Victory Memorial", "Visit the museum to learn about the battle and the history around it."),
      stop("Piassa", "Meet friends for coffee nearby and make a short walk part of the outing."),
    ],
    tips: ["Use the museum’s ticket page to check the current ticket for your visitor category.", "Choose a café or landmark as a meeting point before you set off."],
    sources: [
      { label: "Adwa Victory Memorial visitor information", url: "https://adwavictorymemorial.gov.et/" },
      { label: "Adwa Victory Memorial tickets", url: "https://adwavictorymemorial.gov.et/tickets" },
      cityGuide,
    ],
    tourSearch: "Addis Ababa",
  },
  {
    slug: "science-museum-and-friendship-park",
    title: "Science exhibits and a Friendship Park walk",
    description: "Pair a museum visit with outdoor time so the whole family can move at their own pace.",
    area: "Central Addis",
    duration: "full-day",
    mood: "family",
    timeEstimate: "Save a full day for the two stops and a lunch break.",
    budgetEtb: null,
    ...cityImage,
    stops: [
      stop("Ethiopian Science Museum", "Check the exhibition schedule and choose a topic to explore together."),
      stop("Friendship Park", "Finish the outing with a walk through the landscaped spaces and a rest outside."),
    ],
    tips: ["Check both venues’ opening days and entry arrangements.", "Keep the park visit flexible in case your group wants more time at the museum."],
    sources: [cityTourism, cityGuide],
    tourSearch: "Addis Ababa",
  },
  {
    slug: "gullele-botanic-garden",
    title: "A morning in Gullele Botanic Garden",
    description: "Explore a living collection of plants and spend a quiet half-day in the northwestern part of Addis.",
    area: "Gullele",
    duration: "half-day",
    mood: "nature",
    timeEstimate: "Allow a half-day for the garden and transport.",
    budgetEtb: null,
    ...highlandImage,
    stops: [
      stop("Gullele Botanic Garden", "Check which public paths are open and look for information on native and conservation plants."),
    ],
    tips: ["Confirm the visitor entrance and weekend hours with the garden.", "Bring water and allow time to get to the entrance from your starting point."],
    sources: [
      { label: "Gullele Botanic Garden visitor information", url: "https://www.gbg.gov.et/" },
      { label: "Garden contact page", url: "https://www.gbg.gov.et/contactus" },
    ],
  },
  {
    slug: "bole-injera-and-buna",
    title: "Injera and buna in Bole",
    description: "Plan a long lunch with friends and finish with Ethiopian coffee. A single neighborhood gives you plenty of time at the table.",
    area: "Bole",
    duration: "half-day",
    mood: "food",
    timeEstimate: "Give lunch and coffee a relaxed half-day.",
    budgetEtb: null,
    image: "/images/ethiopian-food-guide.jpg",
    imageAlt: "Injera served with red lentils, green lentils, and cooked greens",
    stops: [
      stop("Ethiopian restaurants in Bole", "Choose a local restaurant, share a platter, and ask about the vegetables, stews, or meats you would like to try.", "Ethiopian restaurants, Bole, Addis Ababa, Ethiopia"),
      stop("Tomoca Roastery in Bole", "Choose a coffee from the Bole outlet or arrange a full ceremony with a local restaurant.", "Tomoca Coffee Bole Impress Building, Addis Ababa, Ethiopia"),
    ],
    tips: ["Ask for current menu prices before you settle on a venue.", "Check with the restaurant for any dietary needs in your group."],
    sources: [
      { label: "Tankua’s Ethiopian food guide", url: "/guides/ethiopian-food-guide" },
      { label: "Tankua’s Ethiopian coffee ceremony guide", url: "/guides/ethiopian-coffee-ceremony-guide" },
      { label: "Tomoca’s outlet directory", url: "https://tomocacoffee.et/locations" },
    ],
  },
  {
    slug: "central-addis-palace-and-gardens",
    title: "National Palace Museum and a garden afternoon",
    description: "Choose a slower day of palace history, with time afterward for a coffee stop or a city park.",
    area: "Central Addis",
    duration: "full-day",
    mood: "culture",
    timeEstimate: "Allow a full day for museum entry, lunch, and your second stop.",
    budgetEtb: null,
    ...cityImage,
    stops: [
      stop("National Palace Museum", "Check the museum’s current ticket rules and spend the first part of the day with the exhibits."),
      stop("Friendship Park", "If time permits, finish with a gentle walk in the park."),
    ],
    tips: ["Check current opening hours and photo rules at the museum.", "Leave a buffer for ticketing and midday traffic."],
    sources: [
      { label: "National Palace Museum visitor information", url: "https://palacemuseum.gov.et/info" },
      cityTourism,
    ],
    tourSearch: "Addis Ababa",
  },
  {
    slug: "abrehot-library-reading-morning",
    title: "A reading morning at Abrehot Library",
    description: "Take a quiet morning to explore Ethiopian literature, find something new to read, or bring a book of your own.",
    area: "Arat Kilo",
    duration: "half-day",
    mood: "culture",
    timeEstimate: "Drop in for an hour or make it a half-day.",
    budgetEtb: 0,
    budgetNote: "The library lists free reader access. Allow extra for transport and any refreshments.",
    ...cityImage,
    stops: [
      stop("Abrehot Library", "Find a reading space and ask the library team where to look for books in your preferred language."),
      stop("Arat Kilo", "If you are visiting with friends, meet nearby afterward to share what you found."),
    ],
    tips: ["Check current reader access and bring a photo ID if requested.", "Pick a nearby meeting point if your group wants to talk after reading."],
    sources: [
      { label: "Abrehot Library visitor information", url: "https://abrehot.org.et/" },
      { label: "Addis Ababa Mayor’s public library project", url: "https://www.addismayor.gov.et/cityprojects/public-library-project" },
    ],
    tourSearch: "Addis Ababa",
  },
  {
    slug: "bishoftu-lakes-overnight",
    title: "A night beside Bishoftu’s lakes",
    description: "Leave Addis for a lakeside stay, with time for a different shore before returning the next day.",
    area: "Bishoftu, Oromia",
    duration: "overnight",
    mood: "nature",
    timeEstimate: "Allow an overnight stay. Visit Ethiopia estimates about 1 hour 15 minutes from Addis by road.",
    budgetEtb: null,
    ...highlandImage,
    stops: [
      stop("Lake Bishoftu", "Choose a hotel or café with confirmed shore access and book ahead if you are staying overnight.", "Lake Bishoftu, Bishoftu, Ethiopia"),
      stop("Lake Hora Arsedi", "Check where you can reach the shore, then fit one short visit in before returning to Addis.", "Lake Hora Arsedi, Bishoftu, Ethiopia"),
    ],
    tips: ["Confirm expressway access, return transport, accommodation, and access costs before leaving Addis.", "Choose one lake each day for time to enjoy both stops."],
    sources: [
      { label: "Visit Ethiopia’s day-trip guide", url: "https://visitethiopia.et/uploads/brochures/un-food-systems-summit-tourism-guide.pdf" },
      { label: "Visit Ethiopia’s Bishoftu guide", url: "https://www.visitethiopia.et/space/bishoftu" },
      { label: "Ethiopia regional travel advisory", url: "https://www.gov.uk/foreign-travel-advice/ethiopia/regional-risks" },
      { label: "Tankua’s Ethiopian festivals guide", url: "/guides/ethiopian-festivals-travel-guide" },
    ],
    tourSearch: "Bishoftu",
  },
];

// Add scheduled events with dates and a link from the venue or organizer.
export const weekendEvents: readonly WeekendEvent[] = [
  {
    slug: "european-union-film-festival-closing-2026",
    title: "European Union Film Festival closing screening",
    description: "The published program closes with a screening at the National Theatre. Check the festival schedule for entry details.",
    startDate: "2026-11-21",
    location: "Ethiopian National Theatre",
    source: { label: "EU Delegation to Ethiopia festival schedule", url: "https://www.eeas.europa.eu/sites/default/files/2026/documents/EUFF%20SCHEDULE%202026%20(2).pdf" },
    mapUrl: mapSearch("Ethiopian National Theatre, Addis Ababa, Ethiopia"),
  },
  {
    slug: "great-ethiopian-run-childrens-races-2026",
    title: "Great Ethiopian Run Children’s Races",
    description: "The children’s races open the Great Ethiopian Run weekend. Check the race organizer for registration and age groups.",
    startDate: "2026-11-21",
    location: "Ethiopian Sports Academy",
    source: { label: "Great Ethiopian Run’s children’s race announcement", url: "https://capitalethiopia.com/wp-content/uploads/2026/11/Capital_Nov_01_-Iss-1456_2026.pdf#page=24" },
    mapUrl: mapSearch("Ethiopian Sports Academy, Addis Ababa, Ethiopia"),
  },
  {
    slug: "great-ethiopian-run-10k-2026",
    title: "Great Ethiopian Run 10km",
    description: "The city’s road race returns on Sunday. The organizer has the course details and information for participants.",
    startDate: "2026-11-22",
    location: "Addis Ababa",
    source: { label: "Great Ethiopian Run official event site", url: "https://www.greatethiopianrun10k.com/" },
  },
  {
    slug: "linkup-bazaar-family-fest-2026-11",
    title: "LinkUp Bazaar and Family Fest",
    description: "Browse local makers and enjoy family activities at K-Park.",
    startDate: "2026-11-28",
    endDate: "2026-11-29",
    location: "K-Park, Ethio-Korea Veterans Memorial Park",
    source: { label: "LinkUp Addis event announcement", url: "https://t.me/LinkUpAddis/13385" },
    mapUrl: mapSearch("Ethio-Korea Veterans Memorial Park, Addis Ababa, Ethiopia"),
  },
];

export function getWeekendPlan(slug: string) {
  return weekendPlans.find((plan) => plan.slug === slug);
}

export function filterWeekendPlans({
  duration,
  mood,
  maxBudgetEtb,
}: {
  duration?: WeekendPlanDuration;
  mood?: WeekendPlanMood;
  maxBudgetEtb?: number;
} = {}) {
  return weekendPlans.filter((plan) => (
    (!duration || plan.duration === duration)
    && (!mood || plan.mood === mood)
    && (maxBudgetEtb === undefined || (plan.budgetEtb !== null && plan.budgetEtb <= maxBudgetEtb))
  ));
}

const oneDay = 86_400_000;
const earliestSaturday = Date.UTC(1970, 0, 3);

export function getAddisWeekend(now = new Date()) {
  const today = Date.parse(getAddisToday(now));
  const weekday = new Date(today).getUTCDay();
  const saturday = today + (weekday === 0 ? -1 : 6 - weekday) * oneDay;
  return {
    saturday: new Date(saturday).toISOString().slice(0, 10),
    sunday: new Date(saturday + oneDay).toISOString().slice(0, 10),
  };
}

export function getWeekendEvents(now = new Date()) {
  const { saturday, sunday } = getAddisWeekend(now);
  const today = getAddisToday(now);
  return weekendEvents.filter((event) => (
    event.startDate <= sunday && (event.endDate ?? event.startDate) >= saturday
    && (event.endDate ?? event.startDate) >= today
  )).sort((left, right) => left.startDate.localeCompare(right.startDate));
}

export function getWeekendPicks(now = new Date()) {
  const { saturday } = getAddisWeekend(now);
  const week = Math.floor((Date.parse(saturday) - earliestSaturday) / (7 * oneDay));
  const offset = ((week * 3) % weekendPlans.length + weekendPlans.length) % weekendPlans.length;
  return Array.from({ length: 3 }, (_, index) => weekendPlans[(offset + index) % weekendPlans.length]);
}
