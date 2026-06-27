// ==========================================
// 1. APP STATE & CONFIGURATION
// ==========================================
let userSelections = { 
  region: 'appalachian', 
  environment: 'river_stream', // New: 'river_stream' or 'lake_pond'
  species: 'trout',            // New: 'trout', 'bass', 'panfish'
  waterTemp: 55, 
  currentMonth: new Date().getMonth() + 1, 
  waterType: 'pool',           // Default value for lakes to pass filter math safely
  riseForm: '' 
};
let hatchDatabase = [];

async function loadHatchData() {
  try {
    const response = await fetch('/hatches.json');
    hatchDatabase = await response.json();
    console.log("✓ Hatch database loaded successfully.");
  } catch (error) {
    console.error("Failed to load hatch database:", error);
  }
}

// ==========================================
// 2. DETACHED RECIPE VAULT SEARCH ENGINE
// ==========================================
window.executePatternSearch = function(query) {
  const dropDown = document.getElementById('search-dropdown-results');
  if (!query.trim()) {
    dropDown.style.display = 'none';
    dropDown.innerHTML = '';
    return;
  }

  const cleanQuery = query.toLowerCase();
  let resultsHTML = '';

  hatchDatabase.forEach(hatch => {
    if (!hatch.recommendedFlies) return;

    hatch.recommendedFlies.forEach(fly => {
      const recipeData = fly.recipe || {};
      const recipeString = JSON.stringify(recipeData).toLowerCase();
      const flyName = (fly.name || "").toLowerCase();
      const insectName = (hatch.insect || "").toLowerCase();
      
      const matchTarget = `${insectName} ${flyName} ${recipeString}`;

      if (matchTarget.includes(cleanQuery)) {
        let materialBoxesHTML = '';
        
        if (Object.keys(recipeData).length === 0) {
          materialBoxesHTML = `
            <div style="grid-column: 1 / -1; color: #a1a1aa; font-style: italic; padding: 10px; background: #18181b; border-radius: 6px; text-align: center;">
              No recipe segments logged for this pattern yet.
            </div>
          `;
        } else {
          materialBoxesHTML = Object.entries(recipeData).map(([part, material]) => `
            <div style="background: #18181b; padding: 10px 14px; border-radius: 8px; border: 1px solid #27272a; display: flex; flex-direction: column; gap: 4px; text-align: left;">
              <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-green); font-weight: 700;">
                ${part}
              </span>
              <span style="font-size: 0.92rem; color: #e4e4e7; font-weight: 500;">
                ${material}
              </span>
            </div>
          `).join('');
        }

        resultsHTML += `
          <div class="card" style="margin-bottom: 16px; border-left: 4px solid var(--accent-green); padding: 18px; background: #202023; text-align: left;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
              <h3 style="margin: 0; font-size: 1.25rem; color: #fff;">${fly.name}</h3>
              <span style="font-size: 0.75rem; background: #27272a; padding: 4px 8px; border-radius: 4px; color: #d4d4d8; font-weight: 600;">
                Sizes: #${fly.sizes ? fly.sizes.join(', #') : 'N/A'}
              </span>
            </div>
            <div style="font-size: 0.85rem; color: #a1a1aa; margin-bottom: 14px;">
              Imitates: <strong style="color: #fff;">${hatch.insect}</strong> (${hatch.stage})
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px;">
              ${materialBoxesHTML}
            </div>
          </div>
        `;
      }
    });
  });

  if (resultsHTML) {
    dropDown.innerHTML = resultsHTML;
    dropDown.style.display = 'block';
  } else {
    dropDown.innerHTML = `
      <div class="card" style="text-align: center; padding: 30px; border-left: 4px solid #f43f5e;">
        <span style="font-size: 1.5rem;">🪶</span>
        <h4 style="margin: 10px 0 4px 0; color: #fff;">No Patterns Found</h4>
        <p style="margin: 0; font-size: 0.85rem; color: #a1a1aa;">No recipes match your search for "${query}"</p>
      </div>
    `;
    dropDown.style.display = 'block';
  }
}

