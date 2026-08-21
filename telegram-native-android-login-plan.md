# Tankua Android — Telegram Native Login SDK Integration
### Implementation Plan & Agent Prompt (Option C: Native SDK, with browser fallback)

---

## 0. Purpose

Section 2 onward is written to be pasted directly into an AI coding agent (e.g. Antigravity) as a task brief for your **Android app**. It replaces the legacy HMAC Login Widget flow with Telegram's **native Login SDK**, which:
- Deep-links straight into the installed Telegram app for a fully native consent screen (no browser).
- Returns a Telegram-signed OIDC `id_token` containing verified `phone_number` when the `phone` scope is granted.
- Falls back gracefully if Telegram isn't installed (handled by later phase, see Section 6).

---

## 1. Manual prerequisites (must be done by a human before any code)

| # | Action | Where | Output needed |
|---|--------|-------|----------------|
| 1 | Get your app's **SHA-256 signing fingerprint** | Run `./gradlew signingReport` in the Android project | e.g. `A1:B2:C3:...` |
| 2 | Get your app's **applicationId / package name** | `app/build.gradle(.kts)` | e.g. `com.tankua.app` |
| 3 | Open **@BotFather → your bot → Bot Settings → Login Widget** | Telegram | — |
| 4 | Register the **Android app** under Login Widget with the package name + SHA-256 fingerprint from steps 1–2 | Same screen | Confirms Telegram can verify your app's identity |
| 5 | Copy the issued **Client ID** | Same screen | `TELEGRAM_OIDC_CLIENT_ID` |
| 6 | Note your auto-generated **App Link domain** | Same screen | `app{CLIENT_ID}-login.tg.dev` — you do NOT register this manually, Telegram generates it |
| 7 | Confirm bot **profile photo** matches Tankua's logo and bot **name** reflects Tankua | BotFather → Edit Bot | This is what renders on the native consent screen |
| 8 | Copy the **Client Secret** (needed server-side for token exchange) | Same Login Widget screen | `TELEGRAM_OIDC_CLIENT_SECRET` |

> Note: unlike a website, there is **no separate "redirect_uri" you invent** — it's `https://app{CLIENT_ID}-login.tg.dev/tglogin`, auto-provisioned by Telegram and tied to your verified package name + fingerprint. This is what makes the callback un-spoofable by other apps.

Hand this whole document plus the values from steps 5 and 8 to your coding agent.

---

## 2. Task Brief for Coding Agent

```
CONTEXT
Tankua's Android app currently authenticates users via Telegram's legacy
Login Widget (hash/HMAC based), triggered through a WebView-hosted flow in
TelegramLoginScreen.js-equivalent code, verified server-side by
telegram-verifier.ts (Supabase Edge Function).

We are MIGRATING the Android app to Telegram's NATIVE Login SDK
(org.telegram:login-sdk), which deep-links into the installed Telegram app,
shows Telegram's native branded consent screen (including phone number
consent), and returns a signed OIDC id_token via an Android App Link.

This is ADDITIVE: do not remove the legacy verifier until the new flow is
confirmed working; gate the new flow behind a feature flag.

CREDENTIALS (provided out of band — store as secrets, never hardcode,
never log):
- TELEGRAM_OIDC_CLIENT_ID          (used in-app, not fully secret, but
                                     still keep out of source control /
                                     inject via BuildConfig or secrets file)
- TELEGRAM_OIDC_CLIENT_SECRET      (server-side ONLY — never ship in the
                                     Android app)
- TELEGRAM_OIDC_REDIRECT_HOST      = app{CLIENT_ID}-login.tg.dev
- TELEGRAM_OIDC_REDIRECT_URI       = https://app{CLIENT_ID}-login.tg.dev/tglogin

SCOPES TO REQUEST: profile, phone
(phone requires explicit user consent and renders the extra "wants to
access your phone number" screen; if declined, id_token simply omits
phone_number / has phone_number_verified: false — handle gracefully.)

REFERENCE (server-side verification, unchanged from web flow):
- JWKS:  https://oauth.telegram.org/.well-known/jwks.json
- Token signed RS256 by default. Verify iss == https://oauth.telegram.org,
  aud == TELEGRAM_OIDC_CLIENT_ID, exp not passed.
```

---

## 3. Step-by-step build plan (Android client)

### Phase 1 — Dependency & credentials setup

