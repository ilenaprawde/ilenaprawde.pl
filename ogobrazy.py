#!/usr/bin/env python
"""Ile Naprawdę – podglądy linków (og:image 1200×630) dla stron kalkulatorów (N182).
Dla każdego kalkulatora rysuje (Edge/Chrome headless z szablonu HTML) grafikę: ciemne tło z siatką kropek, z lewej miniatura paragonu
OPUBLIKOWANEGO odcinka (img/filmy/mini; brak odcinka → sam tekst), z prawej „Ile naprawdę kosztuje [słowo?]” + tytuł kalkulatora
(zawijanie, max 3 linie nagłówka – tekst skaluje się, by się zmieścił), na dole ikona „ILE?” z napisem „ILE NAPRAWDĘ” tuż pod nią i ilenaprawde.pl.
Wynik: img/og/<id>.png. Zbuduj.js używa pliku, gdy istnieje (inaczej wspólny og-ilenaprawde-v2.png).
Użycie: python ogobrazy.py            (tylko brakujące; w CI/bez przeglądarki nic nie robi)
        python ogobrazy.py --wszystkie
        python ogobrazy.py --arkusz plik.png  (zestawienie podglądów)
Czcionka: Segoe UI Black/Bold (Windows) – zamiennik Intera, którego nie ma w systemie."""
import os, sys, json, subprocess, tempfile, shutil, time, glob, html
from pathlib import Path

KOR = Path(__file__).resolve().parent
OUT = KOR / 'img' / 'og'
PRZEGLADARKI = [r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe', r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
                r'C:\Program Files\Google\Chrome\Application\chrome.exe']

def dane():
    js = "global.window={};require('./dane.js');const I=window.ILE;console.log(JSON.stringify({K:I.KALK.map(c=>({id:c.id,krot:c.krot,st:c.st||''})),O:I.ODCINKI.filter(o=>!o.plan&&o.yt&&o.pa).map(o=>({nr:o.nr,id:o.id,pa:o.pa}))}))"
    return json.loads(subprocess.run(['node', '-e', js], cwd=KOR, capture_output=True, text=True, encoding='utf-8', check=True).stdout)

def slowo(krot):
    k = krot.strip()
    if len(k) > 1 and k[0].isupper() and k[1].islower():
        k = k[0].lower() + k[1:]
    return k

