# Tankua Website Design Research

## Executive recommendation

Tankua should not imitate a global marketplace visually. It should adopt the interaction architecture that the best travel platforms have converged on, while retaining the original warm, Ethiopian visual identity.

The recommended model is a destination-led marketplace with four priorities:

1. Make search and discovery the primary homepage task.
2. Help travelers judge a trip before opening its detail page.
3. Make trust, logistics, and total cost visible early.
4. Maintain one understandable journey across web, Telegram, and mobile.

The strongest benchmark is not one company. Tankua should combine Airbnb's inspirational category discovery, GetYourGuide's experience merchandising, Booking.com's search clarity, Klook's broad category navigation, and the local specificity of Ethiopia's official tourism catalogue.

## Research scope

The review covered leading global experience marketplaces, broader travel-booking platforms, research-based travel UX guidance, Ethiopia-specific travel discovery, and the existing Tankua mobile and Telegram Mini App flows.

Platforms reviewed:

- Airbnb Experiences
- GetYourGuide
- Booking.com Attractions
- Klook
- Tripadvisor Ethiopia
- Visit Ethiopia
- Tankua mobile app
- Tankua Telegram Mini App

Independent UX evidence was taken primarily from Baymard Institute's travel and ecommerce usability research.

## Competitive benchmark

| Product | Strongest pattern | Relevance to Tankua | Pattern to avoid |
|---|---|---|---|
| Airbnb Experiences | Search structured around destination, date, and guests; visual category discovery | Supports both intentional search and inspiration | Over-minimal cards when local logistics require more explanation |
| GetYourGuide | Dense, decision-ready experience cards and strong confidence messaging | Useful for rating, duration, pickup, availability, and cancellation information | Large catalogue density before Tankua has enough inventory |
| Booking.com Attractions | Search is immediately understandable; recommendations follow the search action | Good model for first-time and international visitors | Visually generic blue marketplace styling |
| Klook | Clear taxonomy spanning activities, tours, transport, and local experiences | Useful as Tankua expands beyond tours | Too many product categories before supply exists |
| Tripadvisor | Review volume, ranking, traveler photos, and “ways to experience” | Strong trust and destination validation model | Allowing editorial/review density to obscure the booking path |
| Visit Ethiopia | Authoritative local destination content, maps, regions, access, and “what to see” information | Essential content depth and Ethiopian specificity | Weak conversion hierarchy and inconsistent inventory quality |

## Evidence and implications

### Search should be the homepage's primary action

Airbnb asks for destination, date, and guests at the top of its Experiences surface. Booking.com Attractions similarly begins with destination and dates. Baymard reports that travel booking search must be treated as the homepage's primary content, not a secondary utility.

Implication: Tankua should preserve its existing hero photography and copy, but place a prominent destination-and-experience search directly beneath the value proposition. This is a functional enhancement, not a new visual identity.

### Discovery needs categories as well as text search

Airbnb introduced categories specifically to help people discover places they could not name in advance. Klook organizes its catalogue around recognizable activity types, while GetYourGuide exposes popular destinations, attractions, and experience types.

Implication: Tankua's existing category cards are valuable, but they must be links that open filtered results. Categories should reflect actual Ethiopian inventory—historical, religious, cultural, nature, wildlife, city, and adventure—rather than decorative marketing tiles.

### Cards must answer practical questions

GetYourGuide cards commonly surface activity type, duration, service attributes, rating volume, and starting price. Booking.com uses rankings and review evidence. Airbnb's own experience-listing guidance says travelers want to know whether the activity interests them, why it is distinctive, what they will do, and whether logistics and cost work.

Implication: Tankua cards should progressively include:

- Destination and region
- Experience or trip type
- Duration
- Next available date
- Pickup availability
- Provider verification
- Rating and review count
- Starting price and pricing unit
- Cancellation or flexibility label where applicable

Avoid invented ratings, random review counts, and generic inclusions. Missing information should be omitted or clearly labeled.

### Filters are decision tools, not decoration

Baymard's travel research highlights price, rating, and industry-specific filters. It also finds that prominent filters help people narrow large result sets and that applied filters need a visible overview.

Implication: the tours page should evolve toward filters for region, category, date, duration, price, rating, trip type, and pickup. On mobile these should open in a focused sheet; active filters should remain visible as removable chips.

### Trust belongs beside the decision

GetYourGuide places confidence, trusted reviews, flexibility, and support near the product journey. Booking.com similarly foregrounds flexible cancellation and 24/7 support. Airbnb states that Experiences are vetted using experience, education, certifications, awards, portfolios, and feedback.

Implication: Tankua should show verified-provider status, cancellation terms, payment protection, availability, and support context close to price and booking controls—not in a distant “Why Tankua” section only.

### Ethiopia requires richer destination context

