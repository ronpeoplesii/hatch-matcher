// ============================================================================
// VERCEL ANALYTICS
// ============================================================================
import { inject } from '@vercel/analytics';

// Initialize Vercel Analytics
inject();

// ============================================================================
// 1. GLOBAL STATE MANAGEMENT
// ============================================================================
let hatchDatabase = [];
let recipeDatabase = {};

// ============================================================================
// HATCH CALENDAR
// ============================================================================

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const BIOME_MAP = {
  appalachian: "Northeast", rocky_mountain: "Rocky Mountain",
  pacific_coastal: "Pacific Northwest", boreal_shield: "Midwest",
  transitional_plains: "Midwest", warmwater_south: "Southeast"
};

window.openHatchCalendar = () => {
  switchScreen("step-home", "step-hatch-calendar");
  renderHatchCalendar();
};

window.renderHatchCalendar = () => {
  const select = document.getElementById("calendar-biome");
  const grid = document.getElementById("calendar-grid");
  if (!select || !grid) return;

  const databaseBiome = BIOME_MAP[select.value] || "Northeast";
  const flies = hatchDatabase.filter(f =>
    (f.biomes || []).map(b => b.toLowerCase()).includes(databaseBiome.toLowerCase())
  );

  // Group by insect name, collect active months
  const byName = {};
  flies.forEach(f => {
    if (!byName[f.name]) byName[f.name] = { fly: f, months: new Set() };
    (f.months || []).forEach(m => byName[f.name].months.add(m));
  });

  const currentMonth = new Date().getMonth() + 1;

  const rows = Object.values(byName).sort((a, b) => {
    const aMin = Math.min(...a.months);
    const bMin = Math.min(...b.months);
    return aMin - bMin;
  });

  grid.innerHTML = `
    <div style="overflow-x:auto; margin-bottom:8px;">
      <table style="width:100%; border-collapse:collapse; font-size:0.72rem;">
        <thead>
          <tr>
            <th style="text-align:left; padding:6px 8px; color:#71717a; font-weight:700; white-space:nowrap; border-bottom:1px solid #27272a;">Pattern</th>
            ${MONTHS.map((m, i) => `<th style="padding:4px 2px; color:${i + 1 === currentMonth ? "#10b981" : "#71717a"}; font-weight:${i + 1 === currentMonth ? "700" : "400"}; border-bottom:1px solid #27272a;">${m}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows.map(({ fly, months }) => `
            <tr onclick="openPatternDetail('${fly.id}', 'step-hatch-calendar')" style="cursor:pointer;" onmouseover="this.style.background='#1c1c1f'" onmouseout="this.style.background='transparent'">
              <td style="padding:6px 8px; color:#e4e4e7; font-weight:600; white-space:nowrap; border-bottom:1px solid #18181b;">${fly.name}</td>
              ${MONTHS.map((_, i) => {
                const active = months.has(i + 1);
                const current = i + 1 === currentMonth && active;
                return `<td style="padding:4px 2px; text-align:center; border-bottom:1px solid #18181b;">
                  ${active ? `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${current ? "#10b981" : "#3f3f46"};"></span>` : ""}
                </td>`;
              }).join("")}
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <p style="font-size:0.72rem; color:#52525b; margin-top:4px;">🟢 = active this month &nbsp;⚫ = active other months &nbsp;Tap any row for the recipe</p>
  `;
};

// ============================================================================
// TRIP LOG
// ============================================================================

let tripLog = JSON.parse(localStorage.getItem("hatch_trip_log") || "[]");

function saveTripLog() {
  localStorage.setItem("hatch_trip_log", JSON.stringify(tripLog));
}

window.openTripLog = () => {
  // Pre-fill today's date
  const dateInput = document.getElementById("log-date");
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }
  renderTripLogList();
  switchScreen("step-home", "step-trip-log");
};

window.saveTripEntry = () => {
  const date = document.getElementById("log-date").value;
  const location = document.getElementById("log-location").value.trim();
  const pattern = document.getElementById("log-pattern").value.trim();
  const conditions = document.getElementById("log-conditions").value.trim();
  const notes = document.getElementById("log-notes").value.trim();

  if (!date && !location && !pattern) {
    alert("Add at least a date, location, or pattern before saving.");
    return;
  }

  const entry = { id: Date.now(), date, location, pattern, conditions, notes };
  tripLog.unshift(entry);
  saveTripLog();

  // Clear form
  ["log-location", "log-pattern", "log-conditions", "log-notes"].forEach(id => {
    document.getElementById(id).value = "";
  });

  renderTripLogList();
};

window.deleteTripEntry = (id) => {
  tripLog = tripLog.filter(e => e.id !== id);
  saveTripLog();
  renderTripLogList();
};

window.exportTripLog = () => {
  if (tripLog.length === 0) {
    alert("No trips logged yet — nothing to export.");
    return;
  }

  const headers = ["Date", "Location", "Pattern", "Conditions", "Notes"];
  const rows = tripLog.map(e => [
    e.date || "",
    e.location || "",
    e.pattern || "",
    e.conditions || "",
    (e.notes || "").replace(/"/g, '""')
  ].map(v => `"${v}"`).join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hatch-matcher-trip-log-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

function renderTripLogList() {
  const list = document.getElementById("trip-log-list");
  if (!list) return;

  if (tripLog.length === 0) {
    list.innerHTML = `<div style="padding:20px; background:#202023; border:1px dashed #3f3f46; border-radius:12px; text-align:center;"><p style="color:#a1a1aa;">No trips logged yet. Fill in the form above after your next session.</p></div>`;
    return;
  }

  list.innerHTML = tripLog.map(entry => {
    const dateStr = entry.date ? new Date(entry.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
    return `
      <div style="background:#1c1c1f; border:1px solid #27272a; border-radius:12px; padding:14px 16px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div>
            ${dateStr ? `<p style="font-size:0.75rem; color:#71717a; margin:0 0 2px; font-weight:600;">${dateStr}</p>` : ""}
            ${entry.location ? `<p style="font-size:0.92rem; color:#e4e4e7; font-weight:700; margin:0;">${entry.location}</p>` : ""}
          </div>
          <button onclick="deleteTripEntry(${entry.id})" style="background:none; border:none; color:#52525b; cursor:pointer; font-size:1rem; padding:0; line-height:1;" title="Delete">✕</button>
        </div>
        ${entry.pattern ? `<p style="font-size:0.82rem; margin:0 0 4px;"><span style="color:#71717a; font-weight:600;">Pattern:</span> <span style="color:#10b981;">${entry.pattern}</span></p>` : ""}
        ${entry.conditions ? `<p style="font-size:0.82rem; color:#a1a1aa; margin:0 0 4px;">${entry.conditions}</p>` : ""}
        ${entry.notes ? `<p style="font-size:0.82rem; color:#71717a; margin:0; font-style:italic; line-height:1.5;">${entry.notes}</p>` : ""}
      </div>`;
  }).join("");
}

// ============================================================================
// BUY ME A COFFEE — update this URL once you have your buymeacoffee.com link
// ============================================================================
const BMC_URL = "https://buymeacoffee.com/hatchmatcher";

document.addEventListener("DOMContentLoaded", () => {
  const link = document.getElementById("bmc-link");
  if (link) link.href = BMC_URL;
});

// ============================================================================
// OFFLINE DETECTION
// ============================================================================

function updateOfflineBanner() {
  const banner = document.getElementById("offline-banner");
  if (!banner) return;
  banner.style.display = navigator.onLine ? "none" : "block";
  // Shift app container down when banner is visible
  const app = document.getElementById("app-container");
  if (app) app.style.paddingTop = navigator.onLine ? "0" : "40px";
}

window.addEventListener("online", updateOfflineBanner);
window.addEventListener("offline", updateOfflineBanner);
document.addEventListener("DOMContentLoaded", updateOfflineBanner);

// ============================================================================
// FAVORITES — persisted in localStorage
let favorites = new Set(JSON.parse(localStorage.getItem("hatch_favorites") || "[]"));

function saveFavorites() {
  localStorage.setItem("hatch_favorites", JSON.stringify([...favorites]));
}

window.toggleFavorite = (flyId, btn) => {
  if (favorites.has(flyId)) {
    favorites.delete(flyId);
    btn.textContent = "☆";
    btn.style.color = "#52525b";
  } else {
    favorites.add(flyId);
    btn.textContent = "★";
    btn.style.color = "#f59e0b";
  }
  saveFavorites();
};

window.openFavorites = () => {
  const favFlies = hatchDatabase.filter(f => favorites.has(f.id));
  const list = document.getElementById("favorites-list");
  if (!list) return;
  if (favFlies.length === 0) {
    list.innerHTML = `<div style="padding:20px; background:#202023; border:1px dashed #3f3f46; border-radius:12px; text-align:center;"><p style="color:#a1a1aa;">No favorites yet — tap ☆ on any pattern to save it here.</p></div>`;
  } else {
    list.innerHTML = favFlies.map(fly => {
      const sizes = fly.size_range && fly.size_range.length > 0 ? `#${fly.size_range.join(", #")}` : "";
      return `
        <div style="display:flex; align-items:center; gap:10px; padding:12px 14px; background:#202023; border:1px solid #27272a; border-radius:10px; margin-bottom:8px; transition: border-color 0.15s;" onmouseover="this.style.borderColor='#10b981'" onmouseout="this.style.borderColor='#27272a'">
          <button onclick="toggleFavorite('${fly.id}', this); renderFavoritesList()" style="background:none; border:none; cursor:pointer; font-size:1.2rem; color:#f59e0b; flex-shrink:0;">★</button>
          <div onclick="openPatternDetail('${fly.id}', 'step-favorites')" style="cursor:pointer; flex:1;">
            <span style="color:#e4e4e7; font-size:0.9rem; font-weight:600;">${fly.name}</span>
            ${sizes ? `<span style="display:block; font-size:0.72rem; color:#71717a; margin-top:1px;">${sizes}</span>` : ""}
          </div>
          <span style="font-size:0.68rem; color:#10b981; background:#052e16; border:1px solid #166534; padding:2px 7px; border-radius:20px; text-transform:uppercase; letter-spacing:0.05em; white-space:nowrap;">${fly.stage}</span>
        </div>`;
    }).join("");
  }
  switchScreen("step-home", "step-favorites");
};

window.renderFavoritesList = () => {
  const favFlies = hatchDatabase.filter(f => favorites.has(f.id));
  const list = document.getElementById("favorites-list");
  if (!list) return;
  if (favFlies.length === 0) {
    list.innerHTML = `<div style="padding:20px; background:#202023; border:1px dashed #3f3f46; border-radius:12px; text-align:center;"><p style="color:#a1a1aa;">No favorites yet — tap ☆ on any pattern to save it here.</p></div>`;
  } else {
    list.innerHTML = favFlies.map(fly => {
      const sizes = fly.size_range && fly.size_range.length > 0 ? `#${fly.size_range.join(", #")}` : "";
      return `
        <div style="display:flex; align-items:center; gap:10px; padding:12px 14px; background:#202023; border:1px solid #27272a; border-radius:10px; margin-bottom:8px;">
          <button onclick="toggleFavorite('${fly.id}', this); renderFavoritesList()" style="background:none; border:none; cursor:pointer; font-size:1.2rem; color:#f59e0b; flex-shrink:0;">★</button>
          <div onclick="openPatternDetail('${fly.id}', 'step-favorites')" style="cursor:pointer; flex:1;">
            <span style="color:#e4e4e7; font-size:0.9rem; font-weight:600;">${fly.name}</span>
            ${sizes ? `<span style="display:block; font-size:0.72rem; color:#71717a; margin-top:1px;">${sizes}</span>` : ""}
          </div>
          <span style="font-size:0.68rem; color:#10b981; background:#052e16; border:1px solid #166534; padding:2px 7px; border-radius:20px; text-transform:uppercase; letter-spacing:0.05em; white-space:nowrap;">${fly.stage}</span>
        </div>`;
    }).join("");
  }
};

// Fallback runtime conditions (Maps to our 101-fly flat schema rules)
const currentConditions = {
  biome: "Northeast",
  month: new Date().getMonth() + 1, // Normalized 1-12 range
  waterTemp: 55,
  waterType: "freestone"
};

// ============================================================================
// 2. CORE APPLICATION INITIALIZATION
// ============================================================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Fetch the 101+ fly database generated by generate_hatches.cjs
    const response = await fetch('/hatches.json');
    if (!response.ok) throw new Error("Could not fetch hatches.json asset profile");

    hatchDatabase = await response.json();
    console.log("✓ Hatch database loaded successfully. Total profiles:", hatchDatabase.length);

    const recipesResponse = await fetch('/recipes.json');
    if (recipesResponse.ok) {
      recipeDatabase = await recipesResponse.json();
      hatchDatabase.forEach(fly => {
        const recipe = recipeDatabase[fly.recipe_id];
        if (recipe) {
          fly.tying_materials = recipe.tying_materials;
          fly.recipe_hook = recipe.hook;
          fly.recipe_thread = recipe.thread;
          fly.recipe_steps = recipe.steps;
        }
      });
      console.log("✓ Recipe vault loaded. Total recipes:", Object.keys(recipeDatabase).length);
    }
    
    // Bind manual inputs and standard controls
    setupEventListeners();

    // Evaluate initial baseline filter matching
    matchTheHatch();

    // Render "hatching this week" on home screen
    renderHatchingNow();
    renderPatternOfWeek();

    // Handle shared box URL if present
    loadSharedBox();
  } catch (error) {
    console.error("❌ Critical error bootstrapping hatch engine:", error);
  }
});

// ============================================================================
// 3. UI EVENT LISTENER MAPPINGS
// ============================================================================
function setupEventListeners() {
  // Catch updates from manual UI select dropdowns if they exist in DOM
  const biomeSelector = document.getElementById("biome-select");
  const monthSelector = document.getElementById("month-select");
  
  if (biomeSelector) {
    biomeSelector.addEventListener("change", (e) => {
      currentConditions.biome = e.target.value;
      matchTheHatch();
    });
  }
  
  if (monthSelector) {
    monthSelector.addEventListener("change", (e) => {
      currentConditions.month = Number(e.target.value);
      matchTheHatch();
    });
  }
}

// ============================================================================
// 4. CORE MATCH-THE-HATCH FILTERING ENGINE
// ============================================================================
// ============================================================================
// 4. CORE MATCH-THE-HATCH FILTERING ENGINE (WITH DATA MAPPING)
// ============================================================================
function matchTheHatch() {
  let { biome, month, waterTemp, waterType } = currentConditions;
  console.log("🔍 Evaluating raw wizard inputs:", currentConditions);

  // 1. MAP HTML REGION KEYS OVER TO THE 101-FLY PROFILE MATCHES
  let databaseBiome = biome;
  if (biome === "appalachian") databaseBiome = "Northeast";
  if (biome === "rocky_mountain") databaseBiome = "Rocky Mountain";
  if (biome === "pacific_coastal") databaseBiome = "Pacific Northwest";
  if (biome === "boreal_shield") databaseBiome = "Midwest";
  if (biome === "transitional_plains") databaseBiome = "Midwest";
  if (biome === "warmwater_south") databaseBiome = "Southeast";

  // 2. MAP MICRO WATER SEGMENTS BACK TO BASELINE PROFILE WATER TYPES
  let databaseWaterType = "freestone"; // reliable default fallback
  if (waterType === "stillwater" || waterType === "lake_pond") {
    databaseWaterType = "stillwater";
  } else if (["riffle", "run", "pool", "freestone", "splashy", "sipping", "bulging"].includes(waterType)) {
    databaseWaterType = "freestone"; // Snaps river micro-flow states back to moving water entries
  }

  const matchedFlies = hatchDatabase.filter(hatch => {
    // A. Biome Validation
    const biomes = hatch.biomes || [];
    const biomeMatch = biomes.map(b => b.toLowerCase().trim()).includes(databaseBiome.toLowerCase().trim());

    // B. Chronological Hatch Window Check
    const months = hatch.months || [];
    const monthMatch = months.includes(month);

    // C. Ambient Water Temperature Window Check
    const minTemp = hatch.water_temp_range?.min_f ?? 32;
    const maxTemp = hatch.water_temp_range?.max_f ?? 80;
    const tempMatch = waterTemp >= minTemp && waterTemp <= maxTemp;

    // D. Hydrographic Stream Profile Match
    const waterTypes = hatch.water_types || [];
    const waterTypeMatch = waterTypes.map(w => w.toLowerCase().trim()).includes(databaseWaterType.toLowerCase().trim());

    return biomeMatch && monthMatch && tempMatch && waterTypeMatch;
  });

  console.log(`🎯 Normalized Match Target: Biome="${databaseBiome}", Water="${databaseWaterType}" -> Found: ${matchedFlies.length}`);
  renderResults(matchedFlies);
}

// ============================================================================
// 5. VIEWPORT DOM LAYOUT RENDERING
// ============================================================================
function renderResults(flies) {
  const resultsContainer = document.getElementById("results-list");
  if (!resultsContainer) return;

  const summary = document.getElementById("results-summary");
  const context = document.getElementById("results-context");
  const monthName = new Date().toLocaleString("default", { month: "long" });

  const biomeLabels = {
    appalachian: "Appalachian & Limestone",
    rocky_mountain: "Rocky Mountain",
    pacific_coastal: "Pacific Rainforest & Coastal",
    boreal_shield: "Great Lakes & Boreal Shield",
    transitional_plains: "Midwest & Plains",
    warmwater_south: "Southern & Coastal Plain"
  };
  const waterTypeLabels = {
    freestone: "River / Stream", riffle: "Riffle", run: "Run", pool: "Pool",
    stillwater: "Lake / Pond", lake_pond: "Lake / Pond",
    splashy: "Splashy Rise", sipping: "Sipping Rise", bulging: "Bulging / Subsurface"
  };

  if (context) {
    context.style.display = "block";
    context.innerHTML = `
      <span style="color:#e4e4e7; font-weight:600;">📍 ${biomeLabels[currentConditions.biome] || currentConditions.biome}</span>
      &nbsp;·&nbsp; 📅 ${monthName}
      &nbsp;·&nbsp; 🌡️ ${currentConditions.waterTemp}°F
      &nbsp;·&nbsp; 💧 ${waterTypeLabels[currentConditions.waterType] || currentConditions.waterType}
    `;
  }

  if (summary) {
    const filtered = applySpeciesFilter(flies);
    const count = filtered.length;
    summary.innerHTML = flies.length === 0 ? "" : `
      <span style="display:block; margin-bottom:8px;">${count} pattern${count === 1 ? "" : "s"} matched${activeSpeciesFilter ? ` for ${SPECIES_LIST.find(s=>s.key===activeSpeciesFilter)?.label||activeSpeciesFilter}` : ""}:</span>
      ${speciesPillsHtml("setResultsSpeciesFilter")}
    `;
  }

  if (flies.length === 0) {
    // Diagnose which filter killed the results
    const { biome, month, waterTemp, waterType } = currentConditions;
    let databaseBiome = biome;
    if (biome === "appalachian") databaseBiome = "Northeast";
    if (biome === "rocky_mountain") databaseBiome = "Rocky Mountain";
    if (biome === "pacific_coastal") databaseBiome = "Pacific Northwest";
    if (biome === "boreal_shield") databaseBiome = "Midwest";
    if (biome === "transitional_plains") databaseBiome = "Midwest";
    if (biome === "warmwater_south") databaseBiome = "Southeast";
    let databaseWaterType = ["stillwater", "lake_pond"].includes(waterType) ? "stillwater" : "freestone";

    const biomeOnly = hatchDatabase.filter(h => (h.biomes || []).map(b => b.toLowerCase()).includes(databaseBiome.toLowerCase()));
    const biomeAndMonth = biomeOnly.filter(h => (h.months || []).includes(month));
    const biomeAndTemp = biomeOnly.filter(h => waterTemp >= (h.water_temp_range?.min_f ?? 32) && waterTemp <= (h.water_temp_range?.max_f ?? 80));

    let hint = "Try an all-season attractor pattern like a Prince Nymph or Woolly Bugger.";
    if (biomeOnly.length === 0) {
      hint = "No patterns are mapped to this region yet. Try a neighboring biome.";
    } else if (biomeAndMonth.length === 0) {
      hint = `No hatches are mapped for this month in your region. Attractor patterns or midges fish year-round.`;
    } else if (biomeAndTemp.length === 0) {
      const cooler = biomeOnly.filter(h => waterTemp < (h.water_temp_range?.min_f ?? 32));
      const suggestion = cooler.length > 0 ? `Water may be too cold — try patterns active above ${Math.min(...cooler.map(h => h.water_temp_range.min_f))}°F.` : `Water may be too warm for active hatches — focus on early morning or shaded runs.`;
      hint = suggestion;
    } else {
      hint = `Patterns exist for this region and season but not this water type. Try switching to ${databaseWaterType === "freestone" ? "stillwater" : "moving water"} or use an attractor.`;
    }

    resultsContainer.innerHTML = `
      <div style="padding: 20px; background: #202023; border: 1px dashed #3f3f46; border-radius: 12px; text-align: center;">
        <p style="font-size: 1rem; font-weight: 600; color: #e4e4e7; margin-bottom: 8px;">No hatches matched these conditions.</p>
        <p style="font-size: 0.85rem; color: #a1a1aa; line-height: 1.5;">${hint}</p>
      </div>
    `;
    return;
  }

  lastMatchedFlies = flies;
  const displayFlies = applySpeciesFilter(flies);

  if (displayFlies.length === 0 && flies.length > 0) {
    resultsContainer.innerHTML = `<div style="padding:20px; background:#202023; border:1px dashed #3f3f46; border-radius:12px; text-align:center;"><p style="color:#a1a1aa;">No patterns matched for this species filter. Try a different species or clear the filter.</p></div>`;
    return;
  }

  resultsContainer.innerHTML = displayFlies.map(fly => {
    const sizeString = fly.size_range && fly.size_range.length > 0
      ? `Sizes: #${fly.size_range.join(', #')}`
      : 'Universal Size';

    return `
      <div onclick="openPatternDetail('${fly.id}', 'step-results')" style="cursor:pointer; padding:14px; background:#202023; border:1px solid #27272a; border-radius:12px; margin-bottom:10px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); transition: border-color 0.15s;" onmouseover="this.style.borderColor='#10b981'" onmouseout="this.style.borderColor='#27272a'">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <p style="color:#fff; font-weight:600; font-size:0.95rem; margin:0 0 2px;">${fly.name}</p>
            <p style="color:#71717a; font-size:0.75rem; font-style:italic; margin:0;">${fly.imitation_species}</p>
          </div>
          <span style="font-size:0.68rem; color:#10b981; background:#052e16; border:1px solid #166534; padding:2px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:0.05em; white-space:nowrap; margin-left:8px;">${fly.stage}</span>
        </div>
        <div style="margin-top:10px; padding-top:10px; border-top:1px solid #27272a; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.78rem; color:#d4d4d8;">${sizeString}</span>
          <span style="font-size:0.7rem; color:#52525b; background:#18181b; padding:2px 6px; border-radius:4px; font-family:monospace;">Tap for recipe →</span>
        </div>
      </div>
    `;
  }).join('');
}
// ============================================================================
// 6. UI SCREEN TRANSITION ENGINE (MULTI-STEP WIZARD)
// ============================================================================
window.advanceToNextScreen = function(currentScreenId, nextScreenId) {
  const currentScreen = document.getElementById(currentScreenId);
  const nextScreen = document.getElementById(nextScreenId);

  if (currentScreen && nextScreen) {
    // Remove active class from the current step to hide it
    currentScreen.classList.remove("active");
    // Add active class to the next step to reveal it
    nextScreen.classList.add("active");
    console.log(`✈️ Advanced UI: ${currentScreenId} -> ${nextScreenId}`);
  } else {
    console.warn(`⚠️ Wizard transition requested for missing elements: ${currentScreenId} or ${nextScreenId}`);
  }
};

// ============================================================================
// 7. GLOBAL WINDOW INTERFACE WRAPPERS (MATCHING YOUR INDEX.HTML)
// ============================================================================

// Weather code → description + emoji
function describeWeather(code) {
  if (code === 0) return { desc: "Clear skies", emoji: "☀️" };
  if (code <= 2) return { desc: "Partly cloudy", emoji: "⛅" };
  if (code === 3) return { desc: "Overcast", emoji: "☁️" };
  if (code <= 49) return { desc: "Foggy", emoji: "🌫️" };
  if (code <= 59) return { desc: "Drizzle", emoji: "🌦️" };
  if (code <= 69) return { desc: "Rain", emoji: "🌧️" };
  if (code <= 79) return { desc: "Snow", emoji: "❄️" };
  if (code <= 84) return { desc: "Rain showers", emoji: "🌧️" };
  if (code <= 99) return { desc: "Thunderstorms", emoji: "⛈️" };
  return { desc: "Unknown", emoji: "🌡️" };
}

// Estimate water temp from air temp (water lags air by ~10-15°F in most seasons)
function estimateWaterTemp(airTempF) {
  return Math.round(Math.max(33, airTempF * 0.75 + 5));
}

// Automated streamside detection with live weather
window.detectLocation = () => {
  if (!navigator.geolocation) {
    alert("Location services are not supported by your browser configuration.");
    return;
  }

  const gpsStatus = document.getElementById("gps-status");
  if (gpsStatus) {
    gpsStatus.style.display = "block";
    gpsStatus.innerText = "🛰️ Resolving location & weather...";
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      // Biome detection
      let detectedBiome = "appalachian";
      if (longitude < -120) detectedBiome = "pacific_coastal";
      else if (longitude < -105) detectedBiome = "rocky_mountain";
      else if (longitude < -80 && longitude > -97) detectedBiome = "boreal_shield";
      else if (latitude < 36) detectedBiome = "warmwater_south";

      const biomeLabels = {
        appalachian: "Appalachian & Limestone (East)",
        rocky_mountain: "Rocky Mountain Tailwaters (West)",
        pacific_coastal: "Pacific Rainforest & Coastal (NW)",
        boreal_shield: "Great Lakes & Boreal Shield (Midwest)",
        transitional_plains: "Midwest & Plains Rivers",
        warmwater_south: "Southern & Coastal Plain"
      };

      currentConditions.biome = detectedBiome;

      // Fetch weather + USGS in parallel
      let weatherHtml = "";
      try {
        const [wxRes, usgsData] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`),
          fetchUSGSData(latitude, longitude)
        ]);

        const wx = await wxRes.json();
        const airTemp = Math.round(wx.current.temperature_2m);
        const windSpeed = Math.round(wx.current.wind_speed_10m);
        const humidity = wx.current.relative_humidity_2m;
        const { desc, emoji } = describeWeather(wx.current.weather_code);
        const estWaterTemp = estimateWaterTemp(airTemp);

        // Use real USGS water temp if available, otherwise use estimate
        const finalWaterTemp = usgsData ? usgsData.waterTemp : estWaterTemp;
        currentConditions.waterTemp = finalWaterTemp;
        const slider = document.getElementById("temp-slider");
        const display = document.getElementById("temp-display");
        if (slider) slider.value = finalWaterTemp;
        if (display) display.innerText = `${finalWaterTemp}°F`;

        renderWeatherWidget({ airTemp, windSpeed, humidity, desc, emoji, estWaterTemp, usgs: usgsData });

        weatherHtml = usgsData
          ? `<span style="font-size:0.78rem; font-weight:400; color:#71717a;">${emoji} ${airTemp}°F air · <strong style="color:#10b981;">${usgsData.waterTemp}°F water (USGS live)</strong></span>`
          : `<span style="font-size:0.78rem; font-weight:400; color:#71717a;">${emoji} ${airTemp}°F air · ~${estWaterTemp}°F water est.</span>`;
      } catch (e) {
        console.warn("Weather fetch failed:", e);
      }

      if (gpsStatus) {
        gpsStatus.innerHTML = `📍 <strong>${biomeLabels[detectedBiome]}</strong><br>${weatherHtml}<br><span style="font-size:0.78rem; font-weight:400; color:#71717a;">Advancing in 2 seconds...</span>`;
      }

      matchTheHatch();
      setTimeout(() => advanceToNextScreen("step-region", "step-environment"), 2000);
    },
    (error) => {
      console.error("GPS error:", error);
      currentConditions.biome = "appalachian";
      matchTheHatch();
      advanceToNextScreen("step-region", "step-environment");
    }
  );
};

function renderWeatherWidget({ airTemp, windSpeed, humidity, desc, emoji, estWaterTemp, usgs }) {
  const widget = document.getElementById("weather-widget");
  if (!widget) return;
  widget.style.display = "block";

  const waterTempHtml = usgs
    ? `<span style="display:block; color:#10b981; font-weight:700;">${usgs.waterTemp}°F water <span style="font-size:0.7rem; font-weight:400; color:#52525b;">(USGS live)</span></span>`
    : `<span style="display:block; color:#10b981; font-weight:600;">~${estWaterTemp}°F water <span style="font-size:0.7rem; font-weight:400; color:#52525b;">(estimated)</span></span>`;

  const usgsHtml = usgs ? `
    <div style="margin-top:10px; padding-top:10px; border-top:1px solid #27272a; font-size:0.78rem; color:#71717a; line-height:1.8;">
      <span style="color:#a1a1aa; font-weight:600;">📍 ${usgs.siteName}</span><br>
      <span>Flow: <strong style="color:#e4e4e7;">${usgs.flow} CFS</strong></span>
      &nbsp;·&nbsp;
      <span>Stage: <strong style="color:#e4e4e7;">${usgs.stage} ft</strong></span>
      &nbsp;·&nbsp;
      <a href="https://waterdata.usgs.gov/monitoring-location/${usgs.siteNo}" target="_blank" style="color:#10b981; text-decoration:none;">Full gauge →</a>
    </div>` : "";

  widget.innerHTML = `
    <p style="font-size:0.72rem; font-weight:700; color:#71717a; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px;">📡 Live Conditions Near You</p>
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <span style="font-size:2rem; font-weight:700; color:#fff;">${airTemp}°F</span>
        <span style="font-size:0.88rem; color:#a1a1aa; margin-left:8px;">${emoji} ${desc}</span>
      </div>
      <div style="text-align:right; font-size:0.8rem; color:#71717a; line-height:1.8;">
        <span style="display:block;">💨 ${windSpeed} mph</span>
        <span style="display:block;">💧 ${humidity}% humidity</span>
        ${waterTempHtml}
      </div>
    </div>
    ${usgsHtml}
  `;
}

// Fetch nearest USGS stream gauge with water temp + flow data
async function fetchUSGSData(lat, lon) {
  const delta = 0.5; // ~35 mile bounding box
  const bbox = `${(lon - delta).toFixed(4)},${(lat - delta).toFixed(4)},${(lon + delta).toFixed(4)},${(lat + delta).toFixed(4)}`;

  try {
    const res = await fetch(
      `https://waterservices.usgs.gov/nwis/iv/?format=json&bBox=${bbox}&parameterCd=00010,00060,00065&siteType=ST&siteStatus=active`
    );
    const data = await res.json();
    const sites = data?.value?.timeSeries;
    if (!sites || sites.length === 0) return null;

    // Group by site, collect available parameters
    const siteMap = {};
    for (const ts of sites) {
      const siteNo = ts.sourceInfo.siteCode[0].value;
      const siteName = ts.sourceInfo.siteName;
      const siteGeo = ts.sourceInfo.geoLocation.geogLocation;
      const paramCode = ts.variable.variableCode[0].value;
      const value = parseFloat(ts.values[0]?.value[0]?.value);

      if (!siteMap[siteNo]) {
        siteMap[siteNo] = { siteNo, siteName, lat: siteGeo.latitude, lon: siteGeo.longitude };
      }
      if (paramCode === "00010" && !isNaN(value)) siteMap[siteNo].waterTempC = value;
      if (paramCode === "00060" && !isNaN(value)) siteMap[siteNo].flow = Math.round(value);
      if (paramCode === "00065" && !isNaN(value)) siteMap[siteNo].stage = value.toFixed(2);
    }

    // Find closest site that has water temp data
    const sitesWithTemp = Object.values(siteMap).filter(s => s.waterTempC !== undefined);
    if (sitesWithTemp.length === 0) return null;

    const closest = sitesWithTemp.reduce((best, site) => {
      const dist = Math.hypot(site.lat - lat, site.lon - lon);
      return dist < Math.hypot(best.lat - lat, best.lon - lon) ? site : best;
    });

    const waterTempF = Math.round(closest.waterTempC * 9 / 5 + 32);

    return {
      siteNo: closest.siteNo,
      siteName: closest.siteName.replace(/ AT .+/, "").replace(/ NR .+/, "").trim(),
      waterTemp: waterTempF,
      flow: closest.flow ?? "N/A",
      stage: closest.stage ?? "N/A"
    };
  } catch (e) {
    console.warn("USGS fetch failed:", e);
    return null;
  }
}

// Manual region button selection handler
window.selectRegion = (regionName) => {
  if (!regionName) return;
  console.log(`Manual region selection registered: ${regionName}`);
  
  // Set the core tracking state to the exact string passed by your button
  currentConditions.biome = regionName;

  // Run the filter calculations
  matchTheHatch();
  
  // Smoothly slide the user from step-region into step-environment
  advanceToNextScreen("step-region", "step-environment");
};

// Manual environment button selection handler (River vs Lake)
window.selectEnvironment = (envType) => {
  if (!envType) return;
  console.log(`Manual environment selection registered: ${envType}`);
  
  // Map the HTML choice over to our tracking states
  // if it's lake/pond, we swap the water type default over to stillwater
  if (envType === 'lake_pond') {
    currentConditions.waterType = "stillwater";
  } else {
    currentConditions.waterType = "freestone"; // baseline default for moving water
  }

  // Recalculate match filtering
  matchTheHatch();
  
  // Advance the wizard to the target species panel
  advanceToNextScreen("step-environment", "step-temp");
};

// Handles submission from the temperature slider panel
window.submitTemp = () => {
  const tempSlider = document.getElementById("temp-slider");
  if (!tempSlider) {
    console.warn("⚠️ Temperature slider element not found in DOM.");
    // Fallback and advance anyway if the element is missing
    advanceToNextScreen("step-temp", "step-water");
    return;
  }

  const selectedValue = Number(tempSlider.value);
  console.log(`Water temperature submitted: ${selectedValue}°F`);

  // Assign the dynamic temperature to our core filter state
  currentConditions.waterTemp = selectedValue;

  // Run the calculations across the 101 profiles
  matchTheHatch();

  // Advance the wizard to the water speed/type screen
  advanceToNextScreen("step-temp", "step-water");
};

// Global inline slider tracking fallback wrapper
window.updateTempDisplay = (value) => {
  const display = document.getElementById("temp-display");
  if (display) display.innerText = `${value}°F`;
};

// Manual water flow type selection handler (Riffle, Run, Pool)
window.selectWater = (waterFlow) => {
  if (!waterFlow) return;
  console.log(`Water flow selection registered: ${waterFlow}`);
  
  // Normalize the input or map it directly to our stream profile state
  currentConditions.waterType = waterFlow;

  // Run the calculations across the 101 flat-schema profiles
  matchTheHatch();
  
  // Slide the user into the final active hatch display panel!
  advanceToNextScreen("step-water", "step-rise");
};

// HTML onClick -> selectRise('bulging')
window.selectRise = (waterType, assumedTemp) => {
  console.log(`Rise strategy assigned: ${waterType}`);
  currentConditions.waterType = waterType;
  if (assumedTemp) currentConditions.waterTemp = assumedTemp;
  
  // Calculate final matches
  matchTheHatch();

  // Advance to the final results screen!
  advanceToNextScreen("step-rise", "step-results");
};

// ============================================================================
// AI RECOMMEND
// ============================================================================

window.submitAiRecommend = async () => {
  const prompt = document.getElementById("ai-prompt").value.trim();
  if (!prompt) return;

  const result = document.getElementById("ai-recommend-result");
  const btn = document.querySelector("#step-ai-recommend .btn-vault[onclick='submitAiRecommend()']");
  result.style.display = "block";
  result.innerHTML = `<span style="color:#71717a;">🤖 Thinking...</span>`;
  if (btn) { btn.disabled = true; btn.textContent = "Thinking..."; }

  try {
    const res = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        conditions: {
          biome: currentConditions.biome,
          month: new Date().toLocaleString("default", { month: "long" }),
          waterTemp: currentConditions.waterTemp + "°F",
          waterType: currentConditions.waterType
        }
      })
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { throw new Error(`Server returned: ${text.slice(0, 120)}`); }
    if (data.error) throw new Error(data.error);
    // Bold any **text** markdown
    const html = data.answer.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e4e4e7;">$1</strong>');
    result.innerHTML = html;
  } catch (err) {
    result.innerHTML = `<span style="color:#ef4444;">Error: ${err.message}. Check your API key is set in Vercel.</span>`;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "🤖 Get Recommendation"; }
  }
};

