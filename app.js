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
const defaults=c=>{const v={};c.in.forEach(x=>v[x.id]=num(x.v));return v};

/* ---------- wiersze (rachunki): odcinki od najnowszych + kalkulatory bez odcinka ---------- */
function wiersze(){
 const eps=[...ODCINKI].sort((a,b)=>b.nr-a.nr).map(o=>{const c=calc(o.id);return{nr:o.nr,id:o.id,params:o.params,nazwa:o.nazwa||c.krot,cat:c.cat,wynik:o.wynik,kol:o.kol,podpis:o.podpis,szukaj:o.nazwa+' '+c.t+' '+c.k+' '+CATS[c.cat]+' '+o.nr}});
 const uzyte=new Set(ODCINKI.map(o=>o.id));
 const bez=KALK.filter(c=>!uzyte.has(c.id)).map(c=>{const r=c.f(defaults(c));return{nr:null,id:c.id,nazwa:c.krot,cat:c.cat,wynik:zl(r.sv),kol:'ink',podpis:'przykład',szukaj:c.t+' '+c.k+' '+CATS[c.cat]}});
 return eps.concat(bez);
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
  ep.forEach((r,i)=>{const a=el('a','card');a.href=url(r.id,r.params);a.style.transform='rotate('+ROT[i%ROT.length]+'deg)';
   const pin=el('i','pin');pin.style.background=PINS[i%PINS.length];
   const p=el('div','paper');const tr=el('div','tagrow');tr.appendChild(el('small','tg','#'+r.nr+' · '+CATS[r.cat]));
   const oo=ODCINKI.find(x=>x.nr===r.nr);
   if(oo&&opub(oo)){const pl=el('span','play','▶');pl.setAttribute('role','link');pl.tabIndex=0;pl.title='Obejrzyj film #'+r.nr;pl.setAttribute('aria-label','Obejrzyj film #'+r.nr+' na YouTube');
    const go=ev=>{ev.preventDefault();ev.stopPropagation();window.open(filmUrl(oo),'_blank','noopener')};pl.addEventListener('click',go);pl.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' ')go(ev)});tr.appendChild(pl)}
   p.appendChild(tr);p.appendChild(el('div','t',r.nazwa));p.appendChild(el('div','dots'));
   p.appendChild(el('div','v c-'+r.kol,r.wynik));p.appendChild(el('small',null,r.podpis));a.appendChild(pin);a.appendChild(p);w.appendChild(a)});
  $('none').hidden=lista.length>0;$('roll').hidden=!lista.length;
  const box=$('rows');box.innerHTML='';const pokaz=rozwin?lista:lista.slice(0,10);
  pokaz.forEach(r=>{const a=el('a','row');a.href=url(r.id,r.params);a.appendChild(el('i',null,r.nr!=null?'#'+r.nr:''));a.appendChild(el('span','t',r.nazwa));a.appendChild(el('span','f'));a.appendChild(el('b',null,r.wynik));box.appendChild(a)});
  const m=$('more');m.hidden=rozwin||lista.length<=10;m.textContent='POKAŻ WSZYSTKIE '+lista.length+' ↓'}
 $('more').onclick=()=>{rozwin=true;rysuj()};
 $('q').addEventListener('input',()=>{rozwin=false;rysuj()});
 chipy();rysuj();
}

/* ---------- podstrona kalkulatora ---------- */
function kalk(c){
 const eps=ODCINKI.filter(o=>o.id===c.id).map(o=>o.nr).sort((a,b)=>b-a);
 const P=new URLSearchParams(location.search);
 const fb=$('filmy'),fl=ODCINKI.filter(o=>o.id===c.id&&opub(o)).sort((x,y)=>x.nr-y.nr);
 if(fb&&fl.length){fl.forEach(o=>{const a=el('a','film');a.href=filmUrl(o);a.target='_blank';a.rel='noopener';
   const im=document.createElement('img');im.src='/thumbs/odc0'+o.nr+'.jpg';im.alt='';im.width=60;im.height=77;im.loading='lazy';a.appendChild(im);
   a.appendChild(el('span',null,'▶ OBEJRZYJ FILM #'+o.nr));fb.appendChild(a)});
  const tk=el('p','small tk');const ta=el('a',null,'także na TikToku');ta.href='https://www.tiktok.com/@ilenaprawde';ta.target='_blank';ta.rel='noopener';tk.appendChild(ta);fb.appendChild(tk)}
 const asc=[...eps].sort((x,y)=>x-y);$('ktag').textContent=(asc.length?(asc.length>1?'ODC. '+asc.slice(0,-1).map(n=>'#'+n).join(', ')+' i #'+asc[asc.length-1]:'ODC. #'+asc[0])+' · ':'')+CATS[c.cat];
 const box=$('cf');box.innerHTML='';
 c.in.forEach(x=>{const d=el('div','f');const id='f_'+x.id;const lb=el('label');lb.htmlFor=id;lb.appendChild(el('span',null,x.l));d.appendChild(lb);
  const w=el('div','fw');const inp=document.createElement('input');inp.id=id;inp.setAttribute('inputmode','decimal');inp.autocomplete='off';inp.value=P.has(x.id)?P.get(x.id):x.v;
  inp.addEventListener('input',run);w.appendChild(inp);if(x.u)w.appendChild(el('span',null,x.u));d.appendChild(w);box.appendChild(d)});
 if(c.pre){const ch=el('div','kchips');ch.setAttribute('aria-label','Przykładowe wartości');
  c.pre.forEach(([lab,set])=>{const b=el('button','chip',lab);b.type='button';b.onclick=()=>{Object.entries(set).forEach(([k,v])=>{$('f_'+k).value=v});run()};ch.appendChild(b)});
  box.insertBefore(ch,box.children[0])}
 function wartosci(){const v={};let bad=false;c.in.forEach(x=>{const n=num($('f_'+x.id).value);if(!(n>=0))bad=true;v[x.id]=n});return{v,bad}}
 function run(){const {v,bad}=wartosci();$('cerr').hidden=!bad;if(bad)return;
  const r=c.f(v);const cl=$('cl');cl.innerHTML='';
  r.l.forEach(([a,b])=>{const d=el('div','line');d.appendChild(el('span','l',a));d.appendChild(el('span','fill'));d.appendChild(el('span','r',b));cl.appendChild(d)});
  $('sk').textContent=r.sk;const sv=$('sv');sv.textContent=zl(r.sv);
  sv.style.color=/OSZCZ|TAŃSZE|NAJTANIEJ/.test(r.sk)?'var(--green)':r.sv>=500?'var(--red)':r.sv>=50?'var(--amber)':'var(--green)'}
 $('cw').textContent=c.w;$('cs').textContent=c.s||'';
 function link(){const q=new URLSearchParams();c.in.forEach(x=>q.set(x.id,$('f_'+x.id).value.trim()));return location.origin+location.pathname+'?'+q.toString()}
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
