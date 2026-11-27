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
const VER = { css: V('strona.css'), dane: V('dane.js'), app: V('app.js'), ab: V('abonamenty.js') };
const BEACON = `<!-- Cloudflare Web Analytics (bez ciasteczek; pomijany przy testach automatycznych i ?test=1). Znacznik promocji ?z=fb: na czas wysłania odwiedzin ścieżka to /z-fb/..., potem wraca oryginalny adres --><script>(function(){try{if(window.__nb||navigator.webdriver||/[?&]test=1(&|$)/.test(location.search))return}catch(e){}var o=null;try{var m=/[?&]z=([a-z]{2,12})(&|$)/i.exec(location.search);if(m&&history.replaceState){o=location.pathname+location.search+location.hash;window.__p0=o;history.replaceState(null,'','/z-'+m[1].toLowerCase()+location.pathname+location.search)}}catch(e){}function back(){if(o){try{history.replaceState(null,'',o)}catch(e){}o=null}}try{new PerformanceObserver(function(l,ob){l.getEntries().forEach(function(e){if(e.name.indexOf('cdn-cgi/rum')>0){ob.disconnect();setTimeout(back,300)}})}).observe({type:'resource',buffered:true})}catch(e){}setTimeout(back,8000);var s=document.createElement('script');s.type='module';s.src='https://static.cloudflareinsights.com/beacon.min.js';s.setAttribute('data-cf-beacon','{"token": "433148455d314f7e988566097f1515ce"}');s.onerror=back;document.head.appendChild(s)})()</script><!-- End Cloudflare Web Analytics -->`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- SEO podstron kalkulatorów (N101): tytuł, opis, „Jak liczymy”, „Pytania”, JSON-LD, okładka OG, lastmod ----------
const { execFileSync } = require('child_process');
// N178: miniaturki odcinków (sam paragon, bez beżowego blatu) – tylko brakujące/starsze od okładki; bez Pythona/Pillow pomija
try { const o = execFileSync('python', ['miniatury.py'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); if (/miniatur: [1-9]/.test(o)) console.log(o.trim()); } catch (e) { console.log('UWAGA: miniatury.py nie zadziałał – ' + String(e.message).split('\n')[0]); }
const num = window.ILE.num;
const MIN = '−';
const fk = v => { const x = Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ','), [a, d] = x.split(','); return a.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (d ? ',' + d : '') + ' zł'; };
const proc = p => String(p).replace('.', ',') + '%';
const dataPL = t => new Date(t).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
// wymiary JPEG z nagłówka SOF (okładki /img/filmy/N.jpg)
function jpgWym(f) {
  try { const b = fs.readFileSync(f); let i = 2;
    while (i < b.length) { if (b[i] !== 0xFF) return null; const m = b[i + 1], L = b.readUInt16BE(i + 2);
      if (m >= 0xC0 && m <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(m)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + L; } } catch (e) {}
  return null;
}
// odcinki kalkulatora (bez zapowiedzi), od najnowszego
const odcinkiDla = id => ODCINKI.filter(o => o.id === id && !o.plan && !o.href).sort((a, b) => b.nr - a.nr);
const okladka = id => { for (const o of odcinkiDla(id)) { const f = `img/filmy/${o.nr}.jpg`, w = jpgWym(f); if (w) return { url: `${ORIGIN}/${f}`, ...w, nr: o.nr }; } return null; };
// wynik z danych: najpierw z odcinka (film), inaczej z wartości domyślnych kalkulatora; null gdy brak liczby
function wynikDla(c) {
  for (const o of odcinkiDla(c.id)) {
    const t = o.typ || 'koszt', per = o.okres ? ' / ' + o.okres : '';
    if (t === 'razy' && o.razy != null) return { krotki: '×' + String(o.razy).replace('.', ','), pelny: 'Drożej ×' + String(o.razy).replace('.', ','), podpis: o.podpis, nr: o.nr };
    if (t === 'procent' && o.procent != null) return { krotki: MIN + proc(o.procent), pelny: `${MIN}${proc(o.procent)}`, podpis: o.podpis, nr: o.nr };
    if (typeof o.kwota === 'number') {
      const am = t === 'roznica' ? MIN + fk(o.kwota) : (o.znak || '') + fk(o.kwota);
      const pr = t === 'roznica' && o.procent != null ? ` (${MIN}${proc(o.procent)})` : '';
      return { krotki: am + per, pelny: (t === 'roznica' ? 'Różnica: ' : 'Koszt: ') + am + per + pr, podpis: o.podpis, nr: o.nr };
    }
  }
  if (c.lista) return null;
  try { const v = {}; c.in.forEach(x => v[x.id] = num(x.v)); const r = c.f(v);
    if (!(typeof r.sv === 'number' && isFinite(r.sv))) return null;
    const ozn = /OSZCZĘD|RÓŻNICA|TAŃSZ/.test(r.sk) ? MIN : '';
    const am = r.svt || ozn + fk(Math.round(r.sv * 100) / 100);
    const sk = r.sk.charAt(0) + r.sk.slice(1).toLowerCase();
    return { krotki: `${sk.toLowerCase()} ${am}`, pelny: `${sk}: ${am}`, podpis: null, nr: null };
  } catch (e) { return null; }
}
const zdania = s => String(s || '').trim().split(/(?<=[.!?])(?<!\b(?:np|ok|tzw|tj|zob|nr|ul|godz|m\.in)\.)\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ])/).filter(Boolean);   // bez dzielenia po skrótach (np., ok., tzw.)
const kropka = s => /[.!?]$/.test(s) ? s : s + '.';
const DATA_RE = /\b\d{1,2}\.\d{1,2}\.\d{4}\b|\b(stycz|lut|marc|kwie|maj|czerw|lip|sierp|wrze[sś]|październik|paźdz|listopad|grud)[a-ząćęłńóśźż]*\s+\d{4}\b/i;
function seoKalk(c) {
  const w = wynikDla(c);
  // tytuł: nazwa + „– kalkulator | Ile Naprawdę”, maks. 60 znaków
  const suf = ' – kalkulator | Ile Naprawdę';
  let nazwa = c.tk || c.t.split(':')[0].trim();   // tk: krótka nazwa do tytułu (opcjonalnie, dane.js)
  if ((nazwa + suf).length > 60) nazwa = c.krot;
  if ((nazwa + suf).length > 60) nazwa = nazwa.slice(0, 60 - suf.length).trim();
  // st: tytuł SEO (fraza z Google + korzyść, ≤ 46 znaków) – wtedy <title> = st + „ | Ile Naprawdę” (≤ 60 znaków)
  const title = c.st ? c.st + ' | Ile Naprawdę' : nazwa + suf;
  if (title.length > 60) throw new Error('title > 60 znaków: ' + title);
  // opis: maks. 155 znaków, z liczbą z dane.js
  let desc = (w ? `${c.krot}: ${w.krotki}${w.podpis ? ' – ' + w.podpis : ''}${w.nr ? ` (film #${w.nr})` : ' (przykład)'}. ` : '') + c.i;
  if (desc.length > 155) { desc = desc.slice(0, 155); const k = Math.max(desc.lastIndexOf('. '), desc.lastIndexOf(' ')); desc = desc.slice(0, k).replace(/[,:;–\s]+$/, ''); if (!/[.!?]$/.test(desc)) desc = desc.slice(0, 154) + '…'; }
  // „Jak liczymy”: wzór, założenia (wartości domyślne), źródło, data cen – tylko z pól dane.js
  const jak = [];
  if (c.w) jak.push(`Liczymy wzorem: ${c.w}.`);
  const zal = c.in.filter(x => !x.gdy && !x.chk && !x.opt && !x.sek && x.v !== '').slice(0, 4).map(x => `${x.l.toLowerCase()} ${x.v}${x.u ? ' ' + x.u : ''}`);
  if (zal.length) jak.push(`Wartości domyślne (przykład do podmiany): ${zal.join(', ')}.`);
  const zs = zdania(c.s).filter(z => !/^To nie jest porada/.test(z));
  if (zs.length) jak.push(...zs.slice(0, c.uw ? 1 : 2).map(kropka));
  if (c.uw) jak.push(kropka(c.uw));   // uw: uwaga o zmianie po filmie (dane.js)
  const dm = DATA_RE.exec(c.s || '');
  if (dm) jak.push(`Data cen: ${dm[0]}.`);
  // „Pytania”: 3 pytania z odpowiedziami z danych odcinka/kalkulatora; mniej niż 3 = sekcja pominięta
  const faq = [];
  (c.faq || []).forEach(p => faq.push(p));   // faq: pytania charakterystyczne dla kalkulatora (dane.js)
  if (w) faq.push([w.nr ? `Ile wyszło w filmie #${w.nr}?` : 'Ile wychodzi przy przykładowych danych?',
    `${w.pelny}${w.podpis ? ` – ${w.podpis}` : ''}. Tyle wychodzi przy przykładowych danych${w.nr ? ' z filmu' : ''}. Wpisz swoje liczby w kalkulatorze, żeby policzyć własny wynik.`]);
  if (c.w) faq.push(['Jak to policzyć samemu?', `Wzór: ${c.w}.`]);
  if (zs.length) faq.push(['Skąd są liczby?', zs.map(kropka).join(' ')]);
  return { title, desc, jak: jak.slice(0, 5), faq: faq.length >= 3 ? faq : [] };
}
// lastmod: najnowsza zmiana linii wpisu kalkulatora w dane.js (KALK + jego wiersze ODCINKI) wg git blame;
// linie nie z tej historii (płytki klon) – poprzedni lastmod z sitemap.xml; niezatwierdzone zmiany – dziś
const staraMapa = {};
try { for (const m of fs.readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)) staraMapa[m[1]] = m[2]; } catch (e) {}
const daneLinie = fs.readFileSync('dane.js', 'utf8').split('\n');
let PLYTKI = false;   // płytki klon (checkout automatu, fetch-depth 1): blame przypisuje wszystko jednemu commitowi
try { PLYTKI = execFileSync('git', ['rev-parse', '--is-shallow-repository'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() === 'true'; } catch (e) {}
function blameData(linie, url) {
  if (!linie.length) return null;
  let naj = null, stara = false;
  const zakresy = []; linie.sort((a, b) => a - b).forEach(n => { const z = zakresy[zakresy.length - 1]; if (z && n === z[1] + 1) z[1] = n; else zakresy.push([n, n]); });
  try {
    const arg = ['blame', '--line-porcelain']; zakresy.forEach(([a, b]) => arg.push('-L', `${a},${b}`));
    const out = execFileSync('git', [...arg, '--', 'dane.js'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    // blok linii w porcelain: <sha> …, committer-time, …, [boundary], filename, \t<treść>; ocena przy linii z treścią
    let sha = '', czas = 0, granica = false;
    for (const l of out.split('\n')) {
      if (/^[0-9a-f]{40} /.test(l)) { sha = l.slice(0, 40); czas = 0; granica = false; }
      else if (l.startsWith('committer-time ')) czas = +l.slice(15) * 1000;
      else if (l === 'boundary') granica = true;
      else if (l.startsWith('\t')) {
        if (/^0+$/.test(sha)) naj = Math.max(naj || 0, Date.now());          // niezatwierdzona zmiana = dziś
        else if (granica || PLYTKI) stara = true;                              // płytki klon (automat): data commitu nic nie mówi
        else naj = Math.max(naj || 0, czas);
      }
    }
  } catch (e) { stara = true; }
  const d = naj ? dataPL(naj) : null, s = stara ? staraMapa[url] : null;
  return [d, s].filter(Boolean).sort().pop() || null;
}
function lastmodKalk(c, url) {
  const st = daneLinie.findIndex(l => l.startsWith(`{id:'${c.id}',`));
  const linie = [];
  if (st >= 0) { let k = st + 1; while (k < daneLinie.length && !/^\{id:'|^\];/.test(daneLinie[k])) k++; for (let n = st; n < k; n++) linie.push(n + 1); }
  daneLinie.forEach((l, n) => { if (/^\s*\{nr:/.test(l) && l.includes(`id:'${c.id}'`)) linie.push(n + 1); });
  return blameData(linie, url);
}
const plikData = f => { try { return execFileSync('git', ['log', '-1', '--format=%cs', '--', f], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null; } catch (e) { return null; } };
const ldJson = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;

function head({ title, desc, canonical, robots, img, ld }) {
  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">${robots ? `\n<meta name="robots" content="${robots}">` : ''}
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=n175">
<link rel="apple-touch-icon" href="/favicon-192.png?v=n175">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ile Naprawdę">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${img ? img.url : ORIGIN + '/og-image.png'}">
<meta property="og:image:width" content="${img ? img.w : 1200}">
<meta property="og:image:height" content="${img ? img.h : 630}">
<meta property="og:locale" content="pl_PL">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${img ? img.url : ORIGIN + '/og-image.png'}">
<link rel="stylesheet" href="/strona.css?v=${VER.css}">${ld ? '\n' + ldJson(ld) : ''}
</head>`;
}

const stopka = `<div class="cta">OBSERWUJ @ILENAPRAWDE</div>
 <nav class="soc" aria-label="Profile w mediach społecznościowych">
  <a href="https://www.tiktok.com/@ilenaprawde" target="_blank" rel="noopener">TikTok</a>
  <a href="https://www.youtube.com/@ilenaprawde" target="_blank" rel="noopener">YouTube</a>
  <a href="https://www.facebook.com/ilenaprawde" target="_blank" rel="noopener" aria-label="Ile Naprawdę na Facebooku">Facebook</a>
 </nav>`;
const stopka2 = `<p class="fine">Kontakt: <a href="mailto:ilenaprawde@gmail.com">ilenaprawde@gmail.com</a> · <a href="/prywatnosc/">Prywatność</a> · <a href="/regulamin/">Regulamin</a></p>
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
<nav class="chips" id="cats" aria-label="Działy"></nav>
<section id="nowe" aria-labelledby="hn"><h2 class="sec" id="hn">NAJNOWSZE FILMY <span>3 ostatnio opublikowane</span></h2><div class="grid" id="wall"></div></section>
<div id="dzialy"></div>
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
<script>(function(){var m=/^[/]z-([a-z]{2,12})([/].*)?$/.exec(location.pathname);if(!m)return;window.__nb=1;var q=location.search;if(!/[?&]z=/.test(q))q+=(q?'&':'?')+'z='+m[1];location.replace((m[2]||'/')+q+location.hash)})()</script>
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

const SEO_KALK = {};
// ---------- podstrony kalkulatorów ----------
const pins = ['#C62828', '#1D4ED8', '#15803D', '#E0A800'];
const tytuly = new Set();
KALK.forEach((c, i) => {
  const canonical = `${ORIGIN}/kalkulatory/${c.id}/`;   // zawsze bez parametrów (?z=, pola formularza)
  const seo = seoKalk(c), desc = seo.desc, img = okladka(c.id);
  if (tytuly.has(seo.title)) throw new Error('Powtórzony tytuł: ' + seo.title); tytuly.add(seo.title);
  const graf = [{ '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Ile Naprawdę', item: ORIGIN + '/' },
    { '@type': 'ListItem', position: 2, name: c.krot, item: canonical }] }];
  if (seo.faq.length) graf.push({ '@type': 'FAQPage', mainEntity: seo.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  odcinkiDla(c.id).filter(o => o.yt && o.pa && fs.existsSync(`img/filmy/${o.nr}.jpg`)).forEach(o => graf.push({ '@type': 'VideoObject',
    name: o.tytul || o.nazwa || c.krot, description: (o.podpis ? `${o.nazwa || c.krot}: ${o.podpis}. ` : '') + c.i,
    thumbnailUrl: `${ORIGIN}/img/filmy/${o.nr}.jpg`, uploadDate: o.pa,
    contentUrl: `https://www.youtube.com/watch?v=${o.yt}`, embedUrl: `https://www.youtube.com/embed/${o.yt}` }));
  const ld = { '@context': 'https://schema.org', '@graph': graf };
  SEO_KALK[c.id] = { title: seo.title, desc, canonical, img, ld, seo };   // N164: te same dane SEO dla nowego wyglądu po przełączeniu
  const sekcje = (seo.jak.length ? `<section class="about seo" aria-labelledby="jak"><h2 id="jak">JAK LICZYMY</h2>
<p>${seo.jak.map(esc).join(' ')}</p></section>\n` : '') + (seo.faq.length ? `<section class="about seo" aria-labelledby="faq"><h2 id="faq">PYTANIA</h2>
${seo.faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('\n')}</section>\n` : '');
  zapisz(`kalkulatory/${c.id}/index.html`, head({ title: seo.title, desc, canonical, img, ld }) + `
<body data-strona="kalk" data-id="${c.id}">
<main class="wrap">
${brand}
<a class="back" href="/">← wszystkie rachunki</a>
<div class="kcard"><i class="pin" style="background:${pins[i % pins.length]};position:absolute;top:-6px;left:calc(50% - 8px);width:16px;height:16px;border-radius:50%;z-index:2;box-shadow:inset -2px -2px 0 #0003,0 2px 2px #0004"></i><div class="p">
 <div class="tag" id="ktag"></div>
 <h1>${esc(c.h1 || c.st || c.t)}</h1>
 <p class="i">${esc(c.i)}</p>
 <div class="wyn" aria-live="polite"><div class="sum"><span class="k" id="sk">SUMA</span><span class="v" id="sv">–</span></div><p class="err" id="cerr" hidden>Wpisz liczby, np. 0,5 albo 1,10.</p></div>${c.lk ? `
 <a class="lkb" href="${esc(c.lk[0])}">${esc(c.lk[1])}</a>` : ''}
 <hr class="dash">
 <h2 class="kh">TWOJE LICZBY</h2>
 <div id="cf"></div>
 <p class="small cdate" id="csd" hidden></p>
 <hr class="dash">
 <h2 class="kh">RACHUNEK</h2>
 <div id="cl"></div>
 <div id="bars" hidden></div>
 <p class="small note">Liczby domyślne to przykłady do podmiany na Twoje. Wyliczenie poglądowe, to nie jest porada.</p>
 <button class="share" id="share" type="button">UDOSTĘPNIJ WYNIK</button>
 <div class="msg" id="msg" role="status"></div>
</div></div>
${sekcje}<section class="rels" aria-labelledby="rh"><h2 class="sec" id="rh">POWIĄZANE <span>${esc(CATS[c.cat])}</span></h2><div class="mini" id="mini"></div></section>
<section class="filmbox" id="filmy" aria-label="Film"></section>
${stopka}
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
ODCINKI.filter(o => !o.plan).forEach(o => {   // zapowiedzi (plan:true) nie mają jeszcze adresu /N
  const q = o.params && Object.keys(o.params).length ? '?' + new URLSearchParams(o.params).toString() : '';
  const dest = o.href ? o.href : `/kalkulatory/${o.id}/${q}`;
  zapisz(`${o.nr}/index.html`, `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><title>Ile Naprawdę – odcinek #${o.nr}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<link rel="canonical" href="${ORIGIN}${o.href || `/kalkulatory/${o.id}/`}">
<noscript><meta http-equiv="refresh" content="0;url=${esc(dest)}"></noscript>
<script>window.__nb=1;(function(){var d=${JSON.stringify(dest)},m=/[?&]z=([a-z0-9]{1,12})(&|$)/i.exec(location.search);if(m)d+=(d.indexOf("?")<0?"?":"&")+"z="+m[1];location.replace(d)})()</script>
</head><body><p><a href="${esc(dest)}">Przejdź do kalkulatora odcinka #${o.nr}</a></p>${BEACON}</body></html>
`);
});

// ---------- porównywarka abonamentów: /abonamenty/ (+ krótki adres /abonament) ----------
const abDesc = 'Abonament na telefon: ile naprawdę przez 2 lata? Porównanie najtańszych abonamentów Play, Virgin Mobile, Orange, nju, Plus, Plush, T-Mobile i Red Bull Mobile. Ceny z oficjalnych stron, sprawdzane codziennie.';
zapisz('abonamenty/index.html', head({ title: 'Abonament na telefon: ile naprawdę przez 2 lata? – Ile Naprawdę', desc: abDesc, canonical: ORIGIN + '/abonamenty/' }) + `
<body data-strona="abonamenty" class="cmp">
<main class="wrap">
${brand}
<a class="back" href="/">← wszystkie rachunki</a>
<h1>Abonament na telefon: ile <mark>naprawdę</mark> przez 2 lata?</h1>
<p class="stan" id="stan">Wczytuję ceny…</p>
<p class="lead">Koszt 24 miesięcy = abonament × 24 + opłata aktywacyjna. Abonament bez telefonu, nowy numer, ceny po rabatach (e-faktura, zgody marketingowe), chyba że zaznaczysz inaczej.</p>
<div class="opts">
 <div class="chips" id="siec" role="group" aria-label="Moja sieć"></div>
 <label class="tog"><input type="checkbox" id="bez"> pokaż ceny bez rabatów</label>
</div>
<p class="wn" id="wniosek"></p>
<div id="lista" aria-live="polite"></div>
<p class="fine2">Promocje dla przenoszących numer i darmowe pierwsze miesiące to uwagi, nie cena bazowa – nie są wliczone w koszt 24 miesięcy. Wybierz „moja sieć”, by zobaczyć oferty w tej sieci (marki działają w sieci operatora: Virgin Mobile – Play, nju – Orange, Plush – Plus, Red Bull Mobile – T-Mobile). Najtańsza z sprawdzanych ofert, nie z całego rynku.</p>
<p class="fine2">Mapy operatorów są orientacyjne; zasięg w budynku może być gorszy.</p>
<p class="fine2">Ceny z oficjalnych stron operatorów, sprawdzane codziennie. Przy każdej ofercie podajemy datę ostatniego potwierdzenia ceny. To nie jest porada.</p>
<a class="cmpl" href="/kalkulatory/abonament/">Policz własny abonament →</a>
<noscript><p class="fine2">Porównywarka wymaga włączonego JavaScriptu (wczytuje ceny z pliku danych).</p></noscript>
${stopka}
${stopka2}
</main>
<script src="/abonamenty.js?v=${VER.ab}"></script>
${BEACON}
</body>
</html>
`);
zapisz('abonament/index.html', `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><title>Ile Naprawdę – porównywarka abonamentów</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<link rel="canonical" href="${ORIGIN}/abonamenty/">
<meta http-equiv="refresh" content="0;url=/abonamenty/">
<script>location.replace('/abonamenty/'+location.search)</script>
</head><body><p><a href="/abonamenty/">Przejdź do porównywarki abonamentów</a></p>${BEACON}</body></html>
`);

// ---------- promocje na pizzę dziś: /promocje-pizza/ (N152; dane: dane/promocje_pizza.json z fabryki, codziennie ok. 07:30) ----------
const PZ_URL = ORIGIN + '/promocje-pizza/';
let PZ = null; try { PZ = JSON.parse(fs.readFileSync('dane/promocje_pizza.json', 'utf8')); } catch (e) {}
let PZ_OP = {}; try { PZ_OP = JSON.parse(fs.readFileSync('dane/promocje_pizza_opisy.json', 'utf8')); } catch (e) {}   // opisy ręczne (N153) – automat ich nie nadpisuje
const PZ_INNE = [['Pizza Hut', 'https://pizzahut.pl/'], ['Da Grasso', 'https://www.dagrasso.pl/promocje'], ["Papa John's", 'https://papajohns.pl/']];
const PZ_FAQ = [
  ['Skąd są te promocje?', "Z regulaminów promocji publikowanych przez sieci: Domino's (PDF „Regulamin promocji”) i T-Pizza (dawna Telepizza; strona „Regulaminy Promocji”). Sprawdzamy je codziennie rano i pokazujemy tylko promocje ogólnopolskie, które obowiązują dziś."],
  ['Dlaczego nie ma tu Pizza Hut, Da Grasso i Papa John’s?', 'Ich regulaminy nie podają dat albo cen (cena zależy od lokalu), a aktualne oferty widać dopiero w aplikacji lub po wyborze adresu. Dlatego dajemy tylko linki do ich stron promocji.'],
  ['Czy cena z promocji to cena w moim lokalu?', 'Nie zawsze. Ceny mogą się różnić w niektórych lokalach, do zamówienia z dostawą dochodzą opłaty za opakowanie i minimalna wartość zamówienia. Przed zamówieniem sprawdź koszyk.'],
  ['Co znaczy „tylko aplikacja”, „z kodem” i „wybrane dni”?', 'Tylko aplikacja – promocja działa wyłącznie w aplikacji mobilnej sieci. Z kodem – trzeba mieć kod promocyjny. Wybrane dni – promocja działa tylko w niektóre dni tygodnia (pokazujemy ją, gdy dziś jest taki dzień).'],
];
{
  const dzisPL = dataPL(Date.now());
  const DN = ['', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.', 'niedz.'];
  const dm = iso => { const [y, m, d] = iso.slice(0, 10).split('-'); return `${+d}.${m}`; };
  const godz = iso => iso && iso.length > 15 ? iso.slice(11, 16).replace(/^0/, '') : '';
  const termin = p => p.do >= '2027-01-01' && !p.dni ? 'codziennie' : (p.dni ? `${p.dni.map(d => DN[d]).join(', ')}` : '') + (p.do < '2027-01-01' ? `${p.dni ? ' · ' : ''}do ${dm(p.do)}` : '');
  const dowPL = iso => { const d = new Date(iso + 'T12:00:00Z').getUTCDay(); return d === 0 ? 7 : d; };
  const dzisiaj = p => p.od <= dzisPL && p.do >= dzisPL && (!p.dni || p.dni.includes(dowPL(dzisPL)));
  // N153: kod pokazujemy tylko, gdy podany publicznie (regulamin: kod_wartosc, albo ręcznie w opisach); promocji „z kodem” bez kodu nie ma na stronie
  const bezKodu = p => (p.tagi || []).includes('z kodem') && !p.kod_wartosc;
  const karta = (p, sid) => { const op = (PZ_OP[sid] || {})[p.nazwa] || {}, kod = op.kod || p.kod_wartosc;
    return `<article class="pzc"${dzisiaj(p) ? '' : ' hidden'} data-od="${p.od}" data-do="${p.do}"${p.dni ? ` data-dni="${p.dni.join(',')}"` : ''}>
  <h3>${esc(p.nazwa)}</h3>
  ${op.zaw ? `<p class="pzz">${esc(op.zaw)}</p>` : ''}
  ${p.cena ? `<p class="pzp">${esc(p.cena)}</p>` : ''}
  <p class="pzt">${esc(termin(p))}${(p.tagi || []).map(t => ` <span class="pzg">${esc(t)}</span>`).join('')}${kod ? ` <span class="pzg">kod: ${esc(kod)}</span>` : ''}</p>
  ${op.zaw ? (op.uwaga ? `<p class="pzw">${esc(op.uwaga)}</p>` : '') : (p.warunki ? `<p class="pzw">${esc(p.warunki)}</p>` : '')}
 </article>`; };
  const sieci = (PZ ? PZ.sieci : []).map(s => ({ ...s, promocje: s.promocje.filter(p => !bezKodu(p)) }));
  const sekcja = s => {
    const ile = s.promocje.filter(dzisiaj).length;
    const stary = s.ok === false ? `<p class="pzs">Nieaktualne od ${esc(dm(s.nieaktualne_od || s.sprawdzono || dzisPL))} – nie udało się odczytać regulaminu. Pokazujemy ostatnie dane${s.sprawdzono ? ` z ${esc(dm(s.sprawdzono))}` : ''} (bez promocji po terminie).</p>` : '';
    return `<section class="pz" aria-labelledby="pz-${s.id}"><h2 class="sec" id="pz-${s.id}">${esc(s.nazwa.toUpperCase())} <span class="pzn">${ile} ${ile === 1 ? 'promocja' : (ile % 10 >= 2 && ile % 10 <= 4 && (ile % 100 < 10 || ile % 100 >= 20)) ? 'promocje' : 'promocji'} dziś</span></h2>
${stary}<div class="pzl">
${s.promocje.map(p => karta(p, s.id)).join('\n')}
</div>
<p class="pz0"${ile ? ' hidden' : ''}>Dziś brak promocji ogólnopolskich w regulaminie tej sieci.</p>
<p class="pzr"><a href="${esc(s.regulamin)}" target="_blank" rel="noopener">Regulamin promocji ${esc(s.nazwa)} (źródło) →</a></p>
</section>`;
  };
  const spr = PZ && PZ.sprawdzono;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Ile Naprawdę', item: ORIGIN + '/' }, { '@type': 'ListItem', position: 2, name: 'Promocje na pizzę dziś', item: PZ_URL }] },
    { '@type': 'FAQPage', mainEntity: PZ_FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] };
  const pzDesc = "Promocje na pizzę dziś w Domino's i T-Pizza (dawna Telepizza): ceny, terminy, „tylko aplikacja”, „z kodem”. Z regulaminów sieci, sprawdzane codziennie rano.";
  zapisz('promocje-pizza/index.html', head({ title: "Promocje na pizzę dziś – Domino's i T-Pizza (dawna Telepizza) | Ile Naprawdę", desc: pzDesc, canonical: PZ_URL, ld }) + `
<body data-strona="pizza" class="pzpage">
<main class="wrap">
${brand}
<a class="back" href="/">← wszystkie rachunki</a>
<h1>Promocje na pizzę <mark>dziś</mark></h1>
<p class="stan" id="pzstan" data-spr="${esc(spr || '')}">${spr ? `Sprawdzone ${spr.slice(0, 10) === dzisPL ? 'dziś' : dm(spr)} o ${esc(godz(spr))}` : 'Brak odczytu'}</p>
<p class="lead">Promocje ogólnopolskie z regulaminów sieci, które obowiązują dziś. Cena, termin i warunki – bez rankingu.</p>
<p class="pzk"><a class="lkb" href="/kalkulatory/pizza/">Policz, ile przepłacasz →</a></p>
${sieci.map(sekcja).join('\n')}
<section class="pz" aria-labelledby="pz-inne"><h2 class="sec" id="pz-inne">SPRAWDŹ W ICH APLIKACJI <span>bez cen</span></h2>
<ul class="pzi">${PZ_INNE.map(([n, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(n)} – promocje →</a></li>`).join('')}</ul>
</section>
<p class="fine2">Ceny mogą się różnić w niektórych lokalach. Wyliczenie poglądowe.</p>
<p class="fine2">Źródło: regulaminy promocji sieci (linki pod każdą siecią). Promocje lokalne (tylko wybrane miasta) pomijamy. To nie jest porada.</p>
<section class="about seo" aria-labelledby="faq"><h2 id="faq">PYTANIA</h2>
${PZ_FAQ.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('\n')}</section>
${stopka}
${stopka2}
</main>
<script>(function(){var t=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Warsaw'}).format(new Date()),w=new Date(t+'T12:00:00Z').getUTCDay()||7;
document.querySelectorAll('.pz').forEach(function(s){var n=0;s.querySelectorAll('.pzc').forEach(function(c){var d=c.dataset.dni,ok=c.dataset.od<=t&&c.dataset.do>=t&&(!d||d.split(',').indexOf(String(w))>=0);c.hidden=!ok;if(ok)n++});
 var l=s.querySelector('.pzn');if(l)l.textContent=n+' '+(n===1?'promocja':(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?'promocje':'promocji')+' dziś';var z=s.querySelector('.pz0');if(z)z.hidden=n>0});
var e=document.getElementById('pzstan'),s=e&&e.dataset.spr;if(s&&s.slice(0,10)!==t)e.textContent='Sprawdzone '+(+s.slice(8,10))+'.'+s.slice(5,7)+' o '+s.slice(11,16).replace(/^0/,'')})()</script>
${BEACON}
</body>
</html>
`);
}

// ---------- N161: baner premium (wzór baner_premium_v6) + intro raz dziennie – tylko strony /proba/ ----------
// Słowa: dane/baner_slowa.json (automat fabryki co rano: ruch 7 dni + YouTube 7 dni + słowo sezonowe); brak pliku = lista z wzoru v6.
const BW_DOMYSLNE = ['codzienne życie?', 'prąd?', 'pizza?', 'dojazd do pracy?', 'Netflix?', 'ogrzewanie?', 'kawa na mieście?', 'tankowanie?', 'Allegro Smart?', 'Wigilia?'];
const bwLista = () => { try { const j = JSON.parse(fs.readFileSync('dane/baner_slowa.json', 'utf8')); if (Array.isArray(j.slowa) && j.slowa.length >= 2) return j.slowa; } catch (e) {} return BW_DOMYSLNE; };
const JSHEAD = `<script>document.documentElement.classList.add('js')</script>`;
// intro: nakładka (display:none bez JS – Google widzi zwykłą stronę); raz dziennie na urządzenie, ?intro=1 wymusza
const INTRO = `<div class="intro" id="intro" aria-hidden="true"><div class="ilogo"><span>ILE</span><span class="q">?</span><span class="n">&nbsp;NAPRAWDĘ</span></div></div>
<script>(function(){var el=document.getElementById('intro'),d=new Date(),dz=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(),pokaz=false;
try{if(/[?&]intro=1(&|$)/.test(location.search))pokaz=true;else if(!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)&&localStorage.getItem('in_intro')!==dz)pokaz=true;if(pokaz)localStorage.setItem('in_intro',dz)}catch(e){pokaz=false}
function koniec(){if(!el.parentNode)return;el.remove();document.dispatchEvent(new Event('intro-koniec'))}
if(!pokaz){window.__intro=false;el.remove();return}window.__intro=true;el.classList.add('on');
var t=setTimeout(koniec,2050);function pomin(){clearTimeout(t);el.classList.add('off');setTimeout(koniec,160);removeEventListener('keydown',pomin)}
el.addEventListener('click',pomin);el.addEventListener('touchstart',pomin,{passive:true});addEventListener('keydown',pomin)})()</script>`;
// N162 pkt 5: oryginalny awatar przycięty do koła (img/awatar/awatar-N.webp + .png), 1x i 2x
const awatar = (n, alt = '') => `<picture><source type="image/webp" srcset="/img/awatar/awatar-${n}.webp?v=n175 1x, /img/awatar/awatar-${n * 2}.webp?v=n175 2x"><img class="awa" src="/img/awatar/awatar-${n}.png?v=n175" srcset="/img/awatar/awatar-${n}.png?v=n175 1x, /img/awatar/awatar-${n * 2}.png?v=n175 2x" width="${n}" height="${n}" alt="${alt}"></picture>`;
const STOPKA_PROBA = `<footer class="pstop">${awatar(56)}<p>Oglądaj na <a href="https://www.youtube.com/@ilenaprawde" rel="noopener">YouTube</a> / <a href="https://www.tiktok.com/@ilenaprawde" rel="noopener">TikToku</a> · <a href="https://www.facebook.com/ilenaprawde" target="_blank" rel="noopener" aria-label="Ile Naprawdę na Facebooku">Facebook</a></p></footer>`;
// N164: k = wersja niska (kalkulatory i inne podstrony), stop = słowo, na którym się zatrzymuje (bw kalkulatora), baza = '/proba' na próbie
const banerPremium = ({ kalk = null, k = !!kalk, stop = null, baza = '' } = {}) => {
  const L = bwLista();
  stop = stop || (kalk && kalk.bw) || null;
  const dane = JSON.stringify({ L, stop }).replace(/</g, '\\u003c');
  return `<header class="ban${k ? ' k' : ''}" id="ban">${k ? `<a class="bback" href="${baza}/">← wszystkie rachunki</a>` : ''}<div class="bin">
<a class="ey" href="${baza}/">${awatar(k ? 28 : 80)}<span>ILE NAPRAWDĘ</span></a>
<p class="bh1">Ile naprawdę kosztuje<br><span class="box" id="box"><span class="w" id="bw"><span>${esc(stop || L[0])}</span></span></span></p>
${k ? '' : '<p class="bsub">Codziennie liczę. Ze wzorem i źródłem.</p>'}</div></header>
<script>(function(){var D=${dane},box=document.getElementById('box'),w=document.getElementById('bw'),ban=document.getElementById('ban'),
ruch=!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
var L=D.stop?D.L.filter(function(x){return x!==D.stop}).slice(0,3).concat(D.stop):D.L.slice();
if(!D.stop&&L.length>1)L.push(L[0]);
w.innerHTML='';L.forEach(function(t){var s=document.createElement('span');s.textContent=t;w.appendChild(s)});
var m=document.createElement('span');m.style.cssText='visibility:hidden;position:absolute;white-space:nowrap';var dl=D.L.concat(D.stop||[]).reduce(function(a,b){return b.length>a.length?b:a},'');
var mx=0;D.L.concat(D.stop||[]).forEach(function(t){m.textContent=t;box.appendChild(m);mx=Math.max(mx,m.getBoundingClientRect().width);m.remove()});
box.style.width=(Math.ceil(mx)+28)+'px';
var i=0,n=L.length-1,T=D.stop?1100:2400,widoczny=true,tm=null;
function krok(){i++;w.style.transition='transform .35s cubic-bezier(.6,0,.2,1)';w.style.transform='translateY(-'+(i*1.3)+'em)';
 if(D.stop){if(i>=n){clearInterval(tm);tm=null}}else if(i===n)setTimeout(function(){w.style.transition='none';i=0;w.style.transform='translateY(0)'},380)}
function steruj(){var ok=widoczny&&document.visibilityState==='visible';if(ok&&!tm&&(!D.stop||i<n))tm=setInterval(krok,T);if(!ok&&tm){clearInterval(tm);tm=null}}
function start(){ban.classList.add('go');if(!ruch){if(D.stop){i=n;w.style.transform='translateY(-'+(n*1.3)+'em)'}return}
 if('IntersectionObserver' in window)new IntersectionObserver(function(e){widoczny=e[0].isIntersecting;steruj()}).observe(ban);
 document.addEventListener('visibilitychange',steruj);steruj()}
if(window.__intro)document.addEventListener('intro-koniec',start,{once:true});else start()})()</script>`;
};
// ---------- N164: nowy wygląd całej strony – na razie pod /proba/ (noindex, poza sitemap); przełączenie: plik nowy_wyglad.json {"wlaczony": true} ----------
// Silnik kalkulatorów bez zmian (dane.js + app.js); nowy.js dokłada zdanie wyniku, wykres i pasek. Nagłówki SEO (tytuł, opis, canonical, JSON-LD, og:)
// biorę 1:1 z wygenerowanych wyżej starych stron – po przełączeniu adresy, tytuły, opisy, canonical, JSON-LD, FAQ i sitemap są te same.
{
  const NW = (() => { try { return JSON.parse(fs.readFileSync('nowy_wyglad.json', 'utf8')); } catch (e) { return { wlaczony: false }; } })();
  const NA_ZYWO = NW.wlaczony === true, BAZA = NA_ZYWO ? '' : '/proba';
  const VN = { css: V('proba.css'), js: V('nowy.js') };
  const DZ = ['dz-prad', 'dz-dom', 'dz-auto', 'dz-zakupy', 'dz-abonamenty', 'dz-apteka'];
  const IKONY = [   // proste ikony działów (własne SVG)
    '<path d="M27 4 10 27h12l-3 17 19-25H26l5-15Z" fill="var(--akc-tlo)" stroke="var(--akc)" stroke-width="3" stroke-linejoin="round"/>',
    '<path d="M6 23 24 8l18 15" fill="none" stroke="var(--akc)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 20v21h26V20" fill="var(--akc-tlo)" stroke="var(--akc)" stroke-width="3" stroke-linejoin="round"/><path d="M20 41V29h8v12" fill="none" stroke="var(--akc)" stroke-width="3"/>',
    '<path d="M7 31v-7l5-10h24l5 10v7Z" fill="var(--akc-tlo)" stroke="var(--akc)" stroke-width="3" stroke-linejoin="round"/><path d="M7 24h34" stroke="var(--akc)" stroke-width="3"/><circle cx="15" cy="33" r="4" fill="#fff" stroke="var(--akc)" stroke-width="3"/><circle cx="33" cy="33" r="4" fill="#fff" stroke="var(--akc)" stroke-width="3"/>',
    '<path d="M9 16h30l-3 26H12Z" fill="var(--akc-tlo)" stroke="var(--akc)" stroke-width="3" stroke-linejoin="round"/><path d="M17 20v-6a7 7 0 0 1 14 0v6" fill="none" stroke="var(--akc)" stroke-width="3" stroke-linecap="round"/>',
    '<rect x="14" y="5" width="20" height="38" rx="4" fill="var(--akc-tlo)" stroke="var(--akc)" stroke-width="3"/><path d="M21 37h6" stroke="var(--akc)" stroke-width="3" stroke-linecap="round"/>',
    '<rect x="6" y="17" width="36" height="14" rx="7" transform="rotate(-35 24 24)" fill="var(--akc-tlo)" stroke="var(--akc)" stroke-width="3"/><path d="m19 13 10 22" transform="rotate(-35 24 24)" stroke="var(--akc)" stroke-width="3"/>'
  ];
  const PIZZA_IKONA = '<path d="M24 44 6 10c11-6 25-6 36 0L24 44Z" fill="var(--akc-tlo)" stroke="var(--akc)" stroke-width="3" stroke-linejoin="round"/><path d="M8.5 14.5c10-5 21-5 31 0" fill="none" stroke="var(--akc)" stroke-width="3" stroke-linecap="round"/><circle cx="19" cy="20" r="3.2" fill="var(--akc)"/><circle cx="29" cy="22" r="3.2" fill="var(--akc)"/><circle cx="24" cy="31" r="3.2" fill="var(--akc)"/>';
  const ikona = (cat, id) => `<svg class="ico" viewBox="0 0 48 48" aria-hidden="true">${id === 'pizza' ? PIZZA_IKONA : IKONY[cat] || IKONY[3]}</svg>`;
  const doBazy = h => h.replace(/href="\/(?!\/)/g, `href="${BAZA}/`).replace(new RegExp(`href="${BAZA}/(img|dane|fonts)/`, 'g'), 'href="/$1/');
  // nagłówek SEO ze starej strony (bez arkuszy i stylów) + nowy arkusz; na próbie: noindex i „PRÓBA – ” w tytule
  const glowa = stary => {
    const h = (/<head>([\s\S]*?)<\/head>/.exec(stary) || [, ''])[1].replace(/<style[\s\S]*?<\/style>/g, '');
    let linie = h.split('\n').filter(l => /<title>|<meta |<link rel="(canonical|icon|apple-touch-icon)"|application\/ld\+json/.test(l) && !/name="robots"/.test(l));
    const robots = (/<meta name="robots" content="([^"]+)"/.exec(h) || [])[1];
    if (!NA_ZYWO) { linie = linie.map(l => l.replace(/<title>/, '<title>PRÓBA – ')); linie.splice(2, 0, '<meta name="robots" content="noindex, nofollow">'); }
    else if (robots) linie.splice(2, 0, `<meta name="robots" content="${robots}">`);
    return `<!doctype html>\n<html lang="pl">\n<head>\n${linie.join('\n')}\n<meta name="theme-color" content="#0F1115">\n<link rel="stylesheet" href="/proba.css?v=${VN.css}">\n${JSHEAD}\n</head>`;
  };
  const cel = p => (NA_ZYWO ? '' : 'proba/') + p;
  const stopkaN = `${STOPKA_PROBA}
<p class="stopka">Treści przygotowujemy z udziałem AI i sprawdzamy obliczenia. To nie jest porada finansowa.<br>Kontakt: <a href="mailto:ilenaprawde@gmail.com">ilenaprawde@gmail.com</a> · <a href="${BAZA}/prywatnosc/">Prywatność</a> · <a href="${BAZA}/regulamin/">Regulamin</a><br>Strona nie używa ciasteczek. Liczymy tylko anonimowe odwiedziny (Cloudflare Web Analytics).</p>`;
  const analityka = NA_ZYWO ? BEACON : '';
  // N168: „Co mam policzyć?” – pomysł od widza → Worker bota (POST /pomysl) → Telegram. Bez e-maila i danych osobowych; nic nie jest publikowane.
  const FCFG = (() => { try { return JSON.parse(fs.readFileSync('dane/formularz.json', 'utf8')); } catch (e) { return {}; } })();
  const FORMULARZ = `<section class="card pomysl" aria-labelledby="hpom"><h2 id="hpom">Co mam policzyć?</h2>
<form id="fpom" novalidate><label class="sr" for="tpom">Twój pomysł na rachunek</label><textarea id="tpom" name="tekst" maxlength="200" rows="3" placeholder="Np. ile kosztuje pies przez rok?" required></textarea>
<p class="licz"><span id="lpom">0</span>/200</p><input class="sr" tabindex="-1" autocomplete="off" name="www" id="wpom" aria-hidden="true">
${FCFG.turnstile_sitekey ? `<div class="cf-turnstile" data-sitekey="${esc(FCFG.turnstile_sitekey)}" data-size="flexible" data-appearance="interaction-only"></div>` : ''}<button class="cta" type="submit" id="bpom">Wyślij pomysł</button>
<p class="pmsg" id="mpom" role="status" aria-live="polite"></p><p class="pinf">Nie wpisuj danych osobowych. Nic nie publikujemy na stronie. <a href="${BAZA}/prywatnosc/">Prywatność</a></p></form></section>
${FCFG.turnstile_sitekey ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>' : ''}
<script>(function(){var f=document.getElementById('fpom');if(!f)return;var t=document.getElementById('tpom'),l=document.getElementById('lpom'),m=document.getElementById('mpom'),b=document.getElementById('bpom'),t0=Date.now();
t.addEventListener('input',function(){l.textContent=t.value.length});
f.addEventListener('submit',function(e){e.preventDefault();var x=t.value.trim();if(!x){m.textContent='Wpisz, co mam policzyć.';m.className='pmsg zle';t.focus();return}
b.disabled=true;m.className='pmsg';m.textContent='Wysyłam…';var ts=f.querySelector('[name="cf-turnstile-response"]');
fetch('${FCFG.url || 'https://ilenaprawde-bot.ilenaprawde.workers.dev/pomysl'}',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tekst:x,strona:location.origin+location.pathname,www:document.getElementById('wpom').value,ms:Date.now()-t0,ts:ts?ts.value:''})})
.then(function(r){return r.json().catch(function(){return{ok:false,tekst:'Nie udało się wysłać. Spróbuj jeszcze raz.'}})}).then(function(j){m.textContent=j.tekst||(j.ok?'Dzięki! Najciekawsze tematy liczę w filmach.':'Nie udało się wysłać.');m.className='pmsg '+(j.ok?'ok':'zle');if(j.ok){t.value='';l.textContent='0'}b.disabled=false;if(window.turnstile)try{turnstile.reset()}catch(e){}})
.catch(function(){m.textContent='Nie udało się wysłać. Sprawdź internet i spróbuj jeszcze raz.';m.className='pmsg zle';b.disabled=false})})})()</script>`;

  // ---- A. kalkulatory ----
  KALK.forEach(c => {
    const stary = fs.readFileSync(`kalkulatory/${c.id}/index.html`, 'utf8'), seo = seoKalk(c);
    const lk = c.lk ? `<a class="cta" href="${BAZA}${c.lk[0]}">${esc(c.lk[1])}</a>` : '';
    zapisz(cel(`kalkulatory/${c.id}/index.html`), glowa(stary) + `
<body data-strona="kalk" data-id="${c.id}" data-baza="${BAZA}" class="${DZ[c.cat]}">
${INTRO}
${banerPremium({ kalk: c, baza: BAZA })}
<main class="col nad">
<section class="card hero" aria-labelledby="h1">
 <div class="dzial">${ikona(c.cat, c.id)}<span>${esc(CATS[c.cat])}</span></div>
 <h1 id="h1">${esc(c.h1 || c.st || c.t)}</h1>
 <p class="pyt">${esc(c.i)}</p>
 <p class="ktag" id="ktag"></p>
 <div class="wynik" id="wynik" aria-live="polite"><p class="zd" id="zd"><span id="za"></span> <b class="kw" id="kw">–</b> <span id="zb"></span></p><p class="pod" id="zp" hidden></p>
  <div class="sum sr"><span class="k" id="sk">SUMA</span><span class="v" id="sv">–</span></div><p class="blad" id="cerr" hidden>Wpisz liczby, np. 0,5 albo 1,10.</p></div>
 <div class="wyk" id="wyk" aria-label="Porównanie" hidden></div>
 <p class="przyk" id="przyk"></p>
</section>
<section class="card" aria-labelledby="hz">
 <h2 id="hz">Zmień na swoje liczby</h2>
 <div id="cf" class="pola2"></div>
</section>
<details class="card wyl" id="wyl">
 <summary><span>Pokaż wyliczenie</span><i aria-hidden="true">▾</i></summary>
 <div class="wyl-in">
  <div class="paragon"><div class="ph">ILE NAPRAWDĘ<small>paragon z liczenia</small></div><div id="cl"></div><div class="line psuma" id="psuma"></div></div>
  <div id="bars" hidden></div>
  <h3>Wzór</h3><p class="mono-s" id="cw"></p>
  <h3>Źródła</h3><p class="mono-s" id="cs"></p>
  ${seo.jak.length ? `<h3>Jak liczymy</h3><p class="mono-s">${seo.jak.map(esc).join(' ')}</p>` : ''}
  <p class="spr" id="csd" hidden></p>
 </div>
</details>
${lk}
<div class="akcje"><button class="rst2" id="share" type="button">Udostępnij wynik</button><div class="msg" id="msg" role="status"></div></div>
<section class="filmy" id="filmy" aria-label="Film"></section>
${seo.faq.length ? `<section class="card faq" aria-labelledby="hf">
 <h2 id="hf">Pytania</h2>
${seo.faq.map(([q, a]) => ` <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
</section>` : ''}
<section class="card powiazane" aria-labelledby="hp"><h2 id="hp">Powiązane</h2><div class="mini" id="mini"></div></section>
${FORMULARZ}
${stopkaN}
</main>
<div class="lepki" id="lepki" aria-hidden="true"><b id="lk-k"></b></div>
<noscript><p class="stopka">Kalkulator wymaga włączonego JavaScriptu (liczy w Twojej przeglądarce).</p></noscript>
<script src="/dane.js?v=${VER.dane}"></script>
<script src="/nowy.js?v=${VN.js}"></script>
<script src="/app.js?v=${VER.app}"></script>
${analityka}
</body>
</html>
`);
  });

  // ---- B. strona główna ----
  {
    const stary = fs.readFileSync('index.html', 'utf8'), STR = window.ILE.STRONY || [];
    const dzialy = CATS.map((n, i) => {
      const k = KALK.filter(c => c.cat === i), s = STR.filter(x => x.cat === i);
      if (!k.length && !s.length) return '';
      return `<section class="card dzk ${DZ[i]}" aria-labelledby="dz${i}"><div class="dzh">${ikona(i)}<h2 id="dz${i}">${esc(n)}</h2><span class="ile">${k.length + s.length}</span></div>
<ul>${k.map(c => `<li data-s="${esc([c.krot, c.t, c.k, n, ...ODCINKI.filter(o => o.id === c.id && !o.plan && !o.href).map(o => o.nr + ' ' + (o.nazwa || ''))].join(' '))}"><a href="${BAZA}/kalkulatory/${c.id}/">${esc(c.krot)}</a></li>`).join('')}${s.map(x => `<li data-s="${esc(x.nazwa + ' ' + (x.szukaj || '') + ' ' + n)}"><a href="${BAZA}${x.href}">${esc(x.nazwa)}</a> <small>${esc(x.tag)}</small></li>`).join('')}</ul></section>`;
    }).join('\n');
    zapisz(cel('index.html'), glowa(stary) + `
<body data-strona="home2" data-baza="${BAZA}">
${INTRO}
${banerPremium({ baza: BAZA })}
<main class="col nad szeroka">
<div class="card szukaj"><label class="sr" for="q">Szukaj rachunku</label><input id="q" type="search" placeholder="Szukaj: np. czajnik, LED, pizza" autocomplete="off"><p class="none" id="none" hidden>Nie mam jeszcze takiego rachunku. Nowe dodaję na bieżąco.</p></div>
<section class="card" id="nowe" aria-labelledby="hn"><h2 id="hn">Najnowsze filmy</h2><div class="filmy3" id="wall"></div></section>
<div class="dzialy">
${dzialy}
</div>
<section class="card"><h2>Skąd liczby</h2><p class="pyt">Liczymy na danych publicznych: przepisy UE, GUS, URE, NBP, Eurostat, etykiety energetyczne. Przy każdym rachunku podajemy wzór i zaznaczamy, które liczby są przykładem.</p></section>
${FORMULARZ}
${stopkaN}
</main>
<script src="/dane.js?v=${VER.dane}"></script>
<script>(function(){var I=window.ILE,B='${BAZA}',w=document.getElementById('wall');if(!I||!w)return;
var opub=function(o){return!!(o.yt&&o.pa&&Date.now()>=Date.parse(o.pa))};
I.ODCINKI.filter(function(o){return!o.plan&&!o.href&&opub(o)}).sort(function(a,b){return b.nr-a.nr}).slice(0,3).forEach(function(o){var c=I.KALK.find(function(k){return k.id===o.id});if(!c)return;
var a=document.createElement('a');a.className='film3';a.href=B+'/kalkulatory/'+c.id+'/';var pc=document.createElement('picture');var so=document.createElement('source');so.type='image/webp';so.srcset='/img/filmy/mini/'+o.nr+'.webp?v=n180';pc.appendChild(so);var im=document.createElement('img');im.src='/img/filmy/mini/'+o.nr+'.png?v=n180';im.alt='';im.width=116;im.height=116;im.loading='lazy';im.onerror=function(){pc.remove()};pc.appendChild(im);a.appendChild(pc);
var t=document.createElement('span');var s=document.createElement('small');s.textContent='#'+o.nr;var b=document.createElement('b');b.textContent=o.tytul||o.nazwa||c.krot;t.appendChild(s);t.appendChild(b);a.appendChild(t);w.appendChild(a)})})();
(function(){var q=document.getElementById('q');if(!q)return;var norm=function(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ł/g,'l')};
var dz=[].slice.call(document.querySelectorAll('.dzk'));function f(){var ws=norm(q.value.trim()).split(/\\s+/).filter(Boolean),ile=0;
dz.forEach(function(s){var k=0;[].slice.call(s.querySelectorAll('li')).forEach(function(li){var t=norm(li.dataset.s||li.textContent),ok=ws.every(function(x){return t.indexOf(x)>=0});li.hidden=!ok;if(ok)k++});s.hidden=!k;var e=s.querySelector('.ile');if(e)e.textContent=k;ile+=k});
document.getElementById('nowe').hidden=ws.length>0;document.getElementById('none').hidden=ile>0}q.addEventListener('input',f);f()})()</script>
${analityka}
</body>
</html>
`);
  }

  // ---- C. pozostałe strony: ta sama treść w nowym wyglądzie ----
  const owin = (plik, wnetrze, stop, klasa = '', zrodloGlowy = plik, skrypty = '') => zapisz(cel(plik), glowa(fs.readFileSync(zrodloGlowy, 'utf8')) + `
<body class="${/dz-/.test(klasa) ? '' : 'dz-zakupy '}${klasa}" data-baza="${BAZA}">
${INTRO}
${banerPremium({ k: true, stop, baza: BAZA })}
<main class="col nad">
<section class="card tresc">
${doBazy(wnetrze.indexOf('<h1') >= 0 ? wnetrze.slice(wnetrze.indexOf('<h1')) : wnetrze)}
</section>
${stopkaN}
</main>
${skrypty}
${analityka}
</body>
</html>
`);
  const srodek = (html, re) => { const m = re.exec(html); return m ? m[1] : ''; };
  const czysc = t => t.replace(/<div class="brandbar">[\s\S]*?<\/div>/, '').replace(/<a class="back"[^>]*>[^<]*<\/a>/, '').replace(/<p class="small">\s*<\/p>/, '')
    .replace(/<div class="cta">[\s\S]*?<\/nav>/, '').replace(/<p class="fine">Kontakt:[\s\S]*?<\/p>\s*<p class="fine">[\s\S]*?<\/p>/, '');
  {
    const p = fs.readFileSync('promocje-pizza/index.html', 'utf8');
    const skr = (/<\/main>\s*(<script>\(function\(\)\{var t=new Intl[\s\S]*?<\/script>)/.exec(p) || [, ''])[1];
    owin('promocje-pizza/index.html', czysc(srodek(p, /<main class="wrap">([\s\S]*?)<\/main>/)) + '\n' + skr, 'pizza?', 'pzpage');
  }
  [['prywatnosc/index.html', 'strony_zrodlo/prywatnosc.html'], ['regulamin/index.html', 'strony_zrodlo/regulamin.html']].forEach(([f, zr]) => owin(f, czysc(srodek(fs.readFileSync(zr, 'utf8'), /<main class="paper doc">([\s\S]*?)<\/main>/)), 'codzienne życie?', 'doc', zr));
  {   // N165: porównywarka abonamentów – dane i działanie bez zmian (abonamenty.js), nowy wygląd
    const a = fs.readFileSync('abonamenty/index.html', 'utf8');
    owin('abonamenty/index.html', czysc(srodek(a, /<main class="wrap">([\s\S]*?)<\/main>/)), 'abonament?', 'cmp dz-abonamenty', 'abonamenty/index.html', `<script src="/abonamenty.js?v=${VER.ab}"></script>`);
  }
  owin('404.html', czysc(srodek(fs.readFileSync('404.html', 'utf8'), /<main class="wrap">([\s\S]*?)<\/main>/)).replace(/<mark>|<\/mark>/g, ''), 'codzienne życie?');
  // stare adresy próby → nowe
  if (!NA_ZYWO) {
    // cofnięcie przełączenia: prywatność i regulamin to pliki statyczne – wracają z kopii źródłowej
    [['prywatnosc/index.html', 'strony_zrodlo/prywatnosc.html'], ['regulamin/index.html', 'strony_zrodlo/regulamin.html']].forEach(([f, zr]) => { const t = fs.readFileSync(zr); if (!fs.readFileSync(f).equals(t)) fs.writeFileSync(f, t); });
    const prz =(p, do_) => zapisz(p, `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${do_}"><link rel="canonical" href="${ORIGIN}${do_}"><title>Przeniesione</title></head><body><a href="${do_}">${do_}</a></body></html>\n`);
    prz('proba/pizza/index.html', '/proba/kalkulatory/pizza/');
    prz('proba/glowna-baner/index.html', '/proba/');
  } else {
    // N167: po przełączeniu stare adresy próby przekierowują na prawdziwe (noindex, canonical na prawdziwy adres)
    try { fs.rmSync('proba', { recursive: true, force: true }); } catch (e) {}
    const prz = (p, do_) => zapisz(p, `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${do_}"><link rel="canonical" href="${ORIGIN}${do_}"><title>Przeniesione – Ile Naprawdę</title><script>location.replace(${JSON.stringify(do_)}+location.search+location.hash)</script></head><body><a href="${do_}">${do_}</a></body></html>\n`);
    [['proba/index.html', '/'], ['proba/pizza/index.html', '/kalkulatory/pizza/'], ['proba/glowna-baner/index.html', '/'], ['proba/abonamenty/index.html', '/abonamenty/'],
     ['proba/promocje-pizza/index.html', '/promocje-pizza/'], ['proba/prywatnosc/index.html', '/prywatnosc/'], ['proba/regulamin/index.html', '/regulamin/'], ['proba/404.html', '/'],
     ...KALK.map(c => [`proba/kalkulatory/${c.id}/index.html`, `/kalkulatory/${c.id}/`])].forEach(([p, d]) => prz(p, d));
  }
}

// ---------- sitemap.xml + robots.txt ----------
// lastmod: data ostatniej zmiany danego kalkulatora (git blame jego wpisu w dane.js), nie dzisiejsza dla wszystkich
const dzis = dataPL(Date.now());
const kurls = KALK.map(c => { const u = `${ORIGIN}/kalkulatory/${c.id}/`; return [u, lastmodKalk(c, u) || staraMapa[u] || dzis]; });
const naj = kurls.map(x => x[1]).sort().pop();
const inne = [['/abonamenty/', 'abonamenty.js'], ['/promocje-pizza/', 'dane/promocje_pizza.json'],['/prywatnosc/', 'prywatnosc.html'], ['/regulamin/', 'regulamin.html']]
  .map(([p, f]) => { const u = ORIGIN + p; return [u, (PLYTKI ? null : plikData(f)) || staraMapa[u] || dzis]; });
const urls = [[ORIGIN + '/', naj], ...kurls, ...inne];
zapisz('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, d]) => `<url><loc>${u}</loc><lastmod>${d}</lastmod></url>`).join('\n')}
</urlset>
`);
zapisz('robots.txt', `User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`);

console.log('Wygenerowano ' + wyniki.length + ' plików:\n' + wyniki.join('\n'));