// ==========================================
// 3. STEP-BY-STEP FLOW INTERACTIVE NAVIGATION
// ==========================================
window.selectRegion = function(selectedRegion) {
  userSelections.region = selectedRegion.toLowerCase().trim();
  switchScreen('step-region', 'step-environment');
}

window.selectEnvironment = function(env) {
  userSelections.environment = env.toLowerCase().trim();
  switchScreen('step-environment', 'step-species');
}

window.selectSpecies = function(spec) {
  userSelections.species = spec.toLowerCase().trim();
  switchScreen('step-species', 'step-temp');
}

window.updateTempDisplay = function(val) {
  document.getElementById('temp-display').innerText = `${val}°F`;
  userSelections.waterTemp = parseInt(val, 10);
}

window.submitTemp = function() {
  const sliderVal = document.getElementById('temp-slider').value;
  userSelections.waterTemp = parseInt(sliderVal, 10);
  
  // Dynamic Route Bypass: Stillwaters do not have riffles or runs
  if (userSelections.environment === 'lake_pond') {
    userSelections.waterType = 'pool'; // Normalize to safe flat-water filtering parameter
    switchScreen('step-temp', 'step-rise');
  } else {
    switchScreen('step-temp', 'step-water');
  }
}

window.selectWater = function(type) {
  userSelections.waterType = type.toLowerCase().trim();
  switchScreen('step-water', 'step-rise');
}

window.selectRise = function(form) {
  userSelections.riseForm = form.toLowerCase().trim();
  switchScreen('step-rise', 'step-results');
  
  const topMatches = calculateHatchMatches();
  displayResults(topMatches);
}

window.switchScreen = function(hideId, showId) {
  document.getElementById(hideId).classList.remove('active');
  document.getElementById(showId).classList.add('active');
}

window.resetApp = function() {
  userSelections = { 
    region: 'appalachian',
    environment: 'river_stream',
    species: 'trout',
    waterTemp: 55, 
    currentMonth: new Date().getMonth() + 1, 
    waterType: 'pool', 
    riseForm: '' 
  };
  document.getElementById('temp-slider').value = 55;
  document.getElementById('temp-display').innerText = '55°F';
  if (document.getElementById('global-search')) {
    document.getElementById('global-search').value = '';
  }
  document.getElementById('search-dropdown-results').style.display = 'none';
  switchScreen('step-results', 'step-region');
}

// ==========================================
// 4. NORTH AMERICAN BIOME GPS CALCULATOR 
// ==========================================
window.detectLocation = function() {
  const statusDiv = document.getElementById('gps-status');
  if (!navigator.geolocation) {
    statusDiv.style.display = 'block';
    statusDiv.style.color = '#f43f5e';
    statusDiv.innerText = "❌ Geolocation is not supported by this device browser.";
    return;
  }

  statusDiv.style.display = 'block';
  statusDiv.style.color = '#a1a1aa';
  statusDiv.innerText = "⚡ Pinging satellite matrix...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lon = position.coords.longitude;
      const lat = position.coords.latitude;
      
      let calculatedRegion = 'transitional_plains';
      let locationLabel = 'Midwest & Plains Rivers';
      
      if (lon < -119.0 && lat >= 42.0) {
        calculatedRegion = 'pacific_coastal';
        locationLabel = 'Pacific Rainforest & Coastal';
      }
      else if (lon >= -119.0 && lon < -103.0 && lat >= 34.0) {
        calculatedRegion = 'rocky_mountain';
        locationLabel = 'Rocky Mountain Tailwaters';
      }
      else if (lat >= 45.0 && lon >= -103.0) {
        calculatedRegion = 'boreal_shield';
        locationLabel = 'Great Lakes & Boreal Shield';
      }
      else if (lon >= -87.0 && lat >= 36.0) {
        calculatedRegion = 'appalachian';
        locationLabel = 'Appalachian & Limestone';
      }
      else if (lat < 34.0 || (lon >= -98.0 && lat < 36.0)) {
        calculatedRegion = 'warmwater_south';
        locationLabel = 'Southern & Coastal Plain';
      }

      statusDiv.style.color = 'var(--accent-green)';
      statusDiv.innerText = `✓ Locked: Auto-selecting ${locationLabel}`;
      
      setTimeout(() => {
        statusDiv.style.display = 'none';
        window.selectRegion(calculatedRegion);
      }, 1500);
    },
    (error) => {
      statusDiv.style.color = '#f43f5e';
      console.warn(`GPS Execution Error Code ${error.code}: ${error.message}`);
      statusDiv.innerText = "❌ Unable to acquire precise GPS lock streamside.";
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}

