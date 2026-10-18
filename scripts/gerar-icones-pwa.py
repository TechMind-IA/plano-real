#!/usr/bin/env python3
"""Gera ícones PWA do app Finanças na paleta do design system
(--c-deep #16376e, --c-mid #2e5fbf, --c-pale #e9ecf2)."""
from pathlib import Path
from PIL import Image, ImageDraw

DEEP = (22, 55, 110)      # #16376e
MID = (46, 95, 191)       # #2e5fbf
PALE = (233, 236, 242)    # #e9ecf2
OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
SS = 4  # supersampling


def glyph(canvas: int, scale: float = 1.0, radius: int = 0) -> Image.Image:
    """Ícone completo em RGBA. canvas = tamanho final; scale comprime o
    desenho (para maskable/apple-touch, mantendo a área segura);
    radius arredonda o fundo (0 = fundo sangrando)."""
    s = canvas * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    r = int(radius * SS)
    if r > 0:
        d.rounded_rectangle((0, 0, s - 1, s - 1), radius=r, fill=DEEP + (255,))
    else:
        d.rectangle((0, 0, s - 1, s - 1), fill=DEEP + (255,))

    # Três barras ascendentes (gráfico), desenhadas num canvas 512-base
    # e depois centradas/comprimidas no tamanho real.
    bw, gap = 64, 28
    heights = [96, 148, 204]
    bar_radius = 14
    bottom = 340  # base das barras no canvas 512-base
    total_w = 3 * bw + 2 * gap
    x0 = (512 - total_w) // 2
    colors = [PALE, MID, PALE]

    group = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    gd = ImageDraw.Draw(group)
    scale_s = s / 512
    for i, (h, c) in enumerate(zip(heights, colors)):
        x = (x0 + i * (bw + gap)) * scale_s
        y_top = (bottom - h) * scale_s
        y_bot = bottom * scale_s
        gd.rounded_rectangle(
            (x, y_top, x + bw * scale_s - 1, y_bot),
            radius=bar_radius * scale_s,
            fill=c + (255,),
        )

    if scale != 1.0:
        smaller = group.resize(
            (max(1, int(s * scale)), max(1, int(s * scale))), Image.LANCZOS
        )
        group = Image.new("RGBA", (s, s), (0, 0, 0, 0))
        off = (s - smaller.width) // 2
        group.alpha_composite(smaller, (off, off))

    img.alpha_composite(group)
    return img.resize((canvas, canvas), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    # Regulares: canto arredondado ~22%
    glyph(192, radius=42).save(OUT / "icon-192.png")
    glyph(512, radius=112).save(OUT / "icon-512.png")
    # Maskable: fundo sangrado, glyph a 72% (zona segura do Android)
    glyph(512, scale=0.72, radius=0).save(OUT / "icon-maskable-512.png")
    # Apple touch: 180x180, fundo sangrado (iOS aplica a máscara)
    glyph(180, scale=0.78, radius=0).save(OUT / "apple-touch-icon.png")
    for f in sorted(OUT.iterdir()):
        print(f.name, Image.open(f).size)


if __name__ == "__main__":
    main()