- [ ] Add the Telegram Login SDK Maven repository (GitHub Packages) to `settings.gradle.kts`:
  ```kotlin
  dependencyResolutionManagement {
      repositories {
          google()
          mavenCentral()
          maven {
              url = uri("https://maven.pkg.github.com/TelegramMessenger/telegram-login-android")
              credentials {
                  username = providers.gradleProperty("gpr.user").orNull ?: System.getenv("GITHUB_USERNAME")
                  password = providers.gradleProperty("gpr.key").orNull ?: System.getenv("GITHUB_TOKEN")
              }
          }
      }
  }
  ```
  > Requires a GitHub personal access token with `read:packages` scope, stored locally in `~/.gradle/gradle.properties` (`gpr.user` / `gpr.key`) — **do not commit this token**. In CI, inject via secret env vars.
- [ ] Add the SDK dependency to `app/build.gradle.kts`:
  ```kotlin
  dependencies {
      implementation("org.telegram:login-sdk:1.0.0")
  }
  ```
- [ ] Confirm `minSdk >= 23` in `app/build.gradle.kts` (SDK requirement).
- [ ] Store `TELEGRAM_OIDC_CLIENT_ID` and `TELEGRAM_OIDC_REDIRECT_URI` as `buildConfigField` values (per build variant if you have staging/prod bots), not hardcoded strings scattered in code.
- [ ] Add a feature flag `BuildConfig.TELEGRAM_AUTH_MODE` (`"legacy"` | `"native"`) so this can be toggled without a new release if something goes wrong (e.g. via remote config).

### Phase 2 — Manifest: App Link intent filter

- [ ] Create (or repurpose) a dedicated `LoginActivity` (or reuse your current auth activity) to receive the callback.
- [ ] Declare the intent filter with `autoVerify="true"` so Android verifies domain ownership via your registered SHA-256 fingerprint:
  ```xml
  <activity
      android:name=".auth.TelegramLoginCallbackActivity"
      android:exported="true"
      android:launchMode="singleTask">
      <intent-filter android:autoVerify="true">
          <action android:name="android.intent.action.VIEW" />
          <category android:name="android.intent.category.DEFAULT" />
          <category android:name="android.intent.category.BROWSABLE" />
          <data
              android:scheme="https"
              android:host="app${TELEGRAM_CLIENT_ID}-login.tg.dev"
              android:pathPrefix="/tglogin" />
      </intent-filter>
  </activity>
  ```
- [ ] Use `launchMode="singleTask"` (or `singleTop`) — required to avoid duplicate Activity instances when returning from the Telegram app.
- [ ] Verify the App Link with `adb shell pm get-app-links <your.package.name>` after install to confirm `verified` status (not `legacy` / `none`).

### Phase 3 — SDK initialization

- [ ] Initialize once, in your `Application` class `onCreate()`:
  ```kotlin
  import org.telegram.login.TelegramLogin

  class TankuaApplication : Application() {
      override fun onCreate() {
          super.onCreate()

          TelegramLogin.init(
              clientId = BuildConfig.TELEGRAM_OIDC_CLIENT_ID,
              redirectUri = BuildConfig.TELEGRAM_OIDC_REDIRECT_URI,
              scopes = listOf("profile", "phone")
          )
      }
  }
  ```

### Phase 4 — Trigger login + handle callback

- [ ] Replace the current "Log in with Telegram" button action with:
  ```kotlin
  TelegramLogin.startLogin(this@LoginActivity)
  ```
- [ ] In the callback Activity, override `onNewIntent` to catch the returned URI:
  ```kotlin
  override fun onNewIntent(intent: Intent) {
      super.onNewIntent(intent)

      intent.data?.let { uri ->
          // Security: only process URIs from Telegram's verified login host
          if (uri.host == "app${BuildConfig.TELEGRAM_CLIENT_ID}-login.tg.dev") {
              TelegramLogin.handleLoginResponse(
                  uri,
                  onSuccess = { loginData ->
                      val idToken = loginData.idToken
                      // Do NOT trust any claims client-side.
                      // Send idToken to backend for verification + session issuance.
                      viewModel.verifyTelegramLogin(idToken)
                  },
                  onError = { error ->
                      // Show a retry/decline UI state; log error.code, not the raw token.
                      viewModel.onTelegramLoginError(error)
                  }
              )
          }
      }
  }
  ```
- [ ] If `launchMode="singleTask"` and the Activity may already be running, also check `onCreate`'s `intent` for the same URI (cold-start case).
- [ ] Client-side: treat `idToken` as opaque — do not decode/trust any claims (name, phone, etc.) in the app UI until the backend has verified and returned your own session.

### Phase 5 — Backend verification (same as the general OIDC plan, unchanged)

Reuse or create `telegram-oidc-verifier.ts`:

