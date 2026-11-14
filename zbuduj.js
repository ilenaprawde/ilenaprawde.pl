#!/usr/bin/env node
// Ile Naprawdę – generator statycznych stron z dane.js. Uruchom w katalogu repo:  node zbuduj.js
// Tworzy: index.html, 404.html, kalkulatory/<id>/index.html, <nr>/index.html (krótkie adresy odcinków), sitemap.xml, robots.txt.
// Nie ruszaj tych plików ręcznie – edytuj dane.js (KALK, ODCINKI) i uruchom generator ponownie.
const fs = require('fs');
const path = require('path');
global.window = {};
require('./dane.js');
const { KALK, ODCINKI, CATS } = window.ILE;

const ORIGIN = 'https://ilenaprawde.pl';
const crypto = require('crypto');
const V = f => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex').slice(0, 8);   // znacznik wersji w adresach plików (omija stare pamięci podręczne)
const VER = { css: V('strona.css'), dane: V('dane.js'), app: V('app.js') };
const BEACON = `<!-- Cloudflare Web Analytics (bez ciasteczek; pomijany przy testach automatycznych i ?test=1) --><script>(function(){try{if(navigator.webdriver||/[?&]test=1(&|$)/.test(location.search))return}catch(e){}var s=document.createElement('script');s.type='module';s.src='https://static.cloudflareinsights.com/beacon.min.js';s.setAttribute('data-cf-beacon','{"token": "433148455d314f7e988566097f1515ce"}');document.head.appendChild(s)})()</script><!-- End Cloudflare Web Analytics -->`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function head({ title, desc, canonical, robots }) {
  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">${robots ? `\n<meta name="robots" content="${robots}">` : ''}
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/favicon-192.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ile Naprawdę">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ORIGIN}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="pl_PL">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ORIGIN}/og-image.png">
<link rel="stylesheet" href="/strona.css?v=${VER.css}">
</head>`;
}

const stopka = `<div class="cta">OBSERWUJ @ILENAPRAWDE</div>
 <nav class="soc" aria-label="Profile w mediach społecznościowych">
  <a href="https://www.tiktok.com/@ilenaprawde" target="_blank" rel="noopener">TikTok</a>
  <a href="https://www.youtube.com/@ilenaprawde" target="_blank" rel="noopener">YouTube</a>
 </nav>`;
const stopka2 = `<p class="fine">Kontakt: <a href="mailto:ilenaprawde@gmail.com">ilenaprawde@gmail.com</a> · <a href="/prywatnosc.html">Prywatność</a> · <a href="/regulamin.html">Regulamin</a></p>
<p class="fine">Strona nie używa ciasteczek i nie zbiera danych osobowych. Liczymy tylko anonimowe odwiedziny (Cloudflare Web Analytics). Kalkulatory liczą w Twojej przeglądarce.</p>`;
const brand = `<div class="brandbar"><a href="/">ILE NAPRAWDĘ</a><span>paragony z liczenia</span></div>`;

const wyniki = [];
const zapisz = (p, t) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, t); wyniki.push(p); };

// ---------- strona główna ----------
const homeDesc = 'Ile Naprawdę – kalkulatory codziennych kosztów: prąd, apteka, auto, ogrzewanie. Wzór i źródło przy każdym rachunku.';
const linki = KALK.map(c => `<li><a href="/kalkulatory/${c.id}/">${esc(c.t)}</a></li>`).join('\n');
zapisz('index.html', head({ title: 'Ile Naprawdę – kalkulatory codziennych kosztów', desc: homeDesc, canonical: ORIGIN + '/' }) + `
<body data-strona="home">
<main class="wrap">
${brand}
<h1>Ile to <mark>naprawdę</mark> kosztuje?</h1>
<p class="lead" id="ile">${KALK.length} kalkulatorów ze wzorem, źródłem i datą cen.</p>
<div class="search"><input id="q" type="search" placeholder="Szukaj: np. czajnik, LED" aria-label="Szukaj rachunku" autocomplete="off"></div>
<div class="chips" id="cats" role="group" aria-label="Działy"></div>
<section id="nowe" aria-labelledby="hn"><h2 class="sec" id="hn">NAJNOWSZE <span>z ostatnich filmów</span></h2><div class="wall" id="wall"></div></section>
<section class="roll" id="roll" aria-labelledby="hw"><div class="rp"><h2 class="sec" id="hw">WSZYSTKIE RACHUNKI <span>od najnowszych</span></h2><div id="rows"></div><button class="more" id="more" type="button" hidden></button></div></section>
<p class="none" id="none" hidden>Nie mam jeszcze takiego rachunku. Nowe dodaję na bieżąco.</p>
<noscript><ul>
${linki}
</ul></noscript>
<section class="about" aria-labelledby="meto"><h2 id="meto">SKĄD LICZBY</h2>
<p>Liczymy na danych publicznych: przepisy UE, GUS, URE, NBP, Eurostat, etykiety energetyczne. Przy każdym rachunku podajemy wzór i zaznaczamy, które liczby są przykładem.</p>
<p>Treści przygotowujemy z udziałem AI i sprawdzamy obliczenia. To nie jest porada finansowa.</p></section>
${stopka}
${stopka2}
</main>
<script src="/dane.js?v=${VER.dane}"></script>
<script src="/app.js?v=${VER.app}"></script>
${BEACON}
</body>
</html>
`);

// ---------- 404 ----------
zapisz('404.html', head({ title: 'Nie ma takiej strony – Ile Naprawdę', desc: homeDesc, canonical: ORIGIN + '/', robots: 'noindex' }) + `
<body>
<main class="wrap">
${brand}
<h1>Nie ma takiej <mark>strony</mark></h1>
<p class="lead">Ten rachunek się zgubił. Wróć do <a href="/">wszystkich rachunków</a>.</p>
${stopka2}
</main>
${BEACON}
</body>
</html>
`);

// ---------- podstrony kalkulatorów ----------
const pins = ['#C62828', '#1D4ED8', '#15803D', '#E0A800'];
KALK.forEach((c, i) => {
  const desc = `${c.i} Wzór i źródło przy rachunku.`.slice(0, 300);
  const canonical = `${ORIGIN}/kalkulatory/${c.id}/`;
  zapisz(`kalkulatory/${c.id}/index.html`, head({ title: `${c.t} – Ile Naprawdę`, desc, canonical }) + `
<body data-strona="kalk" data-id="${c.id}">
<main class="wrap">
${brand}
<a class="back" href="/">← wszystkie rachunki</a>
<div class="kcard"><i class="pin" style="background:${pins[i % pins.length]};position:absolute;top:-6px;left:calc(50% - 8px);width:16px;height:16px;border-radius:50%;z-index:2;box-shadow:inset -2px -2px 0 #0003,0 2px 2px #0004"></i><div class="p">
 <div class="tag" id="ktag"></div>
 <h1>${esc(c.t)}</h1>
 <p class="i">${esc(c.i)}</p>
 <div id="cf"></div>
 <hr class="dash">
 <div id="cl" aria-live="polite"></div>
 <hr class="dbl">
 <div class="sum"><span class="k" id="sk">SUMA</span><span class="v" id="sv">–</span></div>
 <p class="err" id="cerr" hidden>Wpisz liczby, np. 0,5 albo 1,10.</p>
 <hr class="dash">
 <p class="small"><b>Wzór:</b> <span id="cw">${esc(c.w)}</span></p>
 <p class="small" id="cs">${esc(c.s || '')}</p>
 <p class="small">Liczby domyślne to przykłady do podmiany na Twoje. Wyliczenie poglądowe, to nie jest porada.</p>
 <button class="share" id="share" type="button">UDOSTĘPNIJ WYNIK</button>
 <div class="msg" id="msg" role="status"></div>
 <div id="filmy"></div>
 ${stopka}
</div></div>
<div class="rel">POLICZ TEŻ</div><div class="mini" id="mini"></div>
${stopka2}
<noscript><p class="small">Kalkulator wymaga włączonego JavaScriptu (liczy w Twojej przeglądarce).</p></noscript>
</main>
<script src="/dane.js?v=${VER.dane}"></script>
<script src="/app.js?v=${VER.app}"></script>
${BEACON}
</body>
</html>
`);
});

// ---------- krótkie adresy odcinków: /1 … /N ----------
ODCINKI.forEach(o => {
  const q = o.params && Object.keys(o.params).length ? '?' + new URLSearchParams(o.params).toString() : '';
  const dest = `/kalkulatory/${o.id}/${q}`;
  zapisz(`${o.nr}/index.html`, `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><title>Ile Naprawdę – odcinek #${o.nr}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<link rel="canonical" href="${ORIGIN}/kalkulatory/${o.id}/">
<meta http-equiv="refresh" content="0;url=${esc(dest)}">
<script>location.replace(${JSON.stringify(dest)})</script>
</head><body><p><a href="${esc(dest)}">Przejdź do kalkulatora odcinka #${o.nr}</a></p>${BEACON}</body></html>
`);
});

// ---------- sitemap.xml + robots.txt ----------
const dzis = new Date().toISOString().slice(0, 10);
const urls = [ORIGIN + '/', ...KALK.map(c => `${ORIGIN}/kalkulatory/${c.id}/`), ORIGIN + '/prywatnosc.html', ORIGIN + '/regulamin.html'];
zapisz('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>${u}</loc><lastmod>${dzis}</lastmod></url>`).join('\n')}
</urlset>
`);
zapisz('robots.txt', `User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`);

console.log('Wygenerowano ' + wyniki.length + ' plików:\n' + wyniki.join('\n'));
