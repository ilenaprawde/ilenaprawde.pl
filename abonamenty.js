// Ile Naprawdę – porównywarka abonamentów (/abonamenty/). Dane: /dane/abonamenty.json (odczyt cen codziennie z oficjalnych stron operatorów).
// Bez zewnętrznych skryptów i ciasteczek. Oferta bez świeżego odczytu (>36 h) albo ze statusem „do_sprawdzenia” jest oznaczona wyraźnie.
(()=>{
const $=id=>document.getElementById(id);
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const MIN='−',NB=' ';
const fz=v=>{const x=Number.isInteger(v)?String(v):v.toFixed(2).replace('.',',');const[i,d]=x.split(',');return i.replace(/\B(?=(\d{3})+(?!\d))/g,NB)+(d?','+d:'')+NB+'zł'};
const dt=iso=>{const d=new Date(iso);if(isNaN(d))return '?';return d.getDate()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear()+', '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
const STARE_H=36;
// oficjalne mapy zasięgu operatorów (tylko linki, bez kopiowania); marki wchodzą pod swoją sieć
const MAPY={'Play':'https://www.play.pl/pomoc/zasieg/mapa-zasiegu','Orange':'https://www.orange.pl/view/mapazasiegu','Plus':'https://www.plus.pl/mapa-zasiegu','T-Mobile':'https://www.t-mobile.pl/d/mapa-zasiegu'};
let dane=null,siec='',bez=false;

function stan(o){   // -> {ok:boolean, powody:[...]}
 const p=[];
 if(o.status!=='ok')p.push(...(o.powody&&o.powody.length?o.powody:['status: do sprawdzenia']));
 const t=Date.parse(o.odczyt);
 if(!isNaN(t)&&Date.now()-t>STARE_H*3600e3)p.push('ostatni odczyt starszy niż '+STARE_H+' h ('+dt(o.odczyt)+')');
 if(o.cena==null)p.push('brak ceny');
 return{ok:!p.length,powody:p};
}
const klucz=o=>bez?(o.koszt24_bez==null?null:o.koszt24_bez):o.koszt24;

function rysuj(){
 const box=$('lista');box.innerHTML='';
 let lista=dane.oferty.filter(o=>!siec||o.siec===siec);
 lista=[...lista].sort((a,b)=>{const x=klucz(a),y=klucz(b);if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return x-y});
 const znane=lista.map(klucz).filter(v=>v!=null);
 lista.forEach((o,i)=>{
  const s=stan(o),k=klucz(o);
  const a=el('article','ab'+(s.ok?'':' chk'));
  const h=el('div','abh');
  h.appendChild(el('span','abn',(k==null?'–':String(i+1)+'.')));
  const nm=el('div','abt');nm.appendChild(el('b',null,o.marka));nm.appendChild(el('small',null,'sieć: '+o.siec+' · '+o.plan));
  h.appendChild(nm);
  const kw=el('div','abk');
  kw.appendChild(el('span','abkv',k==null?'brak danych':fz(k)));
  kw.appendChild(el('span','abkl','za 24 mies.'+(bez?' (bez rabatów)':'')));
  h.appendChild(kw);a.appendChild(h);
  if(!s.ok){const w=el('div','abwarn');w.appendChild(el('b',null,'DO SPRAWDZENIA'));w.appendChild(el('span',null,' – '+s.powody.join('; ')+'.'+(o.cena!=null?' Pokazana wartość to ostatnia znana, nie potwierdzona dziś.':'')));a.appendChild(w)}
  const cena=bez?o.bez:o.cena;
  const rows=[
   ['Cena za miesiąc'+(bez?' (bez rabatów)':' (po rabatach)'),cena==null?'brak danych'+(bez&&o.cena!=null?' (strona nie podaje)':''):fz(cena)+(bez&&o.bez_wyliczone?' *':'')],
   ['Aktywacja',o.aktywacja==null?'brak danych':fz(o.aktywacja)],
   ['Internet',o.gb||'brak danych'],
   ['Umowa',o.umowa||'brak danych']];
  const dl=el('dl','abd');rows.forEach(([l,v])=>{dl.appendChild(el('dt',null,l));dl.appendChild(el('dd',null,v))});a.appendChild(dl);
  if(o.koszt24_bez_limitu!=null&&!bez)a.appendChild(el('p','abx','Z internetem bez limitu od 4. mies. (+'+fz(o.dodatek_bez_limitu)+'/mies.): '+fz(o.koszt24_bez_limitu)+' za 24 mies.'));
  if(o.promo_pierwszy_miesiac!=null)a.appendChild(el('p','abx','Promocja: 1. miesiąc '+fz(o.promo_pierwszy_miesiac)+' – nie wliczona w koszt.'));
  (o.uwagi||[]).forEach(u=>a.appendChild(el('p','abu',u)));
  if(MAPY[o.siec]){const mp=el('p','abu');const ma=el('a',null,'Sprawdź zasięg u siebie ↗');ma.href=MAPY[o.siec];ma.target='_blank';ma.rel='noopener';mp.appendChild(ma);mp.appendChild(document.createTextNode(' (mapa sieci '+o.siec+')'));a.appendChild(mp)}
  const f=el('div','abf');
  const l=el('a',null,'Oferta na stronie operatora ↗');l.href=o.url;l.target='_blank';l.rel='noopener';f.appendChild(l);
  f.appendChild(el('small',null,o.potwierdzone_recznie?'potwierdzone ręcznie: '+dt(o.potwierdzone_recznie+'T12:00:00+01:00').split(',')[0]+' · odczyt: '+dt(o.odczyt):'odczyt: '+dt(o.odczyt)));a.appendChild(f);
  box.appendChild(a);
 });
 if(bez)box.appendChild(el('p','abu','* cena bez rabatów wyliczona: cena po rabatach plus rabaty z opisu na stronie operatora (strona nie podaje jej wprost).'));
 const najt=lista.find(o=>klucz(o)!=null);
 $('wniosek').textContent=najt?'Najtańsza z '+dane.oferty.length+' sprawdzanych ofert'+(siec?' (w sieci '+siec+')':'')+': '+najt.marka+', '+fz(klucz(najt))+' za 24 mies. To nie jest najtańsza oferta z całego rynku.':'';
}

function chipy(){
 const box=$('siec');box.innerHTML='';
 const sieci=[...new Set(dane.oferty.map(o=>o.siec))];
 [['Wszystkie',''],...sieci.map(s=>[s,s])].forEach(([n,v])=>{
  const b=el('button','chip',n);b.type='button';b.setAttribute('aria-pressed',String(v===siec));
  b.onclick=()=>{siec=v;chipy();rysuj()};box.appendChild(b)});
}

function start(){
 fetch('/dane/abonamenty.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(j=>{
  dane=j;
  $('stan').textContent='Stan na: '+dt(j.aktualizacja)+' (odczyt z oficjalnych stron operatorów, codziennie rano)';
  const n=dane.oferty.filter(o=>!stan(o).ok).length;
  if(n)$('stan').textContent+=' · '+n+(n===1?' oferta wymaga':' oferty wymagają')+' sprawdzenia';
  chipy();rysuj();
  $('bez').addEventListener('change',e=>{bez=e.target.checked;rysuj()});
 }).catch(()=>{$('stan').textContent='Nie udało się wczytać cen. Spróbuj odświeżyć stronę.';});
}
start();
})();