// ============================================================================
// PHOTO BUG MATCH
// ============================================================================

let photoBase64 = null;
let photoMediaType = "image/jpeg";

window.handlePhotoUpload = (input) => {
  const file = input.files[0];
  if (!file) return;
  photoMediaType = file.type || "image/jpeg";

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    photoBase64 = dataUrl.split(",")[1];

    const preview = document.getElementById("photo-preview");
    const wrap = document.getElementById("photo-preview-wrap");
    const submitBtn = document.getElementById("photo-submit-btn");
    const resultDiv = document.getElementById("photo-match-result");

    preview.src = dataUrl;
    wrap.style.display = "block";
    submitBtn.style.display = "flex";
    resultDiv.style.display = "none";
    resultDiv.innerHTML = "";
  };
  reader.readAsDataURL(file);
};

window.submitPhotoMatch = async () => {
  if (!photoBase64) return;

  const result = document.getElementById("photo-match-result");
  const btn = document.getElementById("photo-submit-btn");
  result.style.display = "block";
  result.innerHTML = `<span style="color:#71717a;">🔍 Identifying insect...</span>`;
  btn.disabled = true;
  btn.textContent = "Identifying...";

  try {
    const res = await fetch("/api/photo-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: photoBase64, mediaType: photoMediaType })
    });
    const data = await res.json();

    if (data.error) {
      result.innerHTML = `<p style="color:#a1a1aa;">${data.error}</p>`;
      return;
    }

    const confidenceColor = data.confidence === "high" ? "#10b981" : data.confidence === "medium" ? "#f59e0b" : "#ef4444";
    const patternsHtml = (data.patterns || []).map(p => {
      const fly = hatchDatabase.find(f => f.name.toLowerCase() === p.toLowerCase());
      const clickable = fly
        ? `onclick="openPatternDetail('${fly.id}', 'step-photo-match')" style="cursor:pointer; color:#10b981; text-decoration:underline; text-underline-offset:2px;"`
        : `style="color:#e4e4e7;"`;
      return `<li ${clickable}>${p}</li>`;
    }).join("");

    result.innerHTML = `
      <div style="margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid #27272a;">
        <p style="font-size:1rem; font-weight:700; color:#fff; margin:0 0 4px;">${data.insect}</p>
        <div style="display:flex; gap:8px; align-items:center;">
          <span style="font-size:0.72rem; color:#10b981; background:#052e16; border:1px solid #166534; padding:2px 8px; border-radius:20px; text-transform:uppercase;">${data.stage}</span>
          <span style="font-size:0.72rem; color:${confidenceColor}; font-weight:600;">${data.confidence} confidence</span>
        </div>
      </div>
      <p style="font-size:0.78rem; font-weight:700; color:#71717a; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px;">Recommended Patterns</p>
      <ul style="margin:0 0 12px; padding-left:20px; font-size:0.9rem; line-height:1.8;">${patternsHtml}</ul>
      <p style="font-size:0.82rem; color:#a1a1aa; margin:0;"><strong style="color:#d4d4d8;">Size:</strong> ${data.sizes || "Match the hatch"}</p>
      ${data.notes ? `<p style="font-size:0.82rem; color:#a1a1aa; margin-top:6px;">${data.notes}</p>` : ""}
    `;
  } catch (err) {
    result.innerHTML = `<span style="color:#ef4444;">Error: ${err.message}</span>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "🔍 Identify & Match";
  }
};

// ============================================================================
// SHARE RESULTS CARD
// ============================================================================

let lastMatchedFlies = [];

window.shareResults = () => {
  const flies = lastMatchedFlies.slice(0, 5);
  if (flies.length === 0) return;

  const biomeLabels = {
    appalachian: "Appalachian & Limestone",
    rocky_mountain: "Rocky Mountain",
    pacific_coastal: "Pacific Rainforest & Coastal",
    boreal_shield: "Great Lakes & Boreal Shield",
    transitional_plains: "Midwest & Plains",
    warmwater_south: "Southern & Coastal Plain"
  };

  const monthName = new Date().toLocaleString("default", { month: "long" });
  const biome = biomeLabels[currentConditions.biome] || currentConditions.biome;

  // Draw card on canvas
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#141417";
  ctx.fillRect(0, 0, 1080, 1080);

  // Green accent bar top
  ctx.fillStyle = "#10b981";
  ctx.fillRect(0, 0, 1080, 8);

  // App name
  ctx.fillStyle = "#10b981";
  ctx.font = "bold 52px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("🎣 Hatch Matcher", 80, 100);

  // Tagline
  ctx.fillStyle = "#71717a";
  ctx.font = "32px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("hatchmatcher.app", 80, 150);

  // Divider
  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 175);
  ctx.lineTo(1000, 175);
  ctx.stroke();

  // Conditions
  ctx.fillStyle = "#a1a1aa";
  ctx.font = "28px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(`📍 ${biome}   📅 ${monthName}   🌡️ ${currentConditions.waterTemp}°F`, 80, 225);

  // Section label
  ctx.fillStyle = "#52525b";
  ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("TOP MATCHED PATTERNS", 80, 285);

  // Fly cards
  flies.forEach((fly, i) => {
    const y = 310 + i * 140;
    // Card bg
    ctx.fillStyle = "#202023";
    roundRect(ctx, 80, y, 920, 120, 16);
    ctx.fill();

    // Green dot
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(120, y + 60, 8, 0, Math.PI * 2);
    ctx.fill();

    // Fly name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(fly.name, 148, y + 48);

    // Species + size
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "26px -apple-system, BlinkMacSystemFont, sans-serif";
    const sizeStr = fly.size_range && fly.size_range.length > 0 ? `  ·  #${fly.size_range.slice(0,2).join(", #")}` : "";
    ctx.fillText(`${fly.imitation_species}${sizeStr}`, 148, y + 88);

    // Stage pill
    ctx.fillStyle = "#052e16";
    roundRect(ctx, 870, y + 38, 110, 44, 22);
    ctx.fill();
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(fly.stage.toUpperCase(), 925, y + 66);
    ctx.textAlign = "left";
  });

  // Bottom label
  ctx.fillStyle = "#3f3f46";
  ctx.font = "24px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("Free fly fishing app — match the hatch, build your box, tie the pattern.", 80, 1040);

  // Convert to blob and share
  canvas.toBlob(async (blob) => {
    const file = new File([blob], "hatch-matcher-results.png", { type: "image/png" });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Hatch Matcher Results",
          text: `Fishing ${biome} in ${monthName} — here's what I'm throwing. hatchmatcher.app`
        });
        return;
      } catch {}
    }
    // Fallback: download the image
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hatch-matcher-results.png";
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ============================================================================
// PATTERN OF THE WEEK
// ============================================================================

