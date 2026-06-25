# Hatch Matcher & Fly Tying Recipe Vault 🎣

A tactical, dark-mode Progressive Web App (PWA) designed for fly anglers to accurately match insect hatches streamside and search a comprehensive database of fly tying patterns—even completely offline when miles away from cell service.

Built modernly with **Vite**, **Vanilla JavaScript (ES6+)**, and optimized for zero-overhead global deployments via **Vercel CDN**.

---

## 🛠️ Key Features

* **The Hatch Matrix Engine:** A step-by-step biological stratification loop that filters local insect populations down by **Region**, **Month**, **Water Temperature Range**, and specific stream conditions.
* **Weighted Scoring:** Dynamically ranks matching fly patterns based on real-time observations of **Water Type** (+1 point) and fish **Rise Forms** (+2 points).
* **Standalone Tying Vault:** An isolated search engine that filters through pattern names, target insects, or precise materials, rendering recipes instantly in a clean, mobile-responsive CSS grid.
* **PWA Offline Capabilities:** Lightweight asset caching ensures your local database, UI styling, and custom icons run seamlessly deep in mountain canyons without data connectivity.

---

## 📂 Project Architecture

To ensure assets build properly and deploy flawlessly to Vercel without `404 (Not Found)` errors, the directory layout must strictly follow this structure:

```text
hatch-matcher/
├── public/                 # Static production assets (copied directly to dist)
│   ├── hatches.json        # Main regional/insect relational database
│   ├── pwa-192x192.png     # Android/Mobile PWA installation icon
│   └── pwa-512x512.png     # High-res system splash screen icon
├── src/                    # App source files
│   └── main.js             # Core JS logic (filtering loop + tying vault search)
├── index.html              # Single-page UI application shell
├── package.json            # Node project configuration
├── vite.config.js          # Vite configuration & PWA engine setup
└── README.md               # Documentation