Visit Ethiopia's destination pages include what to see, access, local transport, accommodation, events, and practical context. Tripadvisor's Ethiopia pages show that destination demand is often attraction-led, with Lalibela, the Simien Mountains, and Danakil prominent.

Implication: Tankua should distinguish destination pages from bookable trip pages. A destination is inspirational and informational; a trip is dated, priced, capacity-limited, provider-operated inventory. One destination can lead to several comparable trips.

## Recommended information architecture

### Public discovery

- Home
- Destinations
- Tours and departures
- Destination detail
- Trip detail
- Provider profile
- Guides and travel information
- Help and safety

### Traveler account

- Saved destinations
- Trips
- Booking detail
- Digital ticket
- Notifications
- Profile and traveler details
- Rewards, coupons, and referrals

### Booking sequence

1. Choose destination or trip.
2. Compare available departures and providers.
3. Select pickup station.
4. Choose seats.
5. Enter passenger details.
6. Review the complete price.
7. Pay through a server-verified checkout.
8. Receive confirmation and a digital ticket.

This sequence already exists in the Telegram Mini App and should become the shared behavioral model across platforms.

## Visual direction

### Preserve

- Warm cream, earth-brown, and Tankua gold palette
- Large Ethiopian destination photography
- Friendly rounded geometry
- Natural, optimistic tone
- Existing logo and recognizable brand assets

### Refine

- Use fewer equally weighted sections on the homepage.
- Make the search control the strongest element after the headline.
- Reduce repetitive badges and generic feature cards.
- Increase typographic contrast between destination storytelling and transactional details.
- Use gold for primary actions and verified/trust highlights, not for every decorative element.
- Keep card surfaces quiet so photography, titles, dates, and prices dominate.

### Avoid

- A generic dark luxury-travel aesthetic
- Copying Airbnb's white minimalism or Booking.com's blue palette
- Unsupported market-leadership claims
- Fake activity counts, random ratings, or placeholder testimonials
- Multiple competing primary calls to action
- Marketing “Book” buttons that only redirect to an app-download page

## Delivery roadmap

### Phase 1 — Discovery foundation

- Add functional homepage search.
- Make category cards open filtered catalogue views.
- Preserve the current visual identity.
- Use live Supabase inventory with honest empty and loading states.

### Phase 2 — Catalogue and detail quality

- Separate destinations from scheduled trips.
- Add promoted filters and applied-filter chips.
- Replace fallback and invented values with explicit data-quality states.
- Add galleries, itinerary, inclusions, exclusions, pickup, provider, cancellation, and safety information.

### Phase 3 — Web booking parity

- Implement real traveler authentication.
- Reuse the TMA's trip, pickup, seats, passenger, checkout, confirmation, and ticket model.
- Make saved destinations, trips, and profile state consistent across devices.

### Phase 4 — SEO and content

- Server-render destination and trip detail content.
- Add unique titles and descriptions, canonical URLs, structured data, sitemap coverage, and social images.
- Build useful regional and activity landing pages based on real inventory.
- Publish authoritative practical travel content with clear ownership and update dates.

## Sources

1. Airbnb. [Experiences](https://www.airbnb.com/experiences).
2. Airbnb. [A new Airbnb for a new world of travel](https://news.airbnb.com/en-au/a-new-airbnb-for-a-new-world-of-travel-launching-the-biggest-change-to-the-platform-in-a-decade).
3. Airbnb. [Best practices for creating an Experiences listing](https://www.airbnb.com/e/experiences-best-practices).
4. GetYourGuide. [Book things to do, attractions, and tours](https://www.getyourguide.com/).
5. Booking.com. [Attractions, activities, and experiences](https://www.booking.com/attractions).
6. Klook. [Travel activities and experiences](https://www.klook.com/).
7. Tripadvisor. [Things to do in Ethiopia](https://www.tripadvisor.com/Attractions-g293790-Activities-Ethiopia.html).
8. Visit Ethiopia. [Destination catalogue](https://visitethiopia.et/space).
9. Visit Ethiopia. [The Simien Mountains National Park](https://www.visitethiopia.et/space/the-semien-mountains-national-park).
10. Visit Ethiopia. [Lalibela](https://www.visitethiopia.et/space/lalibela-1).
11. Baymard Institute. [Travel site UX: 5 best practices](https://baymard.com/blog/travel-site-ux-best-practices).
12. Baymard Institute. [Travel tour booking website UX audit insights](https://baymard.com/audits/travel-tours-experience-booking).
13. Baymard Institute. [Make booking search the primary homepage content](https://baymard.com/blog/travel-accommodations-booking-search).
14. Baymard Institute. [Consider promoting important filters](https://baymard.com/blog/promoting-product-filters).
15. Baymard Institute. [Display applied filters in an overview](https://baymard.com/blog/how-to-design-applied-filters).
