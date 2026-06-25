import json

# This is the "brain" matrix connecting river conditions to fly recommendations
hatch_data = [
    {
        "id": "bwo-emerger",
        "insect": "Blue-Winged Olive (Mayfly)",
        "stage": "Emerger",
        "conditions": {
            "waterType": ["pool", "run"],
            "riseForm": "sipping",
            "airActivity": "low"
        },
        "recommendedFlies": [
            {"name": "RS2", "sizes": [18, 20, 22]},
            {"name": "WD40", "sizes": [18, 20]},
            {"name": "Craven's Juju Baetis", "sizes": [18, 20, 22]}
        ]
    },
    {
        "id": "elk-hair-caddis",
        "insect": "Hydropsyche (Caddisfly)",
        "stage": "Adult / Egg-Layer",
        "conditions": {
            "waterType": ["riffle", "run"],
            "riseForm": "splashy",
            "airActivity": "high"
        },
        "recommendedFlies": [
            {"name": "Elk Hair Caddis (Tan)", "sizes": [14, 16, 18]},
            {"name": "X-Caddis", "sizes": [14, 16]},
            {"name": "LaFontaine's Dancing Caddis", "sizes": [14, 16]}
        ]
    },
    {
        "id": "caddis-pupa",
        "insect": "Caddisfly",
        "stage": "Pupa (Rising)",
        "conditions": {
            "waterType": ["run", "riffle"],
            "riseForm": "bulging",
            "airActivity": "low"
        },
        "recommendedFlies": [
            {"name": "Holy Grail Caddis Pupa", "sizes": [14, 16, 18]},
            {"name": "Graphic Moving Pupa", "sizes": [16, 18]},
            {"name": "Mercer's Z-Wing Pupa", "sizes": [14, 16]}
        ]
    },
    {
        "id": "golden-stonefly",
        "insect": "Golden Stonefly",
        "stage": "Nymph (Migrating)",
        "conditions": {
            "waterType": ["riffle"],
            "riseForm": "bulging",
            "airActivity": "none"
        },
        "recommendedFlies": [
            {"name": "Pat's Rubber Legs", "sizes": [8, 10, 12]},
            {"name": "20 Incher Stonefly Nymph", "sizes": [10, 12]},
            {"name": "Girdle Bug", "sizes": [8, 10, 12]}
        ]
    },
    {
        "id": "midges-surface",
        "insect": "Chironomid (Midge)",
        "stage": "Adult / Cluster",
        "conditions": {
            "waterType": ["pool"],
            "riseForm": "sipping",
            "airActivity": "high"
        },
        "recommendedFlies": [
            {"name": "Griffith's Gnat", "sizes": [18, 20, 22]},
            {"name": "Morgan's Midge", "sizes": [20, 22]},
            {"name": "Zebra Midge (Suspended)", "sizes": [20, 22]}
        ]
    }
]

# Write out the database to a local json file
with open('hatches.json', 'w') as f:
    json.dump(hatch_data, f, indent=2)

print("✓ Successfully generated hatches.json in your directory!")
