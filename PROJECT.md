# Hatch Matcher — Project Notes

## App
- **URL:** https://hatchmatcher.app
- **Repo:** https://github.com/ronpeoplesii/hatch-matcher
- **Deployed on:** Vercel (domain purchased through Vercel, $9.99/yr)
- **Stack:** Vanilla JS, Vite, vite-plugin-pwa
- **API:** Vercel serverless functions in `/api/` folder (ESM)

## Built By
Ron Peoples — fly fisherman, volunteer with The Mayfly Project (Smethport, PA chapter)

## What the App Does
- Match the hatch by live conditions (water temp, water type, rise form, region, month)
- Plan My Box — recommend fly box by region and month
- Recipe Vault — 122 patterns with full tying recipes, difficulty ratings, stage/species/difficulty filters
- Live USGS stream gauge data (water temp, flow CFS, stage height) via free API
- Live weather via Open-Meteo (air temp, wind, humidity) — no API key needed
- AI Guide ("Ask the Guide") — plain English pattern recommendations via Claude
- Photo Match — photograph a bug, AI identifies it and recommends patterns
- Hatch Calendar — month-by-month grid by region
- Trip Log — local only, localStorage, CSV export
- Favorites / Saved Flies
- Pattern of the Week — rotates weekly by ISO week number
- Audit View — all 122 patterns readable for accuracy review
- Share cards — 1080x1080 canvas image for match results and Plan My Box
- QR code generator + downloadable share card (hatchmatcher.app)
- Offline PWA — works without internet on the water
- Report an error — mailto link on every pattern detail and audit view

## Key Links
- Buy Me a Coffee: https://buymeacoffee.com/hatchmatcher
- Mayfly Project Smethport donate: https://purecharity.com/checkout/408119
- Mayfly Project website: https://themayflyproject.com
- Google Analytics: G-ZD25FBQ7ZH (analytics.google.com)
- Vercel Analytics: enabled via @vercel/analytics inject()

## Tech Stack Details
- `src/main.js` — all app logic (~1600+ lines)
- `index.html` — all screen HTML (single page app)
- `public/hatches.json` — 122 fly patterns
- `public/recipes.json` — 122 tying recipes keyed by recipe_id
- `api/recommend.js` — Ask the Guide (claude-opus-4-8, max_tokens 300)
- `api/photo-match.js` — Photo Match vision (claude-opus-4-8, max_tokens 400)
- `api/package.json` — `{"type":"module"}` required for ESM in Vercel functions
- `vercel.json` — build config + API rewrites
- `vite.config.js` — VitePWA, CacheFirst for JSON data (30-day TTL)

## Environment Variables (set in Vercel project settings)
- `ANTHROPIC_API_KEY` — must be set at project level, not team level

## Global State (main.js)
- `hatchDatabase` — loaded from hatches.json, recipes merged on
- `recipeDatabase` — loaded from recipes.json
- `favorites` — Set, persisted to localStorage `hatch_favorites`
- `tripLog` — array, persisted to localStorage `hatch_trip_log`
- `activeStageFilter`, `activeSpeciesFilter`, `activeDifficultyFilter`
- `lastMatchedFlies` — for share card
- `boxBuilderBiome` — for Plan My Box flow
- `currentConditions` — biome, waterTemp, waterType, riseForm
- `BMC_URL` = "https://buymeacoffee.com/hatchmatcher"

## Screens (index.html)
step-home, step-box-region, step-box-month, step-box-results,
step-region, step-environment, step-temp, step-water, step-rise,
step-results, step-search, step-ai-recommend, step-photo-match,
step-hatch-calendar, step-trip-log, step-about, step-pattern-detail,
step-favorites, step-audit

## Navigation
- `window.advanceToNextScreen(currentId, nextId)` — slide forward
- `window.switchScreen(currentId, nextId)` — jump directly

## Database
- 122 patterns, 122 recipes
- Every pattern has: id, name, stage, difficulty, biomes, months,
  water_temp_range, water_types, size_range, imitation_species,
  recipe_id, target_species
- Difficulty: beginner / intermediate / advanced
- Stages: nymph, emerger, dun, spinner, terrestrial, streamer
- Biomes: Northeast, Rocky Mountain, Pacific Northwest, Midwest, Southeast, Southwest
- Species: brown_trout, rainbow_trout, brook_trout, steelhead, salmon,
  whitefish, bass, carp, panfish, grayling

## Key Hatches in Database
BWO, Hendrickson, Sulfur, Green Drake, PMD, Trico, March Brown,
Quill Gordon, Light Cahill, Isonychia, Mahogany Dun, Callibaetis,
Pale Evening Dun, Hexagenia, Skwala Stonefly, Elk Hair Caddis,
Grannom, October Caddis, Cinnamon Caddis, Salmonfly, Golden Stone,
Little Yellow Sallie, Early Black Stonefly, Zebra Midge, Blood Midge,
Rhyacophila (Green Caddis), Cranefly, Grasshopper, Beetle, Ants,
Flying Ant, Woolly Bugger, San Juan Worm, Damselfly Nymph, Sculpin

## External APIs Used (all free, no key except Anthropic)
- Open-Meteo: weather by lat/lon
- USGS Water Services: stream gauge data by bounding box
- api.qrserver.com: QR code image generation
- Anthropic Claude API: AI guide + photo match

## Known Issues / Watch List
- PWA aggressive caching: users may need hard refresh (Ctrl+Shift+R) to see updates
- USGS data only covers gauges with active water temp sensors (00010)
- QR code requires internet (fetches from api.qrserver.com)

## What's Next (ideas backlog)
- Google Play Store listing via TWA
- Push notifications ("BWO season starts next week in your region")
- Community hatch reports by region
- Tying video links on pattern detail
- More Southeast / Southwest hatch coverage

## Marketing / Distribution
- Facebook: Fly Fishing Pennsylvania group (7,200 members) — posted
- Reddit: r/flyfishing and r/flytying — rejected (new account karma issue, try again after building karma)
- QR code card — print and leave at fly shops, TU meetings, Mayfly Project events
- Dot card — pointed to hatchmatcher.app
- Buy Me a Coffee: https://buymeacoffee.com/hatchmatcher

## Ron's Email (for error reports)
rpeoples@gmail.com
