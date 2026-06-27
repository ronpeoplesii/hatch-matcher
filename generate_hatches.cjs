const fs = require('fs');

const baseInsects = [
  // --- MAYFLIES ---
  { name: "Blue Winged Olive", species: "Baetis", biomes: ["Northeast", "Midwest", "Rocky Mountain", "Pacific Northwest"], water_types: ["freestone", "spring_creek", "tailwater"], temps: {min: 42, max: 55}, months: [3, 4, 5, 9, 10, 11], stages: ["nymph", "emerger", "dun", "spinner"], sizes: [18, 20, 22], variants: ["Standard", "Dark"] },
  { name: "Hendrickson", species: "Ephemerella subvaria", biomes: ["Northeast", "Midwest"], water_types: ["freestone", "spring_creek"], temps: {min: 48, max: 54}, months: [4, 5], stages: ["nymph", "dun", "spinner"], sizes: [12, 14], variants: ["Standard"] },
  { name: "Sulfur", species: "Ephemerella invaria", biomes: ["Northeast", "Midwest", "Southeast"], water_types: ["freestone", "spring_creek", "tailwater"], temps: {min: 55, max: 65}, months: [5, 6, 7], stages: ["nymph", "emerger", "dun", "spinner"], sizes: [14, 16, 18], variants: ["Standard", "Bright"] },
  { name: "Green Drake", species: "Ephemera guttulata", biomes: ["Northeast", "Midwest", "Rocky Mountain"], water_types: ["freestone", "tailwater"], temps: {min: 52, max: 60}, months: [5, 6], stages: ["nymph", "dun", "spinner"], sizes: [8, 10, 12], variants: ["Standard"] },
  { name: "Light Cahill", species: "Stenonema", biomes: ["Northeast", "Midwest", "Southeast"], water_types: ["freestone"], temps: {min: 60, max: 68}, months: [6, 7, 8], stages: ["nymph", "dun", "spinner"], sizes: [12, 14, 16], variants: ["Standard"] },
  { name: "Pale Morning Dun (PMD)", species: "Ephemerella excrucians", biomes: ["Rocky Mountain", "Pacific Northwest", "Southwest"], water_types: ["freestone", "spring_creek", "tailwater"], temps: {min: 52, max: 62}, months: [6, 7, 8], stages: ["nymph", "emerger", "dun", "spinner"], sizes: [16, 18], variants: ["Standard", "Light"] },
  { name: "Western Trico", species: "Tricorythodes", biomes: ["Rocky Mountain", "Midwest", "Southwest"], water_types: ["spring_creek", "tailwater"], temps: {min: 58, max: 68}, months: [7, 8, 9], stages: ["nymph", "dun", "spinner"], sizes: [22, 24, 26], variants: ["Standard"] },
  { name: "March Brown", species: "Rhithrogena morrisoni", biomes: ["Pacific Northwest", "Northeast"], water_types: ["freestone"], temps: {min: 44, max: 50}, months: [3, 4, 5], stages: ["nymph", "emerger", "dun"], sizes: [12, 14], variants: ["Standard"] },
  { name: "Quill Gordon", species: "Epeorus pleuralis", biomes: ["Southeast", "Northeast"], water_types: ["freestone"], temps: {min: 46, max: 52}, months: [4], stages: ["nymph", "dun", "spinner"], sizes: [12, 14], variants: ["Standard"] },
  { name: "Isonychia (Slate Drake)", species: "Isonychia bicolor", biomes: ["Northeast", "Southeast", "Midwest"], water_types: ["freestone", "tailwater"], temps: {min: 50, max: 65}, months: [6, 7, 8, 9], stages: ["nymph", "dun", "spinner"], sizes: [10, 12], variants: ["Standard"] },

  // --- CADDISFLIES ---
  { name: "Elk Hair Caddis", species: "Hydropsyche", biomes: ["Northeast", "Midwest", "Southeast", "Rocky Mountain", "Pacific Northwest", "Southwest"], water_types: ["freestone", "spring_creek", "tailwater"], temps: {min: 50, max: 65}, months: [4, 5, 6, 7, 8, 9], stages: ["nymph", "emerger", "dun"], sizes: [14, 16, 18], variants: ["Tan", "Olive", "Black"] },
  { name: "Grannom Caddis", species: "Brachycentrus", biomes: ["Northeast", "Midwest", "Southeast"], water_types: ["freestone"], temps: {min: 45, max: 52}, months: [4, 5], stages: ["nymph", "emerger", "dun"], sizes: [14, 16], variants: ["Standard", "Dark"] },
  { name: "October Caddis", species: "Dicosmoecus", biomes: ["Rocky Mountain", "Pacific Northwest"], water_types: ["freestone", "tailwater"], temps: {min: 48, max: 56}, months: [9, 10, 11], stages: ["nymph", "emerger", "dun"], sizes: [8, 10], variants: ["Standard"] },
  { name: "Cinnamon Caddis", species: "Cheumatopsyche", biomes: ["Midwest", "Southeast", "Southwest"], water_types: ["freestone", "spring_creek"], temps: {min: 55, max: 70}, months: [6, 7, 8], stages: ["nymph", "emerger", "dun"], sizes: [16, 18], variants: ["Standard"] },

  // --- STONEFLIES ---
  { name: "Salmonfly", species: "Pteronarcys californica", biomes: ["Rocky Mountain", "Pacific Northwest"], water_types: ["freestone", "tailwater"], temps: {min: 54, max: 62}, months: [5, 6, 7], stages: ["nymph", "dun"], sizes: [4, 6, 8], variants: ["Standard"] },
  { name: "Golden Stonefly", species: "Hesperoperla pacifica", biomes: ["Rocky Mountain", "Pacific Northwest", "Southwest"], water_types: ["freestone", "tailwater"], temps: {min: 56, max: 65}, months: [6, 7], stages: ["nymph", "dun"], sizes: [8, 10, 12], variants: ["Standard", "High-Vis"] },
  { name: "Little Yellow Sallie", species: "Isoperla", biomes: ["Southeast", "Northeast", "Rocky Mountain"], water_types: ["freestone", "spring_creek"], temps: {min: 52, max: 60}, months: [5, 6, 7], stages: ["nymph", "dun"], sizes: [14, 16], variants: ["Standard"] },
  { name: "Early Black Stonefly", species: "Capniidae", biomes: ["Northeast", "Midwest"], water_types: ["freestone"], temps: {min: 36, max: 45}, months: [2, 3], stages: ["nymph", "dun"], sizes: [16, 18], variants: ["Standard"] },

  // --- MIDGES, ATTRACTORS & DIPTERA ---
  { name: "Zebra Midge", species: "Chironomidae", biomes: ["Northeast", "Midwest", "Southeast", "Rocky Mountain", "Pacific Northwest", "Southwest"], water_types: ["tailwater", "spring_creek", "freestone"], temps: {min: 34, max: 70}, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], stages: ["nymph", "emerger"], sizes: [18, 20, 22], variants: ["Red", "Black", "Olive", "Cream"] },
  { name: "Blood Midge", species: "Chironomus Muticus", biomes: ["Midwest", "Southwest"], water_types: ["tailwater", "spring_creek"], temps: {min: 40, max: 68}, months: [3, 4, 10, 11], stages: ["nymph", "emerger"], sizes: [16, 18], variants: ["Standard"] },
  { name: "San Juan Worm", species: "Annelida", biomes: ["Northeast", "Midwest", "Southeast", "Rocky Mountain", "Pacific Northwest", "Southwest"], water_types: ["freestone", "tailwater", "spring_creek"], temps: {min: 34, max: 75}, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], stages: ["nymph"], sizes: [12, 14], variants: ["Red", "Pink", "Squirmy-Orange"] },
  { name: "Prince Nymph", species: "Attractor Nymph", biomes: ["Northeast", "Midwest", "Southeast", "Rocky Mountain", "Pacific Northwest", "Southwest"], water_types: ["freestone", "tailwater", "spring_creek"], temps: {min: 34, max: 70}, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], stages: ["nymph"], sizes: [12, 14, 16], variants: ["Standard", "Beadhead"] },

  // --- TERRESTRIAL & MISC ---
  { name: "Black Ant", species: "Formicidae", biomes: ["Northeast", "Midwest", "Southeast", "Rocky Mountain", "Pacific Northwest", "Southwest"], water_types: ["freestone", "spring_creek"], temps: {min: 55, max: 75}, months: [6, 7, 8, 9], stages: ["terrestrial"], sizes: [14, 16, 18], variants: ["Standard", "Cinnamon"] },
  { name: "Grasshopper", species: "Orthoptera", biomes: ["Midwest", "Rocky Mountain", "Southwest"], water_types: ["freestone", "spring_creek"], temps: {min: 60, max: 80}, months: [7, 8, 9], stages: ["terrestrial"], sizes: [8, 10, 12], variants: ["Standard", "Yellow"] },
  { name: "Beetle", species: "Coleoptera", biomes: ["Northeast", "Midwest", "Southeast"], water_types: ["freestone", "spring_creek"], temps: {min: 58, max: 78}, months: [6, 7, 8], stages: ["terrestrial"], sizes: [12, 14, 16], variants: ["Standard"] },
  { name: "Woolly Bugger", species: "Anisoptera (Imitation)", biomes: ["Northeast", "Midwest", "Southeast", "Rocky Mountain", "Pacific Northwest", "Southwest"], water_types: ["freestone", "tailwater"], temps: {min: 34, max: 70}, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], stages: ["streamer"], sizes: [4, 6, 8, 10], variants: ["Black", "Olive", "White"] },
  { name: "Sculpin Leech", species: "Cottidae (Imitation)", biomes: ["Rocky Mountain", "Pacific Northwest", "Northeast"], water_types: ["freestone", "tailwater"], temps: {min: 36, max: 62}, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], stages: ["streamer"], sizes: [2, 4, 6], variants: ["Olive", "Natural"] }
];

const database = [];
let idCounter = 1;

baseInsects.forEach(insect => {
  insect.stages.forEach(stage => {
    insect.variants.forEach(variant => {
      const id = `fly_${String(idCounter++).padStart(3, '0')}`;
      const capitalizedStage = stage.charAt(0).toUpperCase() + stage.slice(1);
      const isStandard = variant === "Standard";
      const displayName = isStandard ? `${insect.name} (${capitalizedStage})` : `${variant} ${insect.name} (${capitalizedStage})`;
      
      database.push({
        id: id,
        name: displayName,
        stage: stage,
        biomes: insect.biomes,
        months: insect.months,
        water_temp_range: {
          min_f: insect.temps.min,
          max_f: insect.temps.max
        },
        water_types: insect.water_types,
        size_range: insect.sizes,
        imitation_species: insect.species,
        recipe_id: `rec_${insect.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${variant.toLowerCase()}_${stage}`
      });
    });
  });
});

fs.writeFileSync('hatches.json', JSON.stringify(database, null, 2));
console.log(`Successfully generated hatches.json with ${database.length} unique fly configurations across all biomes!`);
