// App State variables
let userSelections = { region: 'northeast', waterTemp: 55, currentMonth: 1, waterType: '', riseForm: '' };
let hatchDatabase = [];

// Automatically detect current month on boot
userSelections.currentMonth = new Date().getMonth() + 1;

async function loadHatchData() {
  try {
    const response = await fetch('/hatches.json');
    hatchDatabase = await response.json();
    console.log("✓ Hatch database loaded.");
  } catch (error) {
    console.error("Failed to load hatch database:", error);
  }
}

// Visual Slider updates
window.updateTempDisplay = function(val) {
  document.getElementById('temp-display').innerText = `${val}°F`;
  userSelections.waterTemp = parseInt(val);
}

// Global Text Search Engine for Tying Patterns
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
        resultsHTML += `
          <div style="background:#27272a; padding:12px; margin:6px 0; border-radius:6px; border-left: 4px solid var(--accent-green); text-align: left;">
            <div style="font-weight:bold; color:#fff; font-size:1.1rem;">${fly.name}</div>
            <div style="font-size:0.8rem; color:var(--accent-green); margin-bottom:6px;">Imitates: ${hatch.insect} (${hatch.stage})</div>
            <div style="font-size:0.85rem; color:#d4d4d8; line-height:1.4;">
              ${Object.keys(recipeData).length === 0 
                ? '<span style="color:#a1a1aa; font-style:italic;">No recipe steps added yet for this pattern.</span>'
                : Object.entries(recipeData).map(([part, material]) => `
                    <div><strong style="color:#a1a1aa; text-transform: capitalize;">${part}:</strong> ${material}</div>
                  `).join('')
              }
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
    dropDown.innerHTML = `<div style="padding:10px; color:#a1a1aa; font-size:0.9rem;">No recipes match "${query}"</div>`;
    dropDown.style.display = 'block';
  }
}

// UI Navigation Flow
window.selectRegion = function(selectedRegion) {
  userSelections.region = selectedRegion;
  switchScreen('step-region', 'step-temp');
}

window.submitTemp = function() {
  switchScreen('step-temp', 'step-water');
}

window.selectWater = function(type) {
  userSelections.waterType = type;
  switchScreen('step-water', 'step-rise');
}

window.selectRise = function(form) {
  userSelections.riseForm = form;
  switchScreen('step-rise', 'step-results');
  
  const topMatches = calculateHatchMatches();
  displayResults(topMatches);
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
  document.getElementById('global-search').value = '';
  document.getElementById('search-dropdown-results').style.display = 'none';
  switchScreen('step-results', 'step-region');
}

function calculateHatchMatches() {
  const { region, waterTemp, currentMonth, waterType, riseForm } = userSelections;

  return hatchDatabase
    .filter(hatch => {
      const regionMatch = hatch.conditions.regions.includes(region);
      const monthMatch = hatch.conditions.months.includes(currentMonth);
      const [minTemp, maxTemp] = hatch.conditions.tempRange;
      const tempMatch = waterTemp >= minTemp && waterTemp <= maxTemp;
      return regionMatch && monthMatch && tempMatch;
    })
    .map(hatch => {
      let score = 0;
      if (hatch.conditions.waterType.includes(waterType)) score += 1;
      if (hatch.conditions.riseForm.includes(riseForm)) score += 2;
      return { ...hatch, currentScore: score };
    })
    .filter(item => item.currentScore > 0)
    .sort((a, b) => b.currentScore - a.currentScore);
}

function switchScreen(hideId, showId) {
  document.getElementById(hideId).classList.remove('active');
  document.getElementById(showId).classList.add('active');
}

function displayResults(matches) {
  const container = document.getElementById('results-list');
  container.innerHTML = '';
  
  if (matches.length === 0) {
    container.innerHTML = `
      <div class="card" style="border-left-color: #f43f5e;">
        <h3 style="margin-top:0; color:#fff;">No Regional Match Found</h3>
        <p style="margin: 4px 0; font-size:0.9rem; color:#a1a1aa;">Biological parameters filtered out main hatches.</p>
      </div>
    `;
    return;
  }

  matches.slice(0, 3).forEach(match => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3 style="margin-top:0; color:#fff;">${match.insect}</h3>
      <p style="margin: 4px 0; font-size:0.9rem; color:#a1a1aa;">Stage: <strong style="color:#fff;">${match.stage}</strong></p>
      <div style="margin-top: 12px;">
        ${match.recommendedFlies.map(f => `
          <div style="margin-bottom:8px;">
            <span class="fly-tag" style="display:inline-block; margin-bottom:4px;">${f.name} (#${f.sizes.join(', #')})</span>
            <div style="font-size:0.75rem; color:#a1a1aa; padding-left:8px; border-left:2px solid #52525b; text-align: left;">
              ${f.recipe 
                ? `<strong>Hook:</strong> ${f.recipe.hook || 'Standard'} <br> <strong>Body:</strong> ${f.recipe.body || 'N/A'}`
                : '<span style="font-style:italic;">Recipe not logged</span>'
              }
            </div>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(card);
  });
}

// Initial Core Execution
loadHatchData();

// Direct event listener attachment
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      window.executePatternSearch(e.target.value);
    });
    console.log("✓ Search input event listener successfully attached.");
  }
});
