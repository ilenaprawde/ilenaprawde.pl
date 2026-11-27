// N164: nowy wygląd podstrony kalkulatora. Silnikiem jest dalej app.js (pola, liczenie, link, „Ceny sprawdzone”) z tą samą funkcją c.f z dane.js –
// ten plik ładuje się PRZED app.js, podpina się pod c.f i dokłada: zdanie wyniku, wykres (paski / próg / rozbicie), sumę paragonu, grupy pól, pasek na dole.
(function () {
 'use strict';
 const I = window.ILE, B = document.body;
 window.ILE_BAZA = B.dataset.baza || '';
 const c = I.KALK.find(k => k.id === B.dataset.id);
 if (!c) return;
 c.reset = true;   // „Przywróć domyślne” na wszystkich kalkulatorach (app.js)
 const $ = id => document.getElementById(id);
 const el = (t, cl, tx) => { const e = document.createElement(t); if (cl) e.className = cl; if (tx != null) e.textContent = tx; return e; };
 const num = I.num;
 const ruch = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
 const zlc = v => (Math.abs(v) < 9.995 && v !== 0 ? Math.abs(v).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Math.round(Math.abs(v)).toLocaleString('pl-PL', { useGrouping: true })).replace(/ /g, ' ') + ' zł';
 const kwota = s => { const m = /(-|−|\+)?\s*([\d\s ]+(?:,\d+)?)\s*zł/.exec(String(s)); return m ? (m[1] === '-' || m[1] === '−' ? -1 : 1) * num(m[2].replace(/[\s ]/g, '')) : NaN; };
 const liczba = s => { const m = /([\d\s ]+(?:,\d+)?)/.exec(String(s)); return m ? num(m[1].replace(/[\s ]/g, '')) : NaN; };

 // ---- próg (skala z zaznaczonym progiem i „Ty: …”) – tylko tam, gdzie jest próg i Twoja wartość ----
 const PROG = {
  g12: { re: /^Próg/, ty: v => v.pr, j: '%', opis: 'prądu w tańszych godzinach', lepiej: 'wyzej', tak: 'G12 się opłaca', nie: 'G12 się nie opłaca', max: () => 100 },
  'allegro-smart': { re: /^Roczny zwraca się od paczki/, ty: v => v.n, j: ' paczek', opis: 'paczek w roku', lepiej: 'wyzej', tak: 'Smart! roczny się zwraca', nie: 'Smart! roczny się nie zwraca' },
  opony: { re: /^Koszty równe przy/, ty: v => v.km, j: ' km', opis: 'km rocznie', lepiej: 'nizej', tak: 'całoroczne tańsze', nie: 'dwa komplety tańsze' }
 };
 // ---- dopisek pod zdaniem (r.pod): zostaje tylko, gdy dodaje coś nowego; null = usuń, funkcja = przytnij ----
 const POD = {
  dostawa: () => null,
  pizza: () => null,                                                          // N171: „Ceny z przykładowego lokalu… Wpisz swoje.” = linijka „Przykład”                                                        // „Przepłacasz 24,01 zł.” = zdanie
  'allegro-smart': () => null,                                                // „Roczny Smart zwraca się przy 6. paczce” = wykres progu
  g12: t => t.replace(/\s*Próg opłacalności:[^.]*\.\s*$/, ''),              // próg jest na wykresie; „bo …” zostaje
  podroz: t => t.replace(/^Dla .*?najtaniej wychodzi:[^.]*\.\s*/, '')      // kto najtańszy = zdanie; zostają zastrzeżenia
 };
 const BEZ_OP = { g12: 1, 'allegro-smart': 1, opony: 1 };                      // ramka progu = to samo co wykres progu
 // ---- jedna liczba: rozbicie dziennie / miesięcznie / rocznie (koszty roczne) ----
 const ROZBICIE = /^ROCZNIE$/;

 const f0 = c.f; let ost = null, czeka = false;
 c.f = function (v) { const r = f0.apply(this, arguments); ost = { r, v }; if (!czeka) { czeka = true; Promise.resolve().then(() => { czeka = false; rysuj(ost.r, ost.v); }); } return r; };

 let gotowe = !ruch, pokazane = 0, anim = 0, pierwszy = true;
 function odlicz(cel, txt) {
  const kw = $('kw'); if (!kw) return;
  cancelAnimationFrame(anim);
  if (txt != null) { kw.textContent = txt; pokazane = 0; return; }
  if (!gotowe) { kw.textContent = zlc(0); return; }
  const od = pierwszy ? 0 : pokazane, t0 = performance.now(), T = pierwszy ? 900 : 300; pierwszy = false;
  if (!ruch || od === cel) { pokazane = cel; kw.textContent = zlc(cel); return; }
  const krok = t => { const p = Math.min(1, (t - t0) / T), e = 1 - Math.pow(1 - p, 3); pokazane = od + (cel - od) * e; kw.textContent = zlc(pokazane); if (p < 1) anim = requestAnimationFrame(krok); else pokazane = cel; };
  anim = requestAnimationFrame(krok);
 }

 function rysuj(r, v) {
  // zdanie
  let z = null; try { z = c.zd ? c.zd(r, v) : null; } catch (e) { z = null; }
  if (!z) z = { a: '', k: r.svt || (r.sv != null ? r.sv : ''), b: String(r.sk || '').toLowerCase(), kol: r.kol || '', p: '' };
  const zd = $('zd'), kw = $('kw');
  $('za').textContent = z.a; $('zb').textContent = z.b; $('zp').textContent = z.p || ''; $('zp').hidden = !z.p;
  kw.className = 'kw' + (z.kol ? ' k-' + z.kol : '');
  kw.hidden = z.k == null;
  if (typeof z.k === 'number') odlicz(Math.abs(z.k)); else if (z.k != null) odlicz(0, String(z.k));
  zd.classList.toggle('bez', z.k == null);
  // pasek na dole
  const lk = $('lk-k'); if (lk) { lk.textContent = (typeof z.k === 'number' ? zlc(z.k) : (z.k || '')) + (z.b ? ' ' + z.b : ''); lk.className = z.kol === 'red' ? 'drozej' : ''; }
  // wykres
  const W = $('wyk'); W.innerHTML = ''; let jest = false;
  const re = c.sl ? new RegExp(c.sl) : null;
  const P = re ? r.l.filter(([a]) => re.test(a)).map(([a, b]) => ({ a, b, v: kwota(b) })).filter(x => x.v >= 0) : [];
  if (P.length >= 2) {
   jest = true;
   const mx = Math.max(...P.map(x => x.v)), mn = Math.min(...P.map(x => x.v));
   P.forEach(x => {
    const okr = / rocznie$|: koszt w roku$|na rok$/.test(x.a) ? ' / rok' : / miesięcznie$/.test(x.a) ? ' / mies.' : '';
    const n = x.a.replace(/ rocznie$/, '').replace(/ miesięcznie$/, '');
    const d = el('div', 'pasek' + (P.length > 1 && x.v === mn ? ' min' : P.length > 1 && x.v === mx ? ' max' : ''));
    const op = el('div', 'op'), s = el('span', null, n);
    if (x.v === mn && mn !== mx) s.appendChild(el('span', 'znak', 'najtaniej')); else if (x.v === mx && mn !== mx) s.appendChild(el('span', 'znak', 'najdrożej'));
    op.appendChild(s); op.appendChild(el('b', null, zlc(x.v) + okr)); d.appendChild(op);
    const t = el('div', 'tor'), w = el('div', 'wyp'); w.dataset.cel = mx > 0 ? Math.max(1.5, x.v / mx * 100) : 0; w.style.width = (gotowe ? w.dataset.cel : 0) + '%'; t.appendChild(w); d.appendChild(t); W.appendChild(d);
   });
  }
  const pr = PROG[c.id];
  if (pr) {
   const w = r.l.find(([a]) => pr.re.test(a)), p = w ? liczba(w[1]) : NaN, ty = pr.ty(v);
   if (p > 0 && ty >= 0) {
    jest = true;
    const max = pr.max ? pr.max() : Math.max(p, ty) * 1.4, ok = pr.lepiej === 'wyzej' ? ty >= p : ty <= p;
    const box = el('div', 'prog'), sk = el('div', 'skala'), pos = x => Math.max(0, Math.min(100, x / max * 100));
    const strefa = el('div', 'strefa'); if (pr.lepiej === 'wyzej') { strefa.style.left = pos(p) + '%'; strefa.style.right = '0'; } else { strefa.style.left = '0'; strefa.style.width = pos(p) + '%'; }
    sk.appendChild(strefa);
    const mp = el('div', 'mprog'); mp.style.left = pos(p) + '%'; mp.appendChild(el('span', null, 'próg ' + w[1].replace(/^ok\. /, ''))); sk.appendChild(mp);
    const mt = el('div', 'mty' + (ok ? ' ok' : ' nie')); mt.style.left = pos(ty) + '%'; mt.appendChild(el('span', null, 'Ty: ' + String(ty).replace('.', ',') + pr.j)); sk.appendChild(mt);
    box.appendChild(el('p', 'ptyt', (ok ? '✓ ' + pr.tak : '✗ ' + pr.nie) + ' (' + pr.opis + ')'));
    box.appendChild(sk); W.appendChild(box);
   }
  }
  if (!jest && ROZBICIE.test(r.sk || '') && r.sv > 0) {
   jest = true;
   const g = el('div', 'rozb');
   [['dziennie', r.sv / 365], ['miesięcznie', r.sv / 12], ['rocznie', r.sv]].forEach(([n, x]) => { const t = el('div', 'kaf'); t.appendChild(el('b', null, x < 10 ? x.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł' : zlc(x))); t.appendChild(el('span', null, n)); g.appendChild(t); });
   W.appendChild(g);
  }
  W.hidden = !jest;
  // dopisek i ramka progu
  const sp = $('spod');
  if (sp && POD[c.id] && z && z.a) { const t = POD[c.id](r.pod || ''); if (!t) sp.hidden = true; else { sp.hidden = false; sp.textContent = t; } }
  const opb = $('op'); if (opb && BEZ_OP[c.id] && W.querySelector('.prog')) opb.hidden = true;
  // N171: linijka „Przykład: … (źródło, data). Wpisz swoje.” – po zmianie pól przez użytkownika „Twoje liczby.”
  const pz = $('przyk');
  if (pz && c.prz) {
   const zm = c.in.some(x => { const e = $('f_' + x.id); if (!e) return false; return x.chk ? (e.checked ? '1' : '0') !== x.v : x.opt ? e.value !== String(x.v) : !(num(e.value) === num(x.v)); });
   const dc = (/Ceny w polach domyślnych \(stan na (\d{2}\.\d{2}\.\d{4})\)/.exec(c.s || '') || [])[1] || c.prz.d;
   pz.textContent = zm ? 'Twoje liczby.' : c.prz.t.replace('{data}', dc) + ' Wpisz swoje.';
   pz.classList.toggle('twoje', zm);
  }
  // suma paragonu
  const ps = $('psuma'); if (ps) { ps.innerHTML = ''; ps.appendChild(el('span', 'l', r.sk || '')); ps.appendChild(el('span', 'fill')); ps.appendChild(el('span', 'r', r.svt || (r.sv != null ? I.zl(r.sv) : ''))); }
 }

 // ---- start animacji: strona widoczna (nie prerender) i wynik na ekranie; po intro ----
 function start() {
  if (gotowe) return; gotowe = true;
  document.querySelectorAll('#wyk .wyp').forEach(w => { w.style.transition = 'width .9s cubic-bezier(.2,.8,.2,1)'; });
  requestAnimationFrame(() => requestAnimationFrame(() => {
   document.querySelectorAll('#wyk .wyp').forEach(w => { w.style.width = w.dataset.cel + '%'; });
   if (ost) rysuj(ost.r, ost.v);
   setTimeout(() => document.querySelectorAll('#wyk .wyp').forEach(w => { w.style.transition = ''; }), 1000);
  }));
 }
 let widac = false;
 const sprobuj = () => { if (!gotowe && widac && !document.prerendering && document.visibilityState === 'visible' && !document.getElementById('intro')) start(); };
 document.addEventListener('visibilitychange', sprobuj); document.addEventListener('prerenderingchange', sprobuj); window.addEventListener('pageshow', sprobuj); document.addEventListener('intro-koniec', sprobuj);
 document.addEventListener('input', () => { if (!gotowe) { gotowe = true; } }, true);

 document.addEventListener('DOMContentLoaded', () => {
  // odcinki: oficjalna ikona YouTube + „Odc. #N” = jeden link do filmu (nowa karta); zapowiedzi bez linku
  const kt = $('ktag');
  if (kt) {
   kt.innerHTML = '';
   const eps = I.ODCINKI.filter(o => o.id === c.id && !o.plan && !o.href).sort((a, b) => a.nr - b.nr);
   eps.forEach(o => {
    if (o.yt && o.pa && Date.now() >= Date.parse(o.pa)) {
     const a = el('a', 'ytl'); a.href = 'https://youtube.com/shorts/' + o.yt; a.target = '_blank'; a.rel = 'noopener';
     a.setAttribute('aria-label', 'Odcinek #' + o.nr + ' na YouTube (nowa karta)');
     const im = el('img'); im.src = '/img/youtube.svg'; im.alt = ''; im.width = 24; im.height = 17; a.appendChild(im); a.appendChild(el('span', null, 'Odc. #' + o.nr)); kt.appendChild(a);
    } else kt.appendChild(el('span', 'ytw', 'Odc. #' + o.nr + ' wkrótce'));
   });
   kt.hidden = !eps.length;
  }
  // grupy pól: kolejne pola z tą samą nazwą przed „: ” w jednej ramce (np. „Pyszne / Glovo: …”)
  const cf = $('cf');
  if (cf) {
   const pola = [...cf.children].filter(d => d.classList.contains('f'));
   let i = 0;
   while (i < pola.length) {
    const nm = d => { const s = d.querySelector('label > span'); const t = s ? s.textContent : ''; const k = t.indexOf(': '); return k > 0 ? t.slice(0, k) : null; };
    const g = nm(pola[i]); let j = i + 1;
    while (j < pola.length && g && nm(pola[j]) === g) j++;
    if (g && j - i >= 2) {
     const fs = el('div', 'grupa'); fs.appendChild(el('h3', null, g)); pola[i].before(fs);
     for (let k = i; k < j; k++) { const s = pola[k].querySelector('label > span'); s.textContent = s.textContent.slice(g.length + 2).replace(/^./, m => m.toUpperCase()); fs.appendChild(pola[k]); }
    }
    i = j;
   }
  }
  // pasek na dole: gdy wynik poza ekranem (liczone przy przewijaniu)
  const lepki = $('lepki'), wy = $('wynik');
  function lep() { const r = wy.getBoundingClientRect(), h = window.visualViewport ? visualViewport.height : innerHeight, poza = r.bottom < 0 || r.top > h; if (lepki) lepki.classList.toggle('wid', poza); if (!poza && !widac) { widac = true; sprobuj(); } }
  addEventListener('scroll', lep, { passive: true }); addEventListener('resize', lep);
  if (window.visualViewport) visualViewport.addEventListener('resize', lep);
  if ('IntersectionObserver' in window) new IntersectionObserver(lep).observe(wy);
  lep();
 });
})();