function renderPatternOfWeek() {
  const banner = document.getElementById("pattern-of-week");
  if (!banner || hatchDatabase.length === 0) return;

  // Pick a pattern deterministically by ISO week number so it's the same for all users
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.floor((now - startOfYear) / (7 * 24 * 60 * 60 * 1000));
  const month = now.getMonth() + 1;

  // Prefer patterns active this month for relevance
  const active = hatchDatabase.filter(f => (f.months || []).includes(month));
  const pool = active.length >= 5 ? active : hatchDatabase;
  const fly = pool[weekNum % pool.length];
  if (!fly) return;

  const cfg = DIFFICULTY_CONFIG[fly.difficulty] || {};
  banner.style.display = "block";
  banner.innerHTML = `
    <p style="font-size:0.72rem; font-weight:700; color:#71717a; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px;">⭐ Pattern of the Week</p>
    <div onclick="openPatternDetail('${fly.id}', 'step-home')" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <p style="margin:0 0 2px; color:#e4e4e7; font-size:1rem; font-weight:700;">${fly.name}</p>
        <p style="margin:0; color:#71717a; font-size:0.78rem; font-style:italic;">${fly.imitation_species}</p>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0; margin-left:12px;">
        <span style="font-size:0.65rem; color:#10b981; background:#052e16; border:1px solid #166534; padding:2px 7px; border-radius:20px; text-transform:uppercase;">${fly.stage}</span>
        ${fly.difficulty ? `<span style="font-size:0.65rem; color:${cfg.color}; background:${cfg.bg}; border:1px solid ${cfg.border}; padding:2px 7px; border-radius:20px; text-transform:uppercase;">${fly.difficulty}</span>` : ""}
      </div>
    </div>
    <p style="margin:8px 0 0; font-size:0.75rem; color:#52525b;">Tap to see the full recipe →</p>
  `;
}

