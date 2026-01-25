#!/usr/bin/env python3
"""
Generate simple car placeholder renders using basic shapes
This is a TEMPORARY solution until we get real photos
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Car colors
CARS = {
    'bmw_m3_2024': {
        'name': 'BMW M3 2024',
        'color': (20, 65, 120),  # BMW M Blue
        'body_type': 'sedan'
    },
    'audi_rs6_2024': {
        'name': 'Audi RS6 2024',
        'color': (180, 30, 30),  # Audi Red
        'body_type': 'wagon'
    },
    'mercedes_c63_2024': {
        'name': 'Mercedes C63 2024',
        'color': (40, 40, 40),  # AMG Grey
        'body_type': 'sedan'
    },
    'subaru_brz_2024': {
        'name': 'Subaru BRZ 2024',
        'color': (255, 140, 0),  # Orange
        'body_type': 'coupe'
    }
}

ANGLES = [
    'driver_front', 'passenger_front',
    'full_driver_side', 'full_passenger_side',
    'driver_rear', 'passenger_rear',
    'front_center', 'rear_center',
    'front_low', 'rear_low'
]

def create_placeholder(car_id, car_info, angle, output_dir):
    """Create a simple solid color placeholder with text"""
    width, height = 1920, 1080
    img = Image.new('RGB', (width, height), color=(245, 245, 245))
    draw = ImageDraw.Draw(img)
    
    # Draw simple car shape (rectangle with rounded corners)
    car_width = 900
    car_height = 400
    x = (width - car_width) // 2
    y = (height - car_height) // 2
    
    # Car body with color
    draw.rounded_rectangle(
        [(x, y), (x + car_width, y + car_height)],
        radius=50,
        fill=car_info['color']
    )
    
    # Wheels (black circles)
    wheel_radius = 60
    wheel_y = y + car_height - wheel_radius
    draw.ellipse([(x + 150 - wheel_radius, wheel_y - wheel_radius),
                  (x + 150 + wheel_radius, wheel_y + wheel_radius)],
                 fill=(30, 30, 30))
    draw.ellipse([(x + car_width - 150 - wheel_radius, wheel_y - wheel_radius),
                  (x + car_width - 150 + wheel_radius, wheel_y + wheel_radius)],
                 fill=(30, 30, 30))
    
    # Add text label
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
        small_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
    except:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Car name
    text = car_info['name']
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    draw.text(((width - text_width) // 2, y - 100), text, fill=(80, 80, 80), font=font)
    
    # Angle label
    angle_text = f"Angle: {angle.replace('_', ' ').title()}"
    bbox2 = draw.textbbox((0, 0), angle_text, font=small_font)
    text_width2 = bbox2[2] - bbox2[0]
    draw.text(((width - text_width2) // 2, y + car_height + 50), angle_text,
              fill=(150, 150, 150), font=small_font)
    
    # Save
    output_path = os.path.join(output_dir, f"{angle}.jpg")
    img.save(output_path, 'JPEG', quality=90)
    return output_path

def main():
    base_dir = os.path.join(os.path.dirname(__file__), '..', 'tmp', 'car-placeholders')
    
    for car_id, car_info in CARS.items():
        car_dir = os.path.join(base_dir, car_id)
        os.makedirs(car_dir, exist_ok=True)
        
        print(f"\n🎨 Generating placeholders for {car_info['name']}...")
        
        for angle in ANGLES:
            output_path = create_placeholder(car_id, car_info, angle, car_dir)
            print(f"   ✓ {angle}.jpg")
        
        print(f"   📦 {len(ANGLES)} images created")
    
    print("\n✅ All placeholders generated!")
    print(f"📁 Output: {base_dir}")

if __name__ == '__main__':
    main()
