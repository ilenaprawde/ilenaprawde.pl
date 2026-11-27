// N156 – próba nowego wyglądu kalkulatora pizzy. Liczy ta sama funkcja co /kalkulatory/pizza/ (dane.js → KALK.pizza.f).
(function () {
 'use strict';
 const c = window.ILE.KALK.find(k => k.id === 'pizza');
 const $ = id => document.getElementById(id);
 const el = (t, cl, tx) => { const e = document.createElement(t); if (cl) e.className = cl; if (tx != null) e.textContent = tx; return e; };
 const num = s => { const v = parseFloat(String(s).replace(/[\s ]/g, '').replace(',', '.')); return Number.isFinite(v) ? v : NaN; };
 const zlc = v => Math.round(v).toLocaleString('pl-PL', { useGrouping: true }).replace(/ /g, ' ') + ' zł';
 const zlg = v => v.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';
 const ruch = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

 // ---- pola, pogrupowane po nazwie przed dwukropkiem ----
 const grupy = [];
 c.in.forEach(x => {
  const i = x.l.indexOf(': '), g = i > 0 ? x.l.slice(0, i) : 'Jak często', l = i > 0 ? x.l.slice(i + 2) : x.l;
  let gr = grupy.find(z => z.n === g); if (!gr) grupy.push(gr = { n: g, p: [] });
  gr.p.push({ x, l: l.charAt(0).toUpperCase() + l.slice(1) });
 });
 const pola = $('pola');
 grupy.forEach(gr => {
  const box = el('fieldset', 'grupa' + (gr.p.length === 1 ? ' szer' : ''));
  box.style.border = ''; box.appendChild(el('h3', null, gr.n));
  gr.p.forEach(({ x, l }) => {
   const d = el('div', 'pole'), lab = el('label', null, l), we = el('div', 'we'), inp = el('input');
   inp.id = 'f_' + x.id; inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.value = x.v; lab.htmlFor = inp.id;
   inp.addEventListener('input', () => { gotowe = true; licz(); });
   we.appendChild(inp); we.appendChild(el('span', 'j', x.u || '')); d.appendChild(lab); d.appendChild(we); box.appendChild(d);
   if (x.h) box.appendChild(el('p', 'podp', x.h));
  });
  pola.appendChild(box);
 });

 // N159: „Przywróć domyślne” – widoczny tylko po zmianie; wartości domyślne = x.v z dane.js (aktualizuje je tygodniowy odczyt cen)
 const rb = el('button', 'rst', 'Przywróć domyślne'); rb.type = 'button'; rb.hidden = true; pola.after(rb);
 const zmienione = () => c.in.some(x => !(num($('f_' + x.id).value) === num(x.v)));
 rb.addEventListener('click', () => {
  c.in.forEach(x => { $('f_' + x.id).value = x.v; });
  try { const Q = new URLSearchParams(location.search); c.in.forEach(x => Q.delete(x.id)); history.replaceState(null, '', location.pathname + (Q.toString() ? '?' + Q.toString() : '') + location.hash); } catch (e) {}
  licz(); $('f_' + c.in[0].id).focus({ preventScroll: true });
 });
 // ---- liczenie ----
 // N157: animacja startuje dopiero, gdy strona jest naprawdę pokazana (nie w prerenderze Chrome / w tle) i wynik jest na ekranie
 let gotowe = !ruch, dlugo = false, pokazane = 0, anim = 0;
 function odlicz(do_) {
  cancelAnimationFrame(anim);
  const od = pokazane, t0 = performance.now(), T = dlugo ? 900 : 300, kw = $('kw');
  if (!gotowe) { pokazane = 0; kw.textContent = zlc(0); return; }
  if (!ruch || od === do_) { pokazane = do_; kw.textContent = zlc(do_); return; }
  const krok = t => { const p = Math.min(1, (t - t0) / T), e = 1 - Math.pow(1 - p, 3); pokazane = Math.round(od + (do_ - od) * e); kw.textContent = zlc(pokazane); if (p < 1) anim = requestAnimationFrame(krok); };
  anim = requestAnimationFrame(krok);
 }
 function kwota(s) { const m = /(-|−)?([\d\s ]+(?:,\d+)?)\s*zł/.exec(String(s)); return m ? (m[1] ? -1 : 1) * num(m[2]) : NaN; }
 function licz() {
  const v = {}; let zle = false;
  c.in.forEach(x => { const e = $('f_' + x.id), w = num(e.value); const ok = w >= 0; e.setAttribute('aria-invalid', ok ? 'false' : 'true'); if (!ok) zle = true; v[x.id] = w; });
  rb.hidden = !zmienione();
  $('blad').hidden = !zle; if (zle) return;
  const r = c.f(v);
  // paski: wiersze „… rocznie”
  const re = new RegExp(c.sl), B = r.l.filter(([a]) => re.test(a)).map(([a, b]) => ({ n: a.replace(/ rocznie$/, ''), b, v: kwota(b) })).filter(x => x.v >= 0);
  const mx = Math.max(...B.map(x => x.v)), mn = Math.min(...B.map(x => x.v)), P = $('paski');
  if (P.children.length !== B.length) { P.innerHTML = ''; B.forEach(() => { const d = el('div', 'pasek'), op = el('div', 'op'), s = el('span'), b = el('b'), t = el('div', 'tor'), w = el('div', 'wyp'); op.appendChild(s); op.appendChild(b); t.appendChild(w); d.appendChild(op); d.appendChild(t); P.appendChild(d); }); }
  B.forEach((x, i) => {
   const d = P.children[i], s = d.querySelector('.op span'), w = d.querySelector('.wyp');
   d.className = 'pasek' + (x.v === mn ? ' min' : x.v === mx ? ' max' : '');
   s.textContent = x.n; if (x.v === mn || x.v === mx) s.appendChild(el('span', 'znak', x.v === mn ? 'najtaniej' : 'najdrożej'));
   d.querySelector('.op b').textContent = zlc(x.v) + ' / rok';
   const proc = mx > 0 ? Math.max(1.5, x.v / mx * 100) : 0;
   w.style.width = (gotowe ? proc : 0) + '%';
  });
  // zdanie wyniku: dom zamiast Pyszne (jak duża liczba w obecnym kalkulatorze)
  const dd = kwota((r.l.find(([a]) => /^Różnica rocznie: dom zamiast/.test(a)) || [])[1]);
  const abs = Math.round(Math.abs(dd)), kw = $('kw'), zd = $('zd');
  zd.firstChild.nodeValue = 'W domu wydasz ';
  zd.lastChild.nodeValue = abs === 0 ? ' – tyle samo rocznie' : dd < 0 ? ' mniej rocznie' : ' więcej rocznie';
  kw.classList.toggle('drozej', dd > 0);
  $('pod').textContent = 'niż zamawiając przez Pyszne / Glovo';
  odlicz(abs);
  const lk = $('lk-k'); lk.textContent = (dd < 0 ? '−' : dd > 0 ? '+' : '') + zlc(abs) + ' rocznie'; lk.classList.toggle('drozej', dd > 0);
  // paragon
  const pr = $('pr'); pr.innerHTML = '';
  r.l.forEach(([a, b]) => {
   const d = el('div', 'pl' + (/^Pyszne \/ Glovo rocznie|^Różnica rocznie: aplikacja/.test(a) ? ' sep' : ''));
   d.appendChild(el('span', 'l', a)); d.appendChild(el('span', 'f')); d.appendChild(el('span', 'r', b)); pr.appendChild(d);
  });
  const s = el('div', 'pl sep suma'); s.appendChild(el('span', 'l', r.sk)); s.appendChild(el('span', 'f')); s.appendChild(el('span', 'r', r.svt || zlg(r.sv))); pr.appendChild(s);
 }
 licz();
 function start() {
  if (gotowe) return;
  gotowe = true;
  document.querySelectorAll('.wyp').forEach(w => { w.style.transition = 'width .9s cubic-bezier(.2,.8,.2,1)'; });
  requestAnimationFrame(() => requestAnimationFrame(() => {
   dlugo = true; licz(); dlugo = false;
   setTimeout(() => document.querySelectorAll('.wyp').forEach(w => { w.style.transition = ''; }), 1000);
  }));
 }
 let wynikWidoczny = false;
 const pokazana = () => !document.prerendering && document.visibilityState === 'visible';
 function sprobuj() { if (!gotowe && wynikWidoczny && pokazana()) start(); }
 document.addEventListener('visibilitychange', sprobuj);
 document.addEventListener('prerenderingchange', sprobuj);
 window.addEventListener('pageshow', sprobuj);

 // „Ceny sprawdzone” (ten sam plik co obecny kalkulator; zapisuje automat)
 fetch('/dane/ceny_sprawdzone.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => {
  const d = j && j.pizza; if (/^\d{4}-\d{2}-\d{2}$/.test(d || '')) { const e = $('spr'); e.textContent = 'Ceny sprawdzone: ' + d.slice(8) + '.' + d.slice(5, 7) + '.' + d.slice(0, 4); e.hidden = false; }
 }).catch(() => {});

 // przyklejony pasek: gdy wynik jest poza ekranem. N157: liczone z położenia przy przewijaniu (scroll/resize/visualViewport),
 // IntersectionObserver tylko dodatkowo; na komputerze z myszą ukryty w CSS.
 const lepki = $('lepki'), wynik = $('wynik');
 function lep() {
  const r = wynik.getBoundingClientRect(), h = window.visualViewport ? visualViewport.height : innerHeight;
  const poza = r.bottom < 0 || r.top > h;
  lepki.classList.toggle('wid', poza);
  if (!poza && !wynikWidoczny) { wynikWidoczny = true; sprobuj(); }
 }
 window.addEventListener('scroll', lep, { passive: true });
 window.addEventListener('resize', lep);
 if (window.visualViewport) { visualViewport.addEventListener('resize', lep); visualViewport.addEventListener('scroll', lep); }
 if ('IntersectionObserver' in window) new IntersectionObserver(lep, { threshold: [0, 1] }).observe(wynik);
 if (document.readyState === 'complete') lep(); else window.addEventListener('load', lep);
 lep();
})();
