#!/usr/bin/env python
"""Ile Naprawdę – miniaturki odcinków na stronie (N178, poprawione w N179).
Z pierwszej klatki odcinka (okładka 1080×1920) wycina sam paragon i kadruje go od góry do linii TUŻ POD podpisem
pod kwotą (pieczątka nie wchodzi do kadru), zaokrągla rogi, dodaje lekki cień. Wszystkie miniatury mają ten sam rozmiar.
Wynik: img/filmy/mini/N.webp + N.png (przezroczyste tło).

Źródło klatki (pierwsze znalezione, preferowana większa rozdzielczość):
  1. ../../filmy/odcNN_*/okladka_*.png lub .../auto/okladka.png  (pełna rozdzielczość, jeśli folder filmów jest dostępny),
  2. img/filmy/N.jpg  (okładka na stronie; nigdy nie jest podmieniana).
Źródło nie jest powiększane ponad swój rozmiar.

Użycie: python miniatury.py            (tylko brakujące / starsze niż źródło / starsze niż ten skrypt)
        python miniatury.py --wszystkie
        python miniatury.py --arkusz plik.png   (dodatkowo zestawienie wszystkich miniatur na ciemnym tle)"""
import os, sys, re, glob
from PIL import Image, ImageDraw, ImageFilter, ImageChops

KOR = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(KOR, 'img', 'filmy')
OUT = os.path.join(SRC, 'mini')
FILMY = os.path.normpath(os.path.join(KOR, '..', '..', 'filmy'))
W = 480            # szerokość kadru paragonu w pliku (2x dla ~240 px CSS)
H = 480            # wysokość kadru (jednolita dla wszystkich): kwadrat
CIEN = 14          # margines na cień
PAD = 8            # tnie TUŻ pod podpisem (px w skali 1080); dalej dopełniamy papierem, żeby pieczątka nie weszła
MARG = 34          # kremowy margines dopełniony z boków i od dołu (px w skali 1080)
SKRAJ = 0.012      # odcięcie poszarpanej krawędzi papieru (ułamek szerokości)

def prog(kanal, test):
    return kanal.point(lambda v: 255 if test(v) else 0)

def maska(im, tr, tg, tb):
    r, g, b = im.split()
    return ImageChops.multiply(ImageChops.multiply(prog(r, tr), prog(g, tg)), prog(b, tb))

def profil(m, box, os_):
    """Średnia maski (0–255) wzdłuż osi: 'x' → wartość na kolumnę, 'y' → wartość na wiersz (w obrębie box)."""
    c = m.crop(box)
    if os_ == 'x':
        return list(c.resize((c.width, 1), Image.BOX).getdata())
    return list(c.resize((1, c.height), Image.BOX).getdata())

def papier(im):
    """Kremowy papier: prawie biały (blat jest beżowy ~232,225,209, cień ciemniejszy). Krawędzie z profili kolumn/wierszy."""
    w, h = im.size
    m = maska(im, lambda v: v >= 244, lambda v: v >= 242, lambda v: v >= 228)
    kol = profil(m, (0, 0, w, h), 'x')
    mx = max(kol)
    if mx < 60:
        return None
    kx = [x for x, f in enumerate(kol) if f > 0.5 * mx]
    x0, x1 = min(kx), max(kx) + 1
    wie = profil(m, (x0, 0, x1, h), 'y')
    my = max(wie)
    ky = [y for y, f in enumerate(wie) if f > 0.5 * my]
    y0, y1 = min(ky), max(ky) + 1
    if (x1 - x0) < w * 0.5 or (y1 - y0) < h * 0.3:
        return None
    return x0, y0, x1, y1

def niebieski(im):
    return maska(im, lambda v: v < 100, lambda v: v < 140, lambda v: v > 140)

