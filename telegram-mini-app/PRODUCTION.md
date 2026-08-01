# Tankua Telegram Mini App production runbook

## Security model

- Telegram identity is accepted only through signed `Telegram.WebApp.initData`.
- The Worker validates the Telegram HMAC and rejects launch data older than five minutes.
- The browser receives an HttpOnly, Secure, SameSite session cookie signed with `SESSION_SECRET`.
- Supabase's service-role key, the Telegram bot token, and the Chapa key exist only in the Worker environment.
- Booking totals, pickup eligibility, departure state, and seat inventory are validated in PostgreSQL.
- Booking creation is idempotent and locks the selected trip row.
- Chapa results are trusted only after server-to-server verification and amount matching.

## Required deployment sequence

1. Back up the production Supabase database.
2. Review and apply `database/46_telegram_mini_app_production.sql`.
3. Confirm the new `users.telegram_id` unique index and `create_miniapp_booking` function exist.
4. Configure every key in `.env.production.example` in the Sites production environment.
5. Generate `SESSION_SECRET` with at least 32 cryptographically random bytes.
6. Build and run the test suite.
7. Deploy the saved version.
8. Launch only through the bot configured with the matching `TELEGRAM_BOT_TOKEN`.
9. Complete a low-value real Chapa transaction and confirm both `payment_transactions` and `bookings` are updated.

## Operational checks

- Watch Worker logs for request IDs and authentication failures.
- Alert on repeated `telegram_auth_events` failures from the same `ip_hash`.
- Run `cancel_expired_bookings()` every five minutes.
- Reconcile successful Chapa transactions against paid bookings daily.
- Rotate the bot token, service-role key, Chapa key, and session secret after any suspected exposure.

## Required environment variables

| Key | Purpose |
| --- | --- |
| `SUPABASE_URL` | Production Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only database access |
| `TELEGRAM_BOT_TOKEN` | HMAC verification of Mini App launch data |
| `SESSION_SECRET` | Signing Tankua session cookies |
| `CHAPA_SECRET_KEY` | Server-only payment initialization and verification |
| `APP_ORIGIN` | Exact public Mini App origin |

The Supabase `telegram-auth` Edge Function additionally requires two separate
secrets because the native login and Mini App use different Telegram bots:

- `TELEGRAM_LOGIN_BOT_TOKEN` validates mobile Login Widget payloads.
- `TELEGRAM_MINI_APP_BOT_TOKEN` validates Mini App `initData` payloads.

The TMA Worker also submits its already verified Telegram user under a
service-role-authenticated request. This is the resilient production path and
avoids requiring the same Mini App bot token in both Vercel and Supabase. The
Edge Function still validates direct Mini App requests with
`TELEGRAM_MINI_APP_BOT_TOKEN` when no trusted Worker assertion is present.

Deploy the Edge Function with both secrets before deploying a Worker that
forwards `initData` to it.

Do not reuse the mobile app's `EXPO_PUBLIC_CHAPA_SECRET_KEY`. A value with an
`EXPO_PUBLIC_` prefix is part of the client bundle and must be treated as exposed.
