#!/usr/bin/env python3
"""
Generate skill radar and language stack radar SVGs for Wasausky16.
Stdlib only.
Creates:
  - assets/radar-dark.svg
  - assets/radar-light.svg
  - assets/radar-langs-dark.svg
  - assets/radar-langs-light.svg
"""

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

THEMES = {
    "dark": {
        "grid": "#30363d",
        "spoke": "#21262d",
        "label": "#c9d1d9",
        "value": "#8b949e",
        "title": "#aa9bef",
        "fill": "#aa9bef",
        "stroke": "#22d3ee",
        "vertex": "#ffb400",
        "bg": "none",
    },
    "light": {
        "grid": "#d0d7de",
        "spoke": "#e6eaef",
        "label": "#1f2328",
        "value": "#57606a",
        "title": "#0891b2",
        "fill": "#0891b2",
        "stroke": "#7c3aed",
        "vertex": "#d97706",
        "bg": "none",
    },
}

FONT = "ui-sans-serif,-apple-system,Segoe UI,Helvetica,Arial,sans-serif"
LBL, VAL, TTL = 13, 11, 15

def ring(radius, n, start=-math.pi / 2):
    return [
        (radius * math.cos(start + i * 2 * math.pi / n),
         radius * math.sin(start + i * 2 * math.pi / n))
        for i in range(n)
    ]

def text_width(s, font_size):
    return len(s) * font_size * 0.62

def esc(s: str) -> str:
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def render(title, axes, theme: str, size: int=420, rings: int=4) -> str:
    c = THEMES[theme]
    n = len(axes)
    r = size / 2 - 12
    gap = 20

    vals = [max(0.0, min(100.0, v)) for _, v in axes]
    outer = ring(r, n)

    labels = []
    for i, (label, _) in enumerate(axes):
        ang = -math.pi / 2 + i * 2 * math.pi / n
        cosv, sinv = math.cos(ang), math.sin(ang)
        lx, ly = (r + gap) * cosv, (r + gap) * sinv
        anchor = "middle" if abs(cosv) < 0.25 else ("start" if cosv > 0 else "end")
        dy = 4 if abs(sinv) < 0.25 else (14 if sinv > 0 else -5)
        labels.append((lx, ly + dy, anchor, label, vals[i]))

    minx, maxx, miny, maxy = -r, r, -r, r
    for lx, ly, anchor, label, v in labels:
        w = max(text_width(label, LBL), text_width(f"{v:g}", VAL))
        if anchor == "start":
            x0, x1 = lx, lx + w
        elif anchor == "end":
            x0, x1 = lx - w, lx
        else:
            x0, x1 = lx - w / 2, lx + w / 2
        y0 = ly - LBL
        y1 = ly + 4 + VAL + 4
        minx, maxx = min(minx, x0), max(maxx, x1)
        miny, maxy = min(miny, y0), max(maxy, y1)

    pad = 12
    title_h = TTL + 14 if title else 0
    W = round((maxx - minx) + 2 * pad)
    H = round((maxy - miny) + 2 * pad + title_h)
    ox, oy = -minx + pad, -miny + pad + title_h

    if title:
        need = round(text_width(title, TTL) + 2 * pad)
        if need > W:
            ox += (need - W) / 2
            W = need

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
        f'width="{W}" height="{H}" role="img" '
        f'aria-label="{esc(title)}" font-family="{FONT}">'
    ]
    if title:
        parts.append(
            f'<text x="{W / 2:.1f}" y="{pad + TTL:.0f}" text-anchor="middle" '
            f'font-size="{TTL}" font-weight="700" fill="{c["title"]}">'
            f'{esc(title)}</text>'
        )
    parts.append(f'<g transform="translate({ox:.1f},{oy:.1f})">')

    for k in range(rings, 0, -1):
        d = " ".join(f"{x:.1f},{y:.1f}" for x, y in ring(r * k / rings, n))
        parts.append(
            f'<polygon points="{d}" fill="none" stroke="{c["grid"]}" '
            f'stroke-width="1" opacity="{0.35 + 0.5 * k / rings:.2f}"/>'
        )

    for x, y in outer:
        parts.append(
            f'<line x1="0" y1="0" x2="{x:.1f}" y2="{y:.1f}" '
            f'stroke="{c["spoke"]}" stroke-width="1"/>'
        )

    shape = [(px * v / 100, py * v / 100) for (px, py), v in zip(outer, vals)]
    d = " ".join(f"{x:.1f},{y:.1f}" for x, y in shape)
    parts.append("<g>")
    parts.append(
        f'<polygon points="{d}" fill="{c["fill"]}" fill-opacity="0.22" '
        f'stroke="{c["stroke"]}" stroke-width="2.5" stroke-linejoin="round"/>'
    )
    for x, y in shape:
        parts.append(
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4" fill="{c["vertex"]}" '
            f'stroke="{c["stroke"]}" stroke-width="1.5"/>'
        )
    parts.append("</g>")

    for lx, ly, anchor, label, v in labels:
        parts.append(
            f'<text x="{lx:.1f}" y="{ly:.1f}" text-anchor="{anchor}" '
            f'font-size="{LBL}" font-weight="600" fill="{c["label"]}">'
            f'{esc(label)}</text>'
        )

    parts.append("</g></svg>")
    return "".join(parts)

def generate_radar(json_path: Path, out_prefix: str):
    data = json.loads(json_path.read_text(encoding="utf-8"))
    title = data.get("title", "")
    axes = [(a["label"], float(a["value"])) for a in data["axes"]]

    for theme in ("dark", "light"):
        svg = render(title, axes, theme)
        dest = ASSETS / f"{out_prefix}-{theme}.svg"
        dest.write_text(svg, encoding="utf-8")
        print(f"Generated {dest.name}")

def main():
    generate_radar(ASSETS / "skills.json", "radar")
    generate_radar(ASSETS / "langmix.json", "radar-langs")

if __name__ == "__main__":
    main()
