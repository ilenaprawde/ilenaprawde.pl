// Ile Naprawdę – wspólny silnik strony: strona główna („ściana paragonów”) i podstrony kalkulatorów. Dane: dane.js (ILE).
(()=>{
const {KALK,ODCINKI,CATS,num,f1,zl}=window.ILE;
const $=id=>document.getElementById(id);
const PINS=['#C62828','#1D4ED8','#15803D','#E0A800'];
const ROT=[-1.6,1.3,1.0,-1.2,-0.8,1.5];
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ł/g,'l');
const calc=id=>KALK.find(c=>c.id===id);
const url=(id,params)=>'/kalkulatory/'+id+'/'+(params&&Object.keys(params).length?'?'+new URLSearchParams(params).toString():'');
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
// wynik odcinka / kalkulatora: typ 'roznica' (zielone, z minusem), 'procent' (zielone), 'koszt' (neutralne, bez minusa); okres zawsze obok kwoty
const wynik=o=>{const t=o.typ||'koszt',per=o.okres?'/ '+o.okres:'',pr=o.procent!=null&&t!=='procent'?MIN+(Number.isInteger(o.procent)?o.procent:String(o.procent).replace('.',','))+'%':'';
 if(t==='procent')return{am:MIN+String(o.procent).replace('.',',')+'%',per:'',pr:'',kol:'green'};
 if(t==='roznica')return{am:MIN+fk(o.kwota),per,pr,kol:'green'};
 return{am:(o.znak||'')+fk(o.kwota),per,pr:'',kol:o.znak==='+'?'red':'ink'}};
const okresSk=sk=>/SEZON/.test(sk)?'sezon':'rok';
const typSk=sk=>/OSZCZĘD/.test(sk)?'roznica':'koszt';
const defaults=c=>{const v={};c.in.forEach(x=>v[x.id]=num(x.v));return v};

/* ---------- wiersze (rachunki): odcinki od najnowszych + kalkulatory bez odcinka ---------- */
function wiersze(){
 const eps=[...ODCINKI].sort((a,b)=>b.nr-a.nr).map(o=>{if(o.plan)return{nr:o.nr,plan:true,pa:o.pa,nazwa:o.nazwa,cat:o.cat,szukaj:o.nazwa+' '+CATS[o.cat]+' '+o.nr};const c=calc(o.id);return{nr:o.nr,id:o.id,href:o.href,params:o.params,nazwa:o.nazwa||c.krot,cat:c.cat,w:wynik(o),podpis:o.podpis,szukaj:o.nazwa+' '+c.t+' '+c.k+' '+CATS[c.cat]+' '+o.nr}});
 const uzyte=new Set(ODCINKI.map(o=>o.id));
 const bez=KALK.filter(c=>!uzyte.has(c.id)).map(c=>{const r=c.f(defaults(c));return{nr:null,id:c.id,nazwa:c.krot,cat:c.cat,w:wynik({typ:c.typ||typSk(r.sk),kwota:Math.round(r.sv*100)/100,okres:c.okres||okresSk(r.sk)}),podpis:'przykład',szukaj:c.t+' '+c.k+' '+CATS[c.cat]}});
 const cmp={nr:null,id:'__abonamenty',href:'/abonamenty/',nazwa:'Porównywarka abonamentów',cat:6,w:{am:'8 ofert',per:'/ 24 mies.',pr:'',kol:'ink'},podpis:'porównaj sieci',szukaj:'porównywarka abonamentów abonament telefon play virgin orange nju plus plush t-mobile red bull cena sieć'};
 return eps.concat(bez,[cmp]);
}

/* ---------- strona główna ---------- */
function home(){
 const wsz=wiersze();let cat=-1,rozwin=false;
 const filtr=()=>{const ws=norm($('q').value.trim()).split(/\s+/).filter(Boolean);return wsz.filter(r=>(cat<0||r.cat===cat)&&ws.every(w=>norm(r.szukaj).includes(w)))};
 $('ile').textContent=KALK.length+' kalkulatorów ze wzorem, źródłem i datą cen.';
 function chipy(){const box=$('cats');box.innerHTML='';
  [['Wszystkie',-1,wsz.length],...CATS.map((n,i)=>[n,i,wsz.filter(r=>r.cat===i).length])].forEach(([n,i,k])=>{
   if(i>=0&&!k)return;const b=el('button','chip',n+' · '+k);b.type='button';b.setAttribute('aria-pressed',String(i===cat));
   b.onclick=()=>{cat=i;rozwin=false;chipy();rysuj()};box.appendChild(b)})}
 function rysuj(){
  const lista=filtr(),ep=lista.filter(r=>r.nr!=null).slice(0,6);
  $('nowe').hidden=!ep.length;const w=$('wall');w.innerHTML='';
  ep.forEach((r,i)=>{if(r.plan){const a=el('div','card plan');a.setAttribute('aria-disabled','true');a.style.transform='rotate('+ROT[i%ROT.length]+'deg)';const pin=el('i','pin');pin.style.background=PINS[i%PINS.length];const p=el('div','paper');p.appendChild(el('div','tagrow')).appendChild(el('small','tg','#'+r.nr+' · '+CATS[r.cat]));p.appendChild(el('div','t',r.nazwa));p.appendChild(el('div','dots'));const v=el('div','v c-ink');v.appendChild(el('span','am','wkrótce – '+dm(r.pa)));v.appendChild(el('span','arr','→'));p.appendChild(v);a.appendChild(pin);a.appendChild(p);w.appendChild(a);return}const a=el('a','card');a.href=r.href||url(r.id,r.params);a.style.transform='rotate('+ROT[i%ROT.length]+'deg)';
   const pin=el('i','pin');pin.style.background=PINS[i%PINS.length];
   const p=el('div','paper');const tr=el('div','tagrow');tr.appendChild(el('small','tg','#'+r.nr+' · '+CATS[r.cat]));
   const oo=ODCINKI.find(x=>x.nr===r.nr);
   if(oo&&opub(oo))tr.appendChild(playIcon(oo));
   p.appendChild(tr);p.appendChild(el('div','t',r.nazwa));p.appendChild(el('div','dots'));
   {const v=el('div','v c-'+r.w.kol);v.appendChild(el('span','am',r.w.am));if(r.w.per)v.appendChild(el('span','per',r.w.per));p.appendChild(v);if(r.w.pr)p.appendChild(el('div','pr c-'+r.w.kol,r.w.pr))}p.appendChild(el('small',null,r.podpis));if(oo&&!opub(oo))p.appendChild(el('div','soon',wkrotce(oo).replace('film #'+oo.nr+' ','')));a.appendChild(pin);a.appendChild(p);w.appendChild(a)});
  $('none').hidden=lista.length>0;$('roll').hidden=!lista.length;
  const box=$('rows');box.innerHTML='';const pokaz=rozwin?lista:lista.slice(0,10);
  pokaz.forEach(r=>{if(r.plan){const a=el('div','row plan');a.appendChild(el('i',null,'#'+r.nr));a.appendChild(el('span','t',r.nazwa));a.appendChild(el('span','f'));a.appendChild(el('b',null,'wkrótce – '+dm(r.pa)));box.appendChild(a);return}const a=el('a','row');a.href=r.href||url(r.id,r.params);
   const ii=el('i',null,r.nr!=null?'#'+r.nr:'');const oo=r.nr!=null?ODCINKI.find(x=>x.nr===r.nr):null;if(oo&&opub(oo))ii.appendChild(playIcon(oo));a.appendChild(ii);
   a.appendChild(el('span','t',r.nazwa));a.appendChild(el('span','f'));{const b=el('b','c-'+r.w.kol);b.appendChild(el('span','am',r.w.am+(r.w.per?' '+r.w.per:'')));if(r.w.pr)b.appendChild(el('span','pr',r.w.pr));a.appendChild(b)}box.appendChild(a)});
  const m=$('more');m.hidden=rozwin||lista.length<=10;m.textContent='POKAŻ WSZYSTKIE '+lista.length+' ↓'}
 $('more').onclick=()=>{rozwin=true;rysuj()};
 $('q').addEventListener('input',()=>{rozwin=false;rysuj()});
 chipy();rysuj();
}

/* ---------- podstrona kalkulatora ---------- */
function kalk(c){
 const eps=ODCINKI.filter(o=>o.id===c.id).map(o=>o.nr).sort((a,b)=>b-a);
 const P=new URLSearchParams(location.search);
 const hasP=id=>P.has(id)&&!(id==='z'&&/^[a-z]+$/i.test(P.get(id)));   // ?z=fb to znacznik promocji, nie wartość pola 'z'
 if(c.id==='abonament'){const ln=el('a','cmpl','Porównaj oferty wszystkich sieci →');ln.href='/abonamenty/';const sh=$('share');if(sh)sh.parentNode.insertBefore(ln,sh)}
 const fb=$('filmy'),fl=ODCINKI.filter(o=>o.id===c.id).sort((x,y)=>x.nr-y.nr);
 if(fb&&fl.length){let jest=false;fl.forEach(o=>{if(opub(o)){jest=true;const a=el('a','film');a.href=filmUrl(o);a.target='_blank';a.rel='noopener';
   const im=document.createElement('img');im.src='/img/filmy/'+o.nr+'.jpg';im.alt='';im.width=60;im.height=107;im.loading='lazy';im.onerror=()=>{im.remove()};a.appendChild(im);
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
  c.in.forEach(x=>{const wid=widoczne(x,v),d=$('f_'+x.id).closest('.f');if(d)d.hidden=!wid;if(!wid)v[x.id]=num(x.v);else if(!(v[x.id]>=0))bad=true});
  if(c.lista){v.items=items.map(z=>({nm:z.nm.trim(),w:num(z.w),n:num(z.n),h:num(z.h),o:z.o==='1'}));v.items.forEach(z=>{if(!(z.w>=0&&z.n>=0&&z.h>=0&&z.h<=24))bad=true});if(!(v.d>=1))bad=true}
  return{v,bad}}  // ukryte pola: nie liczą się (wartość domyślna)
 function run(){const {v,bad}=wartosci();$('cerr').hidden=!bad;if(bad)return;
  if(c.lista){try{localStorage.setItem(LK,c.zS(items))}catch(e){}}
  const r=c.f(v);const cl=$('cl');cl.innerHTML='';
  r.l.forEach(([a,b,m])=>{const d=el('div','line');d.appendChild(el('span','l',a));d.appendChild(el('span','fill'));const rr=el('span','r',b);if(m)rr.appendChild(el('small','sub',m));d.appendChild(rr);cl.appendChild(d)});
  $('sk').textContent=r.sk;const sv=$('sv');sv.textContent=r.svt||zl(r.sv);
  let pod=$('spod');if(r.pod){if(!pod){pod=el('p','small spod');pod.id='spod';sv.closest('.sum').after(pod)}pod.textContent=r.pod;pod.style.color=r.podKol==='red'?'var(--red)':'';pod.style.fontWeight=r.podKol==='red'?'700':''}else if(pod)pod.remove();
  sv.style.color=r.kol?'var(--'+r.kol+')':/OSZCZ|TAŃSZE|NAJTANIEJ/.test(r.sk)?'var(--green)':r.sv>=500?'var(--red)':r.sv>=50?'var(--amber)':'var(--green)'}
 $('cw').textContent=c.w;$('cs').textContent=c.s||'';
 function link(){const q=new URLSearchParams();c.in.forEach(x=>{const e=$('f_'+x.id);q.set(x.id,x.chk?(e.checked?'1':'0'):e.value.trim())});if(c.lista)q.set('k',c.zS(items));return location.origin+(window.__p0?window.__p0.split('?')[0].split('#')[0]:location.pathname)+'?'+q.toString()}
 const msg=$('msg');
 $('share').onclick=async()=>{const u=link();
  if(navigator.share&&matchMedia('(pointer:coarse)').matches){try{await navigator.share({title:c.t+' – Ile Naprawdę',url:u});return}catch(e){if(e&&e.name==='AbortError')return}}
  try{await navigator.clipboard.writeText(u)}catch(e){const t=document.createElement('textarea');t.value=u;document.body.appendChild(t);t.select();try{document.execCommand('copy')}catch(_){}t.remove()}
  msg.textContent='Skopiowano link z Twoimi liczbami.';setTimeout(()=>{msg.textContent=''},4000)};
 // POLICZ TEŻ: dwa inne rachunki (najpierw z tego samego działu)
 const inne=KALK.filter(x=>x.id!==c.id).sort((a,b)=>(b.cat===c.cat)-(a.cat===c.cat)).slice(0,2),mini=$('mini');
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
