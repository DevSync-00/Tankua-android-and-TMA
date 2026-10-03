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
  sources?: { label: string; url: string }[];
};

export const travelGuides: TravelGuide[] = [
  {
    slug: "harar-travel-guide",
    title: "Harar Travel Guide: A Thoughtful 2-Day Itinerary Inside the Walled City",
    description: "Plan two days in Harar, Ethiopia, with a practical walking itinerary for Harar Jugol, Harari homes, markets, coffee, museums, and respectful cultural encounters.",
    category: "Destinations",
    location: "Harar",
    image: "/harar.png",
    imageAlt: "A local handler with a spotted hyena outside Harar at night",
    publishedAt: "2026-10-03",
    updatedAt: "2026-10-03",
    readingMinutes: 10,
    intro: "Harar rewards the traveller who slows down. Behind Jugol's walls, lanes bend past mosques, shrines, courtyard homes, markets, tailors, coffee sellers, and neighbours going about an ordinary day. Two nights give you enough time to see the landmarks without reducing a living city to a checklist—and enough context to understand why Harar feels unlike anywhere else in Ethiopia.",
    sections: [
      {
        heading: "Why Harar deserves at least two nights",
        paragraphs: [
          "Harar Jugol, the fortified historic town, has been on UNESCO's World Heritage List since 2006. UNESCO describes a 48-hectare walled city shaped by African and Islamic traditions, with 82 mosques, 102 shrines, distinctive Harari houses, and a street plan whose narrow lanes still hold commercial, religious, and domestic life.",
          "Those numbers explain Harar's importance, but not its pace. The best moments are often small: the geometry of a painted interior, baskets arranged on a wall, the smell of roasting coffee, or a lane briefly filled by schoolchildren. A rushed day trip leaves little room for conversation and pushes every visit toward the same few photographs.",
          "Stay two nights if you can. Use the first afternoon to get oriented, devote the next morning to Jugol with a local guide, and keep a second morning for the places you want to revisit. This also protects the trip from delayed transport and changing opening times.",
        ],
      },
      {
        heading: "Getting to Harar and planning your arrival",
        paragraphs: [
          "Dire Dawa is the usual transport gateway for Harar. Travellers commonly continue by road, so build transfer time into the day and arrange a trusted driver or confirmed local transport before arrival. Schedules and access can change; verify the route, current travel advice, and onward connections close to departure rather than relying on an old itinerary.",
          "Choose accommodation in or within an easy walk of Jugol if atmosphere and early walks matter most. A traditional guesthouse can add valuable context, but ask practical questions before booking: private or shared bathroom, vehicle access, luggage help, noise, stairs, and whether breakfast is included. The oldest lanes were made for people, not cars.",
          "Arrive before dark when possible. You will understand the gates and your accommodation's location in daylight, then have an unhurried evening rather than beginning with a confusing walk through unfamiliar alleys.",
        ],
        bullets: [
          "Confirm transfers and accommodation directly before travel",
          "Carry some cash; do not assume every small shop accepts cards",
          "Keep one buffer night before an important flight or connection",
        ],
      },
      {
        heading: "Day 1: learn how Jugol fits together",
        paragraphs: [
          "Begin after breakfast with a licensed or locally recommended guide. Harar's lanes are enjoyable to wander, but guidance turns a photogenic maze into a readable city. Ask about the historic gates, the central commercial streets, the relationship between homes and neighbourhood life, and which religious spaces are open to visitors that day.",
          "Make a traditional Harari house a priority. UNESCO identifies the townhouses and their exceptional interiors as one of Harar's most significant forms of heritage. Inside, raised platforms, niches, colours, objects, and seating positions express family and social life; they are not simply decoration. Visit a home or museum where entry is welcomed and interpretation is offered.",
          "Continue through the market areas at a walking pace. Look before photographing. Traders are working, residents are shopping, and not every person or transaction is a tourist attraction. Buying coffee, spices, basketry, or another locally made item is more meaningful than collecting portraits without conversation.",
        ],
        bullets: [
          "Ask your guide to explain, not merely point out, the five historic gates",
          "Include one interpreted Harari interior rather than several hurried stops",
          "Leave room for tea or coffee instead of filling every hour",
        ],
      },
      {
        heading: "What to notice beyond the headline sights",
        paragraphs: [
          "Harar's importance comes from the whole urban ensemble. UNESCO notes that the central core combines commercial and religious buildings, while traditional Harari, Indian, and combined Indian-Harari houses reveal layers of trade and cultural exchange. The late-19th-century houses with wooden verandas are part of that story.",
          "A museum stop can help connect those layers. Rimbaud's House is associated with the French poet's years in the region and now functions as a cultural site; other local collections focus more directly on Harari life. Confirm what is open, then choose the museum that best fills the gap in your walk rather than trying to enter everything.",
          "Pay attention to conservation as well as beauty. UNESCO identifies pressure from unsuitable materials, altered doors, infrastructure, and urban change. Staying in locally run accommodation, hiring local expertise, buying genuine craft, and treating historic surfaces carefully are small ways visitors can support the place they came to see.",
        ],
      },
      {
        heading: "The hyena tradition: how to approach it responsibly",
        paragraphs: [
          "The evening encounter with spotted hyenas is Harar's most advertised experience, yet it should not become the only story told about the city. Ask a trusted local guide about the history and present-day practice before deciding whether to attend. Conditions, handlers, locations, and crowd sizes can change.",
          "If you go, observe the animals as wild animals. Keep the distance requested by the handler, avoid sudden movement, never surround or chase a hyena, and do not improvise by offering food. Decline any interaction that feels unsafe or coercive. Flash, shouting, and repeated close posing can turn a local tradition into a stressful spectacle.",
          "Families with young children and anyone uncomfortable around large carnivores can skip the close encounter without missing the essence of Harar. A quiet evening meal, a rooftop view, or conversation at a guesthouse can be just as memorable.",
        ],
      },
      {
        heading: "Day 2: return early, then follow one theme",
        paragraphs: [
          "Walk inside Jugol early, when deliveries begin and the lanes are cooler. Revisit a gate or market without trying to reproduce yesterday's route. The repetition is useful: after one guided walk, details that first appeared chaotic start to make sense.",
          "Spend the rest of the morning on one theme. That might be coffee and trade, Harari domestic architecture, basketry and textiles, or the city's religious geography. A focused conversation with a knowledgeable guide or host will usually teach you more than another circuit of loosely explained stops.",
          "Keep the afternoon flexible for a museum, shopping, rest, or a short outing recommended locally. Harar is a place where access depends on the day, the hour, and community life. Flexibility is not failed planning here; it is part of travelling respectfully.",
        ],
      },
      {
        heading: "Faith, festivals, and being a considerate guest",
        paragraphs: [
          "Harar is a sacred Muslim city as well as a World Heritage site. Dress with shoulders and knees covered, speak quietly near worship, and ask before entering a mosque, shrine, courtyard, or home. Remove shoes when requested. A guide's access does not automatically grant permission to photograph the people inside.",
          "Shuwalid shows how closely Harar's public spaces and living heritage are connected. UNESCO inscribed the three-day Harari festival on the Representative List of the Intangible Cultural Heritage of Humanity in 2023. It brings prayer, scripture, music, dance, blessing, and intergenerational learning to shrines near the walled city's main entrance gates.",
          "If your visit coincides with a religious or community event, confirm what is public and where visitors should stand. Give worshippers priority, avoid blocking gates and lanes, and never treat prayer as a performance staged for a camera.",
        ],
      },
      {
        heading: "A practical Harar checklist",
        paragraphs: [
          "Wear shoes with grip for uneven lanes and carry water, sun protection, and a light layer for the evening. Mobile coverage and payments may not work exactly when you need them, so keep offline booking details, your accommodation's phone number, and modest cash in small denominations.",
          "Ask before photographing people, interiors, religious sites, and market stalls. Learn a greeting, buy with interest rather than bargaining for sport, and let residents pass in narrow lanes. Most importantly, resist the urge to turn every encounter into content.",
          "Before leaving, verify your road transfer and onward departure again. A good Harar itinerary is deliberately simple: two nights, one well-guided walk, one deeper theme, and enough unclaimed time for the city to surprise you.",
        ],
        bullets: [
          "Best minimum stay: two nights",
          "Core experience: a contextual walk through Harar Jugol",
          "Bring: modest clothing, walking shoes, water, cash, and curiosity",
          "Confirm locally: opening times, religious access, transport, and evening activities",
        ],
      },
    ],
    relatedTourQuery: "Harar",
    sources: [
      { label: "UNESCO World Heritage Centre — Harar Jugol, the Fortified Historic Town", url: "https://whc.unesco.org/en/list/1189" },
      { label: "UNESCO Intangible Cultural Heritage — Shuwalid festival", url: "https://ich.unesco.org/en/RL/shuwalid-festival-01845" },
      { label: "UNESCO World Heritage Centre — Harar, the walled town", url: "https://whc.unesco.org/en/activities/158/" },
    ],
  },
  {
    slug: "ethiopian-festivals-travel-guide",
    title: "Ethiopian Festivals: When to Go, Where to Be, and How to Attend",
    description: "Plan travel around Timkat, Meskel, Genna, Irreecha, Shuwalid, Fichee-Chambalaalla, and Gifaataa with dates, places, and respectful advice.",
    category: "Culture",
    location: "Ethiopia",
    image: "/images/pexels-christian-alemu-127251395-31047251.jpg",
    imageAlt: "Traditional round buildings surrounded by green landscape in Ethiopia",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    readingMinutes: 11,
    intro: "A festival can become the most memorable part of an Ethiopia journey—or the moment a poorly planned itinerary falls apart. Dates may follow religious, lunar, or community calendars; accommodation fills; streets close; and ceremonies belong first to the people who observe them. This guide helps you choose a celebration for its meaning, not merely its photographs.",
    sections: [
      {
        heading: "First, understand that Ethiopia does not have one festival calendar",
        paragraphs: [
          "Ethiopia's communities follow several religious and cultural calendars. Some national observances recur on familiar Gregorian dates, while others are announced annually or move in relation to Ramadan, local calendars, or community decisions. Even celebrations with a standard date may fall one day later in particular leap-year cycles.",
          "Confirm the exact year, location, and sequence before buying flights. The eve can be as important as the main day: processions may begin before sunset, vigils continue overnight, and the most significant ritual may occur early the following morning.",
          "A festival is not simply an event listing. Timkat and Meskel are acts of Orthodox Christian faith; Irreecha is Oromo thanksgiving; Shuwalid belongs to Harari religious and cultural life; Fichee-Chambalaalla and Gifaataa carry distinct New Year traditions. Attend as a guest, not as the owner of the experience.",
        ],
        bullets: [
          "Verify dates with official tourism and community sources",
          "Book the night before and after the central ceremony",
          "Ask what is worship, what is public, and what may be photographed",
        ],
      },
      {
        heading: "Timkat: Ethiopian Epiphany and the journey of the tabots",
        paragraphs: [
          "Timkat commemorates the baptism of Jesus Christ and is one of the most visible celebrations of the Ethiopian Orthodox Tewahedo Church. UNESCO inscribed Ethiopian Epiphany on the Representative List of the Intangible Cultural Heritage of Humanity in 2019.",
          "The observance begins with Ketera on the eve, when tabots—sacred representations associated with the Ark of the Covenant—are carried from churches in processions to a place of water and remain there overnight. The next morning includes prayer and the blessing of water before the tabots return to their churches.",
          "Timkat is widely associated with January 19, with a one-day calendar shift in certain years. Gondar is famous for large gatherings around Fasilides' Bath; Addis Ababa, Lalibela, Bahir Dar, and many other communities hold their own observances. Bigger is not necessarily better. A local celebration may offer more context and less pressure on residents and infrastructure.",
        ],
        bullets: [
          "Arrive before Ketera rather than on the main morning",
          "Never touch, obstruct, or photograph a covered tabot intrusively",
          "Dress for worship and expect long periods of standing",
        ],
      },
      {
        heading: "Meskel: fire, procession, and the Finding of the True Cross",
        paragraphs: [
          "Meskel commemorates the Finding of the True Cross and was inscribed by UNESCO in 2013. The celebration centers on the Demera, a tall bonfire structure prepared and lit as part of the religious observance, accompanied by processions, prayer, song, and community gathering.",
          "Official tourism information places the Demera observance in late September, with major public ceremonies in Addis Ababa's Meskel Square and celebrations across the country. The eve and feast-day naming can be confusing across sources, so confirm the local schedule rather than arriving on the basis of one date copied from a blog.",
          "Addis offers scale and a formal public program. Aksum, Gondar, Lalibela, and smaller communities offer different relationships between church, neighborhood, and landscape. Choose based on the rest of your route and current access—not on a claim that one place is the only authentic location.",
        ],
      },
      {
        heading: "Genna in Lalibela: Christmas in a living pilgrimage town",
        paragraphs: [
          "Ethiopian Christmas, commonly called Genna or Gena, is observed in early January; official Ethiopian tourism pages commonly list January 7. In Lalibela, the feast draws pilgrims to the rock-hewn churches for worship that may extend through the night.",
          "The setting is extraordinary, but the churches are not a stage. Expect crowded paths, restricted spaces, incense, chanting, long services, and worshippers who have traveled for religious reasons. Follow church and guide instructions immediately, even when that means giving up a photograph or viewpoint.",
          "Reserve accommodation, airport transfer, and a qualified local guide well ahead. Keep the itinerary simple: festival travel already involves disrupted schedules and limited capacity. Add buffer nights instead of connecting directly to an international departure.",
        ],
        bullets: [
          "Wear modest clothing and carry socks for shoe-free areas",
          "Use no flash and ask before photographing people",
          "Do not block church doors, processions, or prayer spaces",
        ],
      },
      {
        heading: "Irreecha: Oromo thanksgiving at the start of Birraa",
        paragraphs: [
          "Irreecha is the thanksgiving celebration of the Oromo people, marking the beginning of Birraa after the rainy season. Participants give thanks to Waaqa and carry fresh grass and flowers to water, where ritual gestures express renewal, gratitude, and hope for abundance.",
          "Major gatherings take place at Hora Finfinne in Addis Ababa and Hora Harsadi in Bishoftu, with celebrations elsewhere in Oromia. Dates are announced for each year; the official Visit Ethiopia listing should be checked rather than assuming the first weekend of a particular month will always apply.",
          "Irreecha is not best understood as a costume parade. Learn the meaning of the green grass, water, blessings, songs, and community gathering. Follow crowd-management directions and arrange transport early, since large movements of people can reshape road access across the day.",
        ],
      },
      {
        heading: "Shuwalid in Harar: a three-day Harari tradition",
        paragraphs: [
          "Shuwalid is an annual three-day festival of the Harari people, inscribed by UNESCO in 2023. It marks the end of six days of fasting observed to compensate for omissions during Ramadan. The celebration takes place at shrines near the main gates of Harar Jugol and includes supplication, spiritual song, scripture, music, dance, and blessings.",
          "Because its timing is connected to the Islamic calendar, Shuwalid moves through the Gregorian year. Confirm the date locally before building an itinerary. Travel with someone who can explain the sequence and appropriate visitor behavior at the shrines.",
          "Harar is a living city, not a festival set. Stay long enough to understand the walled city's neighborhoods, markets, food, craft traditions, and religious diversity beyond the three-day event.",
        ],
      },
      {
        heading: "Fichee-Chambalaalla and Gifaataa: distinct New Year traditions",
        paragraphs: [
          "Fichee-Chambalaalla is the New Year festival of the Sidama people and has been on UNESCO's Representative List since 2015. Its date is determined and announced according to Sidama tradition. UNESCO describes a celebration centered on family, neighborhood greetings, buurisame, song, dance, advice from clan leaders, and the transmission of knowledge between generations.",
          "Gifaataa is the New Year festival of the Wolaita people, inscribed by UNESCO in 2025. It is celebrated between mid-September and early October and emphasizes returning home, cleaning surroundings, resolving disputes, receiving elders' blessings, sharing food and drink, singing, dancing, and community gathering.",
          "These festivals should not be folded into a generic idea of an 'Ethiopian New Year.' Each belongs to a particular community, history, and system of knowledge. Arrange visits through people who have a legitimate relationship with the celebration, and ask how visitor spending benefits local hosts and cultural practitioners.",
        ],
      },
      {
        heading: "How to attend without becoming the problem",
        paragraphs: [
          "Dress more conservatively than you would for an ordinary sightseeing day. Keep camera equipment compact, silence devices, and ask before photographing people at close range. Permission from a guide does not replace permission from the person in front of the lens.",
          "Do not push through a procession, climb sacred or fragile structures, direct worshippers for a better composition, or fly a drone without explicit legal and community permission. If officials close an area or clergy ask visitors to move, respond immediately and calmly.",
          "Buy locally, pay agreed guide fees fairly, and avoid handing out gifts or money in ways that create pressure around children or worshippers. The goal is not to leave with the most dramatic image; it is to understand something while causing as little disruption as possible.",
        ],
        bullets: [
          "Ask before photographing; accept no without negotiation",
          "Keep exits, paths, water, and worship spaces clear",
          "Choose local guides who can explain meaning and etiquette",
          "Stay beyond the ceremony so the destination benefits from the visit",
        ],
      },
      {
        heading: "Build the trip around the place, not only the festival",
        paragraphs: [
          "For Timkat, combine the celebration with a deeper Gondar, Lalibela, Addis Ababa, or Bahir Dar itinerary. For Meskel, connect Addis with its museums and neighborhoods, or choose a northern historical route. Pair Irreecha at Bishoftu with time around the lakes and Oromo cultural context. Give Harar several days around Shuwalid rather than arriving only for the central ceremony.",
          "Book flexible transport, confirm accommodations directly, and expect higher demand around well-known dates. Keep a backup plan for weather, crowd limits, road changes, or altered access. Recheck official travel advice for every region shortly before departure.",
          "A festival should deepen a journey, not consume it. The most responsible itinerary gives the celebration breathing room and lets the destination remain more than the background to a single crowded day.",
        ],
      },
    ],
    relatedTourQuery: "Cultural",
    sources: [
      { label: "UNESCO — Ethiopian Epiphany (Timkat) heritage documentation", url: "https://ich.unesco.org/en/RL/ethiopian-epiphany-01491" },
      { label: "UNESCO — Commemoration feast of the Finding of the True Cross", url: "https://ich.unesco.org/en/RL/commemoration-feast-of-the-finding-of-the-true-holy-cross-of-christ-00858" },
      { label: "Visit Ethiopia — official Irreecha information", url: "https://visitethiopia.et/event/irreecha" },
      { label: "UNESCO — Shuwalid festival", url: "https://ich.unesco.org/en/RL/shuwalid-festival-01845" },
      { label: "UNESCO — Fichee-Chambalaalla", url: "https://ich.unesco.org/en/RL/fichee-chambalaalla-new-year-festival-of-the-sidama-people-01054" },
      { label: "UNESCO — Gifaataa, Wolaita people New Year festival", url: "https://ich.unesco.org/en/RL/gifaataa-wolaita-people-new-year-festival-02315" },
      { label: "Visit Ethiopia — Lalibela visitor and festival information", url: "https://visitethiopia.travel/destinations/lalibela-2/" },
    ],
  },
  {
    slug: "best-things-to-do-addis-ababa",
    title: "Best Things to Do in Addis Ababa: A Guide That Respects Your Time",
    description: "Explore Addis Ababa without wasting the day in traffic: museums, Entoto, Unity Park, Merkato, coffee, food, and practical route plans.",
    category: "City guides",
    location: "Addis Ababa",
    image: "/images/pexels-fanuel-33019023.jpg",
    imageAlt: "A busy modern avenue in Addis Ababa after rain",
    publishedAt: "2026-10-01",
    updatedAt: "2026-10-01",
    readingMinutes: 10,
    intro: "Addis Ababa is often treated as a place to sleep between flights. That misses the city entirely. Ethiopia's capital rewards travelers who stop trying to collect attractions and instead spend time with its history, highland setting, food, coffee, faith, art, and everyday street life. The key is to group each day geographically and leave space for traffic and conversation.",
    sections: [
      {
        heading: "Start with one rule: do not zigzag across the city",
        paragraphs: [
          "Addis is large, busy, and high in the mountains. A short distance on the map can take much longer than expected, particularly around commuting hours, road works, rain, or major events. Choose one area for the morning and a nearby area for the afternoon rather than crossing the city after every stop.",
          "Opening days, ticket rules, security checks, and access to public institutions can change. Confirm the places that matter most on the morning of your visit. A local guide or driver is most valuable when they improve the route and explain the city—not simply when they stand beside you at every stop.",
        ],
        bullets: [
          "Group Arat Kilo museums and Unity Park together",
          "Pair Entoto with Shiro Meda or northern Addis",
          "Keep Merkato as a focused guided visit",
          "Allow extra time before flights and evening reservations",
        ],
      },
      {
        heading: "For deep history: National Museum and the Arat Kilo area",
        paragraphs: [
          "The National Museum of Ethiopia is the natural starting point for visitors interested in archaeology and the long human story associated with Ethiopia. The official Addis Ababa Tourism Commission highlights the museum as the home of the famous Lucy fossil, alongside historical objects and art.",
          "Do not reduce the museum to one display. Give the collections time and, if possible, visit with someone who can connect prehistoric material to Ethiopia's later artistic and political history. Nearby institutions and monuments make Arat Kilo a sensible base for a history-focused half day.",
          "Check current opening information before leaving your accommodation. Museum galleries can close, move, or undergo renovation, and an old travel blog is not a reliable ticket desk.",
        ],
      },
      {
        heading: "For a broad introduction: Unity Park",
        paragraphs: [
          "Unity Park sits within the National Grand Palace compound and combines restored historical buildings, exhibitions, gardens, and wildlife areas. It is useful for first-time visitors who want a single place that introduces several chapters of Ethiopian history and regional diversity.",
          "This is not a quick roadside stop. Security, ticketing, and the size of the grounds require time. The official Visit Addis Ababa page notes that multiple ticket packages may cover different experiences, including palace or photography access, so check the current options before arriving.",
          "Pair Unity Park with the Arat Kilo area rather than with Entoto or the airport side of the city. If you dislike moving rapidly through exhibits, choose either Unity Park or two museums for the day instead of attempting all of them.",
        ],
      },
      {
        heading: "For views and breathing room: Entoto",
        paragraphs: [
          "The Entoto hills reveal the scale and altitude of Addis in a way the center cannot. The official tourism authorities recommend Mount Entoto and Entoto Natural Park for views, green space, and recreation. Clear mornings generally offer the best chance of wider views, but conditions change quickly.",
          "Entoto is higher and cooler than central Addis. Take a warm layer, rain protection in season, water, and shoes suitable for uneven paths. Walk at a comfortable pace if you have only just arrived at altitude.",
          "The northern route can be combined with Shiro Meda, where travelers shop for woven clothing, textiles, and crafts. Ask before photographing vendors, compare quality rather than only price, and leave enough time to make purchases without turning the market into a rushed photo stop.",
        ],
        bullets: [
          "Go earlier for clearer air and a calmer schedule",
          "Carry a layer even when central Addis feels warm",
          "Do not schedule Entoto immediately before an airport transfer",
        ],
      },
      {
        heading: "For the city's commercial energy: visit Merkato with a purpose",
        paragraphs: [
          "Merkato is frequently described as an essential Addis experience, but 'walk around the market' is not a useful plan. The district is vast, crowded, specialized by product, and constantly moving. Decide what you want to understand or buy—coffee, spices, household goods, textiles, or another trade—and structure the visit around that purpose.",
          "For a first visit, go with a trusted local guide who knows the working market and can navigate without obstructing traders. Carry minimal valuables, keep your phone secure, and ask permission before photographing people or stalls. The value of Merkato is observing a living commercial system, not collecting intrusive close-ups.",
          "If dense crowds or uneven walking are not suitable for you, choose a smaller market, craft center, or neighborhood shopping street. Skipping Merkato does not make your Addis visit incomplete.",
        ],
      },
      {
        heading: "For context beyond monuments: coffee, food, and conversation",
        paragraphs: [
          "Coffee in Addis should not be treated as a caffeine break between attractions. A traditional coffee experience can show the sequence of roasting, grinding, brewing, serving, and conversation. Ask what you are being shown rather than assuming every café service is a full household ceremony.",
          "Make time for an Ethiopian meal without ordering every famous dish at once. Ask about the day's fasting and non-fasting options, spice levels, and regional specialties. Shared platters are common, and eating with injera is part of the experience; follow your host or server if you are unsure.",
          "The Addis Ababa Tourism Commission identifies food and coffee culture as central parts of the city's visitor experience. Choose places for the quality of their cooking and explanation, not only for staged entertainment.",
        ],
      },
      {
        heading: "For modern Addis: parks, public spaces, art, and jazz",
        paragraphs: [
          "Friendship Park, the Science Museum, the Adwa Victory Memorial, galleries, and performance spaces show a capital that is still actively reshaping how it tells its story. These places complement the older museums; they do not merely fill leftover time.",
          "Exhibitions and events change, so look for a current program rather than expecting the same experience described months ago. If live music matters to you, ask a trusted local source what is actually scheduled that evening and arrange reliable transport both ways.",
          "One contemporary space plus an unhurried dinner often creates a better evening than racing through several parks. Addis makes more sense when the historic and modern city are seen together.",
        ],
      },
      {
        heading: "Three routes that work",
        paragraphs: [
          "With half a day, choose either the National Museum and nearby historical sites, or Entoto and Shiro Meda. Add coffee close to the route rather than crossing town for a particular brand name.",
          "With one full day, begin around Arat Kilo with the National Museum, continue to Unity Park after confirming access, and finish with an Ethiopian dinner or a current cultural performance. This keeps the day relatively concentrated.",
          "With two days, use the first for central history and food. Use the second for Entoto in the morning, Shiro Meda or another northern stop, then a contemporary museum, gallery, park, or music venue selected from the current schedule.",
        ],
        bullets: [
          "Half day: one museum cluster or Entoto—not both",
          "One day: central history, Unity Park, and dinner",
          "Two days: add Entoto, a market, and contemporary culture",
        ],
      },
      {
        heading: "Practical notes for a better day",
        paragraphs: [
          "Addis sits at high elevation. Hydrate, use sun protection, and keep the first day lighter if you have arrived from near sea level. Afternoon rain can be heavy in the wetter season, while evenings can feel cool throughout the year.",
          "Use transport recommended by your accommodation or a trusted provider, and agree on the pickup point before leaving a busy attraction. Avoid carrying your passport around unless it is specifically required; secure the original and keep an accessible copy according to your travel circumstances.",
          "Finally, verify official travel advice and local conditions before moving around the city. Good city travel is not about fear or bravado. It is about current information, a sensible route, and enough flexibility to change the plan.",
        ],
      },
    ],
    relatedTourQuery: "Addis Ababa",
    sources: [
      { label: "Addis Ababa Tourism Commission — official city tourism authority", url: "https://aatc.gov.et/" },
      { label: "Visit Addis Ababa — official things to do guide", url: "https://visitaddisababa.et/things-to-do" },
      { label: "Visit Addis Ababa — Unity Park visitor information", url: "https://visitaddisababa.et/things-to-do/unity-park" },
      { label: "Visit Ethiopia — official suggested Addis Ababa tours", url: "https://visitethiopia.et/themes/mytravel/ass/AU%202026%20English%20Brochure.pdf" },
    ],
  },
  {
    slug: "ethiopia-travel-requirements",
    title: "Ethiopia Travel Requirements 2026: Visa, Health & Entry Checklist",
    description: "Check Ethiopia visa, passport, yellow fever, health, insurance, money, and arrival requirements with links to official sources.",
    category: "Travel requirements",
    location: "Ethiopia",
    image: "/images/pexels-carmen-soler-759248458-28535157.jpg",
    imageAlt: "Traveler preparing for a journey to Ethiopia",
    publishedAt: "2026-09-30",
    updatedAt: "2026-09-30",
    readingMinutes: 9,
    intro: "The hardest part of preparing for Ethiopia is not finding another packing list. It is knowing which rules apply to your passport, your flight route, and the exact regions on your itinerary. This checklist starts with the decisions that can stop a trip at the airport, then covers the practical preparation that makes the first days easier.",
    sections: [
      {
        heading: "The 10-minute check: do these first",
        paragraphs: [
          "Open your passport and check its expiry date against your planned arrival date. Ethiopia's official e-Visa information says travelers need at least six months of passport validity from the intended entry date. Make sure the passport details you enter in an application match the document exactly.",
          "Next, check visa eligibility and apply only through Ethiopia's official e-Visa website or the Ethiopian embassy responsible for your country. Rules differ by nationality and purpose of travel. Do not assume advice written for another passport applies to yours, and do not use a tourist visa for work, study, journalism, or volunteering without confirming the correct category.",
        ],
        bullets: [
          "Passport valid for at least six months from intended entry",
          "Correct visa for your nationality and purpose",
          "Name, passport number, and dates checked character by character",
          "Downloaded and printed copies of approvals and bookings",
        ],
      },
      {
        heading: "Use the real Ethiopian e-Visa website",
        paragraphs: [
          "Visa lookalike websites can charge extra fees, collect sensitive information, or create confusion about whether an application is genuine. The official portal is evisa.gov.et. Type the address yourself or follow a link from an Ethiopian government or embassy page.",
          "Before submitting, check the intended entry date, visa validity, permitted number of entries, and the port of entry listed in the current instructions. Save the application reference and payment confirmation. Carry the approved document offline because airport Wi-Fi or mobile data should never be your only way to retrieve it.",
          "Visa rules can change faster than articles can be updated. Treat this page as a preparation framework, not as permission to board. The official portal and your airline make the final document check relevant to your journey.",
        ],
        bullets: [
          "Official portal: evisa.gov.et",
          "Avoid sponsored lookalike domains",
          "Carry both digital and paper copies",
        ],
      },
      {
        heading: "Yellow fever: your route matters",
        paragraphs: [
          "A yellow-fever certificate may be required when you arrive from a country with yellow-fever transmission risk. The CDC also notes that a long airport transit in a risk country can affect the entry requirement. That means two travelers landing on the same flight may need different documents because their earlier routes were different.",
          "Check every country on your itinerary, including long layovers and onward destinations. A country you visit after Ethiopia may also ask for proof of vaccination because you have been in Ethiopia. If vaccination is unsuitable for medical reasons, ask a qualified clinician and the relevant authorities what documentation is accepted before travel.",
        ],
        bullets: [
          "Review origin, connections, and onward destinations",
          "Carry the original certificate when required",
          "Do not rely on a screenshot of an old country list",
        ],
      },
      {
        heading: "Book a travel-health appointment around your route",
        paragraphs: [
          "Health planning is itinerary-specific. The CDC recommends travelers review routine vaccines and discusses hepatitis A, typhoid, polio, rabies, meningococcal disease, yellow fever, and other risks for Ethiopia. It also recommends prescription malaria prevention for certain areas, with advice varying by elevation and destination.",
          "Take your actual itinerary to a travel-health professional ideally at least a month before departure. Addis Ababa, a highland trek, the Omo Valley, and the Danakil Depression do not create the same exposure or physical demands. A clinician can consider your medical history, trip length, accommodation, season, and access to care.",
          "Pack enough prescribed medicine for the full trip plus reasonable delay time. Keep medication in original packaging and carry a copy of the prescription where appropriate. Confirm with an Ethiopian embassy if a controlled medicine needs special permission.",
        ],
        bullets: [
          "Share every overnight stop and activity with the clinician",
          "Discuss altitude, malaria, food and water, and animal exposure",
          "Ask when each vaccine or medicine must be started",
        ],
      },
      {
        heading: "Read travel advice region by region—not country by country",
        paragraphs: [
          "Security and access conditions can differ sharply between Ethiopian regions and can change. Read your government's current travel advice for every destination and every road or airport used to reach it. A general impression that one city is calm does not tell you whether a remote route is appropriate.",
          "Re-check advice when booking, one week before departure, and again before a regional journey. Ask your local provider what has changed, but also consult official advice independently. Keep alternative days or routes in the itinerary instead of forcing a plan when conditions shift.",
        ],
        bullets: [
          "Check each region and transit route separately",
          "Avoid unnecessary night driving",
          "Share the itinerary with someone at home",
          "Save embassy, insurer, and provider contacts offline",
        ],
      },
      {
        heading: "Buy insurance for the trip you are actually taking",
        paragraphs: [
          "A basic policy may exclude trekking above a stated elevation, remote expeditions, missed domestic connections, or evacuation from areas under a travel warning. Read the exclusions rather than relying on the product name.",
          "Confirm medical treatment, emergency evacuation, trip interruption, baggage, and the activities you plan to do. If you are trekking or visiting a remote area, ask the insurer in writing whether that specific activity and region are covered. Store the policy number and assistance phone number offline.",
        ],
      },
      {
        heading: "Money, connectivity, and documents on arrival",
        paragraphs: [
          "Bring more than one payment method and arrange a modest cash backup without carrying all your money together. Card acceptance and ATM reliability vary, particularly outside major urban areas. Ask your provider which trip costs, entrance fees, tips, or local purchases require cash.",
          "Do not build the first day around having immediate mobile data. Save your accommodation address, airport transfer contact, visa, insurance, tickets, and itinerary offline. If you plan to obtain a local SIM or eSIM, verify current registration and compatibility requirements shortly before departure rather than relying on an old forum post.",
        ],
        bullets: [
          "Two payment methods stored separately",
          "Offline copies of all essential documents",
          "Accommodation name, address, and phone number",
          "A reachable pickup contact for the arrival window",
        ],
      },
      {
        heading: "Your final 48-hour check",
        paragraphs: [
          "Reconfirm the international flight, the first night's accommodation, and the airport pickup. Check the latest official entry information and travel advice, then verify any domestic flight or regional transfer directly with the operator. Download everything again after the final confirmation.",
          "Put the passport, visa approval, any required vaccination certificate, insurance details, first-night address, and return or onward itinerary in one accessible travel wallet. Keep copies separate from the originals. This is the unglamorous preparation that prevents avoidable problems at check-in and on arrival.",
        ],
      },
    ],
    relatedTourQuery: "Ethiopia",
    sources: [
      { label: "Ethiopian Immigration and Citizenship Service — official e-Visa information", url: "https://www.evisa.gov.et/information" },
      { label: "CDC — Ethiopia Traveler View", url: "https://wwwnc.cdc.gov/travel/destinations/traveler/none/ethiopia" },
      { label: "UK Government — Ethiopia entry requirements", url: "https://www.gov.uk/foreign-travel-advice/ethiopia/entry-requirements" },
      { label: "US Department of State — Ethiopia country information", url: "https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/Ethiopia.html" },
    ],
  },
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
