#!/usr/bin/env python3
"""Generate Android mipmap icons and web favicon from logo.png"""

from PIL import Image
import os

# Source image
SOURCE = "assests/logo/logo.png"

# Android mipmap sizes (width x height in pixels)
ANDROID_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

# Foreground sizes (for adaptive icons)
FOREGROUND_SIZES = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

# Round icon sizes (same as regular)
ROUND_SIZES = ANDROID_SIZES.copy()

# Web favicon sizes
FAVICON_SIZES = [16, 32, 48, 64, 128, 192, 256, 512]

ANDROID_RES = "android/app/src/main/res"
WEB_DIR = "assests"

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def create_round_icon(img, size):
    """Create a round version of the icon by applying a circular mask."""
    # Resize to target size
    resized = img.resize((size, size), Image.LANCZOS)
    
    # Create circular mask
    mask = Image.new("L", (size, size), 0)
    from PIL import ImageDraw
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    
    # Apply mask
    output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    output.paste(resized, mask=mask)
    return output

def create_adaptive_foreground(img, size):
    """Create adaptive icon foreground (centered icon with padding)."""
    # The icon should fill about 66% of the adaptive icon canvas
    icon_size = int(size * 0.66)
    icon = img.resize((icon_size, icon_size), Image.LANCZOS)
    
    # Create canvas
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    
    # Center the icon
    offset = (size - icon_size) // 2
    canvas.paste(icon, (offset, offset))
    return canvas

def generate_android_icons():
    """Generate all Android mipmap icons."""
    print("Generating Android icons...")
    
    try:
        img = Image.open(SOURCE).convert("RGBA")
    except Exception as e:
        print(f"Error opening source image: {e}")
        return False
    
    for folder, size in ANDROID_SIZES.items():
        path = os.path.join(ANDROID_RES, folder)
        ensure_dir(path)
        
        # Regular icon
        resized = img.resize((size, size), Image.LANCZOS)
        resized.save(os.path.join(path, "ic_launcher.png"), "PNG")
        print(f"  Created {folder}/ic_launcher.png ({size}x{size})")
        
        # Round icon
        round_img = create_round_icon(img, size)
        round_img.save(os.path.join(path, "ic_launcher_round.png"), "PNG")
        print(f"  Created {folder}/ic_launcher_round.png ({size}x{size})")
        
        # Adaptive foreground
        fg_size = FOREGROUND_SIZES[folder]
        fg_img = create_adaptive_foreground(img, fg_size)
        fg_img.save(os.path.join(path, "ic_launcher_foreground.png"), "PNG")
        print(f"  Created {folder}/ic_launcher_foreground.png ({fg_size}x{fg_size})")
    
    return True

def generate_favicon():
    """Generate web favicon in multiple sizes."""
    print("\nGenerating web favicon...")
    
    try:
        img = Image.open(SOURCE).convert("RGBA")
    except Exception as e:
        print(f"Error opening source image: {e}")
        return False
    
    ensure_dir(WEB_DIR)
    
    # Generate individual PNG favicons
    for size in FAVICON_SIZES:
        resized = img.resize((size, size), Image.LANCZOS)
        resized.save(os.path.join(WEB_DIR, f"favicon-{size}x{size}.png"), "PNG")
        print(f"  Created favicon-{size}x{size}.png")
    
    # Create ICO file with multiple sizes
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    ico_images = []
    for size in ico_sizes:
        resized = img.resize(size, Image.LANCZOS)
        ico_images.append(resized)
    
    ico_images[0].save(
        os.path.join(WEB_DIR, "favicon.ico"),
        format="ICO",
        sizes=ico_sizes,
        append_images=ico_images[1:]
    )
    print("  Created favicon.ico")
    
    # Also save a large PNG for high-res displays
    large = img.resize((512, 512), Image.LANCZOS)
    large.save(os.path.join(WEB_DIR, "icon-512.png"), "PNG")
    print("  Created icon-512.png")
    
    return True

def update_html_favicon():
    """Update index.html to reference the new favicon."""
    html_file = "index.html"
    
    if not os.path.exists(html_file):
        print(f"\n{html_file} not found, skipping favicon update")
        return
    
    with open(html_file, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Check if favicon link already exists
    if 'rel="icon"' in content or 'rel="shortcut icon"' in content:
        # Replace existing favicon link
        import re
        content = re.sub(
            r'<link\s+rel="(?:shortcut\s+)?icon"[^>]*>',
            '<link rel="icon" type="image/x-icon" href="assests/favicon.ico">',
            content
        )
    else:
        # Add favicon link after <title>
        content = content.replace(
            "</title>",
            '</title>\n    <link rel="icon" type="image/x-icon" href="assests/favicon.ico">'
        )
    
    with open(html_file, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"\nUpdated {html_file} with new favicon reference")

if __name__ == "__main__":
    print("=" * 50)
    print("TaskFlow Pro - Icon Generator")
    print("=" * 50)
    
    success = True
    
    if not generate_android_icons():
        success = False
    
    if not generate_favicon():
        success = False
    
    update_html_favicon()
    
    print("\n" + "=" * 50)
    if success:
        print("All icons generated successfully!")
    else:
        print("Some errors occurred. Check output above.")
    print("=" * 50)
