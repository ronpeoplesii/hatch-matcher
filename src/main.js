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
  displayResults(topMatches); // <-- This is where the error was caught
}

window.switchScreen = function(hideId, showId) {
  document.getElementById(hideId).classList.remove('active');
  document.getElementById(showId).classList.add('active');
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
