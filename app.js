// Ile Naprawdę – wspólny silnik strony: strona główna („ściana paragonów”) i podstrony kalkulatorów. Dane: dane.js (ILE).
(()=>{
const {KALK,ODCINKI,CATS,num,f1,zl}=window.ILE;
const $=id=>document.getElementById(id);
const PINS=['#C62828','#1D4ED8','#15803D','#E0A800'];
const ROT=[-1.6,1.3,1.0,-1.2,-0.8,1.5];
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ł/g,'l');
const calc=id=>KALK.find(c=>c.id===id);
const url=(id,params)=>(window.ILE_BAZA||'')+'/kalkulatory/'+id+'/'+(params&&Object.keys(params).length?'?'+new URLSearchParams(params).toString():'');
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e};
const opub=o=>!!(o.yt&&o.pa&&Date.now()>=Date.parse(o.pa));   // film widoczny dopiero od godziny publikacji
const filmUrl=o=>'https://youtube.com/shorts/'+o.yt;
const dm=iso=>{const d=new Date(iso);return isNaN(d)?'':String(d.getDate())+'.'+String(d.getMonth()+1).padStart(2,'0')};   // 18.11
const wkrotce=o=>'🎬 film #'+o.nr+' wkrótce'+(o.pa&&Date.now()<Date.parse(o.pa)?' · '+dm(o.pa):'');
const opis=o=>o.tytul||o.nazwa||'';
// ikonka ▶ przy #N – tylko gdy film opublikowany (oo z opub()==true); klikalna, otwiera film na YouTube w nowej karcie
const playIcon=oo=>{const pl=el('span','play','▶');pl.setAttribute('role','link');pl.tabIndex=0;pl.title='Obejrzyj film #'+oo.nr+' na YouTube';pl.setAttribute('aria-label','Obejrzyj film #'+oo.nr+' na YouTube');
 const go=ev=>{ev.preventDefault();ev.stopPropagation();window.open(filmUrl(oo),'_blank','noopener')};pl.addEventListener('click',go);pl.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();go(ev)}});return pl};
const MIN='−';
const fk=v=>{const x=Number.isInteger(v)?String(v):v.toFixed(2).replace('.',','),[i,d]=x.split(',');return i.replace(/\B(?=(\d{3})+(?!\d))/g,' ')+(d?','+d:'')+' zł'};
// wynik odcinka / kalkulatora: typ 'roznica' (zielone, z minusem), 'procent' (zielone), 'razy' (czerwone, „×5,11”), 'koszt' (neutralne, bez minusa); okres zawsze obok kwoty
const wynik=o=>{const t=o.typ||'koszt',per=o.okres?'/ '+o.okres:'',pr=o.procent!=null&&t!=='procent'?MIN+(Number.isInteger(o.procent)?o.procent:String(o.procent).replace('.',','))+'%':'';
 if(t==='razy')return{am:'×'+String(o.razy).replace('.',','),per:'',pr:'',kol:'red'};
 if(t==='procent')return{am:MIN+String(o.procent).replace('.',',')+'%',per:'',pr:'',kol:'green'};
 if(t==='roznica')return{am:MIN+fk(o.kwota),per,pr,kol:'green'};
 return{am:(o.znak||'')+fk(o.kwota),per,pr:'',kol:'red'}};
const okresSk=sk=>/SEZON/.test(sk)?'sezon':'rok';
const typSk=sk=>/OSZCZĘD/.test(sk)?'roznica':'koszt';
const defaults=c=>{const v={};c.in.forEach(x=>v[x.id]=num(x.v));return v};