def dol_kadru(im, bb):
    """Linia tuż pod podpisem pod kwotą: dół niebieskiej elipsy, potem pierwszy pas neutralnego ciemnego tekstu pod nią.
    Czerwona pieczątka jest czerwona (nie neutralna), więc nie wpływa na wynik. Zwraca y (w układzie całego obrazu) lub None."""
    x0, y0, x1, y1 = bb
    sub = im.crop(bb)
    wn = profil(niebieski(sub), (0, 0, sub.width, sub.height), 'y')
    ye = [y for y, f in enumerate(wn) if f / 255 * sub.width > 6]
    if not ye:
        return None
    elipsa_dol = max(ye)
    neutralny = maska(sub, lambda v: v < 150, lambda v: v < 150, lambda v: v < 150)
    wd = profil(neutralny, (int(sub.width * 0.06), 0, int(sub.width * 0.94), sub.height), 'y')
    lim = min(sub.height, elipsa_dol + int(sub.width * 0.20))
    wiersze = [y for y in range(max(0, elipsa_dol - 8), lim) if wd[y] / 255 * sub.width * 0.88 > 3]
    if not wiersze:
        return y0 + elipsa_dol
    poprz = wiersze[0]
    for y in wiersze[1:]:
        if y - poprz > 14:
            break
        poprz = y
    return y0 + poprz

def zakres_elipsy(im, y_od, y_do):
    n = niebieski(im)
    kol = profil(n, (0, y_od, im.width, y_do), 'x')
    xs = [x for x, f in enumerate(kol) if f / 255 * (y_do - y_od) > 3]
    return (min(xs), max(xs) + 1) if xs else None

def zrodlo(nr):
    """(ścieżka, skąd) – preferuje pełną rozdzielczość z folderu filmów."""
    kand = []
    for d in sorted(glob.glob(os.path.join(FILMY, f'odc{int(nr):02d}_*'))):
        if os.path.exists(os.path.join(d, 'NIEAKTUALNE.txt')) or os.path.exists(os.path.join(d, 'ARCHIWUM.txt')):
            continue
        kand += glob.glob(os.path.join(d, 'okladka_*.png')) + [os.path.join(d, 'auto', 'okladka.png')]
    best = None
    for k in kand:
        if not os.path.exists(k):
            continue
        try:
            sz = Image.open(k).size[0]
        except Exception:
            continue
        if best is None or sz > best[0]:
            best = (sz, k)
    jpg = os.path.join(SRC, f'{nr}.jpg')
    if best and (not os.path.exists(jpg) or best[0] >= Image.open(jpg).size[0]):
        return best[1], 'filmy'
    return (jpg, 'okładka na stronie') if os.path.exists(jpg) else (None, None)

