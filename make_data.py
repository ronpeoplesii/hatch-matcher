import json
import os

DB_PATH = os.path.join("public", "hatches.json")

def load_database():
    """Safely loads the existing database or initializes an empty list if missing."""
    if not os.path.exists(DB_PATH):
        # Create directories if public/ doesn't exist yet
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        return []
    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        print("⚠️ Warning: hatches.json was corrupted or empty. Initializing new array.")
        return []

def save_database(data):
    """Saves the array back to public/hatches.json with clean indentation formatting."""
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"\n🚀 Success! Database updated locally at '{DB_PATH}'.")

def get_list_input(prompt_text):
    """Helper to take comma-separated inputs and convert them to clean lowercase lists."""
    user_input = input(prompt_text)
    if not user_input.strip():
        return []
    return [item.strip().lower() for item in user_input.split(",") if item.strip()]

def main():
    print("==================================================")
    print("🪶  HATCH MATCHER MATRIX - DATABASE BUILD ASSISTANT")
    print("==================================================")
    
    database = load_database()
    
    # 1. Core Biological Parameters
    insect = input("\nEnter Insect Common Name (e.g., Green Drake, Sulphur): ").strip()
    if not insect:
        print("❌ Insect name cannot be empty. Aborting.")
        return
        
    stage = input("Enter Life Stage Profile (e.g., Nymph, Dun, Spinner): ").strip()
    
    print("\n--- Geographic & Seasonal Filters ---")
    regions = get_list_input("Enter Regions (comma-separated, e.g., northeast, west): ")
    
    # Months tracking parsing
    print("Enter Active Months as numbers (comma-separated, e.g., May and June would be: 5, 6): ")
    months_raw = get_list_input("Months: ")
    months = []
    for m in months_raw:
        try:
            months.append(int(m))
        except ValueError:
            continue
            
    # Thermal array tracking
    print("\nEnter Stream Temperature Envelope Requirements:")
    try:
        min_temp = int(input("Minimum optimal water temp (°F): ") or "32")
        max_temp = int(input("Maximum optimal water temp (°F): ") or "85")
    except ValueError:
        print("⚠️ Invalid temperature entries. Defaulting range to [45, 70].")
        min_temp, max_temp = 45, 70
        
    print("\n--- Presentation & Observation Weight Modifiers ---")
    water_type = get_list_input("Target Water Structure (comma-separated, e.g., riffle, run, pool): ")
    rise_form = get_list_input("Observed Rise Forms (comma-separated, e.g., splashy, sipping, bulging): ")

    # 2. Recommended Presentation Fly Generation
    recommended_flies = []
    print("\n--- Recommended Fly Patterns ---")
    
    while True:
        add_fly = input("\nWould you like to add a recommended fly pattern for this hatch? (y/n): ").strip().lower()
        if add_fly != 'y':
            break
            
        fly_name = input("  Fly Pattern Title (e.g., Parachute Adams): ").strip()
        if not fly_name:
            continue
            
        sizes_raw = get_list_input("  Available Hook Sizes (comma-separated numbers, e.g., 12, 14, 16): ")
        sizes = []
        for s in sizes_raw:
            try:
                sizes.append(int(s))
            except ValueError:
                continue
                
        # 3. Dynamic Recipe Component Builder
        print("  --- Material Recipe Segment Logs (Leave blank to finish fly) ---")
        recipe = {}
        standard_segments = ["hook", "thread", "tail", "body", "ribbing", "wings", "hackle"]
        
        # Guide through standard fly components first
        for segment in standard_segments:
            mat = input(f"    {segment.capitalize()} material: ").strip()
            if mat:
                recipe[segment] = mat
                
        # Allow custom components (e.g., thorax, casing, bead)
        while True:
            custom_segment = input("    Add custom structural part? (Name or enter to skip): ").strip().lower()
            if not custom_segment:
                break
            custom_mat = input(f"    {custom_segment.capitalize()} material: ").strip()
            if custom_mat:
                recipe[custom_segment] = custom_mat
                
        recommended_flies.append({
            "name": fly_name,
            "sizes": sizes,
            "recipe": recipe
        })

    # Assemble complete node layout
    new_hatch_profile = {
        "insect": insect,
        "stage": stage,
        "conditions": {
            "regions": regions,
            "months": months,
            "tempRange": [min_temp, max_temp],
            "waterType": water_type,
            "riseForm": rise_form
        },
        "recommendedFlies": recommended_flies
    }
    
    # Append, sort alphabetically by insect name for clean organization, and write out
    database.append(new_hatch_profile)
    database.sort(key=lambda x: x.get("insect", "").lower())
    save_database(database)

if __name__ == "__main__":
    main()