/* ---------- karty: jeden kalkulator = jedna karta (wynik z najnowszego filmu albo przykład) ---------- */
function karty(){
 return KALK.map(c=>{const eps=ODCINKI.filter(o=>o.id===c.id&&!o.plan&&!o.href).sort((a,b)=>b.nr-a.nr),o=eps[0];
  if(o)return{id:c.id,nr:o.nr,o,params:o.params,nazwa:o.nazwa||c.krot,cat:c.cat,w:wynik(o),szukaj:[o.nazwa,c.t,c.k,CATS[c.cat],...eps.map(e=>e.nr+' '+(e.nazwa||''))].join(' ')};
  const r=c.f(defaults(c));
  return{id:c.id,nr:null,nazwa:c.krot,cat:c.cat,w:wynik({typ:c.typ||typSk(r.sk),kwota:Math.round(r.sv*100)/100,okres:c.okres||okresSk(r.sk)}),szukaj:[c.t,c.k,CATS[c.cat]].join(' ')}})
}
// karta: #N ▶ (albo PRZYKŁAD), nazwa, wynik – wynik zawsze na dole karty (wyrównany w rzędzie)
function karta(r,href){const a=el('a','card');a.href=href||url(r.id,r.params);
 const p=el('div','paper');const tr=el('div','tagrow');
 if(r.nr!=null){const tg=el('small','tg','#'+r.nr);if(r.o&&opub(r.o))tg.appendChild(playIcon(r.o));tr.appendChild(tg);if(r.o&&!opub(r.o))tr.appendChild(el('small','soon',dm(r.o.pa)))}
 else tr.appendChild(el('small','tg','przykład'));
 p.appendChild(tr);p.appendChild(el('div','t',r.nazwa));
 const v=el('div','v c-'+r.w.kol);v.appendChild(el('span','am',r.w.am));v.appendChild(el('span','per',(r.w.per||'')+(r.w.pr?(r.w.per?' · ':'')+r.w.pr:'')||' '));p.appendChild(v);
 a.appendChild(p);return a}

/* ---------- strona główna: najnowsze filmy + 6 działów ---------- */
function home(){
 const wsz=karty();
 $('ile').textContent=KALK.length+' kalkulatorów w '+CATS.length+' działach – każdy ze wzorem, źródłem i datą cen.';
 // skróty do działów
 const nav=$('cats');nav.innerHTML='';
 CATS.forEach((n,i)=>{const k=wsz.filter(r=>r.cat===i).length;if(!k)return;const a=el('a','chip',n+' · '+k);a.href='#d'+i;nav.appendChild(a)});
 // 3 najnowsze filmy (opublikowane albo zapowiedziane)
 const najn=[...ODCINKI].filter(o=>!o.plan&&!o.href&&opub(o)).sort((a,b)=>b.nr-a.nr).slice(0,3);
 const w=$('wall');w.innerHTML='';
 najn.forEach(o=>{const c=calc(o.id);w.appendChild(karta({id:o.id,nr:o.nr,o,params:o.params,nazwa:o.nazwa||c.krot,w:wynik(o)}))});
 const box=$('dzialy');box.innerHTML='';const sek=[];
 CATS.forEach((n,i)=>{const lista=wsz.filter(r=>r.cat===i).sort((a,b)=>(b.nr??-1)-(a.nr??-1));if(!lista.length)return;
  const s=el('section','dz');s.id='d'+i;s.setAttribute('aria-labelledby','dh'+i);
  const h=el('h2','sec');h.id='dh'+i;h.appendChild(document.createTextNode(n.toUpperCase()));const sp=el('span');h.appendChild(sp);s.appendChild(h);
  const g=el('div','grid');lista.forEach(r=>{const k=karta(r);k._r=r;g.appendChild(k)});
  (window.ILE.STRONY||[]).filter(x=>x.cat===i).forEach(x=>{const a=el('a','card');a.href=x.href;const p=el('div','paper');const tr=el('div','tagrow');tr.appendChild(el('small','tg',x.tag));p.appendChild(tr);p.appendChild(el('div','t',x.nazwa));const v=el('div','v');v.appendChild(el('span','per',x.am));p.appendChild(v);a.appendChild(p);a._r={szukaj:x.nazwa+' '+x.szukaj};g.appendChild(a)});s.appendChild(g);box.appendChild(s);sek.push({s,sp,g})});
 function filtr(){const ws=norm($('q').value.trim()).split(/\s+/).filter(Boolean);let ile=0;
  sek.forEach(({s,sp,g})=>{let k=0;[...g.children].forEach(a=>{const ok=ws.every(x=>norm(a._r.szukaj).includes(x));a.hidden=!ok;if(ok)k++});s.hidden=!k;ile+=k;
   sp.textContent=k===1?'1 kalkulator':k+(k%10>=2&&k%10<=4&&(k%100<10||k%100>=20)?' kalkulatory':' kalkulatorów')});
  $('nowe').hidden=ws.length>0;nav.hidden=ws.length>0;$('none').hidden=ile>0}
 $('q').addEventListener('input',filtr);filtr();
}

