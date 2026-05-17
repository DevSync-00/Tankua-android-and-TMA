# Church Terminology → Travel/Destination Migration

**Product:** Tankua — Ethiopian travel & destination booking  
**Status:** Implemented (May 2026)  
**Scope:** Remove all church-specific branding, APIs, routes, and schema labels. The platform is destination-centric, not church-tourism-centric.

---

## Stage 1 — Discovery & Audit (summary)

### Canonical replacement map

| Legacy | Replacement | Notes |
|--------|-------------|--------|
| `churches` table | `destinations` | Renamed in `database/15_generalize_to_all_tours.sql` |
| `church_id` | `destination_id` | On `trips`, `bookings` |
| `church_name` | `destination_name` | On `bookings` |
| `saved_churches` | `saved_destinations` | On `users` |
| Category `'church'` | `'religious'` | Sacred/heritage sites, not a separate entity type |
| `getChurches`, `createChurch`, … | `getDestinations`, `createDestination`, … | Aliases removed from app code |
| Route `/churches` | `/destinations` | Marketing site; old path redirects |
| Admin `/dashboard/churches` | `/dashboard/destinations` | Single admin surface |
| `ChurchDetail` screen | `DestinationDetail` | Mobile |
| `currentBooking.church` | `currentBooking.destination` | Booking context |
| `applicable_churches` | `applicable_destinations` | Promotions (migration 16) |
| Storage bucket `churches` | `destinations` | Prefer `destinations` bucket |

### Risk areas (addressed)

- **Supabase joins:** Queries use `destinations` only; legacy `churches` table fallback removed from active clients.
- **Bookings display:** `bookingDisplay.js` reads `destination_name` only (no `church_name` fallbacks in UI code).
- **Deep links:** `/churches/*` → redirect to `/destinations/*`.
- **Category filter:** UI uses `religious` / `sacred` aligned with `CategoryRibbon`.
- **Historical SQL files** (`database/01`–`09`): Immutable migration history for existing deployments; fresh installs run through `15` then `16`. See `database/README.md` for current schema names.

### Areas audited

- Mobile `src/` — screens, services, navigation, booking, notifications, admin stubs  
- Web admin, marketing, provider apps  
- `web/packages/database` — types, queries  
- Database migrations & seeds  
- Docs under `doc/`, `web/README.md`  
- Env vars — no church-specific keys found  

---

## Stage 2 — Architecture & naming conventions

- **Entity:** destination / destinations  
- **IDs & fields:** `destination_id`, `destination_name`, `destinationName` (camelCase in JS)  
- **Categories:** `religious`, `historical`, `nature`, `adventure`, `cultural`, `sacred`, `city`, … — never `church`  
- **Routes:** `/destinations`, `DestinationDetail`  
- **No compatibility aliases** in application code (DB migration 15 handles column renames on the server).

---

## Stage 3–5 — Implementation order

1. `database/16_remove_church_terminology.sql` — data & column cleanup on live DBs  
2. `web/packages/database` — types & queries  
3. Mobile `src/services/database.js` and booking pipeline  
4. Web apps (admin, marketing, provider)  
5. Remove deprecated files: `ChurchDetailScreen.js`, `ChurchCard.js`, admin `churches` page  
6. Marketing: `/destinations` route + redirect from `/churches`  

---

## Stage 6 — QA checklist

- [ ] Home / search / map filters by category  
- [ ] Destination detail → booking flow → payment → confirmation / ticket share  
- [ ] Trips list shows `destination_name`  
- [ ] Auth signup profile (`saved_destinations`)  
- [ ] Admin destinations CRUD  
- [ ] Marketing `/destinations` and homepage links  
- [ ] `rg -i church` on `src`, `web/apps`, `web/packages`, `database/16`, `doc/CHURCH_*` returns zero (excluding legacy migration archive note)

---

## Verification command

```bash
rg -i "church" src web/apps web/packages database/16 doc/CHURCH_TERMINOLOGY_MIGRATION.md --glob "!**/.next/**" --glob "!**/node_modules/**"
```

Legacy migration files `database/01`–`15` may still contain historical identifiers until a greenfield schema consolidation is scheduled.