def zrob(plik, nr):
    im = Image.open(plik).convert('RGB')
    if im.width > 1080:
        im = im.resize((1080, round(im.height * 1080 / im.width)), Image.LANCZOS)
    bb = papier(im)
    info = []
    if bb:
        x0, y0, x1, y1 = bb
        m = max(3, int((x1 - x0) * SKRAJ))
        xl, xr = x0 + m, x1 - m
        yd = dol_kadru(im, bb)
        yt = y0 + int((y1 - y0) * 0.012)
        if yd is None:
            yd = y0 + int((y1 - y0) * 0.72); info.append('brak elipsy – kadr 72%')
        yb = min(y1, yd + PAD)
        ex = zakres_elipsy(im, y0 + int((yb - y0) * 0.30), yd)
        if ex and (ex[0] < xl - 2 or ex[1] > xr + 2):
            info.append(f'elipsa poza papierem ({ex[0]}-{ex[1]} vs {xl}-{xr})')
        kadr = im.crop((xl, yt, xr, yb))
        tlo_kolor = kadr.getpixel((6, kadr.height - 3))
        # pas PAD pod podpisem (ogonki liter) może zahaczyć o róg pieczątki – czerwone piksele zamalowujemy papierem
        zh = PAD + 30                       # wysokość pasa podpisu (poniżej elipsy, nad nim nie ma czerwonych znaków)
        pas = kadr.crop((0, kadr.height - zh, kadr.width, kadr.height))
        rr, gg, bb_ = pas.split()
        cz = ImageChops.subtract(rr, ImageChops.lighter(gg, bb_)).point(lambda v: 255 if v > 45 else 0).filter(ImageFilter.MaxFilter(5))
        pas.paste(tlo_kolor, mask=cz)
        kadr.paste(pas, (0, kadr.height - zh))
        # dopełnienie papierem: boki i dół (elipsa i podpis mają oddech, a pieczątka nie wchodzi do kadru)
        c = Image.new('RGB', (kadr.width + 2 * MARG, kadr.height + MARG), tlo_kolor)
        c.paste(kadr, (MARG, 0)); kadr = c
        cel_h = kadr.width * H / W
        if kadr.height > cel_h:                      # wyższy niż 1:1 → poszerzamy papierem (bez ucinania)
            nw = round(kadr.height * W / H)
            c = Image.new('RGB', (nw, kadr.height), tlo_kolor)
            c.paste(kadr, ((nw - kadr.width) // 2, 0)); kadr = c
        elif kadr.height < cel_h:                    # niższy → dopełniamy dół papierem
            c = Image.new('RGB', (kadr.width, round(cel_h)), tlo_kolor)
            c.paste(kadr, (0, 0)); kadr = c
    else:
        sq = min(im.width, im.height)
        kadr = im.crop(((im.width - sq) // 2, int(im.height * 0.15), (im.width + sq) // 2, int(im.height * 0.15) + sq))
        info.append('brak paragonu – kadr środkowy')
    kw = min(W, kadr.width)                          # nie powiększaj ponad źródło
    kh = round(kadr.height * kw / kadr.width)
    kadr = kadr.resize((kw, kh), Image.LANCZOS).convert('RGBA')
    r = max(12, round(22 * kw / W))
    mk = Image.new('L', (kw * 4, kh * 4), 0)
    ImageDraw.Draw(mk).rounded_rectangle((0, 0, kw * 4 - 1, kh * 4 - 1), r * 4, fill=255)
    mk = mk.resize((kw, kh), Image.LANCZOS)
    kadr.putalpha(mk)
    plotno = Image.new('RGBA', (kw + 2 * CIEN, kh + 2 * CIEN), (0, 0, 0, 0))
    cien = Image.new('RGBA', plotno.size, (0, 0, 0, 0))
    cien.paste((0, 0, 0, 90), (CIEN, CIEN + 4), mk)
    cien = cien.filter(ImageFilter.GaussianBlur(5))
    plotno.alpha_composite(cien)
    plotno.alpha_composite(kadr, (CIEN, CIEN))
    os.makedirs(OUT, exist_ok=True)
    plotno.save(os.path.join(OUT, f'{nr}.png'), optimize=True)
    plotno.save(os.path.join(OUT, f'{nr}.webp'), quality=88, method=6)
    return plotno.size, info

def arkusz(plik):
    pliki = sorted(glob.glob(os.path.join(OUT, '*.png')), key=lambda p: int(os.path.basename(p)[:-4]))
    ims = [Image.open(p) for p in pliki]
    kol = 6
    cw = max(i.width for i in ims) // 2 + 6
    ch = max(i.height for i in ims) // 2 + 22
    rows = (len(ims) + kol - 1) // kol
    c = Image.new('RGBA', (kol * cw, rows * ch), (15, 17, 21, 255))
    d = ImageDraw.Draw(c)
    for n, (p, i) in enumerate(zip(pliki, ims)):
        x, y = (n % kol) * cw, (n // kol) * ch
        c.alpha_composite(i.resize((i.width // 2, i.height // 2), Image.LANCZOS), (x + 3, y + 18))
        d.text((x + 6, y + 3), f'#{os.path.basename(p)[:-4]}  {i.width}x{i.height}', fill=(255, 224, 74, 255))
    c.convert('RGB').save(plik)

def main():
    wszystkie = '--wszystkie' in sys.argv
    skrypt_t = os.path.getmtime(os.path.abspath(__file__))
    n = 0
    for f in sorted(os.listdir(SRC), key=lambda s: (len(s), s)):
        mm = re.fullmatch(r'(\d+)\.jpg', f)
        if not mm:
            continue
        nr = mm.group(1)
        zr, skad = zrodlo(nr)
        if not zr:
            continue
        cel = os.path.join(OUT, f'{nr}.webp')
        # w CI (świeży checkout = losowe czasy plików) generujemy tylko brakujące; lokalnie także starsze niż źródło/skrypt
        stare = (not os.environ.get('CI')) and os.path.exists(cel) and os.path.getmtime(cel) < max(os.path.getmtime(zr), skrypt_t)
        if not wszystkie and os.path.exists(cel) and not stare:
            continue
        rozm, info = zrob(zr, nr)
        print(f'#{nr}: {rozm[0]}x{rozm[1]} źródło: {skad} {os.path.basename(zr)}' + (' | ' + '; '.join(info) if info else ''))
        n += 1
    print(f'miniatur: {n}')
    if '--arkusz' in sys.argv:
        arkusz(sys.argv[sys.argv.index('--arkusz') + 1])

if __name__ == '__main__':
    main()
