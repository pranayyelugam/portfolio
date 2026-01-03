from PIL import Image
import os

# List of images to optimize
images_to_optimize = [
    'golden_gate.png',
    'india.png',
    'usa.png',
    'taj_mahal.png',
    'india_gate.png',
    'lighthouse.png',
    'acadia_1.jpg'
]

directory = '/Users/shruthiy/Documents/projects/portfolio/src/Images'

for img_name in images_to_optimize:
    path = os.path.join(directory, img_name)
    if os.path.exists(path):
        try:
            with Image.open(path) as img:
                # Resize if too large (e.g., width > 300px for icons/profile)
                if img.width > 300:
                    ratio = 300 / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((300, new_height), Image.ANTIALIAS)
                
                # Save as WebP
                new_path = os.path.splitext(path)[0] + '.webp'
                img.save(new_path, 'WEBP', quality=85)
                print(f"Optimized {img_name} -> {os.path.basename(new_path)}")
        except Exception as e:
            print(f"Failed to optimize {img_name}: {e}")
    else:
        print(f"File not found: {path}")