/* ---------- podstrona kalkulatora ---------- */
function kalk(c){
 const eps=ODCINKI.filter(o=>o.id===c.id).map(o=>o.nr).sort((a,b)=>b-a);
 const P=new URLSearchParams(location.search);
 const hasP=id=>P.has(id)&&!(id==='z'&&/^[a-z]+$/i.test(P.get(id)));   // ?z=fb to znacznik promocji, nie wartość pola 'z'
 if(c.id==='abonament'){const ln=el('a','cmpl','Porównaj oferty wszystkich sieci →');ln.href=(window.ILE_BAZA||'')+'/abonamenty/';const sh=$('share');if(sh)sh.parentNode.insertBefore(ln,sh)}
 const fb=$('filmy'),fl=ODCINKI.filter(o=>o.id===c.id).sort((x,y)=>x.nr-y.nr);if(fb)fb.hidden=!fl.length;
 if(fb&&fl.length){let jest=false;fl.forEach(o=>{if(opub(o)){jest=true;const a=el('a','film');a.href=filmUrl(o);a.target='_blank';a.rel='noopener';
   const pc=document.createElement('picture');const so=document.createElement('source');so.type='image/webp';so.srcset='/img/filmy/mini/'+o.nr+'.webp?v=n179';pc.appendChild(so);const im=document.createElement('img');im.src='/img/filmy/mini/'+o.nr+'.png?v=n179';im.alt='';im.width=116;im.height=116;im.loading='lazy';im.onerror=()=>{pc.remove()};pc.appendChild(im);a.appendChild(pc);
   const fx=el('span','fx');fx.appendChild(el('b',null,'▶ OBEJRZYJ FILM #'+o.nr));if(opis(o))fx.appendChild(el('small',null,opis(o)));a.appendChild(fx);fb.appendChild(a)}
   else fb.appendChild(el('div','soonl',wkrotce(o)))});
  if(jest){const tk=el('p','small tk');const ta=el('a',null,'także na TikToku');ta.href='https://www.tiktok.com/@ilenaprawde';ta.target='_blank';ta.rel='noopener';tk.appendChild(ta);fb.appendChild(tk)}}
 const asc=[...eps].sort((x,y)=>x-y),ktag=$('ktag');ktag.innerHTML='';
 if(asc.length){ktag.appendChild(document.createTextNode('ODC. '));
  asc.forEach((n,i)=>{if(i>0)ktag.appendChild(document.createTextNode(i===asc.length-1?' i ':', '));ktag.appendChild(document.createTextNode('#'+n));
   const oo=ODCINKI.find(x=>x.nr===n);if(oo&&opub(oo))ktag.appendChild(playIcon(oo))});
  ktag.appendChild(document.createTextNode(' · '))}
 ktag.appendChild(document.createTextNode(CATS[c.cat]));
 const box=$('cf');box.innerHTML='';
 c.in.forEach(x=>{const d=el('div','f');const id='f_'+x.id;const lb=el('label');lb.htmlFor=id;lb.appendChild(el('span',null,x.l));d.appendChild(lb);
  if(x.gdy)d.dataset.gdy=x.gdy;if(x.sek)d.classList.add('fsek');
  if(x.opt){const inp=document.createElement('input');inp.type='hidden';inp.id=id;inp.value=hasP(x.id)?P.get(x.id):x.v;const ch=el('div','kchips');ch.setAttribute('role','radiogroup');
   x.opt.forEach(([lab,val])=>{const b=el('button','chip',lab);b.type='button';b.setAttribute('role','radio');b.dataset.v=val;b.setAttribute('aria-pressed',String(String(val)===inp.value));
    b.onclick=()=>{inp.value=String(val);ch.querySelectorAll('button').forEach(z=>z.setAttribute('aria-pressed',String(z===b)));if(c.zmiana)c.zmiana(x.id,ustaw);run()};ch.appendChild(b)});
   d.appendChild(inp);d.appendChild(ch);d.classList.add('fopt');box.appendChild(d);return}
  const w=el('div','fw');const inp=document.createElement('input');inp.id=id;
  if(x.chk){inp.type='checkbox';inp.checked=(hasP(x.id)?P.get(x.id):x.v)==='1';inp.addEventListener('change',()=>{if(c.zmiana)c.zmiana(x.id,ustaw);run()});d.classList.add('fchk')}else{inp.setAttribute('inputmode','decimal');inp.autocomplete='off';inp.value=hasP(x.id)?P.get(x.id):x.v;inp.addEventListener('input',run)}w.appendChild(inp);if(x.u)w.appendChild(el('span',null,x.u));d.appendChild(w);if(x.h)d.appendChild(el('p','small fh',x.h));box.appendChild(d)});
 if(c.pre&&!c.lista){const ch=el('div','kchips');ch.setAttribute('aria-label','Przykładowe wartości');
  c.pre.forEach(([lab,set])=>{const b=el('button','chip',lab);b.type='button';b.onclick=()=>{Object.entries(set).forEach(([k,v])=>{const e=$('f_'+k);e.value=v;const g=e.closest('.fopt');if(g)g.querySelectorAll('button').forEach(z=>z.setAttribute('aria-pressed',String(z.dataset.v===String(v))))});run()};ch.appendChild(b)});
  box.insertBefore(ch,box.children[0])}

 let items=[];const LK='ile_lampki_v1';
 if(c.lista){
  const zS=z=>z.map(i=>[i.nm.replace(/[|;]/g,' '),i.w,i.n,i.h,i.o==='1'?'1':'0'].join('|')).join(';');
  const zP=t=>t.split(';').map(q=>{const a=q.split('|');return{nm:a[0]||'',w:a[1]||'',n:a[2]||'1',h:a[3]||'',o:a[4]==='1'?'1':'0'}}).filter(i=>i.w!=='').slice(0,20);
  try{const kk=P.get('k')||((P.get('z')||'').indexOf('|')>=0?P.get('z'):'');if(kk)items=zP(kk);else if(P.has('w'))items=[{nm:'Lampki',w:P.get('w'),n:P.get('n')||'1',h:P.get('h')||'24',o:'0'}];else{const sv=localStorage.getItem(LK);if(sv)items=zP(sv)}}catch(e){}
  if(!items.length)items=[{nm:'Lampki',w:'27,7',n:'1',h:'24',o:'0'}];
  c.zS=zS;
  const lw=el('div','llist');const lb=el('div','ladd');
  const add=(o)=>{if(items.length>=20)return;items.push(Object.assign({nm:'Komplet '+(items.length+1),w:'6',n:'1',h:'6',o:'0'},o||{}));rys();run()};
  function rys(){lw.innerHTML='';
   items.forEach((z,ix)=>{const r=el('div','litem');
    const nm=document.createElement('input');nm.type='text';nm.className='lnm';nm.maxLength=40;nm.value=z.nm;nm.placeholder='Nazwa, np. Girlanda przód';nm.setAttribute('aria-label','Nazwa pozycji '+(ix+1));nm.addEventListener('input',()=>{z.nm=nm.value;run()});
    const del=el('button','ldel','Usuń');del.type='button';del.disabled=items.length<2;del.setAttribute('aria-label','Usuń pozycję '+(ix+1));del.onclick=()=>{items.splice(ix,1);rys();run()};
    const top=el('div','ltop');top.appendChild(nm);top.appendChild(del);r.appendChild(top);
    const g=el('div','lgrid');
    [['w','Moc 1 kompletu (W)'],['n','Liczba kompletów'],['h','Godzin dziennie']].forEach(([k,lab])=>{const f=el('div','f');const l=el('label',null,lab);const id='li_'+ix+'_'+k;l.htmlFor=id;f.appendChild(l);
     const w=el('div','fw');const inp=document.createElement('input');inp.id=id;inp.setAttribute('inputmode','decimal');inp.autocomplete='off';inp.value=z[k];inp.addEventListener('input',()=>{z[k]=inp.value;run()});w.appendChild(inp);f.appendChild(w);g.appendChild(f)});
    r.appendChild(g);
    const ch=el('label','lchk');const cb=document.createElement('input');cb.type='checkbox';cb.checked=z.o==='1';cb.addEventListener('change',()=>{z.o=cb.checked?'1':'0';run()});ch.appendChild(cb);ch.appendChild(el('span',null,'moc z zasilacza (OUTPUT) – doliczam 20% strat'));r.appendChild(ch);
    r.appendChild(el('p','small lhint','Moc znajdziesz na etykiecie lub zasilaczu. Jeśli podana jest jako OUTPUT (wyjście zasilacza), zaznacz – zasilacz zużywa zwykle 15–25% więcej.'));
    lw.appendChild(r)})}
  const ab=el('button','chip addb','+ dodaj lampki');ab.type='button';ab.onclick=()=>add();lb.appendChild(ab);
  const tc=el('div','kchips');tc.setAttribute('aria-label','Gotowe zestawy – dodają nową pozycję');
  c.pre.forEach(([lab,set])=>{const b=el('button','chip',lab);b.type='button';b.onclick=()=>add(set);tc.appendChild(b)});
  const wr=el('div','lwrap');wr.appendChild(lw);wr.appendChild(lb);wr.appendChild(el('p','small','Gotowe zestawy (dodają nową pozycję):'));wr.appendChild(tc);
  box.insertBefore(wr,box.firstChild);rys();
 }
 function ustaw(id,val){const e=$('f_'+id);if(e)e.value=val}
 function widoczne(x,v){if(!x.gdy)return true;return x.gdy.split('&').every(g=>{const [k,w]=g.split('=');return w===undefined?!!v[k]:String(v[k])===w})}   // 'a=1&b=2' = oba warunki
 function wartosci(){const v={};let bad=false;c.in.forEach(x=>{const e=$('f_'+x.id);v[x.id]=x.chk?(e.checked?1:0):num(e.value)});
  c.in.forEach(x=>{const wid=widoczne(x,v),d=$('f_'+x.id).closest('.f');if(d)d.hidden=!wid;if(!wid)v[x.id]=num(x.v);else if(!(v[x.id]>=0)){if(x.opc&&!$('f_'+x.id).value.trim())v[x.id]=0;else bad=true}});   // opc: puste pole = 0 (źródło „brak”)
  if(c.lista){v.items=items.map(z=>({nm:z.nm.trim(),w:num(z.w),n:num(z.n),h:num(z.h),o:z.o==='1'}));v.items.forEach(z=>{if(!(z.w>=0&&z.n>=0&&z.h>=0&&z.h<=24))bad=true});if(!(v.d>=1))bad=true}
  return{v,bad}}  // ukryte pola: nie liczą się (wartość domyślna)
 function run(){const {v,bad}=wartosci();$('cerr').hidden=!bad;if(bad)return;
  if(c.lista){try{localStorage.setItem(LK,c.zS(items))}catch(e){}}
  const r=c.f(v);const cl=$('cl');cl.innerHTML='';
  r.l.forEach(([a,b,m])=>{const d=el('div','line');d.appendChild(el('span','l',a));d.appendChild(el('span','fill'));const rr=el('span','r',b);if(m)rr.appendChild(el('small','sub',m));d.appendChild(rr);cl.appendChild(d)});
  const bx=$('bars');if(bx){bx.innerHTML='';const re=c.sl?new RegExp(c.sl):null;
   const B=re?r.l.filter(([a])=>re.test(a)).map(([a,b])=>{const m=/(-?[\d\s\u00a0]+(?:,\d+)?)\s*zł/.exec(String(b));return m?{a,b,v:num(m[1].replace(/[\s\u00a0]/g,''))}:null}).filter(x=>x&&x.v>=0):[];
   bx.hidden=B.length<2;if(B.length>=2){const mx=Math.max(...B.map(x=>x.v)),mn=Math.min(...B.map(x=>x.v));bx.appendChild(el('h2','kh','PORÓWNANIE'));
    B.forEach(x=>{const d=el('div','bar'+(x.v===mn?' min':x.v===mx?' max':''));const l=el('div','bl');l.appendChild(el('span',null,x.a));l.appendChild(el('b',null,x.b));d.appendChild(l);
     const tr=el('div','bt');const fi=el('div','bf');fi.style.width=(mx>0?Math.max(2,x.v/mx*100):0)+'%';tr.appendChild(fi);d.appendChild(tr);bx.appendChild(d)})}}
  $('sk').textContent=r.sk;const sv=$('sv');sv.textContent=r.svt||zl(r.sv);
  let pod=$('spod');if(r.pod){if(!pod){pod=el('p','small spod');pod.id='spod';sv.closest('.sum').after(pod)}pod.textContent=r.pod;pod.style.color=r.podKol==='red'?'var(--red)':'';pod.style.fontWeight=r.podKol==='red'?'700':''}else if(pod)pod.remove();
  {let op=$('op');const ore=c.op?new RegExp(c.op):null,or=ore&&r.l.find(([x])=>ore.test(x));
   if(or){if(!op){op=el('p','op');op.id='op';($('spod')||sv.closest('.sum')).after(op)}op.textContent='';op.appendChild(el('span',null,or[0]));op.appendChild(el('b',null,or[1]))}else if(op)op.remove()}
  sv.style.color=r.kol?'var(--'+r.kol+')':/OSZCZ|TAŃSZE|NAJTANIEJ/.test(r.sk)?'var(--green)':r.sv>=500?'var(--red)':r.sv>=50?'var(--amber)':'var(--green)';if(window.__rstChk)window.__rstChk()}
 if($('cw'))$('cw').textContent=c.w;if($('cs'))$('cs').textContent=c.s||'';
 // N159: „Przywróć domyślne” (c.reset) – widoczny tylko gdy któreś pole różni się od wartości domyślnej; czyści też liczby z adresu
 if(c.reset){const rb=el('button','rst','Przywróć domyślne');rb.type='button';rb.id='rst';rb.hidden=true;box.after(rb);
  const zm=()=>c.in.some(x=>{const e=$('f_'+x.id);return x.chk?(e.checked?'1':'0')!==x.v:x.opt?e.value!==String(x.v):!(num(e.value)===num(x.v))});
  window.__rstChk=()=>{rb.hidden=!zm()};
  rb.onclick=()=>{c.in.forEach(x=>{const e=$('f_'+x.id);if(x.chk)e.checked=x.v==='1';else{e.value=x.v;const g=e.closest('.fopt');if(g)g.querySelectorAll('button').forEach(z=>z.setAttribute('aria-pressed',String(z.dataset.v===String(x.v))))}});
   try{const Q=new URLSearchParams(location.search);c.in.forEach(x=>Q.delete(x.id));history.replaceState(null,'',location.pathname+(Q.toString()?'?'+Q.toString():'')+location.hash)}catch(e){}
   run();rb.hidden=true};setTimeout(window.__rstChk,0)}
 // „Ceny sprawdzone: DD.MM.RRRR” – tylko kalkulatory z cenami śledzonymi przez tygodniową kontrolę (dane/ceny_sprawdzone.json; plik zapisuje automat)
 fetch('/dane/ceny_sprawdzone.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{const d=j&&j[c.id],e=$('csd');if(e&&/^\d{4}-\d{2}-\d{2}$/.test(d||'')){e.textContent='Ceny sprawdzone: '+d.slice(8)+'.'+d.slice(5,7)+'.'+d.slice(0,4);e.hidden=false}}).catch(()=>{});
 function link(){const q=new URLSearchParams();c.in.forEach(x=>{const e=$('f_'+x.id);q.set(x.id,x.chk?(e.checked?'1':'0'):e.value.trim())});if(c.lista)q.set('k',c.zS(items));return location.origin+(window.__p0?window.__p0.split('?')[0].split('#')[0]:location.pathname)+'?'+q.toString()}
 const msg=$('msg');
 $('share').onclick=async()=>{const u=link();
  if(navigator.share&&matchMedia('(pointer:coarse)').matches){try{await navigator.share({title:c.t+' – Ile Naprawdę',url:u});return}catch(e){if(e&&e.name==='AbortError')return}}
  try{await navigator.clipboard.writeText(u)}catch(e){const t=document.createElement('textarea');t.value=u;document.body.appendChild(t);t.select();try{document.execCommand('copy')}catch(_){}t.remove()}
  msg.textContent='Skopiowano link z Twoimi liczbami.';setTimeout(()=>{msg.textContent=''},4000)};
 // POLICZ TEŻ: dwa inne rachunki (najpierw z tego samego działu)
 const inne=KALK.filter(x=>x.id!==c.id).sort((a,b)=>(b.cat===c.cat)-(a.cat===c.cat)).slice(0,3),mini=$('mini');
 inne.forEach(x=>{const a=el('a');a.href=url(x.id);const ee=ODCINKI.filter(o=>o.id===x.id).map(o=>o.nr).sort((p,q)=>q-p)[0];
  a.appendChild(el('small',null,(ee?'#'+ee+' · ':'')+CATS[x.cat]));a.appendChild(el('p',null,x.krot));mini.appendChild(a)});
 run();
}

/* ---------- start ---------- */
const s=document.body.dataset.strona;
if(s==='home'){
 const h=location.hash.slice(1);
 if(h&&calc(h)){location.replace(url(h));}   // stare adresy /#id -> /kalkulatory/id/
 else home();
 window.addEventListener('hashchange',()=>{const g=location.hash.slice(1);if(g&&calc(g))location.replace(url(g))});
}else if(s==='kalk'){
 const c=calc(document.body.dataset.id);if(c)kalk(c);
}
})();
