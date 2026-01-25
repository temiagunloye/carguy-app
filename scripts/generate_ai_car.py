import os
import sys
import json
import requests
from pathlib import Path

# Usage: python scripts/generate_ai_car.py "BMW M3 2024" <OPENAI_API_KEY>
# Or set OPENAI_API_KEY env var

def generate_car(car_name, api_key):
    print(f"🤖 Creative Agent (Generative) starting for: {car_name}...")
    
    if not api_key:
        print("❌ Error: OpenAI API Key required.")
        return

    # Load Knowledge Base
    prompt_path = Path("assets/prompts/studio_angles.json")
    if not prompt_path.exists():
        print("❌ Error: Prompt definition file missing.")
        return
        
    with open(prompt_path, 'r') as f:
        knowledge = json.load(f)

    # Standardize ID
    car_id = car_name.lower().replace(" ", "_")
    output_dir = Path(f"output/renders/{car_id}")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate Each Angle
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    url = "https://api.openai.com/v1/images/generations"

    for key, angle_desc in knowledge["angles"].items():
        base_prompt = f"{knowledge['style_prefix']} {car_name}, {angle_desc}, {knowledge['style_suffix']}"
        
        # Determine exact filepath
        dest_path = output_dir / f"{key}.png"
        
        if dest_path.exists():
             print(f"   ⏩ Skipping {key} (Already exists)...")
             continue

        print(f"   🎨 Painting {key}...")
        print(f"      Prompt: {base_prompt}")

        payload = {
            "model": "dall-e-3",
            "prompt": base_prompt,
            "n": 1,
            "size": "1024x1024",
            "response_format": "url"
        }

        try:
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            image_url = data['data'][0]['url']
            
            # Download
            img_data = requests.get(image_url).content
            with open(dest_path, 'wb') as f:
                f.write(img_data)
                
            print(f"      ✅ Saved to {dest_path}")
            
        except Exception as e:
            print(f"      ❌ Failed: {e}")
            if hasattr(e, 'response') and e.response:
                print(e.response.text)

    print(f"✅ Creative Agent finished. Assets in {output_dir}")
    print(f"👉 Next Step: Run 'npm run ingest:upload-render' (Use {car_id})")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/generate_ai_car.py <CAR_NAME> [API_KEY]")
    else:
        key = sys.argv[2] if len(sys.argv) > 2 else os.environ.get("OPENAI_API_KEY")
        generate_car(sys.argv[1], key)