// ============================================================================
// HATCHING NOW BANNER
// ============================================================================

function renderHatchingNow() {
  const banner = document.getElementById("hatching-now");
  if (!banner || hatchDatabase.length === 0) return;

  const month = new Date().getMonth() + 1;
  // Try GPS-detected biome from currentConditions, default to Northeast
  let databaseBiome = "Northeast";
  const b = currentConditions.biome;
  if (b === "appalachian" || b === "Northeast") databaseBiome = "Northeast";
  else if (b === "rocky_mountain") databaseBiome = "Rocky Mountain";
  else if (b === "pacific_coastal") databaseBiome = "Pacific Northwest";
  else if (b === "boreal_shield" || b === "transitional_plains") databaseBiome = "Midwest";
  else if (b === "warmwater_south") databaseBiome = "Southeast";

  const monthName = new Date().toLocaleString("default", { month: "long" });

  const active = hatchDatabase.filter(fly => {
    const biomeMatch = (fly.biomes || []).map(x => x.toLowerCase()).includes(databaseBiome.toLowerCase());
    const monthMatch = (fly.months || []).includes(month);
    return biomeMatch && monthMatch;
  });

  if (active.length === 0) {
    banner.style.display = "none";
    return;
  }

  // Pick 3 diverse patterns (one dun/dry, one nymph, one other)
  const picks = [];
  const want = ["dun", "emerger", "nymph", "streamer", "terrestrial", "spinner"];
  const used = new Set();
  for (const stage of want) {
    if (picks.length >= 3) break;
    const match = active.find(f => f.stage === stage && !used.has(f.id));
    if (match) { picks.push(match); used.add(match.id); }
  }

  banner.style.display = "block";
  banner.innerHTML = `
    <p style="font-size:0.72rem; font-weight:700; color:#71717a; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px;">🌿 Hatching Now — ${monthName}</p>
    ${picks.map(fly => `
      <div onclick="openPatternDetail('${fly.id}', 'step-home')" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #27272a;">
        <span style="color:#e4e4e7; font-size:0.88rem; font-weight:600;">${fly.name}</span>
        <span style="font-size:0.65rem; color:#10b981; background:#052e16; border:1px solid #166534; padding:2px 7px; border-radius:20px; text-transform:uppercase;">${fly.stage}</span>
      </div>`).join("")}
    <p style="font-size:0.75rem; color:#52525b; margin-top:8px; margin-bottom:0;">${active.length} patterns active this month →</p>
  `;
}

