// ==========================================
// 1. APP STATE & CORE CONFIGURATION
// ==========================================
let userSelections = { 
  region: 'northeast', 
  waterTemp: 55, 
  currentMonth: new Date().getMonth() + 1, 
  waterType: '', 
  riseForm: '' 
};
let hatchDatabase = [];

// Base Boot Lifecycle Execution
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
          // Map each material element directly into its own self-contained grid card
          materialBoxesHTML = Object.entries(recipeData).map(([part, material]) => `
            <div style="background: #18181b; padding: 10px 14px; border-radius: 8px; border: 1px solid #27272a; display: flex; flex-direction: column; gap: 4px;">
              <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-green); font-weight: 700;">
                ${part}
              </span>
              <span style="font-size: 0.95rem; color: #e4e4e7; font-weight: 500;">
                ${material}
              </span>
            </div>
          `).join('');
        }

        // Parent Display Wrap for the pattern entry
        resultsHTML += `
          <div class="card" style="margin-bottom: 20px; border-left: 4px solid var(--accent-green); padding: 20px; background: #202023; text-align: left;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
              <h3 style="margin: 0; font-size: 1.3rem; color: #fff;">${fly.name}</h3>
              <span style="font-size: 0.75rem; background: #27272a; padding: 4px 8px; border-radius: 4px; color: #d4d4d8; font-weight: 600;">
                Sizes: #${fly.sizes ? fly.sizes.join(', #') : 'N/A'}
              </span>
            </div>
            <div style="font-size: 0.85rem; color: #a1a1aa; margin-bottom: 16px;">
              Imitates: <strong style="color: #fff;">${hatch.insect}</strong> (${hatch.stage})
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">
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
  switchScreen('step-region', 'step-temp');
}

window.updateTempDisplay = function(val) {
  document.getElementById('temp-display').innerText = `${val}°F`;
  userSelections.waterTemp = parseInt(val, 10);
}

window.submitTemp = function() {
  const sliderVal = document.getElementById('temp-slider').value;
  userSelections.waterTemp = parseInt(sliderVal, 10);
  switchScreen('step-temp', 'step-water');
}

window.selectWater = function(type) {
  userSelections.waterType = type.toLowerCase().trim();
  switchScreen('step-water', 'step-rise');
}

window.selectRise = function(form) {
  userSelections.riseForm = form.toLowerCase().trim();
  switchScreen('step-rise', 'step-results');
  
  const topMatches = calculateHatchMatches();
  displayResults(topMatches
