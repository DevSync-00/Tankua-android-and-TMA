# Telegram Mini App preview media

This local-only tool uploads ordered screenshots to the main Mini App profile for `@tankua_tma_bot`.

Create `telegram-mini-app/preview-media` and add screenshots using numbered filenames:

1. `01-home.png`
2. `02-destinations.png`
3. `03-tour-details.png`
4. `04-booking.png`
5. `05-confirmation.png`

The directory is ignored by Git. JPG, PNG, and WebP files are accepted. Filename order controls upload order.

Keep `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` in `.env.telegram.local`. Never commit the API hash or `.telegram-preview.session`; the latter represents access to the signed-in Telegram account.

Validate the files, then upload:

```powershell
npm.cmd run telegram:previews:check
npm.cmd run telegram:previews
```

The first upload asks for the account phone number, login code, and optional two-step verification password. Later runs reuse the ignored local session. The command appends previews, so review existing previews before running it again to avoid duplicates.
