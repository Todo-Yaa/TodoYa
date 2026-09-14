#!/usr/bin/env python3
"""
Generate animated/styled SVG GitHub profile banners for Luis Merma (Wasausky16).
Inspired by emmi-lili/emmi-lili banner layout.
Creates:
  - assets/banner-dark.svg
  - assets/banner-light.svg
"""

import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)

ROWS = [
    ("Subject", "Luis Merma (Wasausky16)"),
    ("Role", "Mobile & Full Stack Engineer · Tech Lead"),
    ("Origin", "Perú 🇵🇪"),
    ("Education", "Software Development · Android & Web"),
    ("Status", "Building Todo Ya + Learning + Shipping"),
    ("ToolChain", "Android Studio · Cursor · VS Code · Git"),
    ("Core.Lang", "Kotlin · TypeScript · Java · Python · JS"),
    ("Core.Frontend", "React Native · Expo v56 · React · Tailwind"),
    ("Core.Backend", "Node.js · Serverless APIs · Express"),
    ("Core.Database", "Postgres (Neon DB) · Firebase · Supabase"),
    ("Core.Infra", "Vercel · Cloudinary · Docker"),
    ("Grid.LinkedIn", "/in/luis-merma-alarcon-01379a1b9"),
    ("Grid.GitHub", "Wasausky16"),
    ("Grid.Instagram", "@soy_luchito"),
    ("Grid.Facebook", "luis.mermaalarcon"),
]

THEMES = {
    "dark": {
        "bg": "#0A101F",
        "bg_stroke": "#1E293B",
        "panel_left": "#091120",
        "panel_right": "#0D1628",
        "border": "#1B283D",
        "bracket": "#25344C",
        "title": "#8291A8",
        "heading": "#22D3EE",
        "text_key": "#8291A8",
        "text_val": "#DDE7F5",
        "accent": "#FFB400",
        "purple": "#AA9BEF",
        "cyan": "#22D3EE",
        "green": "#10B981",
        "red": "#EF4444",
        "muted": "#526480",
        "particle_base": "#AA9BEF",
    },
    "light": {
        "bg": "#F6F8FA",
        "bg_stroke": "#D0D7DE",
        "panel_left": "#FFFFFF",
        "panel_right": "#F3F4F6",
        "border": "#E5E7EB",
        "bracket": "#CBD5E1",
        "title": "#64748B",
        "heading": "#0891B2",
        "text_key": "#64748B",
        "text_val": "#1F2937",
        "accent": "#D97706",
        "purple": "#7C3AED",
        "cyan": "#0891B2",
        "green": "#059669",
        "red": "#DC2626",
        "muted": "#94A3B8",
        "particle_base": "#7C3AED",
    }
}

def generate_particles(seed=42):
    random.seed(seed)
    particles = []

    # Map box bounds: x in [56, 416], y in [112, 520] -> Center is x=236, y=316
    cx, cy = 236, 316

    # Generate points along the `< / >` code symbol
    # Left bracket `<`: (180, 230) -> (130, 316) -> (180, 402)
    def interpolate_line(p1, p2, count):
        pts = []
        for i in range(count):
            t = i / max(1, count - 1)
            x = p1[0] + (p2[0] - p1[0]) * t
            y = p1[1] + (p2[1] - p1[1]) * t
            pts.append((x, y))
        return pts

    line_points = []
    # Left `<`
    line_points.extend(interpolate_line((180, 236), (136, 316), 40))
    line_points.extend(interpolate_line((136, 316), (180, 396), 40))

    # Center `/`
    line_points.extend(interpolate_line((252, 220), (220, 412), 65))

    # Right `>`
    line_points.extend(interpolate_line((292, 236), (336, 316), 40))
    line_points.extend(interpolate_line((336, 316), (292, 396), 40))

    # Dither / Jitter points to create matrix effect
    for bx, by in line_points:
        # Core dense points
        for _ in range(5):
            jx = bx + random.gauss(0, 3.5)
            jy = by + random.gauss(0, 3.5)
            r = random.choice([1.2, 1.6, 2.0, 2.4])
            op = round(random.uniform(0.5, 0.95), 2)
            c_type = random.choices(["cyan", "purple", "accent"], weights=[0.4, 0.4, 0.2])[0]
            particles.append((round(jx, 1), round(jy, 1), r, op, c_type))

        # Outer halo / dither spray points
        for _ in range(3):
            jx = bx + random.gauss(0, 11.0)
            jy = by + random.gauss(0, 11.0)
            r = random.choice([0.8, 1.2, 1.5])
            op = round(random.uniform(0.15, 0.55), 2)
            c_type = random.choices(["purple", "cyan"], weights=[0.6, 0.4])[0]
            particles.append((round(jx, 1), round(jy, 1), r, op, c_type))

    # Add ambient starfield/node dots inside the box
    for _ in range(180):
        ax = random.uniform(66, 406)
        ay = random.uniform(122, 510)
        r = random.choice([0.7, 1.0, 1.3])
        op = round(random.uniform(0.1, 0.4), 2)
        c_type = random.choice(["cyan", "purple"])
        particles.append((round(ax, 1), round(ay, 1), r, op, c_type))

    return particles