// ============================================================================
// SHARE BOX
// ============================================================================

window.shareBox = (biome, month) => {
  const url = new URL(window.location.href);
  url.searchParams.set("share_biome", biome);
  url.searchParams.set("share_month", month);
  const shareUrl = url.toString();

  if (navigator.share) {
    navigator.share({ title: "My Hatch Matcher Box", url: shareUrl })
      .catch(() => copyToClipboard(shareUrl));
  } else {
    copyToClipboard(shareUrl);
  }
};

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("share-box-btn");
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = "✓ Link Copied!";
      btn.style.color = "#10b981";
      setTimeout(() => { btn.textContent = orig; btn.style.color = ""; }, 2000);
    }
  }).catch(() => alert("Copy this link: " + text));
}

function loadSharedBox() {
  const params = new URLSearchParams(window.location.search);
  const biome = params.get("share_biome");
  const month = parseInt(params.get("share_month"));
  if (biome && month) {
    boxBuilderBiome = biome;
    // Clean URL without reloading
    window.history.replaceState({}, "", window.location.pathname);
    // Delay to let DB finish loading
    setTimeout(() => selectBoxMonth(month), 100);
  }
}

// ============================================================================
// BOX BUILDER ENGINE
// ============================================================================

let boxBuilderBiome = null;

