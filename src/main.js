// ==========================================
// 1. APP STATE & CONFIGURATION
// ==========================================
let userSelections = { 
  region: 'northeast', 
  waterTemp: 55, 
  currentMonth: new Date().getMonth() + 1, 
  waterType: '', 
  riseForm: '' 
};
let hatchDatabase = [];

// Base JSON Database Boot loader
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
          // Map each material component entry into separate responsive boxes
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

        // Full Outer Recipe Entry wrapper
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
  displayResults(topMatches);
}

window.switchScreen = function(hideId, showId) {
  const hideEl = document.getElementById(hideId);
  const showEl = document.getElementById(showId);
  
  if (hideEl) {
    hideEl.classList.remove('active');
    hideEl.style.display = 'none'; // Hard force the element to hide
  }
  
  if (showEl) {
    showEl.classList.add('active');
    
    // If we are jumping to the search engine vault, display it as a block container
    if (showId === 'step-search') {
      showEl.style.display = 'block';
    } else {
      // Otherwise, the fallback matching screen triggers default block view
      showEl.style.display = 'block';
    }
  }
}

window.resetApp = function() {
  userSelections = { 
    region: 'northeast',
    waterTemp: 55, 
    currentMonth: new Date().getMonth() + 1, 
    waterType: '', 
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
// 4. BIOLOGICAL STRATIFICATION ALGORITHMS
// ==========================================
function calculateHatchMatches() {
  const { region, waterTemp, currentMonth, waterType, riseForm } = userSelections;

  return hatchDatabase
    .filter(hatch => {
      const regionMatch = hatch.conditions.regions.map(r => r.toLowerCase().trim()).includes(region);
      const monthMatch = hatch.conditions.months.includes(currentMonth);
      const [minTemp, maxTemp] = hatch.conditions.tempRange;
      const tempMatch = waterTemp >= minTemp && waterTemp <= maxTemp;

      return regionMatch && monthMatch && tempMatch;
    })
    .map(hatch => {
      let score = 0;
      if (hatch.conditions.waterType.map(w => w.toLowerCase().trim()).includes(waterType)) score += 1;
      if (hatch.conditions.riseForm.map(rf => rf.toLowerCase().trim()).includes(riseForm)) score += 2;
      return { ...hatch, currentScore: score };
    })
    .filter(item => item.currentScore > 0)
    .sort((a, b) => b.currentScore - a.currentScore);
}

// ==========================================
// 5. INTERFACE DATA RENDERERS
// ==========================================
function displayResults(matches) {
  const container = document.getElementById('results-list');
  container.innerHTML = '';
  
  if (matches.length === 0) {
    container.innerHTML = `
      <div class="card" style="border-left-color: #f43f5e; text-align: left;">
        <h3 style="margin-top:0; color:#fff;">No Regional Match Found</h3>
        <p style="margin: 4px 0; font-size:0.9rem; color:#a1a1aa;">Biological parameters filtered out main hatches.</p>
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
// 6. SYSTEM BOOT INITIALIZATION
// ==========================================
loadHatchData();

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      window.executePatternSearch(e.target.value);
    });
    console.log("✓ Search input event listener successfully attached.");
  }
});
