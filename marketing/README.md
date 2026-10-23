# Marketing videos

Two videos, built from real simulator captures of the app and the brand fonts:

| File | What | Spec |
|---|---|---|
| `out/cinearch-app-preview.mp4` | App Store app preview | 886 × 1920, H.264, 30 fps, 15–30 s, silent stereo AAC |
| `out/cinearch-explainer.mp4` | Explainer for the website and social | 1920 × 1080, H.264, 30 fps |

App previews may only use screen captures of the app itself, with text overlays
(App Review Guideline 2.3.4), so every shot comes from the app. Captions are in
`src/copy.json` and only say what the app says.

## Rebuild

1. **Capture** on the iPhone 17 Pro Max simulator (1320 × 2868, an accepted
   6.9-inch screenshot size), status bar set to 9:41:
   ```sh
   xcrun simctl status_bar <sim> override --time 9:41 --batteryState charged --batteryLevel 100
   # stills: capture/{wrap,jobs,guide,wallet}.png
   xcrun simctl launch <sim> ca.cinearch.app -cinearch.preview YES -cinearch.capture YES -cinearch.walkthroughSeen YES -cinearch.tab jobs
   # walkthrough scenes: capture/walk{0..5}.mov (record, then launch)
   xcrun simctl io <sim> recordVideo --codec=h264 --force capture/walk0.mov &
   xcrun simctl launch <sim> ca.cinearch.app -cinearch.walkthrough YES -cinearch.walkthroughPage 0
   ```
   `-cinearch.capture YES` hides the sample account's PREVIEW badge.
2. **Text:** `node src/render-text.cjs <chromium>` (needs `playwright-core`).
3. **Video:** `bash src/build.sh` (needs `ffmpeg`, `jq`).