window.selectBoxRegion = (region) => {
  boxBuilderBiome = region;
  advanceToNextScreen("step-box-region", "step-box-month");
};

window.selectBoxMonth = (month) => {
  const biome = boxBuilderBiome;
  let databaseBiome = biome;
  if (biome === "appalachian") databaseBiome = "Northeast";
  if (biome === "rocky_mountain") databaseBiome = "Rocky Mountain";
  if (biome === "pacific_coastal") databaseBiome = "Pacific Northwest";
  if (biome === "boreal_shield") databaseBiome = "Midwest";
  if (biome === "transitional_plains") databaseBiome = "Midwest";
  if (biome === "warmwater_south") databaseBiome = "Southeast";

  const biomeLabels = {
    appalachian: "Appalachian & Limestone",
    rocky_mountain: "Rocky Mountain",
    pacific_coastal: "Pacific Rainforest & Coastal",
    boreal_shield: "Great Lakes & Boreal Shield",
    transitional_plains: "Midwest & Plains",
    warmwater_south: "Southern & Coastal Plain"
  };
  const monthName = new Date(2000, month - 1).toLocaleString("default", { month: "long" });

  // Match by biome + month only (no temp/water type — user hasn't been there yet)
  const matches = hatchDatabase.filter(fly => {
    const biomeMatch = (fly.biomes || []).map(b => b.toLowerCase()).includes(databaseBiome.toLowerCase());
    const monthMatch = (fly.months || []).includes(month);
    return biomeMatch && monthMatch;
  });

  // Build a diverse box: prioritize variety across stages
  const stageOrder = ["dun", "emerger", "nymph", "spinner", "streamer", "terrestrial"];
  const box = [];
  const used = new Set();
  for (const stage of stageOrder) {
    const stagePicks = matches.filter(f => f.stage === stage && !used.has(f.id));
    stagePicks.slice(0, 3).forEach(f => { box.push(f); used.add(f.id); });
  }
  // Fill remaining slots from any leftover matches (up to 12 total)
  matches.filter(f => !used.has(f.id)).slice(0, Math.max(0, 12 - box.length)).forEach(f => box.push(f));

  const context = document.getElementById("box-context");
  const list = document.getElementById("box-list");

  if (context) {
    context.innerHTML = `<span style="color:#e4e4e7; font-weight:600;">📍 ${biomeLabels[biome] || biome}</span> &nbsp;·&nbsp; 📅 ${monthName} &nbsp;·&nbsp; <span style="color:#10b981;">${box.length} patterns recommended</span>`;
  }

  if (list) {
    if (box.length === 0) {
      list.innerHTML = `<div style="padding:20px; background:#202023; border:1px dashed #3f3f46; border-radius:12px; text-align:center;"><p style="color:#a1a1aa;">No hatches mapped for this region and month. Year-round attractors like Prince Nymph, Woolly Bugger, and Elk Hair Caddis are safe bets.</p></div>`;
    } else {
      list.innerHTML = box.map(fly => {
        const sizes = fly.size_range && fly.size_range.length > 0 ? `#${fly.size_range.join(", #")}` : "";
        return `
          <div onclick="openPatternDetail('${fly.id}', 'step-box-results')" style="cursor:pointer; padding:12px 14px; background:#202023; border:1px solid #27272a; border-radius:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; transition: border-color 0.15s;" onmouseover="this.style.borderColor='#10b981'" onmouseout="this.style.borderColor='#27272a'">
            <div>
              <span style="color:#e4e4e7; font-size:0.9rem; font-weight:600;">${fly.name}</span>
              ${sizes ? `<span style="display:block; font-size:0.72rem; color:#71717a; margin-top:2px;">${sizes}</span>` : ""}
            </div>
            <span style="font-size:0.68rem; color:#10b981; background:#052e16; border:1px solid #166534; padding:2px 7px; border-radius:20px; text-transform:uppercase; letter-spacing:0.05em; white-space:nowrap; margin-left:8px;">${fly.stage}</span>
          </div>`;
      }).join("");
    }
  }

  // Wire up share buttons
  const shareBtn = document.getElementById("share-box-btn");
  if (shareBtn) shareBtn.onclick = () => shareBox(biome, month);

  const shareImgBtn = document.getElementById("share-box-image-btn");
  if (shareImgBtn) shareImgBtn.onclick = () => shareBoxImage(biomeLabels[biome] || biome, monthName, box);

  advanceToNextScreen("step-box-month", "step-box-results");
};

// ============================================================================
// PATTERN DETAIL VIEW
// ============================================================================

let patternDetailReturnScreen = "step-results";

window.openPatternDetail = (flyId, returnScreen) => {
  const fly = hatchDatabase.find(f => f.id === flyId);
  if (!fly) return;

  patternDetailReturnScreen = returnScreen || "step-results";

  const sizes = fly.size_range && fly.size_range.length > 0 ? `#${fly.size_range.join(", #")}` : "Universal";
  const materials = fly.tying_materials || [];
  const steps = fly.recipe_steps || [];
  const hookLine = fly.recipe_hook ? `<p style="margin:0 0 4px; color:#d4d4d8; font-size:0.85rem;"><span style="color:#a1a1aa; font-weight:600;">Hook:</span> ${fly.recipe_hook}</p>` : "";
  const threadLine = fly.recipe_thread ? `<p style="margin:0 0 12px; color:#d4d4d8; font-size:0.85rem;"><span style="color:#a1a1aa; font-weight:600;">Thread:</span> ${fly.recipe_thread}</p>` : "";

  const stepsHtml = steps.length > 0 ? `
    <p style="margin:14px 0 6px; font-weight:700; color:#a1a1aa; font-size:0.82rem; text-transform:uppercase; letter-spacing:0.06em;">🪝 Tying Steps</p>
    <ol style="margin:0; padding-left:20px; color:#d4d4d8; line-height:1.6; font-size:0.85rem;">
      ${steps.map(s => `<li style="margin-bottom:6px;">${s}</li>`).join("")}
    </ol>` : "";

  const isFav = favorites.has(fly.id);
  const html = `
    <div style="background:#1c1c1f; border:1px solid #27272a; border-radius:14px; padding:20px; margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; padding-bottom:14px; border-bottom:1px solid #27272a;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
            <h2 style="color:#10b981; margin:0; font-size:1.4rem;">${fly.name}</h2>
            <button id="detail-fav-btn" onclick="toggleFavorite('${fly.id}', this)" style="background:none; border:none; cursor:pointer; font-size:1.4rem; color:${isFav ? "#f59e0b" : "#52525b"}; padding:0; line-height:1;">${isFav ? "★" : "☆"}</button>
          </div>
          <p style="margin:0; font-size:0.82rem; color:#71717a; font-style:italic;">${fly.imitation_species}</p>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px; margin-left:12px; flex-shrink:0;">
          <span style="font-size:0.7rem; color:#10b981; background:#052e16; border:1px solid #166534; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.05em; white-space:nowrap;">${fly.stage}</span>
          ${difficultyBadge(fly.difficulty)}
        </div>
      </div>
      <p style="margin:0 0 12px; color:#d4d4d8; font-size:0.85rem;"><span style="color:#a1a1aa; font-weight:600;">Hook Size:</span> ${sizes}</p>
      ${hookLine}${threadLine}
      <p style="margin:0 0 6px; font-weight:700; color:#a1a1aa; font-size:0.82rem; text-transform:uppercase; letter-spacing:0.06em;">📐 Materials</p>
      <ul style="margin:0 0 4px; padding-left:20px; color:#d4d4d8; line-height:1.6; font-size:0.85rem;">
        ${materials.map(m => `<li style="margin-bottom:3px;">${m}</li>`).join("")}
      </ul>
      ${stepsHtml}
      ${fly.target_species && fly.target_species.length > 0 ? `
        <p style="margin:14px 0 6px; font-weight:700; color:#a1a1aa; font-size:0.82rem; text-transform:uppercase; letter-spacing:0.06em;">🎯 Target Species</p>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${fly.target_species.map(s => {
            const found = SPECIES_LIST.find(x => x.key === s);
            return `<span style="font-size:0.75rem; background:#202023; border:1px solid #3f3f46; padding:3px 10px; border-radius:20px; color:#a1a1aa;">${found ? found.label : s}</span>`;
          }).join("")}
        </div>` : ""}
    </div>
  `;

  const reportLink = `mailto:rpeoples@gmail.com?subject=Hatch Matcher Error Report: ${encodeURIComponent(fly.name)}&body=Pattern: ${encodeURIComponent(fly.name)}%0AID: ${fly.id}%0A%0AWhat's wrong:%0A`;

  document.getElementById("pattern-detail-content").innerHTML = html + `
    <div style="text-align:center; margin-top:4px;">
      <a href="${reportLink}" style="font-size:0.75rem; color:#52525b; text-decoration:none;">⚠️ Report an error in this pattern</a>
    </div>
  `;

  const backBtn = document.getElementById("pattern-back-btn");
  backBtn.onclick = () => advanceToNextScreen("step-pattern-detail", patternDetailReturnScreen);

  advanceToNextScreen(patternDetailReturnScreen, "step-pattern-detail");
};

// HTML onClick -> resetApp() (Handles the Restart Matcher button)
window.resetApp = () => {
  console.log("🔄 Resetting app layout back to step-region...");
  
  // Reset runtime conditions back to baselines if desired
  currentConditions.biome = "appalachian";
  currentConditions.waterTemp = 55;
  currentConditions.waterType = "freestone";

  // Scan for the active screen container and manually force it back to step-region
  const activeScreen = document.querySelector(".screen-container.active");
  if (activeScreen) {
    activeScreen.classList.remove("active");
  }

  const initialScreen = document.getElementById("step-home");
  if (initialScreen) {
    initialScreen.classList.add("active");
  }
};
// ============================================================================
// 8. STANDALONE TYING VAULT SEARCH ENGINE
// ============================================================================

