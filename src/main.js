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

// Automated streamside detection
window.detectLocation = () => {
  if (!navigator.geolocation) {
    alert("Location services are not supported by your browser configuration.");
    return;
  }

  const gpsStatus = document.getElementById("gps-status");
  if (gpsStatus) {
    gpsStatus.style.display = "block";
    gpsStatus.innerText = "🛰️ Resolving stream coordinates...";
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      let detectedBiome = "appalachian"; // Default fallback to PA limestone country
      
      // Coordinate mapping tailored to your specific biome keys
      if (longitude < -105) {
        detectedBiome = "rocky_mountain";
      } else if (longitude < -120) {
        detectedBiome = "pacific_coastal";
      } else if (longitude < -80 && longitude > -97) {
        detectedBiome = "boreal_shield";
      } else if (latitude < 36) {
        detectedBiome = "warmwater_south";
      }

      const biomeLabels = {
        appalachian: "Appalachian & Limestone (East)",
        rocky_mountain: "Rocky Mountain Tailwaters (West)",
        pacific_coastal: "Pacific Rainforest & Coastal (NW)",
        boreal_shield: "Great Lakes & Boreal Shield (Midwest)",
        transitional_plains: "Midwest & Plains Rivers",
        warmwater_south: "Southern & Coastal Plain"
      };

      console.log(`Banded location to biome: ${detectedBiome}`);
      currentConditions.biome = detectedBiome;

      if (gpsStatus) {
        gpsStatus.innerHTML = `📍 Detected: <strong>${biomeLabels[detectedBiome] || detectedBiome}</strong><br><span style="font-size:0.78rem; font-weight:400; color:#71717a;">Advancing in 2 seconds...</span>`;
      }

      matchTheHatch();

      setTimeout(() => {
        advanceToNextScreen("step-region", "step-environment");
      }, 2000);
    },
    (error) => {
      console.error("Error detecting location, defaulting to appalachian:", error);
      currentConditions.biome = "appalachian";
      matchTheHatch();
      advanceToNextScreen("step-region", "step-environment");
    }
  );
};

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
  ctx.fillText("hatch-matcher.vercel.app", 80, 150);

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
          text: `Fishing ${biome} in ${monthName} — here's what I'm throwing. hatch-matcher.vercel.app`
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

  // Wire up share button
  const shareBtn = document.getElementById("share-box-btn");
  if (shareBtn) {
    shareBtn.onclick = () => shareBox(biome, month);
  }

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
        <span style="font-size:0.7rem; color:#10b981; background:#052e16; border:1px solid #166534; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.05em; white-space:nowrap; margin-left:12px;">${fly.stage}</span>
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

  document.getElementById("pattern-detail-content").innerHTML = html;

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
              <span style="font-size:0.68rem; color:#10b981; background:#052e16; border:1px solid #166534; padding:2px 7px; border-radius:20px; text-transform:uppercase; letter-spacing:0.05em; white-space:nowrap; margin-left:8px;">${fly.stage}</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }).join("");

  container.style.display = "block";
  container.innerHTML = stagePillsHtml + speciesPillsHtml("setVaultSpeciesFilter") + groupsHtml;
}

window.setVaultStageFilter = (stage) => {
  activeStageFilter = stage;
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
