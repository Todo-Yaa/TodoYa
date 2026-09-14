#!/usr/bin/env python3
"""
Generate static SVG GitHub stats card for Wasausky16.
Stdlib only.
Creates:
  - assets/card-stats-dark.svg
  - assets/card-stats-light.svg
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

THEMES = {
    "dark": {
        "bg": "#0D1628",
        "border": "#1B283D",
        "title": "#AA9BEF",
        "text": "#DDE7F5",
        "muted": "#8291A8",
        "value": "#DDE7F5",
        "accent": "#22D3EE",
    },
    "light": {
        "bg": "#FFFFFF",
        "border": "#E5E7EB",
        "title": "#0891B2",
        "text": "#1F2937",
        "muted": "#64748B",
        "value": "#1F2937",
        "accent": "#7C3AED",
    },
}

FONT = "ui-sans-serif, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"

def render_stats_card(user: str, stats: list[tuple[str, str]], theme: str) -> str:
    c = THEMES[theme]
    pad = 22
    tiles = [(v, k) for k, v in stats]
    cols = 3
    rows = (len(tiles) + cols - 1) // cols
    rh, W = 46, 480
    H = pad + 52 + (rows - 1) * rh + 17 + pad
    tw = (W - 2 * pad) / cols

    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="{user} GitHub statistics" font-family="{FONT}">',
        f'<rect x="0.5" y="0.5" width="{W - 1}" height="{H - 1}" rx="10" fill="{c["bg"]}" stroke="{c["border"]}" stroke-width="1"/>',
        f'<text x="{pad}" y="{pad + 14}" font-size="15" font-weight="700" fill="{c["title"]}">{user}</text>',
        f'<text x="{W - pad}" y="{pad + 14}" font-size="11" text-anchor="end" fill="{c["muted"]}">at a glance</text>',
        f'<line x1="{pad}" y1="{pad + 26}" x2="{W - pad}" y2="{pad + 26}" stroke="{c["border"]}" stroke-width="1"/>',
    ]

    top = pad + 52
    for i, (value, label) in enumerate(tiles):
        cx = pad + (i % cols) * tw
        cy = top + (i // cols) * rh
        out.append(f'<text x="{cx:.0f}" y="{cy:.0f}" font-size="22" font-weight="700" fill="{c["value"]}">{value}</text>')
        out.append(f'<text x="{cx:.0f}" y="{cy + 17:.0f}" font-size="11" fill="{c["muted"]}">{label}</text>')

    out.append('</svg>')
    return "".join(out)

def main():
    stats = [
        ("Public Repos", "12+"),
        ("Primary Stack", "Android · RN"),
        ("Status", "Active"),
        ("Role", "Tech Lead"),
        ("Location", "Perú 🇵🇪"),
        ("Focus", "Mobile & AI"),
    ]

    for theme in ("dark", "light"):
        svg = render_stats_card("Wasausky16", stats, theme)
        dest = ASSETS / f"card-stats-{theme}.svg"
        dest.write_text(svg, encoding="utf-8")
        print(f"Generated card-stats-{theme}.svg")

if __name__ == "__main__":
    main()