// Groups for vault browse display
const VAULT_GROUPS = [
  { label: "🪲 Mayflies", species: ["Baetis", "Ephemerella subvaria", "Ephemerella invaria", "Ephemera guttulata", "Stenonema", "Ephemerella excrucians", "Tricorythodes", "Rhithrogena morrisoni", "Epeorus pleuralis", "Isonychia bicolor"] },
  { label: "🦋 Caddisflies", species: ["Hydropsyche", "Brachycentrus", "Dicosmoecus", "Cheumatopsyche"] },
  { label: "🪨 Stoneflies", species: ["Pteronarcys californica", "Hesperoperla pacifica", "Isoperla", "Capniidae"] },
  { label: "🦟 Midges", species: ["Chironomidae", "Chironomus Muticus"] },
  { label: "🪱 Worms & Attractors", species: ["Annelida", "Attractor Nymph"] },
  { label: "🌿 Terrestrials", species: ["Formicidae", "Orthoptera", "Coleoptera"] },
  { label: "🐟 Streamers", species: ["Anisoptera (Imitation)", "Cottidae (Imitation)"] }
];

const ALL_STAGES = ["nymph", "emerger", "dun", "spinner", "terrestrial", "streamer"];
let activeStageFilter = null;
let activeSpeciesFilter = null;
let activeDifficultyFilter = null;

const DIFFICULTY_CONFIG = {
  beginner:     { label: "🟢 Beginner",     color: "#10b981", bg: "#052e16", border: "#166534" },
  intermediate: { label: "🟡 Intermediate", color: "#f59e0b", bg: "#1c1500", border: "#92400e" },
  advanced:     { label: "🔴 Advanced",     color: "#ef4444", bg: "#1c0505", border: "#7f1d1d" }
};

function difficultyBadge(difficulty) {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  if (!cfg) return "";
  return `<span style="font-size:0.68rem; color:${cfg.color}; background:${cfg.bg}; border:1px solid ${cfg.border}; padding:2px 7px; border-radius:20px; text-transform:uppercase; letter-spacing:0.05em; white-space:nowrap;">${cfg.label}</span>`;
}

function difficultyPillsHtml(setFn) {
  return `
    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
      ${[{ key: null, label: "All Levels" }, ...Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map(({ key, label }) => {
        const isActive = activeDifficultyFilter === key;
        const cfg = key ? DIFFICULTY_CONFIG[key] : null;
        return `<button onclick="${setFn}(${key === null ? "null" : `'${key}'`})"
          style="padding:4px 10px; border-radius:20px; font-size:0.72rem; font-weight:600; cursor:pointer; border:1px solid ${isActive && cfg ? cfg.border : "#3f3f46"}; background:${isActive && cfg ? cfg.bg : "#202023"}; color:${isActive && cfg ? cfg.color : "#a1a1aa"};">
          ${label}
        </button>`;
      }).join("")}
    </div>`;
}

function applyDifficultyFilter(flies) {
  if (!activeDifficultyFilter) return flies;
  return flies.filter(f => f.difficulty === activeDifficultyFilter);
}

const SPECIES_LIST = [
  { key: "brown_trout",   label: "🟤 Brown Trout" },
  { key: "rainbow_trout", label: "🌈 Rainbow Trout" },
  { key: "brook_trout",   label: "🔵 Brook Trout" },
  { key: "steelhead",     label: "⚡ Steelhead" },
  { key: "salmon",        label: "🐟 Salmon" },
  { key: "whitefish",     label: "⚪ Whitefish" },
  { key: "bass",          label: "🎯 Bass" },
  { key: "carp",          label: "🟡 Carp" },
  { key: "panfish",       label: "🟠 Panfish" },
  { key: "grayling",      label: "💜 Grayling" }
];

function speciesPillsHtml(setFn) {
  return `
    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
      ${[{ key: null, label: "All Species" }, ...SPECIES_LIST].map(({ key, label }) => {
        const isActive = activeSpeciesFilter === key;
        return `<button onclick="${setFn}(${key === null ? "null" : `'${key}'`})"
          style="padding:4px 10px; border-radius:20px; font-size:0.72rem; font-weight:600; cursor:pointer; border:1px solid ${isActive ? "#10b981" : "#3f3f46"}; background:${isActive ? "#052e16" : "#202023"}; color:${isActive ? "#10b981" : "#a1a1aa"};">
          ${label}
        </button>`;
      }).join("")}
    </div>`;
}

function applySpeciesFilter(flies) {
  if (!activeSpeciesFilter) return flies;
  return flies.filter(f => (f.target_species || []).includes(activeSpeciesFilter));
}

