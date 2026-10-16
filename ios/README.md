# CineArch for iPhone

Native SwiftUI app. Same Supabase database and union engine as the website.

## Open and run

1. `npm run ios:config`: writes `ios/Config/Secrets.xcconfig` from `.env.local` (once per machine).
2. Open `ios/CineArch.xcodeproj` in Xcode.
3. Pick your iPhone or a simulator and press Run, or use the preview canvas (Option-Cmd-Return).

New Swift files you add under `ios/CineArch/` show up in Xcode by themselves.
After changing `ios/project.yml`, run `npm run ios:project` (needs `brew install xcodegen`).

## Layout

- `CineArchKit/`: the pay rules and union engine in Swift (a package; no networking).
  `npm run ios:test` runs its tests on the Mac, using the web tests' fixture
  (`tests/fixtures/pay_engine.json`), so the website and the app pay the same.
- `CineArch/Data/`: Supabase connection, engine cache (works offline), sign-in, jobs.
- `CineArch/Views/`: Guide, Pay, Jobs, Account.

## App Store notes

- The guide and pay calculator work without an account; saving a job asks you to sign in (Guideline 5.1.1(v)).
- Account > Delete account deletes the login and all data (`delete_my_account()`).
- Email sign-in only, so Sign in with Apple isn't required yet (Guideline 4.8). Add it before adding Google sign-in to the app.
- `CineArch/PrivacyInfo.xcprivacy` declares what's collected (no tracking).
