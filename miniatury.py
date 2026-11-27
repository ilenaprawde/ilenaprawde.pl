#!/usr/bin/env python
"""Ile Naprawdę – miniaturki odcinków na stronie (N178).
Z okładki img/filmy/N.jpg (pierwsza klatka 9:16) wycina sam paragon (kremowy obszar wykrywany automatycznie,
bez beżowego blatu), kadruje górną część (nagłówek + tytuł + główna kwota), zaokrągla rogi i dodaje lekki cień.
Wynik: img/filmy/mini/N.webp + N.png (480 px szerokości, przezroczyste tło).
Użycie: python miniatury.py            (tylko brakujące lub starsze od okładki)
        python miniatury.py --wszystkie
Gdy paragonu nie da się wykryć (np. plansza z hakiem) – kadr środkowy całej klatki, też z zaokrągleniem."""
import os, sys, re
from PIL import Image, ImageDraw, ImageFilter

KOR = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(KOR, 'img', 'filmy')
OUT = os.path.join(SRC, 'mini')
W = 480            # szerokość paragonu w pliku (2x dla ~240 px CSS)
CIEN = 14          # margines na cień
PROP = 0.80        # jaka część wysokości paragonu (od góry)

def papier(im):
    """Obszar kremowego paragonu: kolumny/wiersze, w których przeważają jasne, prawie białe piksele
    (blat jest beżowy ~ 232,225,209; pojedyncze jasne piksele i artefakty JPEG są pomijane)."""
    w, h = im.size
    px = im.load()
    jasny = lambda p: p[0] >= 244 and p[1] >= 242 and p[2] >= 228
    krok = max(1, w // 180)
    xs = list(range(0, w, krok)); ys = list(range(0, h, krok))
    kol = [sum(jasny(px[x, y]) for y in ys) / len(ys) for x in xs]
    kx = [x for x, f in zip(xs, kol) if f > 0.60 * max(kol)]
    if not kx:
        return None
    x0, x1 = min(kx), max(kx) + krok
    wie = [sum(jasny(px[x, y]) for x in xs if x0 <= x < x1) / max(1, len([x for x in xs if x0 <= x < x1])) for y in ys]
    ky = [y for y, f in zip(ys, wie) if f > 0.60 * max(wie)]
    if not ky:
        return None
    y0, y1 = min(ky), max(ky) + krok
    if (x1 - x0) < w * 0.5 or (y1 - y0) < h * 0.3:
        return None
    return x0, y0, x1, y1

def zrob(plik, nr):
    im = Image.open(plik).convert('RGB')
    w, h = im.size
    bb = papier(im)
    if bb:
        x0, y0, x1, y1 = bb
        # lekko do środka (poszarpana krawędź papieru), kadr od góry
        m = max(2, int(w * 0.004))
        x0 += m; x1 -= m
        y0 += int(h * 0.012)
        yb = y0 + int((y1 - y0) * PROP)
        kadr = im.crop((x0, y0, x1, yb))
    else:
        s = min(w, h)
        kadr = im.crop(((w - s) // 2, int(h * 0.15), (w + s) // 2, int(h * 0.15) + s))
    kw = W
    kh = round(kadr.height * kw / kadr.width)
    kadr = kadr.resize((kw, kh), Image.LANCZOS).convert('RGBA')
    r = 22
    m = Image.new('L', (kw * 4, kh * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, kw * 4 - 1, kh * 4 - 1), r * 4, fill=255)
    m = m.resize((kw, kh), Image.LANCZOS)
    kadr.putalpha(m)
    plotno = Image.new('RGBA', (kw + 2 * CIEN, kh + 2 * CIEN), (0, 0, 0, 0))
    cien = Image.new('RGBA', plotno.size, (0, 0, 0, 0))
    cien.paste((0, 0, 0, 90), (CIEN, CIEN + 4), m)
    cien = cien.filter(ImageFilter.GaussianBlur(5))
    plotno.alpha_composite(cien)
    plotno.alpha_composite(kadr, (CIEN, CIEN))
    os.makedirs(OUT, exist_ok=True)
    plotno.save(os.path.join(OUT, f'{nr}.png'), optimize=True)
    plotno.save(os.path.join(OUT, f'{nr}.webp'), quality=88, method=6)
    return plotno.size, bool(bb)

def main():
    wszystkie = '--wszystkie' in sys.argv
    n = 0
    for f in sorted(os.listdir(SRC), key=lambda s: (len(s), s)):
        mm = re.fullmatch(r'(\d+)\.jpg', f)
        if not mm:
            continue
        nr = mm.group(1)
        zrodlo = os.path.join(SRC, f)
        cel = os.path.join(OUT, f'{nr}.webp')
        if not wszystkie and os.path.exists(cel) and os.path.getmtime(cel) >= os.path.getmtime(zrodlo):
            continue
        rozm, wykryty = zrob(zrodlo, nr)
        print(f'#{nr}: {rozm[0]}x{rozm[1]} {"paragon" if wykryty else "kadr środkowy (brak paragonu)"}')
        n += 1
    print(f'miniatur: {n}')

if __name__ == '__main__':
    main()