// ==========================================
// 5. EXTENDED MULTI-SPECIES MATCH ALGORITHMS
// ==========================================
function calculateHatchMatches() {
  const { region, environment, species, waterTemp, currentMonth, waterType, riseForm } = userSelections;

  return hatchDatabase
    .filter(hatch => {
      // 1. Filter structural basics (Region, Month, Temperature range)
      const hatchBiomes = hatch.biomes || [];
      const regionMatch = hatchBiomes.map(b => b.toLowerCase().trim()).includes(region.toLowerCase().trim());
      const monthMatch = hatch.conditions.months.includes(currentMonth);
      const [minTemp, maxTemp] = hatch.conditions.tempRange;
      const tempMatch = waterTemp >= minTemp && waterTemp <= maxTemp;

      // 2. Filter structural cross-references (Environment and Species target availability)
      // If your JSON doesn't specify environments/species yet, fallback to true so older entries don't crash
      const envMatch = hatch.conditions.environments ? hatch.conditions.environments.map(e => e.toLowerCase().trim()).includes(environment) : true;
      const specMatch = hatch.conditions.allowedSpecies ? hatch.conditions.allowedSpecies.map(s => s.toLowerCase().trim()).includes(species) : true;

      return regionMatch && monthMatch && tempMatch && envMatch && specMatch;
    })
    .map(hatch => {
      let score = 0;
      // Add points for matching specific localized habitat structures
      if (hatch.conditions.waterType.map(w => w.toLowerCase().trim()).includes(waterType)) score += 1;
      if (hatch.conditions.riseForm.map(rf => rf.toLowerCase().trim()).includes(riseForm)) score += 2;
      return { ...hatch, currentScore: score };
    })
    .sort((a, b) => b.currentScore - a.currentScore);
}

// ==========================================
// 6. INTERFACE DATA RENDERERS
// ==========================================
function displayResults(matches) {
  const container = document.getElementById('results-list');
  container.innerHTML = '';
  
  if (matches.length === 0) {
    container.innerHTML = `
      <div class="card" style="border-left-color: #f43f5e; text-align: left;">
        <h3 style="margin-top:0; color:#fff;">No Match Found</h3>
        <p style="margin: 4px 0; font-size:0.9rem; color:#a1a1aa;">No patterns match these dynamic targets or thermal limits right now.</p>
      </div>
    `;
    return;
  }

  matches.slice(0, 3).forEach(match => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.textAlign = 'left';
    card.innerHTML = `
      <h3 style="margin-top:0; color:#fff;">${match.insect}</h3>
      <p style="margin: 4px 0; font-size:0.9rem; color:#a1a1aa;">Stage: <strong style="color:#fff;">${match.stage}</strong></p>
      <div style="margin-top: 12px;">
        ${match.recommendedFlies.map(f => `
          <div style="margin-bottom:12px;">
            <span class="fly-tag" style="display:inline-block; margin-bottom:4px;">${f.name} (#${f.sizes.join(', #')})</span>
            <div style="font-size:0.75rem; color:#a1a1aa; padding-left:8px; border-left:2px solid #52525b; text-align: left; line-height:1.4;">
              ${f.recipe 
                ? `<strong>Hook:</strong> ${f.recipe.hook || 'Standard'} <br> <strong>Body:</strong> ${f.recipe.body || 'N/A'}`
                : '<span style="font-style:italic;">Recipe metrics unlogged</span>'
              }
            </div>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(card);
  });
}

// ==========================================
// 7. SYSTEM BOOT INITIALIZATION
// ==========================================
loadHatchData();

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      window.executePatternSearch(e.target.value);
    });
  }
});