- [ ] Accept `{ idToken }` from the Android app over your existing authenticated API channel (HTTPS, not exposed publicly beyond your own backend).
- [ ] Fetch `https://oauth.telegram.org/.well-known/jwks.json` (cache by `kid`, refresh on cache-miss).
- [ ] Verify RS256 signature.
- [ ] Verify claims: `iss == https://oauth.telegram.org`, `aud == TELEGRAM_OIDC_CLIENT_ID`, `exp` valid.
- [ ] Extract `id`, `name`, `given_name`, `family_name`, `preferred_username`, `picture`, `phone_number`, `phone_number_verified`, `sub`.
- [ ] Upsert user atomically on unique `telegram_id`:
  - `phone_number` / `phone_number_verified` only set when `phone_number_verified === true`.
  - Keep existing synthetic-email pattern (`telegram-<id>@auth.tankua.app`) so downstream session logic is unchanged.
- [ ] Return your app's normal session token/JWT — same shape as the legacy flow, so the rest of the app doesn't need changes.

### Phase 6 — Fallback for users without Telegram installed

- [ ] Detect SDK's `onError` case indicating Telegram app is not installed (check the SDK's error type/code for this — confirm exact enum from the SDK once added as a dependency, since it's not enumerated in the top-level README snippet).
- [ ] On that specific error, fall back to the **browser-based OIDC flow** (Custom Tabs, PKCE) described in the general web migration plan, using the same `TELEGRAM_OIDC_CLIENT_ID`/`SECRET` but the standard `https://oauth.telegram.org/auth` redirect flow instead of the app-link flow.
- [ ] This fallback is what keeps the login working for the (shrinking, but nonzero) set of users without Telegram installed.

### Phase 7 — Database schema (if not already done)

- [ ] `users.phone_number` (text, nullable)
- [ ] `users.phone_number_verified` (boolean, default false)
- [ ] `users.telegram_oidc_sub` (text, nullable)
- [ ] Keep `telegram_id` as-is; `id` claim maps directly to it.

### Phase 8 — Testing checklist

- [ ] Fresh install, Telegram app installed, user accepts both `profile` and `phone` → native consent screen shown inside Telegram, app receives id_token via App Link, user created with verified phone.
- [ ] User declines `phone` scope only → login still succeeds, `phone_number_verified` false, app prompts for phone later per existing fallback UX.
- [ ] User fully declines → `onError` handled, no partial user created.
- [ ] Returning user (same `telegram_id`) logs in again → row updated, not duplicated.
- [ ] Cold start: app was killed, user taps a stale/duplicate Telegram redirect → `onCreate` path also handles it, no crash, no duplicate session.
- [ ] Tampered/expired `id_token` sent to backend → rejected, no session issued.
- [ ] `adb shell pm get-app-links` shows `verified` for your package (not falling back to `legacy` intent resolution, which would show a disambiguation dialog instead of a clean deep link).
- [ ] Telegram not installed → fallback browser flow triggers and completes successfully.
- [ ] Confirm consent screen shows correct Tankua bot logo/name (visual check against your reference screenshots).

### Phase 9 — Security review

- [ ] `TELEGRAM_OIDC_CLIENT_SECRET` exists only in backend environment, never in the APK / `BuildConfig`.
- [ ] Callback Activity checks `uri.host` before handing off to the SDK (shown in Phase 4) — prevents processing of spoofed intents from other sources.
- [ ] `android:exported="true"` on the callback Activity is required for the App Link intent filter to work, but confirm no sensitive action is reachable through that Activity beyond invoking `TelegramLogin.handleLoginResponse`.
- [ ] Backend re-verifies everything — the app never trusts client-side-decoded token claims for anything security-relevant.
- [ ] Rate-limit the backend verification endpoint.

---

## 4. Deliverables expected from the agent

1. Gradle changes (Phase 1) — repository + dependency + BuildConfig fields, per build variant if applicable.
2. `AndroidManifest.xml` changes (Phase 2) — App Link intent filter on the callback Activity.
3. `TankuaApplication.onCreate()` SDK init (Phase 3).
4. Login trigger + `onNewIntent`/`onCreate` callback handling (Phase 4), wired into existing auth ViewModel/screen.
5. `telegram-oidc-verifier.ts` backend function (Phase 5) — new, alongside legacy verifier, feature-flagged.
6. Browser-flow fallback wiring (Phase 6) for the no-Telegram-installed case.
7. DB migration (Phase 7).
8. Tests covering Phase 8 checklist (unit tests for token/claims verification at minimum; instrumented/manual test notes for the App Link + intent handling, since that portion isn't easily unit-tested).
9. Short README addition documenting: BotFather Android registration steps (Section 1), the App Link domain format, and the GitHub Packages token requirement for pulling the SDK.

---

## 5. Rollback plan

Flip `TELEGRAM_AUTH_MODE` back to `"legacy"` (remote-config-driven if possible, so no app release is needed). Phase 7's DB columns are additive/nullable, so no data migration is required to roll back. The legacy verifier and WebView flow stay untouched until the native flow is confirmed stable in production.
