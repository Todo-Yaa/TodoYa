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

    # 1. Main app icon (1024x1024)
    icon_1024 = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    icon_1024.save(os.path.join(assets_dir, 'icon.png'), 'PNG', quality=100)
    icon_1024.save(os.path.join(assets_img_dir, 'icon.png'), 'PNG', quality=100)
    print("Saved assets/icon.png (1024x1024)")

    # 2. Android Adaptive Icon Foreground (1024x1024 with 60% centered scale for safe zone)
    # Background transparent, foreground scaled down to ~640x640 and placed at center (192, 192)
    adaptive_fg = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    fg_scaled = img.resize((640, 640), Image.Resampling.LANCZOS)
    # Paste centered
    adaptive_fg.paste(fg_scaled, (192, 192), fg_scaled)
    adaptive_fg.save(os.path.join(assets_dir, 'adaptive-icon.png'), 'PNG', quality=100)
    adaptive_fg.save(os.path.join(assets_img_dir, 'android-icon-foreground.png'), 'PNG', quality=100)
    print("Saved assets/adaptive-icon.png (1024x1024 with centered safe zone)")

    # 3. Android Adaptive Icon Background (Solid dark obsidian background)
    bg_color = (26, 29, 32, 255) # #1A1D20 dark obsidian
    adaptive_bg = Image.new('RGBA', (1024, 1024), bg_color)
    adaptive_bg.save(os.path.join(assets_img_dir, 'android-icon-background.png'), 'PNG', quality=100)

    # 4. Splash Screen (2048x2048 with dark background and centered icon)
    splash_bg = Image.new('RGBA', (2048, 2048), bg_color)
    splash_logo = img.resize((720, 720), Image.Resampling.LANCZOS)
    splash_bg.paste(splash_logo, (664, 664), splash_logo)
    splash_bg.save(os.path.join(assets_dir, 'splash.png'), 'PNG', quality=100)
    splash_bg.save(os.path.join(assets_img_dir, 'splash-icon.png'), 'PNG', quality=100)
    print("Saved assets/splash.png (2048x2048)")

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
    if len(sys.argv) > 1:
        src = sys.argv[1]
    else:
        src = "C:\\Users\\PCZ\\.gemini\\antigravity-ide\\brain\\b18e829b-ff75-4fdd-8f6d-9ef7061c5ad0\\todo_ya_app_icon_1785902109568.png"
    process_icons(src)