def build_svg(theme_name):
    t = THEMES[theme_name]
    particles = generate_particles()

    svg_parts = []
    svg_parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1180 610" width="100%" height="100%" style="background-color: transparent;">')
    
    # SVG Styles & Fonts
    svg_parts.append(f'''<defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&amp;display=swap');
      .mono {{ font-family: 'JetBrains Mono', monospace, ui-monospace; }}
      .title-text {{ fill: {t["title"]}; font-size: 13px; font-weight: 500; letter-spacing: 0.5px; }}
      .heading-text {{ fill: {t["heading"]}; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; }}
      .key-text {{ fill: {t["text_key"]}; font-size: 12.5px; font-weight: 500; }}
      .val-text {{ fill: {t["text_val"]}; font-size: 12.5px; font-weight: 600; text-anchor: end; }}
      .muted-text {{ fill: {t["muted"]}; font-size: 11px; font-weight: 500; }}
      .pulse {{ animation: pulse-anim 2s infinite alternate; }}
      @keyframes pulse-anim {{
        0% {{ opacity: 0.4; }}
        100% {{ opacity: 1.0; }}
      }}
    </style>
  </defs>''')

    # Main outer container
    svg_parts.append(f'<rect width="1180" height="610" rx="16" fill="{t["bg"]}" stroke="{t["bg_stroke"]}" stroke-width="2"/>')

    # Top Window Title Bar
    svg_parts.append('<g id="window-header">')
    # Window controls
    svg_parts.append(f'<circle cx="36" cy="26" r="6" fill="{t["red"]}"/>')
    svg_parts.append(f'<circle cx="56" cy="26" r="6" fill="#FFBD2E"/>')
    svg_parts.append(f'<circle cx="76" cy="26" r="6" fill="{t["green"]}"/>')
    # Title text
    svg_parts.append(f'<text x="590" y="30" text-anchor="middle" class="mono title-text">profile.sh --live</text>')
    # Horizontal rule
    svg_parts.append(f'<line x1="20" y1="48" x2="1160" y2="48" stroke="{t["border"]}" stroke-width="1"/>')
    svg_parts.append('</g>')

    # LEFT PANEL: VISUAL.MAP
    svg_parts.append('<g id="visual-map">')
    svg_parts.append(f'<rect x="36" y="64" width="400" height="514" rx="10" fill="{t["panel_left"]}" stroke="{t["border"]}" stroke-width="1.5"/>')
    svg_parts.append(f'<text x="56" y="90" class="mono heading-text">VISUAL.MAP</text>')
    svg_parts.append(f'<text x="416" y="90" text-anchor="end" class="mono muted-text">300×340 / 1-BIT</text>')

    # Inner Frame Box for Visual Map
    svg_parts.append(f'<rect x="56" y="104" width="360" height="434" fill="none" stroke="{t["border"]}" stroke-dasharray="4 4" stroke-width="1"/>')
    # Frame Corners
    c_stroke = t["bracket"]
    svg_parts.append(f'<path d="M 56 120 L 56 104 L 72 104" fill="none" stroke="{c_stroke}" stroke-width="2"/>')
    svg_parts.append(f'<path d="M 416 120 L 416 104 L 400 104" fill="none" stroke="{c_stroke}" stroke-width="2"/>')
    svg_parts.append(f'<path d="M 56 522 L 56 538 L 72 538" fill="none" stroke="{c_stroke}" stroke-width="2"/>')
    svg_parts.append(f'<path d="M 416 522 L 416 538 L 400 538" fill="none" stroke="{c_stroke}" stroke-width="2"/>')

    # Draw dither particles inside VISUAL.MAP
    svg_parts.append('<g id="particles">')
    for x, y, r, op, c_type in particles:
        color = t[c_type]
        svg_parts.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}" opacity="{op}"/>')
    svg_parts.append('</g>')

    # Left Footer Label
    svg_parts.append(f'<text x="56" y="562" class="mono muted-text">PTS 18000 · PERU NODE</text>')
    svg_parts.append('</g>')

    # RIGHT PANEL: SYSTEM.INFO
    svg_parts.append('<g id="system-info">')
    svg_parts.append(f'<rect x="456" y="64" width="688" height="514" rx="10" fill="{t["panel_right"]}" stroke="{t["border"]}" stroke-width="1.5"/>')
    
    # System info header
    svg_parts.append(f'<text x="476" y="90" class="mono heading-text">SYSTEM.INFO</text>')
    
    # Live Badge
    svg_parts.append(f'<circle cx="984" cy="86" r="4" fill="{t["red"]}" class="pulse"/>')
    svg_parts.append(f'<text x="994" y="90" class="mono" fill="{t["red"]}" font-size="11" font-weight="700">LIVE</text>')
    
    # User Pill Badge `@Wasausky16`
    svg_parts.append(f'<rect x="1040" y="74" width="88" height="22" rx="11" fill="{t["border"]}"/>')
    svg_parts.append(f'<text x="1084" y="89" text-anchor="middle" class="mono" fill="{t["heading"]}" font-size="11" font-weight="600">@Wasausky16</text>')

    # Horizontal divider under panel header
    svg_parts.append(f'<line x1="476" y1="104" x2="1124" y2="104" stroke="{t["border"]}" stroke-width="1"/>')

    # Key-Value Data Rows
    start_y = 132
    row_step = 28.5

    for idx, (key, val) in enumerate(ROWS):
        ry = start_y + idx * row_step
        # Key text (left)
        svg_parts.append(f'<text x="476" y="{ry}" class="mono key-text">{key}</text>')

        # Dotted leader line between key and value
        dots_x1 = 476 + len(key) * 8.5 + 12
        dots_x2 = 1124 - len(val) * 7.8 - 12
        if dots_x2 > dots_x1 + 20:
            svg_parts.append(f'<line x1="{dots_x1}" y1="{ry - 4}" x2="{dots_x2}" y2="{ry - 4}" stroke="{t["border"]}" stroke-dasharray="2 4" stroke-width="1"/>')

        # Value text (right)
        svg_parts.append(f'<text x="1124" y="{ry}" class="mono val-text">{val}</text>')

    # Footer divider
    svg_parts.append(f'<line x1="476" y1="542" x2="1124" y2="542" stroke="{t["border"]}" stroke-width="1"/>')

    # Right Footer Labels
    svg_parts.append(f'<circle cx="482" cy="558" r="4" fill="{t["green"]}"/>')
    svg_parts.append(f'<text x="494" y="562" class="mono" fill="{t["green"]}" font-size="11" font-weight="700" letter-spacing="0.5">ALL SYSTEMS NOMINAL</text>')
    svg_parts.append(f'<text x="1124" y="562" text-anchor="end" class="mono muted-text">UTC-5 · LATAM NODE</text>')
    svg_parts.append('</g>')

    svg_parts.append('</svg>')
    return '\n'.join(svg_parts)

def main():
    dark_svg = build_svg("dark")
    light_svg = build_svg("light")

    (ASSETS / "banner-dark.svg").write_text(dark_svg, encoding="utf-8")
    (ASSETS / "banner-light.svg").write_text(light_svg, encoding="utf-8")

    print("Generated assets/banner-dark.svg and assets/banner-light.svg successfully!")

if __name__ == "__main__":
    main()