def szablon(c, mini):
    ik = (KOR / 'img' / 'awatar' / 'awatar-160.png').as_uri()
    f400 = (KOR / 'fonts' / 'IBMPlexMono-700-latin.woff2').as_uri()
    f400x = (KOR / 'fonts' / 'IBMPlexMono-700-latin-ext.woff2').as_uri()
    lewo = f'<img class="par" src="{Path(mini).as_uri()}">' if mini else ''
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:PM;font-weight:700;src:url({f400}) format("woff2");unicode-range:U+0000-00FF,U+2000-206F}}
@font-face{{font-family:PM;font-weight:700;src:url({f400x}) format("woff2");unicode-range:U+0100-02BA}}
*{{box-sizing:border-box;margin:0}}
html,body{{width:1200px;height:630px;overflow:hidden;background:#0F1115;color:#F4EFE3;font-family:"Segoe UI Black","Segoe UI",system-ui,sans-serif}}
body{{position:relative}}
body::before{{content:"";position:absolute;inset:0;background-image:radial-gradient(#ffffff16 1.4px,transparent 1.5px);background-size:26px 26px;-webkit-mask-image:radial-gradient(ellipse at center,#000 35%,transparent 80%)}}
.par{{position:absolute;left:64px;top:62px;width:446px;height:auto;display:block}}
.tx{{position:absolute;left:{'560px' if mini else '90px'};right:70px;top:60px;height:400px;display:flex;flex-direction:column;justify-content:center;gap:16px}}
.h{{font-weight:900;letter-spacing:-1.5px;line-height:1.1;font-size:70px}}
.box{{display:inline-block;background:#FFE04A;color:#0F1115;border-radius:16px;padding:2px 22px 8px;margin-top:10px;max-width:100%;line-height:1.1}}
.st{{font-family:"Segoe UI",system-ui,sans-serif;font-weight:600;font-size:30px;line-height:1.3;color:#A8ADBB}}
.dol{{position:absolute;left:{'560px' if mini else '90px'};right:70px;bottom:36px;display:flex;align-items:flex-end;justify-content:space-between}}
.znak{{display:flex;flex-direction:column;align-items:center}}
.znak img{{width:76px;height:76px;border-radius:50%;display:block}}
.znak b{{font-family:PM,monospace;font-weight:700;font-size:15px;letter-spacing:6px;color:#FFE04A;margin-top:-11px;padding-left:6px}}
.url{{font-family:"Segoe UI",sans-serif;font-weight:700;font-size:26px;color:#8D93A3}}
</style></head><body>
{lewo}
<div class="tx" id="tx"><div class="h" id="h">Ile naprawdę kosztuje<br><span class="box" id="b">{html.escape(slowo(c['krot']))}?</span></div><div class="st" id="st">{html.escape(c['st'])}</div></div>
<div class="dol"><div class="znak"><img src="{ik}" alt=""><b>ILE NAPRAWDĘ</b></div><div class="url">ilenaprawde.pl</div></div>
<script>
(function(){{var tx=document.getElementById('tx'),h=document.getElementById('h'),b=document.getElementById('b'),st=document.getElementById('st');
var max=tx.clientHeight,fs=70;function ok(){{return tx.scrollHeight<=max+1&&h.getBoundingClientRect().height<=fs*1.1*3+30&&b.getBoundingClientRect().width<=tx.clientWidth+1}}
function ukryjSt(){{st.style.display='none'}}
while(!ok()&&fs>34){{fs-=2;h.style.fontSize=fs+'px';st.style.fontSize=Math.max(22,Math.round(fs*0.43))+'px'}}
if(!ok())ukryjSt();
var lin=Math.round(b.getBoundingClientRect().height/(fs*1.1));document.title='fs='+fs+';box='+lin;}})();
</script></body></html>"""

def edge():
    for p in PRZEGLADARKI:
        if os.path.exists(p):
            return p
    return None

def zrob(c, mini, przegladarka):
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix='og_'))
    try:
        (tmp / 'o.html').write_text(szablon(c, mini), encoding='utf-8')
        cel = OUT / f"{c['id']}.png"
        if cel.exists():
            cel.unlink()
        subprocess.run([przegladarka, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--log-level=3',
                        f'--user-data-dir={tmp / "p"}', '--window-size=1200,630', '--virtual-time-budget=4000', f'--screenshot={cel}', (tmp / 'o.html').as_uri()],
                       capture_output=True, timeout=90)
        for _ in range(20):
            if cel.exists():
                break
            time.sleep(0.5)
        return cel.exists()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

def arkusz(plik, ids):
    from PIL import Image
    ims = [Image.open(OUT / f'{i}.png').convert('RGB') for i in ids if (OUT / f'{i}.png').exists()]
    kol = 2
    w, h = 600, 315
    rows = (len(ims) + kol - 1) // kol
    c = Image.new('RGB', (kol * (w + 8) + 8, rows * (h + 8) + 8), (60, 60, 66))
    for n, i in enumerate(ims):
        c.paste(i.resize((w, h), Image.LANCZOS), (8 + (n % kol) * (w + 8), 8 + (n // kol) * (h + 8)))
    c.save(plik)

def main():
    d = dane()
    teraz = time.time()
    from datetime import datetime
    opub = {}
    for o in d['O']:
        if datetime.fromisoformat(o['pa']).timestamp() <= teraz:
            opub[o['id']] = max(opub.get(o['id'], 0), o['nr'])
    prz = edge()
    if not prz:
        print('og: brak Edge/Chrome – pomijam'); return
    wszystkie = '--wszystkie' in sys.argv
    ids = []
    for c in d['K']:
        cel = OUT / f"{c['id']}.png"
        mini = None
        if c['id'] in opub:
            m = KOR / 'img' / 'filmy' / 'mini' / f"{opub[c['id']]}.png"
            mini = m if m.exists() else None
        # odśwież, gdy brak pliku, lub (lokalnie) gdy szablon/skrypt/miniatura są nowsze
        stary = cel.exists() and cel.stat().st_mtime < max(Path(__file__).stat().st_mtime, (mini.stat().st_mtime if mini else 0))
        if wszystkie or not cel.exists() or (stary and not os.environ.get('CI')):
            ok = zrob(c, mini, prz)
            print(f"og {c['id']}: {'ok' if ok else 'BŁĄD'}{' (odc. #%d)' % opub[c['id']] if mini else ' (bez odcinka)'}")
        ids.append(c['id'])
    if '--arkusz' in sys.argv:
        arkusz(sys.argv[sys.argv.index('--arkusz') + 1], [i for i in sys.argv[sys.argv.index('--arkusz') + 2:] if not i.startswith('--')] or ids)

if __name__ == '__main__':
    main()
