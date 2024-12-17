from PIL import Image
import os

def generate_icons():
    # Create icons directory if it doesn't exist
    icons_dir = os.path.join('static', 'icons')
    os.makedirs(icons_dir, exist_ok=True)
    
    # Base icon size (should be the largest size you need)
    base_size = 512
    
    # Create a simple colored square as the base icon
    icon = Image.new('RGB', (base_size, base_size), '#dc3545')
    
    # Icon sizes needed for PWA
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    # Generate icons for each size
    for size in sizes:
        resized_icon = icon.resize((size, size), Image.Resampling.LANCZOS)
        icon_path = os.path.join(icons_dir, f'icon-{size}x{size}.png')
        resized_icon.save(icon_path, 'PNG')
        print(f'Generated icon: {icon_path}')

if __name__ == '__main__':
    generate_icons()
