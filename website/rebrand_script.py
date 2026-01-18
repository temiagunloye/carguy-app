import os

# Configuration
TARGET_DIR = '/Users/temiagunloye/Desktop/carguy-app/website'
EXTENSIONS = {'.html', '.js', '.css', '.json'}
REPLACEMENTS = [
    # Specific/Longer matches first
    ('Car Guy App', 'Garage Manager'),
    ('Car Guy', 'Garage Manager'),
    ('CarGuy', 'GarageManager'),
    ('car-guy', 'garage-manager'),
    ('carguy.app', 'garagemanager.co'),
    ('@carguyapp', '@garagemanagerapp'),
    ('carguyapp', 'garagemanagerapp'),
    ('carguy-website', 'garagemanager-website'),
    ('carguy_analytics_events', 'garagemanager_analytics_events'),
    ('carguy_leads', 'garagemanager_leads'),
    # General match last
    ('carguy', 'garagemanager'),
]

def rebrand_files():
    count = 0
    for root, dirs, files in os.walk(TARGET_DIR):
        if 'node_modules' in root or '.git' in root:
            continue
            
        for file in files:
            if not any(file.endswith(ext) for ext in EXTENSIONS):
                continue
                
            path = os.path.join(root, file)
            
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                # Perform replacements
                for old, new in REPLACEMENTS:
                    content = content.replace(old, new)
                
                # Check for missed case variations (simple check)
                if 'Car Guy' in content or 'carguy' in content:
                    print(f"Warning: Potential missed match in {file}")

                if content != original_content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Updated: {file}")
                    count += 1
                    
            except Exception as e:
                print(f"Error processing {file}: {e}")

    print(f"\nRebrand complete. Updated {count} files.")

if __name__ == "__main__":
    rebrand_files()