function renderVaultBrowse(container) {
  const stagePillsHtml = `
    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
      ${["All", ...ALL_STAGES].map(stage => {
        const isActive = stage === "All" ? activeStageFilter === null : activeStageFilter === stage;
        return `<button onclick="setVaultStageFilter(${stage === "All" ? "null" : `'${stage}'`})"
          style="padding:4px 12px; border-radius:20px; font-size:0.75rem; font-weight:600; cursor:pointer; text-transform:capitalize; border:1px solid ${isActive ? "#10b981" : "#3f3f46"}; background:${isActive ? "#052e16" : "#202023"}; color:${isActive ? "#10b981" : "#a1a1aa"};">
          ${stage}
        </button>`;
      }).join("")}
    </div>
  `;

  const groupsHtml = VAULT_GROUPS.map(group => {
    let flies = hatchDatabase.filter(f => group.species.includes(f.imitation_species));
    if (activeStageFilter) flies = flies.filter(f => f.stage === activeStageFilter);
    flies = applySpeciesFilter(flies);
    flies = applyDifficultyFilter(flies);
    if (flies.length === 0) return "";
    return `
      <div style="margin-bottom:20px;">
        <p style="font-size:0.78rem; font-weight:700; color:#71717a; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px;">${group.label} — ${flies.length} pattern${flies.length === 1 ? "" : "s"}</p>
        ${flies.map(fly => {
          const sizes = fly.size_range && fly.size_range.length > 0 ? `#${fly.size_range.join(", #")}` : "";
          return `
            <div onclick="openPatternDetail('${fly.id}', 'step-search')" style="cursor:pointer; padding:10px 14px; background:#202023; border:1px solid #27272a; border-radius:10px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; transition: border-color 0.15s;" onmouseover="this.style.borderColor='#10b981'" onmouseout="this.style.borderColor='#27272a'">
              <div>
                <span style="color:#e4e4e7; font-size:0.88rem; font-weight:600;">${fly.name}</span>
                <span style="color:#52525b; font-size:0.75rem; margin-left:6px; font-style:italic;">${fly.imitation_species}</span>
                ${sizes ? `<span style="display:block; font-size:0.72rem; color:#71717a; margin-top:2px;">${sizes}</span>` : ""}
              </div>
              <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px; margin-left:8px; flex-shrink:0;">
                <span style="font-size:0.68rem; color:#10b981; background:#052e16; border:1px solid #166534; padding:2px 7px; border-radius:20px; text-transform:uppercase; letter-spacing:0.05em; white-space:nowrap;">${fly.stage}</span>
                ${difficultyBadge(fly.difficulty)}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }).join("");

  container.style.display = "block";
  container.innerHTML = stagePillsHtml + speciesPillsHtml("setVaultSpeciesFilter") + difficultyPillsHtml("setVaultDifficultyFilter") + groupsHtml;
}

window.setVaultStageFilter = (stage) => {
  activeStageFilter = stage;
  const container = document.getElementById("search-dropdown-results");
  const searchInput = document.getElementById("global-search");
  if (container && searchInput && !searchInput.value.trim()) {
    renderVaultBrowse(container);
  }
};

window.setVaultDifficultyFilter = (difficulty) => {
  activeDifficultyFilter = difficulty;
  const container = document.getElementById("search-dropdown-results");
  const searchInput = document.getElementById("global-search");
  if (container && searchInput && !searchInput.value.trim()) {
    renderVaultBrowse(container);
  }
};

window.setResultsSpeciesFilter = (species) => {
  activeSpeciesFilter = species;
  matchTheHatch();
};

window.setVaultSpeciesFilter = (species) => {
  activeSpeciesFilter = species;
  const container = document.getElementById("search-dropdown-results");
  const searchInput = document.getElementById("global-search");
  if (container && searchInput && !searchInput.value.trim()) {
    renderVaultBrowse(container);
  }
};

// Bind live telemetry search to the global input field after database load
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("global-search");
  const searchResults = document.getElementById("search-dropdown-results");

  if (!searchInput) return;

  // Show browse grid immediately when vault opens
  window.switchScreen = (currentId, nextId) => {
    const current = document.getElementById(currentId);
    const next = document.getElementById(nextId);
    if (current && next) {
      current.classList.remove("active");
      next.classList.add("active");
      if (nextId === "step-search" && hatchDatabase.length > 0 && !searchInput.value.trim()) {
        renderVaultBrowse(searchResults);
      }
    }
  };

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (!query) {
      renderVaultBrowse(searchResults);
      return;
    }

    const matchedRecipes = hatchDatabase.filter(fly => {
      const nameMatch = (fly.name || "").toLowerCase().includes(query);
      const speciesMatch = (fly.imitation_species || "").toLowerCase().includes(query);
      const stageMatch = (fly.stage || "").toLowerCase().includes(query);
      
      // Map across potential array field names from your schema generator
      const materials = fly.tying_materials || fly.recipe_materials || fly.materials || [];
      const materialMatch = materials.some(mat => mat.toLowerCase().includes(query));

      return nameMatch || speciesMatch || stageMatch || materialMatch;
    });

    searchResults.style.display = "block";

    if (matchedRecipes.length === 0) {
      searchResults.innerHTML = `
        <div style="padding: 16px; background: #202023; border: 1px solid #27272a; color: #a1a1aa; border-radius: 12px; font-size: 0.9rem;">
          No recipes found matching '${e.target.value}' in the current vault matrix.
        </div>
      `;
      return;
    }

    // Bulletproof inline styled recipe layout blocks
    searchResults.innerHTML = matchedRecipes.map(fly => {
      const materialsList = fly.tying_materials || ["Hook, thread, and standard dressings — recipe data loading."];
      const steps = fly.recipe_steps || [];
      const hookLine = fly.recipe_hook ? `<p style="margin: 0 0 4px 0; color: #d4d4d8; font-size: 0.82rem;"><span style="color: #a1a1aa; font-weight: 600;">Hook:</span> ${fly.recipe_hook}</p>` : '';
      const threadLine = fly.recipe_thread ? `<p style="margin: 0 0 10px 0; color: #d4d4d8; font-size: 0.82rem;"><span style="color: #a1a1aa; font-weight: 600;">Thread:</span> ${fly.recipe_thread}</p>` : '';
      const stepsHtml = steps.length > 0 ? `
        <p style="margin: 10px 0 6px 0; font-weight: 600; color: #a1a1aa; font-size: 0.82rem;">🪝 Tying Steps:</p>
        <ol style="margin: 0; padding-left: 20px; color: #d4d4d8; line-height: 1.5; font-size: 0.82rem;">
          ${steps.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
        </ol>` : '';

      return `
        <div style="padding: 16px; background: #202023; border: 1px solid #27272a; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #27272a; padding-bottom: 8px; margin-bottom: 10px;">
            <div>
              <h4 style="color: var(--accent-green); margin: 0; font-size: 1.05rem; font-weight: 700;">${fly.name}</h4>
              <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: #a1a1aa; font-style: italic;">${fly.imitation_species} (${fly.stage})</p>
            </div>
            <span style="font-family: monospace; font-size: 0.7rem; background: #18181b; padding: 2px 6px; border-radius: 4px; color: #71717a;">#${fly.id}</span>
          </div>
          <div style="font-size: 0.85rem; color: #e4e4e7;">
            ${hookLine}${threadLine}
            <p style="margin: 0 0 6px 0; font-weight: 600; color: #a1a1aa; font-size: 0.82rem;">📐 Materials:</p>
            <ul style="margin: 0; padding-left: 20px; color: #d4d4d8; line-height: 1.4; font-size: 0.82rem;">
              ${materialsList.map(mat => `<li style="margin-bottom: 2px;">${mat}</li>`).join('')}
            </ul>
            ${stepsHtml}
          </div>
        </div>
      `;
    }).join('');
  });
});

// ============================================================================
// SHARE BOX IMAGE CARD
// ============================================================================

window.shareBoxImage = (biomeLabel, monthName, box) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#141417";
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = "#10b981";
  ctx.fillRect(0, 0, 1080, 8);

  ctx.fillStyle = "#10b981";
  ctx.font = "bold 52px Arial, sans-serif";
  ctx.fillText("🎣 Hatch Matcher", 80, 100);

  ctx.fillStyle = "#71717a";
  ctx.font = "30px Arial, sans-serif";
  ctx.fillText("hatchmatcher.app", 80, 148);

  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(80, 172); ctx.lineTo(1000, 172); ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px Arial, sans-serif";
  ctx.fillText(`📦 My Box — ${biomeLabel}`, 80, 225);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "28px Arial, sans-serif";
  ctx.fillText(`📅 ${monthName}  ·  ${box.length} patterns`, 80, 268);

  const cols = 2;
  const cardW = 460, cardH = 72, gapX = 40, gapY = 16;
  const startX = 80, startY = 310;

  box.slice(0, 12).forEach((fly, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    ctx.fillStyle = "#202023";
    ctx.beginPath();
    ctx.roundRect(x, y, cardW, cardH, 10);
    ctx.fill();

    ctx.fillStyle = "#e4e4e7";
    ctx.font = "bold 22px Arial, sans-serif";
    ctx.fillText(fly.name, x + 16, y + 28);

    ctx.fillStyle = "#71717a";
    ctx.font = "18px Arial, sans-serif";
    const sizes = fly.size_range?.length ? `#${fly.size_range.join(", #")}` : "";
    ctx.fillText(`${fly.stage}${sizes ? "  " + sizes : ""}`, x + 16, y + 54);
  });

  ctx.fillStyle = "#10b981";
  ctx.fillRect(0, 1072, 1080, 8);

  canvas.toBlob(blob => {
    const file = new File([blob], "my-fly-box.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ title: "My Fly Box — Hatch Matcher", files: [file] });
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "my-fly-box.png";
      a.click();
    }
  });
};

// ============================================================================
// AUDIT VIEW
// ============================================================================

window.openAuditView = () => {
  const screen = document.getElementById("step-audit");
  if (!screen) return;

  const bySpecies = {};
  hatchDatabase.forEach(fly => {
    const s = fly.imitation_species || "Unknown";
    if (!bySpecies[s]) bySpecies[s] = [];
    bySpecies[s].push(fly);
  });

  const html = Object.entries(bySpecies).sort(([a],[b]) => a.localeCompare(b)).map(([species, flies]) => `
    <div style="background:#1c1c1f; border:1px solid #27272a; border-radius:12px; padding:16px; margin-bottom:10px;">
      <p style="font-size:0.72rem; font-weight:700; color:#10b981; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px;">${species}</p>
      ${flies.map(fly => {
        const sizes = fly.size_range?.length ? `#${fly.size_range.join(", #")}` : "—";
        const months = fly.months?.length ? fly.months.map(m => new Date(2000,m-1).toLocaleString("default",{month:"short"})).join(", ") : "—";
        const temps = fly.water_temp_range ? `${fly.water_temp_range.min_f}–${fly.water_temp_range.max_f}°F` : "—";
        const cfg = DIFFICULTY_CONFIG[fly.difficulty];
        return `
          <div style="padding:10px 0; border-bottom:1px solid #27272a;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="color:#e4e4e7; font-size:0.9rem; font-weight:600;">${fly.name}</span>
              ${cfg ? `<span style="font-size:0.65rem; color:${cfg.color}; background:${cfg.bg}; border:1px solid ${cfg.border}; padding:2px 7px; border-radius:20px;">${fly.difficulty}</span>` : ""}
            </div>
            <div style="font-size:0.75rem; color:#71717a; line-height:1.8;">
              <span>Stage: <strong style="color:#a1a1aa;">${fly.stage}</strong></span> &nbsp;·&nbsp;
              <span>Sizes: <strong style="color:#a1a1aa;">${sizes}</strong></span> &nbsp;·&nbsp;
              <span>Temps: <strong style="color:#a1a1aa;">${temps}</strong></span><br>
              <span>Months: <strong style="color:#a1a1aa;">${months}</strong></span><br>
              <span>Biomes: <strong style="color:#a1a1aa;">${(fly.biomes||[]).join(", ") || "—"}</strong></span>
            </div>
            <a href="mailto:rpeoples@gmail.com?subject=Pattern Correction: ${encodeURIComponent(fly.name)}&body=Pattern: ${encodeURIComponent(fly.name)}%0AID: ${fly.id}%0A%0AWhat needs fixing:%0A" style="display:inline-block; margin-top:6px; font-size:0.72rem; color:#52525b; text-decoration:none; border:1px solid #3f3f46; padding:3px 10px; border-radius:20px;">⚠️ Report correction</a>
          </div>`;
      }).join("")}
    </div>
  `).join("");

  screen.querySelector("#audit-content").innerHTML = `
    <p style="font-size:0.82rem; color:#71717a; margin-bottom:16px;">${hatchDatabase.length} patterns · ${Object.keys(bySpecies).length} species · use the report button on any pattern to flag a correction</p>
    ${html}
  `;

  switchScreen("step-about", "step-audit");
};

// ============================================================================
// QR CODE
// ============================================================================

window.showQRCode = () => {
  document.getElementById("qr-modal").style.display = "flex";
};

window.downloadQRCard = () => {
  const card = document.createElement("canvas");
  card.width = 600;
  card.height = 800;
  const ctx = card.getContext("2d");

  const qrImg = new Image();
  qrImg.crossOrigin = "anonymous";
  qrImg.src = "https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=https://hatchmatcher.app&color=000000&bgcolor=ffffff&margin=1";

  qrImg.onload = () => {
    // Background
    ctx.fillStyle = "#141417";
    ctx.fillRect(0, 0, 600, 800);

    // Green top bar
    ctx.fillStyle = "#10b981";
    ctx.fillRect(0, 0, 600, 8);

    // App name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Hatch Matcher", 300, 90);

    // Tagline
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 22px Arial, sans-serif";
    ctx.fillText("Match the hatch. Tie the right fly.", 300, 130);

    // White QR box
    const qrX = 160, qrY = 165, qrSize = 280, pad = 16;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 16);
    ctx.fill();
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // URL
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "24px Arial, sans-serif";
    ctx.fillText("hatchmatcher.app", 300, 510);

    // Divider
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 540); ctx.lineTo(540, 540);
    ctx.stroke();

    // Feature bullets
    ctx.textAlign = "left";
    ctx.fillStyle = "#d4d4d8";
    ctx.font = "20px Arial, sans-serif";
    const features = [
      "🪰  Match the hatch by conditions",
      "📦  Plan your fly box by region & month",
      "📖  122 patterns with full tying recipes",
      "🌡️  Live USGS stream gauge & weather",
      "🤖  AI guide & photo bug identification",
      "✅  Free. No ads. Always."
    ];
    features.forEach((f, i) => ctx.fillText(f, 70, 580 + i * 34));

    // Bottom bar
    ctx.fillStyle = "#10b981";
    ctx.fillRect(0, 792, 600, 8);

    const link = document.createElement("a");
    link.download = "hatchmatcher-qr.png";
    link.href = card.toDataURL("image/png");
    link.click();
  };

  qrImg.onerror = () => alert("Could not generate card — check your internet connection.");
};
