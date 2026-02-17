import os
import base64
import re
from pathlib import Path

def embed_images(html_path, output_path):
    with open(html_path, 'r') as f:
        content = f.read()

    # Find all file:// image sources
    def replace_image(match):
        src = match.group(1)
        if not src.startswith('file://'):
            return match.group(0)
        
        file_path = src.replace('file://', '')
        if not os.path.exists(file_path):
            print(f"Warning: Image not found: {file_path}")
            return match.group(0)
            
        try:
            with open(file_path, 'rb') as img_f:
                b64 = base64.b64encode(img_f.read()).decode('utf-8')
                ext = Path(file_path).suffix.lower().replace('.', '')
                mime = 'png' if ext == 'png' else 'jpeg'
                print(f"Embedded: {os.path.basename(file_path)}")
                return f'src="data:image/{mime};base64,{b64}"'
        except Exception as e:
            print(f"Error embedding {file_path}: {e}")
            return match.group(0)

    # Regex to find src="file://..."
    embedded_content = re.sub(r'src="(file://[^"]+)"', replace_image, content)

    with open(output_path, 'w') as f:
        f.write(embedded_content)
    print(f"Saved self-contained HTML to {output_path}")

if __name__ == "__main__":
    embed_images('render_quality_comparison.html', 'render_quality_comparison_embedded.html')
