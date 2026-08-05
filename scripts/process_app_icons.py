import os
import sys
from PIL import Image, ImageOps, ImageFilter

def process_icons(source_path):
    print(f"Processing source image: {source_path}")
    if not os.path.exists(source_path):
        print(f"Error: Source image not found at {source_path}")
        return False

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_dir = os.path.join(base_dir, 'assets')
    assets_img_dir = os.path.join(assets_dir, 'images')
    public_dir = os.path.join(base_dir, 'public')

    os.makedirs(assets_dir, exist_ok=True)
    os.makedirs(assets_img_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)

    # Load master image
    img = Image.open(source_path).convert('RGBA')

    # Brand color
    bg_color = (255, 180, 0, 255) # #FFB400 warm golden yellow

    # 1. Main app icon (1024x1024) - full edge-to-edge
    icon_1024 = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    icon_1024.save(os.path.join(assets_dir, 'icon.png'), 'PNG', quality=100)
    icon_1024.save(os.path.join(assets_img_dir, 'icon.png'), 'PNG', quality=100)
    print("Saved assets/icon.png (1024x1024)")

    # 2. Android Adaptive Icon Foreground (1024x1024 with 65% centered scaling)
    # Background color #FFB400, logo scaled down to ~664x664 and centered at (180, 180)
    # This prevents Android from cropping the logo edges inside squircle/circle masks!
    adaptive_fg = Image.new('RGBA', (1024, 1024), bg_color)
    fg_scaled = img.resize((664, 664), Image.Resampling.LANCZOS)
    adaptive_fg.paste(fg_scaled, (180, 180), fg_scaled)
    adaptive_fg.save(os.path.join(assets_dir, 'adaptive-icon.png'), 'PNG', quality=100)
    adaptive_fg.save(os.path.join(assets_img_dir, 'android-icon-foreground.png'), 'PNG', quality=100)
    print("Saved assets/adaptive-icon.png (1024x1024 centered safe zone)")

    # 3. Android Adaptive Icon Background (Solid #FFB400)
    adaptive_bg = Image.new('RGBA', (1024, 1024), bg_color)
    adaptive_bg.save(os.path.join(assets_img_dir, 'android-icon-background.png'), 'PNG', quality=100)

    # 4. Splash Screen (Mantener imagen original de pantalla de inicio)
    print("Skipping splash.png (keeping original splash image)")

    # 5. Favicons & Web Icons
    favicon_64 = img.resize((64, 64), Image.Resampling.LANCZOS)
    favicon_64.save(os.path.join(assets_dir, 'favicon.png'), 'PNG')
    favicon_64.save(os.path.join(public_dir, 'favicon.png'), 'PNG')
    favicon_64.save(os.path.join(assets_img_dir, 'favicon.png'), 'PNG')
    print("Saved favicons (64x64)")

    icon_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
    icon_192.save(os.path.join(public_dir, 'icon-192.png'), 'PNG')
    print("Saved public/icon-192.png (192x192)")

    icon_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save(os.path.join(public_dir, 'icon-512.png'), 'PNG')
    print("Saved public/icon-512.png (512x512)")

    print("All icons successfully generated and updated!")
    return True

if __name__ == '__main__':
    src = "C:\\Users\\PCZ\\.gemini\\antigravity-ide\\brain\\b18e829b-ff75-4fdd-8f6d-9ef7061c5ad0\\todo_ya_official_brand_icon_1785902483444.png"
    if len(sys.argv) > 1:
        src = sys.argv[1]
    process_icons(src)
