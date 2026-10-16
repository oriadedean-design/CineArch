# Sign in with Apple: switching it on

The code is in both apps and switched off. Steps from Supabase's guide
(https://supabase.com/docs/guides/auth/social-login/auth-apple, read 2026-10-17).

**Needs:** a paid Apple Developer account. The free Personal Team can't add the
Sign in with Apple capability.

## iPhone app (native)

1. **Apple Developer → Certificates, Identifiers & Profiles → Identifiers:** open the App ID
   `ca.cinearch.app` and tick **Sign in with Apple**. Leave the server-to-server
   notification endpoint blank (Supabase doesn't use it).
2. **Xcode → CineArch target → Signing & Capabilities:** pick your paid team, then
   **+ Capability → Sign in with Apple**.
3. **Supabase → Authentication → Providers → Apple:** turn it on and add `ca.cinearch.app`
   to **Client IDs**. Native sign-in needs no secret key.
4. In `ios/CineArch/Views/AccountView.swift`, set `Features.signInWithApple = true`.

## Website

1. Note your **Team ID** (10 characters, top right of the developer account).
2. **Services:** register an email source under *Sign in with Apple for Email Communication*.
3. **Identifiers → + → Services ID**, e.g. `ca.cinearch.web`. Turn on Sign in with Apple:
   - Domain: `ylneglnslysecrhgjwcw.supabase.co`
   - Return URL: `https://ylneglnslysecrhgjwcw.supabase.co/auth/v1/callback`
4. **Keys → +:** a key with Sign in with Apple. Download `AuthKey_XXXXXXXXXX.p8` (once only; keep it safe).
5. Make the client secret with Supabase's generator (on the guide page above) from the `.p8`,
   Team ID, key ID and Services ID. Use Firefox or Chrome; Safari isn't supported.
6. **Supabase → Providers → Apple:**
   - **Client IDs:** the Services ID **first**, then `ca.cinearch.app`. (Web sign-in uses the
     first one; Apple refuses it if the App ID comes first.)
   - **Secret key:** paste the generated secret.
7. **Vercel → cine-arch → Settings → Environment Variables:** add `VITE_APPLE_SIGN_IN` = `on`, then redeploy.

**Every 6 months:** Apple requires a new website secret from the `.p8` (step 5). If it lapses,
website Apple sign-in stops working. The iPhone app isn't affected.
