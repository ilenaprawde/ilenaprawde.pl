// Ile Naprawdę – dane i wzory kalkulatorów (JEDEN plik). Nowy odcinek = 1 wpis w ODCINKI, nowy kalkulator = 1 obiekt w KALK.
// Po zmianach uruchom: node zbuduj.js (generuje /kalkulatory/<id>/, /1…/N/, sitemap.xml, robots.txt).
(()=>{
const num=s=>{const v=parseFloat(String(s).replace(/\s/g,'').replace(',','.'));return Number.isFinite(v)?v:NaN};
const f2=v=>v.toLocaleString('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2});
const f1=v=>v.toLocaleString('pl-PL',{maximumFractionDigits:1});
const lat=n=>{const i=Math.round(n);return i!==n?f1(n)+' lat':i===1?'1 rok':(i%10>=2&&i%10<=4&&(i%100<12||i%100>14))?i+' lata':i+' lat'};   // okres w etykiecie: „1 rok / 2 lata / 5 lat”
const zl=v=>f2(v)+' zł', kwh=v=>f2(v)+' kWh';
const yrs=m=>m<24?f1(m)+' mies.':f1(m/12)+' lat';
const PRAD={id:'p',l:'Cena prądu z dystrybucją',v:'1,10',u:'zł/kWh'};
const PALIWO={id:'pb',l:'Cena paliwa',v:'6,20',u:'zł/l'};
const CATS=['Prąd i dom','Apteka','Samochód','Praca i pensja','Pieniądze','Mieszkanie','Telefon i internet','Święta','Zakupy'];
// ODCINKI: nr, id kalkulatora, wynik z filmu: typ ('roznica' = ile można zyskać → zielone „−620 zł / 2 lata”; 'procent' → zielone „−77%”; 'koszt' → neutralne „96 zł / rok”), kwota (liczba), okres ('rok' | '2 lata' | 'sezon' …; zawsze widoczny), procent (opcjonalnie, liczba bez znaku), podpis pod kwotą,
// kalkulatory bez odcinka: typ/okres wynikają z etykiety wyniku (sk), można je nadpisać polami typ/okres w KALK,
// tytul = krótki tytuł odcinka (zalecane ≤70 znaków, hasło w pierwszych słowach) pod przyciskiem filmu; yt = ID filmu na YouTube, pa = data publikacji (ISO ze strefą) – przycisk „OBEJRZYJ FILM” pojawia się dopiero od pa (miniatura: /thumbs/odcNN.jpg);
// zapowiedź bez kalkulatora: {nr,plan:true,pa,nazwa,cat} – karta „wkrótce – DD.MM” bez linku (po powstaniu kalkulatora zamień na zwykły wpis z id);
// opcjonalnie: href (inny cel niż kalkulator, np. '/abonamenty/'), nazwa (inna niż krot kalkulatora) i params (wartości pól w linku, np. {m:'26,59',z:'13,79'}) – /nr otwiera kalkulator z tymi wartościami.
// nazwa (tytuł karty na stronie głównej i w listach) – krótko, hasło na początku, BEZ pytań typu „ile/co taniej”, zalecane ≤40 znaków (wyjątkowo dłużej, gdy wymieniamy kilka opcji, np. sieci czy sposoby ogrzewania); tytul (pod przyciskiem filmu) – pełne pytanie z wynikiem.
const ODCINKI=[
{nr:1,id:'czuwanie',yt:'uru9NgthJB4',pa:'2026-11-11T12:00:00+01:00',nazwa:'Tryb czuwania TV',tytul:'Tryb czuwania TV: ile zjada czerwona dioda? (96 zł)',typ:'koszt',kwota:4.82,okres:'rok',podpis:'starszy sprzęt nawet 96 zł'},
{nr:2,id:'czajnik',yt:'Jy7j-4YCH3s',pa:'2026-11-12T19:00:00+01:00',nazwa:'Pełny czajnik na jedną herbatę',tytul:'Pełny czajnik na jedną herbatę: ile przepłacasz?',typ:'roznica',kwota:211,okres:'rok',podpis:'rocznie w parę'},
{nr:3,id:'zamiennik',yt:'aHd9EIZBv8s',pa:'2026-11-13T19:00:00+01:00',tytul:'Ibuprofen: ile płacisz za markę? (−77%)',nazwa:'Ibuprofen: marka czy zamiennik',typ:'procent',procent:77,podpis:'ten sam ibuprofen'},
{nr:4,id:'zamiennik',yt:'FDqv7ivoM6A',pa:'2026-11-14T19:00:00+01:00',tytul:'Krople do nosa: ile płacisz za markę? (−48%)',nazwa:'Krople do nosa: marka czy zamiennik',typ:'procent',procent:48,podpis:'ta sama substancja',params:{m:'26,59',z:'13,79',n:'2'}},
{nr:5,id:'telefon',yt:'M6WJQECgtIg',pa:'2026-11-15T19:00:00+01:00',nazwa:'Ładowanie telefonu przez rok',tytul:'Ładowanie telefonu przez rok: 9,66 zł',typ:'koszt',kwota:9.66,okres:'rok',podpis:'za cały rok'},
{nr:6,id:'lpg',yt:'VS2NXSWgz3g',pa:'2026-11-16T19:00:00+01:00',nazwa:'LPG czy benzyna',tytul:'LPG czy benzyna: ile oszczędzasz? (2 558 zł)',typ:'roznica',kwota:2558,okres:'rok',procent:39,podpis:'rocznie w kieszeni'},
{nr:7,id:'ogrzewanie',yt:'48EevVKBYPA',pa:'2026-11-17T19:00:00+01:00',nazwa:'Ogrzewanie domu: gaz, węgiel, pellet, pompa ciepła',tytul:'Ogrzewanie domu: co najtaniej? (3 427 zł)',typ:'roznica',kwota:3427,okres:'rok',procent:47,podpis:'różnicy rocznie'},
{nr:8,id:'abonament',yt:'WCxyY4WAMB8',pa:'2026-11-18T19:00:00+01:00',href:'/abonamenty/',tytul:'Play, Orange, T-Mobile, Plus: ile przepłacasz? (do 660 zł)',nazwa:'Play, Orange, T-Mobile, Plus',typ:'roznica',kwota:660,okres:'2 lata',procent:37,podpis:'T-Mobile → Red Bull'},
{nr:10,id:'lampki',yt:'9tTl2HM42kQ',pa:'2026-11-20T19:00:00+01:00',nazwa:'Lampki choinkowe całą dobę',tytul:'Lampki choinkowe całą dobę: ile kosztują? (27 zł)',typ:'roznica',kwota:20.30,okres:'sezon',procent:75,podpis:'dom, całą dobę, sezon',params:{w:'27,7',n:'1',h:'24',d:'37'}},
{nr:12,id:'airfryer',yt:'2l1yRRDC_9g',pa:'2026-11-22T19:00:00+01:00',nazwa:'Airfryer czy piekarnik',tytul:'Airfryer czy piekarnik: co tańsze? (160 zł)',typ:'roznica',kwota:160,okres:'rok',procent:70,podpis:'4 razy w tygodniu'},
{nr:9,id:'opony',yt:'fs1JL1UXHpc',pa:'2026-11-19T19:00:00+01:00',nazwa:'Opony całoroczne czy sezonowe',tytul:'Opony całoroczne czy sezonowe: co taniej? (2013 zł)',typ:'roznica',kwota:2013,okres:'5 lat',procent:50,podpis:'całoroczne vs zimowe + letnie'},
{nr:11,id:'choinka',yt:'aPxKQ7POt2o',pa:'2026-11-21T19:00:00+01:00',nazwa:'Choinka żywa czy sztuczna',tytul:'Choinka żywa czy sztuczna: co taniej? (1040 zł)',typ:'roznica',kwota:1040,okres:'10 lat',procent:80,podpis:'przez 10 lat'},
{nr:13,id:'obnizka',yt:'_1sTdNgNmFE',pa:'2026-11-23T19:00:00+01:00',nazwa:'Black Friday: prawdziwy rabat',tytul:'Black Friday: prawdziwy rabat z najniższej ceny z 30 dni',typ:'procent',procent:5,podpis:'zamiast reklamowanych −49%'},
{nr:14,id:'bnpl',yt:'svLr6UJ1E8c',pa:'2026-11-24T19:00:00+01:00',nazwa:'Zapłać później: Allegro Pay, PayPo, BLIK',tytul:'Kup teraz, zapłać później (Allegro Pay, PayPo, BLIK): ile kosztuje?',typ:'koszt',znak:'+',kwota:640,okres:'30 rat',podpis:'tyle kosztują raty przy 2259 zł'},
{nr:15,id:'stopien',pa:'2026-11-25T19:00:00+01:00',nazwa:'1°C mniej w domu: oszczędność',tytul:'Ile daje 1°C mniej w domu? (294 zł)',typ:'roznica',kwota:294,okres:'sezon',procent:6,podpis:'mniej w sezonie za 1°C'},
{nr:16,id:'gwarancja',pa:'2026-11-26T19:00:00+01:00',nazwa:'Przedłużona gwarancja: opłacalność',tytul:'Czy przedłużona gwarancja się opłaca? (400 zł)',typ:'koszt',kwota:400,okres:'lata 3–5',podpis:'przedłużona gwarancja przy pralce 2000 zł'},
{nr:17,id:'dostawa',pa:'2026-11-27T19:00:00+01:00',nazwa:'Darmowa dostawa: dorzucić czy zapłacić',tytul:'Dorzucić do darmowej dostawy? (+24 zł)',typ:'koszt',znak:'+',kwota:24,okres:'zakup',podpis:'tyle przepłacasz, dorzucając 39 zł'},
{nr:18,id:'streaming',pa:'2026-11-28T19:00:00+01:00',nazwa:'Netflix, HBO, Disney+, Prime: naraz?',tytul:'Netflix, HBO Max, Disney+ i Prime: naraz czy po kolei? (1057 zł)',typ:'roznica',kwota:1057,okres:'rok',procent:75,podpis:'różnicy rocznie: rotacja zamiast 4 naraz'},
{nr:19,id:'lek-dawka',pa:'2026-11-29T19:00:00+01:00',nazwa:'Ten sam lek, 5× drożej: paracetamol',tytul:'Ten sam lek, 5× drożej: paracetamol zwykły czy musujący?',typ:'razy',razy:5.11,podpis:'musujący drożej niż zwykły za 12 tabletek'},
{nr:20,id:'suszarka',pa:'2026-11-30T19:00:00+01:00',nazwa:'Suszarka do ubrań: czy się zwróci?',tytul:'Suszarka do ubrań z pompą ciepła: czy się zwróci? (293 zł/rok)',typ:'koszt',kwota:293,okres:'rok',podpis:'prąd suszarki przy 4 praniach w tygodniu'},
{nr:21,id:'g12',pa:'2026-12-01T19:00:00+01:00',nazwa:'Taryfa nocna G12: opłaca się?',tytul:'G11 czy G12: kiedy taryfa nocna się opłaca? (−147 zł)',typ:'roznica',kwota:147,okres:'rok',podpis:'mniej w G12 przy 40% prądu w tanich godzinach'},
{nr:22,id:'podroz',pa:'2026-12-02T19:00:00+01:00',nazwa:'Na święta: auto, pociąg czy FlixBus?',tytul:'Dojazd na święta: auto, pociąg czy FlixBus? (222 zł)',typ:'koszt',kwota:222,okres:'tam i z powrotem',podpis:'auto dla 4 osób, Warszawa–Kraków'}
];
// ceny opon za sztukę [zimowe, letnie, całoroczne]: mediana oponeo.pl 15.11.2026 (N058b)
const OPONY_KLASY=[[268,225,252],[358,251,314],[420,338,397]];
const KALK=[
{id:'czuwanie',krot:'Tryb czuwania',cat:0,t:'Tryb czuwania: ile kosztuje „czerwona dioda”',k:'czuwanie standby telewizor tv dekoder konsola dioda',
 i:'Ile rocznie kosztuje urządzenie, które tylko czuwa? Zwykłe czuwanie nowego sprzętu to najwyżej 0,5 W (limit UE).',
 in:[{id:'w',l:'Moc w czuwaniu',v:'0,5',u:'W'},PRAD,{id:'n',l:'Ile takich urządzeń',v:'1',u:''}],
 pre:[['TV nowy · 0,5 W',{w:'0,5'}],['szybki start / sieć · 2 W',{w:'2'}],['starszy sprzęt · 10 W',{w:'10'}]],
 f:v=>{const e=v.w*8760/1000*v.n,y=e*v.p;return{l:[['Godzin w roku','8 760 h'],['Zużycie w roku',kwh(e)],['Przez 10 lat',zl(y*10)]],sk:'ROCZNIE',sv:y}},
 w:'moc [W] × 8 760 h ÷ 1000 × cena kWh',s:'Limit 0,5 W: unijne przepisy o ekoprojekcie dla trybu czuwania.'},
{id:'czajnik',krot:'Czajnik',cat:0,t:'Czajnik: ile kosztuje jedno gotowanie wody',k:'czajnik woda herbata kawa gotowanie kuchnia',
 i:'Ile prądu bierze zagotowanie wody? Liczymy z fizyki: ogrzanie wody do 100°C plus straty czajnika.',
 in:[{id:'l',l:'Ile wody',v:'1',u:'l'},{id:'t0',l:'Temperatura wody z kranu',v:'15',u:'°C'},{id:'e',l:'Sprawność czajnika',v:'90',u:'%'},PRAD,{id:'d',l:'Ile gotowań dziennie',v:'4',u:''}],
 pre:[['szklanka · 0,25 l',{l:'0,25'}],['kubek · 0,4 l',{l:'0,4'}],['pełny · 1,7 l',{l:'1,7'}]],
 f:v=>{const e=v.l*4.186*(100-v.t0)/3600/(v.e/100),one=e*v.p,y=one*v.d*365;return{l:[['Energia na raz',kwh(e)],['Jedno gotowanie',zl(one)],['Miesięcznie',zl(y/12)]],sk:'ROCZNIE',sv:y}},
 w:'litry × 4,186 × (100 − temp.) ÷ 3600 ÷ sprawność × cena kWh',s:'Ciepło właściwe wody 4,186 kJ/(kg·°C). Sprawność czajnika to przykład.'},
{id:'urzadzenie',krot:'Dowolne urządzenie',cat:0,t:'Dowolne urządzenie: koszt godziny i roku pracy',k:'suszarka farelka grzejnik klimatyzacja komputer konsola pc gry odkurzacz żelazko piekarnik moc',
 i:'Wpisz moc urządzenia (z tabliczki lub instrukcji) i jak długo działa. Moc na tabliczce to maksimum, więc wynik jest górną granicą.',
 in:[{id:'w',l:'Moc urządzenia',v:'2000',u:'W'},{id:'h',l:'Ile godzin dziennie',v:'0,25',u:''},PRAD,{id:'dn',l:'Ile dni w roku',v:'365',u:''}],
 pre:[['suszarka do włosów · 2000 W',{w:'2000',h:'0,25'}],['farelka · 2000 W',{w:'2000',h:'3'}],['komputer do gier · 400 W',{w:'400',h:'3'}]],
 f:v=>{const ph=v.w/1000*v.p,y=ph*v.h*v.dn;return{l:[['Godzina pracy',zl(ph)],['Dziennie',zl(ph*v.h)],['Miesięcznie',zl(y/12)]],sk:'ROCZNIE',sv:y}},
 w:'moc [W] ÷ 1000 × godziny × dni × cena kWh',s:'Moce w przyciskach to przykłady typowych urządzeń; sprawdź swoją tabliczkę.'},
{id:'pralka',krot:'Pralka',cat:0,t:'Pralka: ile kosztuje jedno pranie',k:'pralka pranie woda prąd łazienka',
 i:'Prąd i woda na jedno pranie. Zużycie energii i wody znajdziesz na etykiecie energetycznej pralki.',
 in:[{id:'e',l:'Prąd na jedno pranie',v:'0,7',u:'kWh'},{id:'wl',l:'Woda na jedno pranie',v:'50',u:'l'},PRAD,{id:'wm',l:'Cena wody ze ściekami',v:'15',u:'zł/m³'},{id:'tyg',l:'Ile prań w tygodniu',v:'4',u:''}],
 f:v=>{const pr=v.e*v.p,wo=v.wl/1000*v.wm,one=pr+wo,y=one*v.tyg*52;return{l:[['Prąd na pranie',zl(pr)],['Woda na pranie',zl(wo)],['Jedno pranie',zl(one)]],sk:'ROCZNIE',sv:y}},
 w:'kWh × cena prądu + litry ÷ 1000 × cena m³, razy prania w roku',s:'Wartości domyślne to przykład; cena wody różni się między gminami.'},
{id:'suszarka',krot:'Suszarka do ubrań',tk:'Suszarka do ubrań z pompą ciepła',cat:0,nr:20,t:'Suszarka do ubrań z pompą ciepła: czy się zwróci',k:'suszarka do ubrań pompa ciepła pranie suszenie prąd kaloryfer sznurek bęben kwh',
 i:'Ile prądu zjada suszarka i ile ciepła z domu zabiera pranie na kaloryferze. Sznurek na balkonie latem kosztuje 0 zł. Wartości domyślne to przykład z etykiety energetycznej: 128 kWh na 100 cykli.',
 in:[{id:'c',l:'Cena suszarki',v:'2000',u:'zł'},{id:'e',l:'Prąd na 1 suszenie',v:'1,28',u:'kWh'},PRAD,{id:'tyg',l:'Ile prań w tygodniu',v:'4',u:''},{id:'n',l:'Ile lat',v:'10',u:''},{id:'wl',l:'Kaloryfer: woda w praniu po wirowaniu',v:'4',u:'l'},{id:'q',l:'Kaloryfer: koszt 1 kWh ciepła w domu',v:'0,33',u:'zł/kWh'},{id:'ms',l:'Kaloryfer: miesiące sezonu grzewczego',v:'6',u:''}],
 f:v=>{const one=v.e*v.p,rok=one*v.tyg*52,raz=v.c+rok*v.n,kal=v.wl*0.68*v.q,kr=kal*v.tyg*52*v.ms/12,d=Math.round((kal-one)*100)/100;
  return{l:[['Suszarka: 1 suszenie',zl(one)],['Suszarka: prąd na rok',zl(rok)],['Suszarka: razem z zakupem przez '+f1(v.n)+' lat',zl(raz)],['Kaloryfer zimą: 1 pranie',zl(kal)],['Kaloryfer zimą: ciepło na sezon',zl(kr)],['Sznurek latem, balkon','0,00 zł'],['Różnica na 1 pranie: kaloryfer zamiast suszarki',(d<0?'−':d>0?'+':'')+zl(Math.abs(d))]],sk:'PRĄD SUSZARKI ROCZNIE',sv:rok,pod:'Suszarka nigdy się nie zwraca w złotówkach – kupujesz wygodę i miejsce.'}},
 w:'kWh × cena prądu × prania × 52 tygodnie; kaloryfer: litry × 0,68 kWh × koszt ciepła',s:'Odparowanie 1 l wody zabiera ok. 0,68 kWh ciepła. Wilgotność po wirowaniu zależy od obrotów pralki (ok. 45–55%). Suszysz w domu – wietrz. Koszt ciepła: gaz ok. 0,31÷0,95 = 0,33 zł/kWh, pompa ciepła 1,10÷3, grzejnik elektryczny 1,10 zł/kWh.'},
{id:'g12',krot:'G11 czy G12',tk:'G11 czy G12: taryfa nocna',cat:0,nr:21,t:'G11 czy G12: kiedy taryfa nocna się opłaca',k:'g11 g12 taryfa nocna prąd tauron dystrybucja strefa tańsze godziny kwh rachunek',
 i:'Porównaj zwykłą taryfę G11 z dwustrefową G12. Wpisz roczne zużycie, jaką część prądu zużywasz w tańszych godzinach i ceny za 1 kWh z dystrybucją z faktury.',
 in:[{id:'k',l:'Roczne zużycie prądu',v:'2000',u:'kWh'},{id:'pr',l:'Prąd w tańszych godzinach',v:'40',u:'%'},{id:'g',l:'G11: cena z dystrybucją',v:'0,9741',u:'zł/kWh'},{id:'gt',l:'G12: tańsze godziny',v:'0,6362',u:'zł/kWh'},{id:'gd',l:'G12: droższe godziny',v:'1,0769',u:'zł/kWh'}],
 f:v=>{if(!(v.k>0)||v.pr<0||v.pr>100||!(v.g>0)||!(v.gt>0)||!(v.gd>0))return{l:[],sk:'SPRAWDŹ DANE',sv:0,svt:'–',kol:'red',podKol:'red',pod:'Wpisz zużycie, ceny większe od zera i udział prądu w tańszych godzinach od 0 do 100%.'};
  const p=v.pr/100,g11=v.k*v.g,g12=v.k*(p*v.gt+(1-p)*v.gd),d=Math.round((g12-g11)*100)/100,pr=v.gd>v.g&&v.gd>v.gt?(v.gd-v.g)/(v.gd-v.gt)*100:null;
  return{l:[['Koszt w G11',zl(g11)],['Koszt w G12',zl(g12)],['Próg: G12 się opłaca od',pr==null?'–':f1(pr)+' %']],sk:'RÓŻNICA G12 ZAMIAST G11, ROCZNIE',sv:d,svt:(d<0?'−':d>0?'+':'')+zl(Math.abs(d)),kol:d<0?'green':d>0?'red':undefined,pod:d<0?'W G12 zapłacisz mniej, bo '+f1(v.pr)+' % prądu zużywasz w tańszych godzinach. Próg opłacalności: '+(pr==null?'brak':f1(pr)+' % prądu w tańszych godzinach')+'.':d>0?'W G12 zapłacisz więcej: poniżej progu droższe godziny kosztują więcej niż G11.':'Koszt taki sam w obu taryfach.'}},
 w:'G11: kWh × cena; G12: kWh × (udział × cena tańsza + (1 − udział) × cena droższa); próg = (droższa − G11) ÷ (droższa − tańsza)',s:'Przykład Taurona. Tańsze godziny zależą od operatora (np. Tauron: 22–6 i 13–15). Opłaty stałe w G11 i G12 u Taurona są takie same – u innych sprawdź na fakturze. Ceny w polach domyślnych (stan na 25.11.2026): G11 0,9741 zł/kWh, G12 tańsze godziny 0,6362 zł/kWh, droższe 1,0769 zł/kWh (Tauron 2026, brutto z dystrybucją, selectra.pl). To nie jest porada.'},
{id:'led',krot:'Żarówka LED',cat:0,t:'Żarówka zwykła czy LED: ile oszczędzasz',k:'żarówka led oświetlenie lampa światło',
 i:'Porównanie dwóch żarówek, które świecą podobnie jasno. Wynik pokazuje oszczędność i kiedy LED się zwróci.',
 in:[{id:'a',l:'Moc starej żarówki',v:'60',u:'W'},{id:'b',l:'Moc LED',v:'8',u:'W'},{id:'h',l:'Godzin świecenia dziennie',v:'3',u:''},PRAD,{id:'c',l:'Cena LED',v:'15',u:'zł'}],
 f:v=>{const s=(v.a-v.b)/1000*v.h*365*v.p;return{l:[['Stara żarówka rocznie',zl(v.a/1000*v.h*365*v.p)],['LED rocznie',zl(v.b/1000*v.h*365*v.p)],['Zwrot zakupu LED',s>0?yrs(v.c/s*12):'brak']],sk:'OSZCZĘDNOŚĆ/ROK',sv:s}},
 w:'(moc stara − moc LED) ÷ 1000 × godziny × 365 × cena kWh',s:'Moce to przykład (60 W i podobnie jasny LED ok. 8 W); sprawdź opakowanie.'},
{id:'lodowka',krot:'Lodówka',cat:0,t:'Lodówka stara czy nowa: kiedy wymiana się zwraca',k:'lodówka chłodziarka zamrażarka wymiana agd etykieta',
 i:'Roczne zużycie prądu znajdziesz na etykiecie energetycznej (kWh/rok). Dla starej lodówki możesz zmierzyć je miernikiem.',
 in:[{id:'a',l:'Stara lodówka',v:'400',u:'kWh/rok'},{id:'b',l:'Nowa lodówka',v:'150',u:'kWh/rok'},PRAD,{id:'c',l:'Cena nowej lodówki',v:'2000',u:'zł'}],
 f:v=>{const s=(v.a-v.b)*v.p;return{l:[['Stara rocznie',zl(v.a*v.p)],['Nowa rocznie',zl(v.b*v.p)],['Zwrot zakupu',s>0?yrs(v.c/s*12):'brak']],sk:'OSZCZĘDNOŚĆ/ROK',sv:s}},
 w:'(kWh stara − kWh nowa) × cena kWh; zwrot = cena ÷ oszczędność',s:'Wartości domyślne to przykład.'},
{id:'telefon',krot:'Ładowanie telefonu',cat:0,t:'Ładowanie telefonu: ile kosztuje przez rok',k:'telefon smartfon ładowarka ładowanie bateria',
 i:'Energia baterii z pojemności (mAh) i napięcia, plus straty na ładowarce.',
 in:[{id:'mah',l:'Pojemność baterii',v:'5000',u:'mAh'},{id:'v',l:'Napięcie baterii',v:'3,85',u:'V'},{id:'s',l:'Straty ładowania',v:'20',u:'%'},PRAD,{id:'d',l:'Pełnych ładowań dziennie',v:'1',u:''}],
 f:v=>{const e=v.mah*v.v/1e6/(1-v.s/100),y=e*v.d*365*v.p;return{l:[['Energia na ładowanie',f2(e*1000)+' Wh'],['Jedno ładowanie',zl(e*v.p)],['Przez 10 lat',zl(y*10)]],sk:'ROCZNIE',sv:y}},
 w:'mAh × V ÷ 1 000 000 ÷ (1 − straty) × ładowania × 365 × cena kWh',s:'Straty ładowania to przykład.'},
{id:'ogrzewanie',krot:'Ogrzewanie domu',cat:0,nr:7,t:'Ogrzewanie domu: co najtańsze',k:'ogrzewanie dom gaz pompa ciepła pellet ekogroszek węgiel kocioł opał drewno kominek drzewo',
 i:'Ile rocznie kosztuje ta sama ilość ciepła z różnych źródeł? Wpisz zapotrzebowanie domu i ceny w swojej okolicy.',
 in:[{id:'q',l:'Ciepło na rok',v:'15000',u:'kWh'},{id:'ek',l:'Ekogroszek',v:'1500',u:'zł/t'},{id:'pe',l:'Pellet',v:'2200',u:'zł/t'},{id:'dr',l:'Drewno sezonowane',v:'500',u:'zł/mp',opc:true},{id:'g',l:'Gaz z dystrybucją',v:'0,31',u:'zł/kWh'},{id:'pr',l:'Prąd z dystrybucją',v:'1,26',u:'zł/kWh'},{id:'sc',l:'Sprawność pompy ciepła (SCOP)',v:'3',u:''}],
 f:v=>{const ek=v.q*v.ek/(7200*0.8),ga=v.q*v.g/0.95,po=v.sc>0?v.q*v.pr/v.sc:Infinity,pe=v.q*v.pe/(5000*0.9),dr=v.dr>0?v.q*v.dr/(2000*0.7):Infinity;
  const all=[ek,ga,po,pe,dr].filter(Number.isFinite),m=all.length?Math.min(...all):0,z=x=>Number.isFinite(x)?zl(x):'brak';
  return{l:[['Ekogroszek rocznie',z(ek)],['Gaz rocznie',z(ga)],['Pompa ciepła rocznie',z(po)],['Pellet rocznie',z(pe)],['Drewno rocznie',z(dr)]],sk:'NAJTANIEJ/ROK',sv:m}},
 w:'cena paliwa ÷ (kWh w paliwie × sprawność) × kWh ciepła; drewno: kWh ciepła × cena za mp ÷ (2000 kWh z 1 mp × sprawność 70%)',s:'Ceny przykładowe: listopad 2026 (kb.pl, taryfa ORLEN + PSG, średnia G11). Drewno 500 zł/mp – środek przedziału 450–800 zł/mp za sezonowane liściaste ze składu (kb.pl, Murator, listopad 2026); w nadleśnictwie ok. 160–270 zł/m³, ale mokre. 1 mp suchego drewna liściastego ≈ 2000 kWh, sprawność pieca/kominka z płaszczem 70%. Wpisz aktualne ceny ze swojej okolicy. Bez kosztów instalacji.',uw:'Drewno dodane po filmie, na prośbę widzów.'},
{id:'lampki',krot:'Lampki świąteczne',cat:7,nr:10,t:'Lampki świąteczne: ile kosztuje ich świecenie',k:'lampki choinkowe świąteczne led kurtyna żarówki choinka boże narodzenie prąd święta sezon girlanda',
 i:'Ile prądu zużyją lampki w całym sezonie, np. od 1 grudnia do 6 stycznia (37 dni)? Dodaj każdy komplet lampek osobno: moc z opisu produktu, liczbę kompletów i godziny świecenia dziennie.',
 lista:true,
 in:[{id:'d',l:'Liczba dni sezonu',v:'37',u:''},PRAD,{id:'x',l:'Porównanie: wszystkie świecą dziennie',v:'6',u:'h'}],
 pre:[['LED 100 diod · 6 W',{nm:'LED 100 diod',w:'6'}],['kurtyna 500 LED · 21,7 W',{nm:'Kurtyna 500 LED',w:'21,7'}],['stare żarówki 16 × 3 W · 48 W',{nm:'Stare żarówki 16 × 3 W',w:'48'}]],
 f:v=>{const it=v.items,d=v.d,p=v.p,r=[];let kw=0,e=0,c=0;
  it.forEach(z0=>{const z=Object.assign({},z0,{w:z0.w*(z0.o?1.2:1)}),k=z.w*z.n/1000*z.h*d,cc=k*p;e+=k;c+=cc;kw+=z.w*z.n/1000*z.h;r.push([(z.nm||'Lampki')+' ('+f1(z.n)+' × '+f1(z0.w)+' W, '+f1(z.h)+' h)'+(z.o?' (+20% straty zasilacza)':''),zl(cc),kwh(k)])});
  const dz=kw*p,wsz=it.reduce((a,z)=>a+z.w*(z.o?1.2:1)*z.n/1000,0),cx=wsz*v.x*d*p,df=Math.round(cx*100)/100-Math.round(c*100)/100,pr=c>0?df/c*100:0,sg=df<0?'−':(df>0?'+':'');
  r.push(['RAZEM: zużycie w sezonie ('+f1(d)+' dni)',kwh(e)],['RAZEM: koszt dziennie',zl(dz)],['Gdyby wszystkie świeciły '+f1(v.x)+' h dziennie – koszt za sezon',zl(cx)],['Różnica za sezon',sg+zl(Math.abs(df))+(c>0?' ('+sg+f1(Math.abs(pr))+'%)':'')]);
  return{l:r,sk:'KOSZT/SEZON',sv:c}},
 w:'dla każdej pozycji: moc (kW) × liczba kompletów × godziny dziennie × dni × cena prądu; razem = suma pozycji; porównanie: łączna moc × godziny z pola porównania × dni × cena; różnica = porównanie − koszt obecny',s:'Moc wg opisów produktów: LED 100 diod 6 W (MediaMarkt), kurtyna 500 LED 21,7 W i 16 żarówek × 3 W (Murator Dom). Cena prądu 1,10 zł/kWh to przykład. Zużycie zależy od konkretnych lampek. To nie jest porada.'},
{id:'airfryer',krot:'Airfryer czy piekarnik',cat:0,nr:12,t:'Airfryer czy piekarnik: co zjada mniej prądu',k:'airfryer frytkownica beztłuszczowa piekarnik kuchnia gotowanie porcja prąd kurczak',
 i:'Porównaj zużycie prądu na jedną porcję w piekarniku i w airfryerze (frytkownicy beztłuszczowej). Wpisz zużycie z własnych pomiarów albo z instrukcji.',
 in:[{id:'po',l:'Piekarnik: zużycie na porcję',v:'1,0',u:'kWh'},{id:'af',l:'Airfryer: zużycie na porcję',v:'0,3',u:'kWh'},{id:'n',l:'Ile razy w tygodniu',v:'4',u:''},PRAD],
 f:v=>{const cp=v.po*v.p,ca=v.af*v.p,d=cp-ca,r=d*v.n*52;return{l:[['Porcja w piekarniku',zl(cp)],['Porcja w airfryerze',zl(ca)],['Różnica na porcji',zl(d)],['Taniej o',cp>0?f1(d/cp*100)+'%':'–']],sk:d>=0?'OSZCZĘDNOŚĆ/ROK':'AIRFRYER DROŻSZY/ROK',sv:Math.abs(r)}},
 w:'(zużycie piekarnika − zużycie airfryera) × cena prądu × liczba porcji w tygodniu × 52; procent = różnica ÷ koszt piekarnika × 100',s:'Zużycie wg testu Stiftung Warentest (kurczak: airfryer 0,2–0,3 kWh, piekarnik 1,0–1,2 kWh; przyjęto 0,3 i 1,0). Przy dużych porcjach airfryer piecze w kilku cyklach – wpisz wtedy większe zużycie. Cena prądu 1,10 zł/kWh to przykład. To nie jest porada.'},
{id:'choinka',krot:'Choinka żywa czy sztuczna',cat:7,nr:11,t:'Choinka żywa czy sztuczna: co wychodzi taniej',k:'choinka żywa sztuczna jodła świerk święta boże narodzenie wynajem sezon',
 i:'Żywą choinkę kupujesz co roku, sztuczną raz na kilka lat. Porównaj koszt obu przez wybraną liczbę lat i zobacz, po ilu sezonach sztuczna się zwraca.',
 in:[{id:'z',l:'Cena żywej choinki (co roku)',v:'130',u:'zł'},{id:'s',l:'Cena sztucznej choinki',v:'260',u:'zł'},{id:'l',l:'Ile lat posłuży sztuczna',v:'10',u:'lat'}],
 pre:[['żywa tania · 80 zł',{z:'80'}],['żywa dobra · 130 zł',{z:'130'}],['żywa premium · 200 zł',{z:'200'}]],
 f:v=>{const zy=v.z*v.l,d=zy-v.s,ob=v.z>0?Math.ceil(v.s/v.z-1e-9):NaN,sz=Number.isFinite(ob)?ob+(ob===1?' sezonie':' sezonach'):'–';
  return{l:[['Żywa przez '+f1(v.l)+' lat',zl(zy)],['Sztuczna (raz)',zl(v.s)],['Różnica za '+lat(v.l),zl(Math.abs(d))+(zy>0||v.s>0?' ('+f1(Math.abs(d)/Math.max(zy,v.s)*100)+'%)':'')],['Sztuczna zwraca się po',sz]],sk:(d>=0?'SZTUCZNA TAŃSZA O':'ŻYWA TAŃSZA O')+' ('+lat(v.l).toUpperCase()+')',sv:Math.abs(d)}},
 w:'żywa = cena × lata; sztuczna = cena jednorazowa; różnica = żywa − sztuczna; procent = różnica ÷ droższa × 100; zwrot po = cena sztucznej ÷ cena żywej (zaokrąglone w górę, w sezonach)',s:'Ceny z grudnia 2025 (ostatni sezon, przykładowe): żywa jodła kaukaska od 70 zł, dobrej klasy ok. 130 zł (Radio Kielce, Castorama), sztuczna 180 cm ok. 260 zł (sklep internetowy). Można też wypożyczyć jodłę w donicy: Castorama 75 zł za 2 tygodnie. Liczymy tylko pieniądze (bez ekologii i zapachu). To nie jest porada.'},
{id:'obnizka',krot:'Prawdziwy rabat',cat:8,nr:13,t:'Prawdziwy rabat: ile naprawdę obniżono cenę',k:'black friday cyber monday promocja rabat obniżka wyprzedaż omnibus najniższa cena 30 dni zakupy sklep okazja',
 i:'Przy obniżce sklep musi podać najniższą cenę z 30 dni przed obniżką. Wpisz trzy ceny i porównaj reklamowany rabat z prawdziwym.',
 in:[{id:'pp',l:'Cena promocyjna',v:'189',u:'zł'},{id:'pr',l:'Cena „przed promocją” (przekreślona)',v:'369',u:'zł'},
  {id:'pn',l:'Najniższa cena z 30 dni przed obniżką',v:'199',u:'zł',h:'Szukaj napisu „najniższa cena z 30 dni przed obniżką” przy produkcie – sklep musi go podać.'},
  {id:'sz',l:'Kupuję kilka sztuk',v:'0',chk:true},{id:'n',l:'Liczba sztuk',v:'1',u:'szt.',gdy:'sz'}],
 pre:[['obudowa PC · 369 → 189 zł',{pp:'189',pr:'369',pn:'199'}],['telewizor · 4799 → 3999 zł',{pp:'3999',pr:'4799',pn:'4499'}]],
 f:v=>{const n=v.sz?v.n:1,zk=x=>(Math.round(x*100)/100).toLocaleString('pl-PL',{maximumFractionDigits:2})+' zł',
   rab=(d,b)=>(d>0?'−':d<0?'+':'')+f1(Math.abs(d)/b*100)+'% ('+(d>0?'−':d<0?'+':'')+zk(Math.abs(d)*n)+')',
   d1=v.pr-v.pp,d2=v.pn-v.pp,za=n>1?' (za '+f1(n)+' szt.)':'',UO='Od 2023 r. rabat powinien być liczony od najniższej ceny z 30 dni (UOKiK).';
  if(!(v.pr>0&&v.pn>0))return{l:[],sk:'PRAWDZIWY RABAT',sv:0,svt:'–',pod:UO};
  if(v.pn>v.pr)return{l:[],sk:'SPRAWDŹ CENY',sv:0,svt:'–',kol:'red',podKol:'red',pod:'Sprawdź ceny – najniższa z 30 dni nie może być wyższa niż cena przed promocją.'};
  const l=[['Reklamowany rabat'+za,rab(d1,v.pr)],['Prawdziwy rabat'+za,rab(d2,v.pn)]];
  if(d2<=0)return{l,sk:'PRAWDZIWY RABAT'+za,sv:0,svt:d2<0?rab(d2,v.pn):'0%',kol:'red',podKol:'red',pod:d2<0?'To nie jest obniżka: w ostatnich 30 dniach było taniej o '+zk(-d2*n)+'.':'To nie jest obniżka: w ostatnich 30 dniach cena była taka sama.'};
  return{l,sk:'PRAWDZIWY RABAT'+za,sv:d2*n,svt:rab(d2,v.pn),kol:'green',pod:UO}},
 w:'reklamowany rabat = (cena przed − cena promocyjna) ÷ cena przed × 100; prawdziwy rabat = (najniższa z 30 dni − cena promocyjna) ÷ najniższa z 30 dni × 100; kwoty rabatu × liczba sztuk',
 s:'Przykłady z Black Friday 2025 ze sklepów internetowych: obudowa komputera 369 → 189 zł (najniższa z 30 dni 199 zł), telewizor 4799 → 3999 zł (najniższa z 30 dni 4499 zł). Od 1.01.2023 przy obniżce sklep musi podać najniższą cenę z 30 dni przed obniżką (dyrektywa Omnibus, UOKiK). To nie jest porada.'},
{id:'stopien',krot:'1°C mniej w domu',cat:0,nr:15,t:'1°C mniej w domu: ile oszczędzasz w sezonie',k:'temperatura obniżka stopień 1°C ogrzewanie kaloryfer termostat oszczędność sezon grzewczy dom ciepło',
 i:'Ile rocznie oszczędzasz, obniżając temperaturę w domu? Wpisz roczny koszt ogrzewania i temperaturę przed zmianą i po niej.',
 in:[{id:'k',l:'Roczny koszt ogrzewania',v:'4895',u:'zł',h:'Nie znasz go? Policz w kalkulatorze ogrzewania: ilenaprawde.pl/7'},{id:'tn',l:'Temperatura teraz',v:'22',u:'°C'},{id:'tp',l:'Temperatura po zmianie',v:'20',u:'°C'},{id:'pr',l:'Oszczędność na 1°C',v:'6',u:'%'}],
 f:v=>{const d=v.tn-v.tp,ud=Math.min(1,Math.abs(d)*v.pr/100),o=v.k*ud,j=v.k*Math.min(1,v.pr/100),pl=v.tp<16?' Poniżej 16°C łatwo o wilgoć i pleśń.':'';
  if(v.pr>100)return{l:[],sk:'SPRAWDŹ DANE',sv:0,svt:'–',kol:'red',podKol:'red',pod:'Oszczędność na 1°C to procent od 0 do 100.'};
  const l=[['Różnica temperatur',f1(Math.abs(d))+'°C'],['Zmiana kosztu za 1°C',zl(j)]];
  if(d>0)return{l,sk:'OSZCZĘDNOŚĆ/SEZON',sv:o,svt:'−'+zl(o),kol:'green',pod:'1°C ≈ −'+zl(j)+'.'+pl,podKol:pl?'red':''};
  if(d<0)return{l,sk:'WZROST KOSZTU/SEZON',sv:o,svt:'+'+zl(o),kol:'red',podKol:'red',pod:'Podnosisz temperaturę – koszt wzrośnie o ok. '+zl(o)+'.'};
  return{l,sk:'ZMIANA KOSZTU/SEZON',sv:0,svt:'0,00 zł',kol:'green',pod:'Temperatura się nie zmienia – koszt też.'}},
 w:'zmiana kosztu = roczny koszt ogrzewania × min(1; (temperatura teraz − temperatura po zmianie) × oszczędność na 1°C ÷ 100); za 1°C = koszt × oszczędność na 1°C ÷ 100',
 s:'Przykład: dom na gaz, 15 000 kWh ciepła rocznie, gaz 0,31 zł/kWh z dystrybucją, sprawność kotła 95%: 15 000 × 0,31 ÷ 0,95 = 4894,74 zł (te same założenia co w #7). 1°C ≈ 6% to reguła orientacyjna: KAPE, Viessmann i BSM podają 6%, kb.pl i globenergia 5–8%, Danfoss 5%; fizycznie w sezonie jest średnio ok. 18°C różnicy między wnętrzem a zewnętrzem, więc 1°C to ok. 1/18, czyli ok. 5,6% ciepła. Bardziej oszczędzasz w dobrze ocieplonym domu niż w starym. Nie dotyczy mieszkań bez podzielników – tam rachunek zależy od rozliczenia spółdzielni. Poniżej 16°C łatwo o wilgoć i pleśń (poradniki gmin, Viessmann). To nie jest porada.'},
{id:'gwarancja',krot:'Przedłużona gwarancja',cat:8,nr:16,t:'Przedłużona gwarancja: czy się opłaca',k:'przedłużona gwarancja rtv agd pralka lodówka telewizor sprzęt ochrona serwis naprawa rękojmia sprzedawca zakupy',
 i:'Sprzedawca proponuje przedłużenie gwarancji? Policz, ile płacisz za rok dodatkowej ochrony i po ilu typowych naprawach się to zwraca.',
 in:[{id:'c',l:'Cena sprzętu',v:'2000',u:'zł'},{id:'p',l:'Cena przedłużonej gwarancji',v:'20',u:'% ceny',opc:true},{id:'kw',l:'albo kwota (0 = liczymy z procentu)',v:'0',u:'zł',opc:true,h:'Jedno z dwóch. Jeśli wpiszesz kwotę, ma pierwszeństwo przed procentem.'},{id:'o',l:'Ochrona łącznie do',v:'5',u:'lat'},{id:'g',l:'Gwarancja producenta',v:'2',u:'lat'},{id:'n',l:'Typowa naprawa',v:'400',u:'zł'}],
 f:v=>{const sk=v.kw>0?v.kw:v.c*v.p/100,pb=Math.max(2,v.g),ly=v.o-pb;
  if(!(sk>0&&v.c>0))return{l:[],sk:'SPRAWDŹ DANE',sv:0,svt:'–',kol:'red',podKol:'red',pod:'Wpisz cenę sprzętu oraz procent albo kwotę gwarancji.'};
  if(ly<=0)return{l:[['Składka',zl(sk)]],sk:'SKŁADKA',sv:sk,svt:zl(sk),kol:'red',podKol:'red',pod:'Producent już daje tyle lat – nie dopłacaj.'};
  const pc=sk/v.c*100,nr=v.n>0?Math.ceil(Math.round(sk/v.n*1e6)/1e6):NaN,lm=x=>x===1?'1 naprawa':(x%10>=2&&x%10<=4&&(x%100<12||x%100>14))?x+' naprawy':x+' napraw';
  const zak=ly===1?'rok '+v.o:'lata '+(pb+1)+'–'+v.o;
  return{l:[['Składka',zl(sk)+' ('+f1(pc)+'% ceny)'],['Płacisz za: '+zak,lat(ly)],['Za rok dodatkowej ochrony',zl(sk/ly)],['Zwróci się przy',Number.isFinite(nr)?lm(nr)+' po '+zl(v.n):'–']],sk:'SKŁADKA ZA '+zak.toUpperCase(),sv:sk,svt:zl(sk),pod:pc>=30?'Składka to już '+f1(pc)+'% ceny sprzętu.':'',podKol:pc>=30?'red':''}},
 w:'składka = cena sprzętu × procent ÷ 100 (albo wpisana kwota); lata dodatkowej ochrony = ochrona łącznie − większa z liczb: 2 lata (odpowiedzialność sprzedawcy) i gwarancja producenta; za rok = składka ÷ lata; zwrot = składka ÷ typowa naprawa, zaokrąglone w górę',
 s:'Składka zwykle 10–30% ceny (rankomat.pl); przykłady: ochrona do 5 lat za 20% ceny w RTV Euro AGD i Media Expert, 15% w oleole (agdmaniak.pl); pralka 1000 zł ≈ 300 zł za 3 dodatkowe lata (Pepper, 04.2026). Naprawy 2026 (cenauslug.pl): pompa 210–400 zł, grzałka 220–380 zł, łożyska 450–700 zł. Przykład: 2000 zł × 20% = 400 zł. Przez 2 lata za niezgodność towaru z umową odpowiada sprzedawca – za darmo. Przedłużona gwarancja to ubezpieczenie: sprawdź wyłączenia w warunkach. To nie jest porada.'},
{id:'dostawa',krot:'Darmowa dostawa',cat:8,nr:17,t:'Darmowa dostawa od progu: dorzucić czy zapłacić za kuriera',k:'darmowa dostawa próg koszyk kurier dorzucić zakupy sklep internetowy black friday paczkomat allegro smart koszt dostawy',
 i:'Do darmowej dostawy brakuje kilku złotych? Policz, czy opłaca się dorzucić coś do koszyka, czy lepiej zapłacić za dostawę.',
 in:[{id:'k',l:'Wartość koszyka',v:'60',u:'zł'},{id:'p',l:'Darmowa dostawa od',v:'99',u:'zł'},{id:'d',l:'Koszt dostawy',v:'14,99',u:'zł'},{id:'x',l:'Ile dorzucasz (0 = brakująca kwota)',v:'0',u:'zł',opc:true},{id:'pz',l:'Dorzucana rzecz i tak by mi się przydała',v:'0',chk:true}],
 f:v=>{const br=Math.max(0,v.p-v.k);
  if(br===0)return{l:[['Koszyk',zl(v.k)],['Brakuje do progu',zl(0)]],sk:'DOSTAWA',sv:0,svt:'0,00 zł',kol:'green',pod:'Masz już darmową dostawę.'};
  const dor=v.x>0?v.x:br,l=[['Brakuje do progu',zl(br)],['Bez dorzucania: koszyk + dostawa',zl(v.k+v.d)],['Z dorzuceniem: koszyk + dorzucone',zl(v.k+dor)]];
  if(dor<br)return{l,sk:'ZA MAŁO',sv:0,svt:'–',kol:'red',podKol:'red',pod:'Za mało – nadal nie masz darmowej dostawy.'};
  const df=Math.round((dor-v.d)*100)/100;
  if(df>0)return{l,sk:'PRZEPŁACASZ',sv:df,svt:'+'+zl(df),kol:'red',podKol:v.pz?'':'red',pod:v.pz?'Wydajesz '+zl(df)+' więcej, ale dostajesz rzecz, której potrzebujesz – OK.':'Przepłacasz '+zl(df)+'.'};
  return{l,sk:'OSZCZĘDZASZ',sv:-df,svt:'−'+zl(-df),kol:'green',pod:df<0?'Oszczędzasz '+zl(-df)+' – dorzuć.':'Wychodzi na to samo.'}},
 w:'brakuje = próg − koszyk (nie mniej niż 0); bez dorzucania płacisz koszyk + dostawa; z dorzuceniem koszyk + dorzucone (puste pole = brakująca kwota); różnica = dorzucone − koszt dostawy: dodatnia = przepłacasz, ujemna = oszczędzasz',
 s:'Przykład: próg 99 zł i kurier 14,99 zł jak w Media Markt (mediamarkt.pl/dostawa, sprawdzone 24.11.2026: „Darmowa dostawa dla zamówień od 99 zł”, kurier 14,99 zł lub 0 zł). 90 zł + 9 zł = 99 zł wobec 90 zł + 14,99 zł = 104,99 zł, czyli 5,99 zł mniej; 60 zł + 39 zł = 99 zł wobec 74,99 zł, czyli 24,01 zł więcej. Progi i ceny dostaw różnią się między sklepami. Np. Allegro Smart!: darmowa od 49,90 zł. Ceny w polach domyślnych (stan na 24.11.2026): darmowa dostawa od 99 zł, kurier 14,99 zł (Media Markt). To nie jest porada.'},
{id:'streaming',krot:'Streaming: naraz czy rotacja',tk:'Netflix, HBO, Disney+, Prime',cat:6,nr:18,t:'Streaming: wszystkie serwisy naraz czy rotacja',k:'streaming netflix hbo max disney prime video skyshowtime apple tv subskrypcje seriale filmy rotacja anulowanie abonament vod',
 i:'Ile kosztują wszystkie serwisy naraz, a ile rotacja, czyli jeden serwis na raz? Wpisz miesięczne ceny swoich planów (0 = nie mam).',
 in:[{id:'nf',l:'Netflix',v:'37',u:'zł/mies.',opc:true},{id:'hb',l:'HBO Max',v:'29,99',u:'zł/mies.',opc:true},{id:'di',l:'Disney+',v:'34,99',u:'zł/mies.',opc:true},{id:'pr',l:'Amazon Prime',v:'15,50',u:'zł/mies.',opc:true},{id:'sk',l:'SkyShowtime',v:'0',u:'zł/mies.',opc:true},{id:'ap',l:'Apple TV',v:'0',u:'zł/mies.',opc:true},{id:'in',l:'Inny serwis',v:'0',u:'zł/mies.',opc:true}],
 f:v=>{const c=[v.nf,v.hb,v.di,v.pr,v.sk,v.ap,v.in].filter(x=>x>0),n=c.length,su=c.reduce((a,b)=>a+b,0);
  if(!n)return{l:[],sk:'SPRAWDŹ DANE',sv:0,svt:'–',kol:'red',podKol:'red',pod:'Wpisz cenę przynajmniej jednego serwisu.'};
  const r=su*12/n,df=su*12-r,l=[['Liczba serwisów',String(n)],['Wszystko naraz: miesięcznie',zl(su)],['Wszystko naraz: rocznie',zl(su*12)],['Rotacja: rocznie',zl(r)]];
  if(n===1)return{l,sk:'ROCZNIE',sv:0,svt:'0,00 zł',kol:'green',pod:'Masz jeden serwis – rotacja nic nie zmieni.'};
  return{l,sk:'OSZCZĘDNOŚĆ/ROK',sv:df,svt:'−'+zl(df),kol:'green',pod:'Rotacja: jeden serwis na raz, każdy '+f1(12/n)+' mies. w roku. To '+f1((1-1/n)*100)+'% mniej niż wszystko naraz.'}},
 w:'naraz = suma cen serwisów (te z ceną większą od 0) × 12; rotacja: jeden serwis na raz, każdy przez 12 ÷ liczba serwisów miesięcy w roku, czyli suma × 12 ÷ liczba serwisów; różnica = naraz − rotacja = suma × 12 × (1 − 1 ÷ liczba serwisów)',
 s:'Ceny ze stron serwisów, sprawdzone 24.11.2026: Netflix Podstawowy 37 zł (bez reklam, help.netflix.com), HBO Max Podstawowy 29,99 zł (z reklamami, hbomax.com; do 30.11 promocja 14,99 zł dla nowych), Disney+ Standard 34,99 zł (jest też plan z reklamami za 24,99 zł, disneyplus.com), Amazon Prime 15,50 zł (amazon.pl). Suma 117,48 zł; × 12 = 1409,76 zł; rotacja 4 serwisów: 1409,76 ÷ 4 = 352,44 zł; różnica 1057,32 zł (75%). Anuluj zaraz po wykupieniu – dostęp zostaje do końca opłaconego okresu. Plany różnią się jakością i liczbą ekranów, ceny się zmieniają. Ceny w polach domyślnych (stan na 24.11.2026): Netflix Podstawowy 37 zł/mies., HBO Max Podstawowy 29,99 zł/mies., Disney+ Standard 34,99 zł/mies., Amazon Prime 15,50 zł/mies. To nie jest porada.'},
{id:'bnpl',krot:'Kup teraz, zapłać później',cat:8,nr:14,t:'Kup teraz, zapłać później (BNPL): ile kosztuje spóźnienie i raty',k:'bnpl kup teraz zapłać później allegro pay paypo blik płacę później pko odroczona płatność raty odsetki spóźnienie bik rrso zakupy',
 i:'Płatność odroczona (np. Allegro Pay, PayPo, BLIK Płacę Później) spłacona w 30 dni zwykle nic nie kosztuje. Policz, ile kosztuje spóźnienie, a ile rozłożenie na raty.',
 in:[{id:'tr',l:'Co liczymy',v:'0',opt:[['Spóźnienie',0],['Raty',1]]},
  {id:'kw',l:'Kwota do spłaty',v:'1000',u:'zł',gdy:'tr=0'},{id:'dn',l:'Dni spóźnienia',v:'14',u:'dni',gdy:'tr=0'},
  {id:'st',l:'Stawka odsetek za opóźnienie',v:'0',opt:[['maksymalne 18,5%',0],['ustawowe 9,25% (np. PKO Płacę później)',1],['własna %',2]],gdy:'tr=0'},
  {id:'sw',l:'Własna stawka',v:'18,5',u:'% rocznie',gdy:'tr=0&st=2'},
  {id:'pc',l:'Cena zakupu',v:'2259',u:'zł',gdy:'tr=1'},
  {id:'ck',l:'Całkowita kwota do zapłaty',v:'2899,52',u:'zł',gdy:'tr=1',h:'Całkowitą kwotę do zapłaty znajdziesz w formularzu informacyjnym przed potwierdzeniem rat.'},
  {id:'lr',l:'Liczba rat',v:'30',u:'',gdy:'tr=1'}],
 pre:[['Wstaw przykład: 732 zł, 5 rat (RRSO 25,09%)',{tr:'1',pc:'732',ck:'787,63',lr:'5'}],['Wstaw przykład: 2259 zł, 30 rat (RRSO 20,88%)',{tr:'1',pc:'2259',ck:'2899,52',lr:'30'}],['Wstaw przykład: Smart! 2 raty 0%',{tr:'1',pc:'583',ck:'583',lr:'2'}]],
 f:v=>{if(!v.tr){const s=[18.5,9.25,v.sw][v.st]??18.5,o=v.kw*s/100*v.dn/365;
   return{l:[['Stawka',s.toLocaleString('pl-PL',{maximumFractionDigits:2})+'% rocznie'],['Na dzień spóźnienia',zl(v.kw*s/100/365)],['Za '+f1(v.dn)+' dni',zl(o)]],sk:'ODSETKI ZA SPÓŹNIENIE',sv:o,svt:'ok. '+zl(o),podKol:'red',pod:'Uwaga: opóźnienie w płatności odroczonej może trafić do BIK i obniżyć ocenę kredytową.'}}
  if(v.ck<v.pc)return{l:[],sk:'SPRAWDŹ KWOTY',sv:0,svt:'–',kol:'red',podKol:'red',pod:'Całkowita kwota do zapłaty nie może być niższa niż cena zakupu.'};
  const k=v.ck-v.pc,r=v.lr>0?v.ck/v.lr:NaN;
  return{l:[['Cena zakupu',zl(v.pc)],['Razem do zapłaty',zl(v.ck)],['Koszt rat za cały okres (% ceny)',v.pc>0?f1(k/v.pc*100)+'%':'–'],['Rata miesięczna ok.',Number.isFinite(r)?zl(r):'–']],sk:'KOSZT RAT (CAŁY OKRES)',sv:k,svt:(k>0?'+':'')+zl(k),kol:k>0?'red':'green'}},
 w:'spóźnienie: kwota × stawka roczna × dni ÷ 365; raty: koszt = całkowita kwota do zapłaty − cena zakupu; procent = koszt ÷ cena × 100; rata ≈ całkowita kwota ÷ liczba rat',
 s:'Stawki z listopada 2026: odsetki maks. za opóźnienie 18,5% (2 × odsetki ustawowe za opóźnienie, art. 481 §2¹ KC), ustawowe 9,25% (stopa referencyjna NBP 3,75% + 5,5 pkt proc., M.P. 2026 poz. 367); przykłady reprezentatywne Allegro Pay z 14.07.2026 (FAQ Allegro Pay). Rata to średnia – w harmonogramie ostatnia może się różnić o grosze. To nie jest porada.'},
{id:'dojazd',krot:'Dojazd autem',cat:2,t:'Dojazd autem: ile kosztuje paliwo na trasie',k:'auto samochód dojazd trasa praca przedszkole szkoła paliwo benzyna km',
 i:'Koszt samego paliwa na stałej trasie, np. do pracy albo przedszkola. Bez serwisu, opon i ubezpieczenia.',
 in:[{id:'km',l:'Długość jednego przejazdu',v:'5',u:'km'},{id:'k',l:'Przejazdów dziennie',v:'4',u:''},{id:'dn',l:'Dni w miesiącu',v:'22',u:''},{id:'sp',l:'Spalanie',v:'8',u:'l/100 km'},PALIWO],
 f:v=>{const d=v.km*v.k,day=d*v.sp/100*v.pb,m=day*v.dn;return{l:[['Kilometrów dziennie',f1(d)+' km'],['Dziennie',zl(day)],['Miesięcznie',zl(m)]],sk:'ROCZNIE',sv:m*12}},
 w:'km × przejazdy × spalanie ÷ 100 × cena paliwa × dni',s:'Cena paliwa to przykład; wpisz aktualną ze stacji.'},
{id:'sto-km',krot:'100 km jazdy',cat:2,t:'Ile kosztuje 100 km jazdy',k:'auto samochód 100 km spalanie paliwo benzyna diesel trasa',
 i:'Koszt paliwa na 100 km i na 1 km dla Twojego spalania.',
 in:[{id:'sp',l:'Spalanie',v:'7',u:'l/100 km'},PALIWO,{id:'km',l:'Ile km rocznie',v:'15000',u:''}],
 f:v=>{const c=v.sp*v.pb;return{l:[['Na 1 km',zl(c/100)],['Na 100 km',zl(c)],['Miesięcznie',zl(c*v.km/100/12)]],sk:'ROCZNIE',sv:c*v.km/100}},
 w:'spalanie × cena paliwa = koszt 100 km',s:'Cena paliwa to przykład.'},
{id:'opony',krot:'Opony: dwa komplety czy całoroczne',tk:'Opony całoroczne czy 2 komplety',cat:2,t:'Opony zimowe + letnie czy całoroczne: co wychodzi taniej',k:'opony zimowe letnie całoroczne wielosezonowe wymiana opon przechowalnia felgi auto samochód',
 i:'Dwa komplety (zimowe i letnie) czy jeden komplet całorocznych? Liczymy zakup, wymiany i przechowywanie przez wybraną liczbę lat. Liczymy tylko koszty. Bezpieczeństwo i warunki jazdy (góry, śnieg) mogą przesądzić o wyborze.',
 in:[{id:'km',l:'Przebieg rocznie',v:'10000',u:'km'},{id:'l',l:'Ile lat liczymy',v:'5',u:'lat'},
  {id:'kl',l:'Klasa opon',v:'1',opt:[['Budżet',0],['Średnia',1],['Premium',2]]},
  {id:'zc',l:'Zmień ceny ręcznie',v:'0',chk:true},
  {id:'cz',l:'Komplet zimowych (4 szt.)',v:'1432',u:'zł',gdy:'zc'},{id:'cl',l:'Komplet letnich (4 szt.)',v:'1004',u:'zł',gdy:'zc'},{id:'cc',l:'Komplet całorocznych (4 szt.)',v:'1256',u:'zł',gdy:'zc'},
  {id:'wy',l:'Wymiana opon z wyważeniem',v:'160',u:'zł',gdy:'zc'},
  {id:'pt',l:'Przechowywanie',v:'0',opt:[['W domu',0],['Płatna przechowalnia',1]]},
  {id:'pr',l:'Przechowalnia za sezon',v:'150',u:'zł',gdy:'pt=1'},
  {id:'fe',l:'Mam drugi komplet na felgach',v:'0',chk:true},{id:'wk',l:'Wymiana kół (komplet na felgach)',v:'80',u:'zł',gdy:'fe'},
  {id:'za',l:'Ustawienia zaawansowane',v:'0',chk:true,sek:true},
  {id:'wi',l:'Wymiana opon po ilu latach (zalecane ok. 5, maks. 10 od produkcji)',v:'5',u:'lat',gdy:'za'},
  {id:'ts',l:'Trwałość opon sezonowych',v:'40000',u:'km',gdy:'za'},{id:'tc',l:'Trwałość opon całorocznych',v:'35000',u:'km',gdy:'za'}],
 pre:[['5 tys. km/rok',{km:'5000'}],['10 tys.',{km:'10000'}],['20 tys.',{km:'20000'}],['30 tys.',{km:'30000'}],['40 tys.',{km:'40000'}]],
 zmiana:(id,ustaw)=>{if(id!=='kl'&&id!=='zc')return;const K=OPONY_KLASY[+document.getElementById('f_kl').value]||OPONY_KLASY[1];ustaw('cz',String(K[0]*4));ustaw('cl',String(K[1]*4));ustaw('cc',String(K[2]*4))},
 f:v=>{const K=OPONY_KLASY[v.kl]||OPONY_KLASY[1],cz=v.zc?v.cz:K[0]*4,cl=v.zc?v.cl:K[1]*4,cc=v.zc?v.cc:K[2]*4,
   wym=v.fe?v.wk:v.wy,pr=v.pt?v.pr:0,
   ks=km=>v.l/Math.min(v.wi,km>0?v.ts/(km/2):Infinity),kc=km=>v.l/Math.min(v.wi,km>0?v.tc/km:Infinity),
   sez=km=>(cz+cl)*ks(km)+2*v.l*wym+2*v.l*pr,cal=km=>kc(km)*(cc+v.wy);
  const s=sez(v.km),c=cal(v.km),d=s-c,n=2*v.l;
  let prog=null;for(let k=1000;k<80000;k+=500){const a=sez(k)-cal(k),b=sez(k+500)-cal(k+500);if(a*b<0||(b===0&&a!==0)){prog=Math.round((k+500*a/(a-b))/500)*500;break}}
  const zawsze=sez(40000)-cal(40000)>0?'całoroczne tańsze przy każdym przebiegu':'dwa komplety tańsze przy każdym przebiegu';
  const l=[['Dwa komplety: opony ('+f1(ks(v.km))+' × zima + lato)',zl((cz+cl)*ks(v.km))],[(v.fe?'Wymiany kół':'Wymiany opon')+' ('+f1(n)+' × '+zl(wym)+')',zl(n*wym)]];
  if(pr>0)l.push(['Przechowalnia ('+f1(n)+' × '+zl(pr)+')',zl(n*pr)]);
  l.push(['Dwa komplety razem ('+lat(v.l)+')',zl(s)],['Całoroczne ('+f1(kc(v.km))+' kpl. z montażem, '+lat(v.l)+')',zl(c)],['Różnica za '+lat(v.l),zl(Math.abs(d))+(Math.max(s,c)>0?' ('+f1(Math.abs(d)/Math.max(s,c)*100)+'%)':'')],
   ['Taniej wychodzą',d>=0?'całoroczne':'dwa komplety'],['Koszty równe przy',prog?'ok. '+prog.toLocaleString('pl-PL')+' km/rok':zawsze]);
  return{l:l.filter(x=>!/^0,00 zł/.test(x[1])),sk:(d>=0?'CAŁOROCZNE TAŃSZE O':'DWA KOMPLETY TAŃSZE O')+' ('+lat(v.l).toUpperCase()+')',sv:Math.abs(d),pod:v.zc?'Ceny: Twoje (wpisane ręcznie).':'Ceny: mediana z oponeo.pl, 15.11.2026 (klasa '+['budżet','średnia','premium'][v.kl]+', 205/55 R16).'}},
 w:'sezonowe: komplety = lata ÷ min(wymiana po latach, trwałość ÷ (przebieg ÷ 2)); koszt = (zimowe + letnie) × komplety + 2 × lata × wymiana + 2 × lata × przechowalnia. Całoroczne: komplety = lata ÷ min(wymiana po latach, trwałość ÷ przebieg); koszt = komplety × (cena + montaż). Zużycie liczone proporcjonalnie. Różnica = sezonowe − całoroczne; procent = różnica ÷ droższa × 100',
 s:'Ceny opon 205/55 R16 za sztukę: mediana 6 ofert z oponeo.pl z 15.11.2026 – budżet (Dębica, Goodride, Kormoran): zimowe 268, letnie 225, całoroczne 252 zł; średnia (Kleber, Fulda, Hankook, Sava): 358 / 251 / 314 zł; premium (Michelin, Continental, Goodyear, Bridgestone): 420 / 338 / 397 zł. Wymiana 4 opon z wyważeniem ok. 160 zł (kb.pl 2026: 158 zł), przechowalnia ok. 150 zł za sezon (kb.pl). Producenci zalecają wymianę opon po ok. 5 latach, najpóźniej 10 lat od produkcji. Trwałość w km przykładowa. Liczymy tylko koszty. Bezpieczeństwo i warunki jazdy (góry, śnieg) mogą przesądzić o wyborze. To nie jest porada.'},
{id:'lpg',krot:'Benzyna czy LPG',cat:2,t:'Benzyna czy LPG: kiedy instalacja się zwraca',k:'lpg gaz instalacja gazowa benzyna auto samochód zwrot',
 i:'Auto na gazie pali go więcej niż benzyny, ale gaz jest tańszy. Liczymy roczną oszczędność i zwrot instalacji.',
 in:[{id:'km',l:'Ile km rocznie',v:'15000',u:''},{id:'sb',l:'Spalanie benzyny',v:'7',u:'l/100 km'},PALIWO,{id:'sg',l:'Spalanie LPG',v:'8,5',u:'l/100 km'},{id:'pg',l:'Cena LPG',v:'3,10',u:'zł/l'},{id:'c',l:'Koszt instalacji',v:'3500',u:'zł'}],
 f:v=>{const b=v.km/100*v.sb*v.pb,g=v.km/100*v.sg*v.pg,s=b-g;return{l:[['Benzyna rocznie',zl(b)],['LPG rocznie',zl(g)],['Zwrot instalacji',s>0?yrs(v.c/s*12):'brak']],sk:'OSZCZĘDNOŚĆ/ROK',sv:s}},
 w:'km ÷ 100 × (spalanie × cena) benzyny − to samo dla LPG',s:'Ceny i spalanie to przykład. Bez kosztów przeglądów instalacji.'},
{id:'auto-czy-bilet',krot:'Auto czy bilet',cat:2,t:'Auto czy komunikacja miejska: co taniej w mieście',k:'auto komunikacja bilet miesięczny autobus tramwaj metro parking miasto',
 i:'Porównanie paliwa i parkowania z biletem miesięcznym. Nie liczymy utraty wartości auta ani ubezpieczenia, więc auto wychodzi tu najtaniej, jak może.',
 in:[{id:'km',l:'Km autem w miesiącu',v:'500',u:''},{id:'sp',l:'Spalanie',v:'8',u:'l/100 km'},PALIWO,{id:'pk',l:'Parkowanie w miesiącu',v:'200',u:'zł'},{id:'bil',l:'Bilet miesięczny',v:'110',u:'zł'}],
 f:v=>{const a=v.km/100*v.sp*v.pb+v.pk,d=a-v.bil;return{l:[['Auto miesięcznie',zl(a)],['Bilet miesięcznie',zl(v.bil)],['Różnica miesięcznie',zl(d)]],sk:d>=0?'AUTO DROŻSZE/ROK':'AUTO TAŃSZE/ROK',sv:Math.abs(d)*12}},
 w:'km ÷ 100 × spalanie × cena paliwa + parking − bilet',s:'Wszystkie wartości domyślne to przykład.'},
{id:'podroz',krot:'Podróż',tk:'Podróż: auto, pociąg czy autobus',cat:2,nr:22,t:'Dojazd na święta: auto, pociąg czy FlixBus',k:'podróż dojazd na święta auto pociąg autobus flixbus pkp intercity bilet rodzina dzieci paliwo warszawa kraków trasa',
 i:'Porównanie kosztu podróży autem, pociągiem i autobusem dla całej rodziny. Ceny biletów są dynamiczne – wpisz te, które widzisz w sklepie. Auto liczymy tylko z paliwa i opłat, bez parkingu i zużycia auta.',
 in:[{id:'km',l:'Dystans w jedną stronę',v:'295',u:'km'},{id:'tz',l:'Jadę tam i z powrotem',v:'1',chk:true},{id:'sp',l:'Spalanie',v:'6,5',u:'l/100 km'},{id:'pb',l:'Cena paliwa',v:'5,80',u:'zł/l'},{id:'op',l:'Opłaty drogowe za cały wyjazd',v:'0',u:'zł'},{id:'dd',l:'Liczba dorosłych',v:'2',u:''},{id:'dz',l:'Liczba dzieci',v:'2',u:''},
  {id:'bd',l:'Pociąg: bilet dorosłego w jedną stronę',v:'96,85',u:'zł'},{id:'bk',l:'Pociąg: bilet dziecka w jedną stronę',v:'61,02',u:'zł',h:'Dzieci do 4 lat w PKP Intercity jadą za darmo (ulga 100%), uczniowie mają 37% ulgi.'},
  {id:'ad',l:'Autobus: bilet dorosłego w jedną stronę',v:'47,49',u:'zł'},{id:'ak',l:'Autobus: bilet dziecka w jedną stronę',v:'47,49',u:'zł'},{id:'ar',l:'Autobus: opłata za rezerwację (za kurs)',v:'3,99',u:'zł'}],
 f:v=>{const os=v.dd+v.dz;
  if(!(v.km>0)||!(v.sp>0)||!(v.pb>0)||!(os>=1))return{l:[],sk:'SPRAWDŹ DANE',sv:0,svt:'–',kol:'red',podKol:'red',pod:'Wpisz dystans, spalanie i cenę paliwa większe od zera oraz co najmniej jedną osobę.'};
  const L=v.tz?2:1,r2=x=>Math.round(x*100)/100,a=r2(v.km*L/100*v.sp*v.pb+v.op),p=r2((v.dd*v.bd+v.dz*v.bk)*L),b=r2((v.dd*v.ad+v.dz*v.ak+v.ar)*L),m=Math.min(a,p,b);
  const o=[['auto',a,'Auto: paliwo i opłaty'],['pociąg',p,'Pociąg'],['autobus',b,'Autobus (np. FlixBus)']],n=o.find(x=>x[1]===m);
  const ln=o.map(x=>[x[2],zl(x[1]),x===n?'najtaniej':undefined]);
  o.filter(x=>x!==n).forEach(x=>{const d=r2(m-x[1]);ln.push(['Różnica: '+n[0]+' zamiast '+(x[0]==='autobus'?'autobusu':x[0]==='pociąg'?'pociągu':'auta'),(d<0?'−':'')+zl(Math.abs(d))])});
  return{l:ln,sk:'NAJTAŃSZE: '+n[0].toUpperCase()+(L===2?', TAM I Z POWROTEM':', W JEDNĄ STRONĘ'),sv:m,svt:zl(m),kol:'green',pod:'Dla '+os+' os. najtaniej wychodzi: '+n[0]+'. Auto bez parkingu i zużycia auta; ceny biletów są dynamiczne i zależą od kursu.'}},
 w:'auto: km × (2 przy podróży tam i z powrotem) ÷ 100 × spalanie × cena paliwa + opłaty; pociąg: (dorośli × bilet dorosłego + dzieci × bilet dziecka) × kursy; autobus: (dorośli × bilet + dzieci × bilet dziecka + opłata za rezerwację) × kursy',s:'Ceny domyślne z 25.11.2026 na 23.12 i 27.12, Warszawa–Kraków, 2 dorosłych i 2 dzieci. Pociąg: PKP Intercity EIC, 2 klasa, uczniowie z ulgą 37%, 315,74 zł w jedną stronę (2 × 96,85 + 2 × 61,02), ebilet.intercity.pl; ceny różnią się między pociągami od 81,50 do 485,74 zł. Autobus: FlixBus 44,99 zł (23.12) i 49,99 zł (27.12) za osobę, średnia 47,49 zł, bez zniżki dla dzieci (niepotwierdzona), opłata za rezerwację 3,99 zł, flixbus.pl. Auto: 295 km trasą S7 (Google Maps), Pb95 średnio 5,80 zł/l (autocentrum.pl), 6,5 l/100 km. To nie jest porada.'},
{id:'lek-dawka',krot:'Lek: cena za tabletkę',tk:'Paracetamol zwykły czy musujący',cat:1,nr:19,t:'Lek: cena za tabletkę i za kurację',k:'paracetamol apap efferalgan tabletki musujące lek apteka cena za sztukę kuracja opakowanie ibuprofen ból gorączka',
 i:'Porównaj opakowania leku z tą samą substancją: ile kosztuje jedna tabletka i cała kuracja. Wpisz cenę i liczbę sztuk w opakowaniu (cena 0 = pomijamy).',
 in:[{id:'ac',l:'Zwykła: cena opakowania',v:'2,99',u:'zł',opc:true},{id:'as',l:'Zwykła: liczba sztuk',v:'20',u:'szt.',opc:true},{id:'bc',l:'Markowa: cena opakowania',v:'10,99',u:'zł',opc:true},{id:'bs',l:'Markowa: liczba sztuk',v:'24',u:'szt.',opc:true},{id:'cc',l:'Musująca: cena opakowania',v:'12,20',u:'zł',opc:true},{id:'cs',l:'Musująca: liczba sztuk',v:'16',u:'szt.',opc:true},{id:'k',l:'Ile tabletek na kurację',v:'12',u:'szt.'}],
 f:v=>{const N=['Zwykła','Markowa','Musująca'],it=[[v.ac,v.as],[v.bc,v.bs],[v.cc,v.cs]].map((x,i)=>({n:N[i],c:x[0],s:x[1]})).filter(x=>x.c>0&&x.s>0);
  if(!it.length||!(v.k>0))return{l:[],sk:'SPRAWDŹ DANE',sv:0,svt:'–',kol:'red',podKol:'red',pod:'Wpisz cenę i liczbę sztuk przynajmniej jednego opakowania oraz liczbę tabletek na kurację.'};
  it.forEach(x=>{x.p=x.c/x.s;x.u=Math.round(x.c*v.k/x.s*100+1e-9)/100});
  const l=[];it.forEach(x=>{l.push([x.n+': za 1 szt.',zl(x.p)]);l.push([x.n+': kuracja '+f1(v.k)+' szt.',zl(x.u)])});
  if(it.length<2)return{l,sk:'KURACJA',sv:it[0].u,svt:zl(it[0].u),pod:'Dodaj drugie opakowanie, żeby porównać.'};
  const mn=it.reduce((a,b)=>b.u<a.u?b:a),mx=it.reduce((a,b)=>b.u>a.u?b:a),d=Math.round((mx.u-mn.u)*100)/100;
  return{l,sk:'RÓŻNICA ZA KURACJĘ',sv:d,svt:(d>0?'+':'')+zl(d),kol:d>0?'red':'green',pod:d>0&&mn.u>0?mx.n+' jest '+f2(mx.u/mn.u)+' razy droższa niż '+mn.n+' (najtańsza). Porównuj tylko leki z tą samą substancją i dawką.':'Ceny kuracji są takie same.'}},
 w:'cena za 1 szt. = cena opakowania ÷ liczba sztuk; kuracja = cena za 1 szt. × liczba tabletek (zaokrąglona do grosza); różnica = najdroższa kuracja − najtańsza; „razy” = najdroższa ÷ najtańsza',
 s:'Najniższe ceny z aptek internetowych, sprawdzone 24.11.2026: Paracetamol Zentiva 500 mg 20 szt. 2,99 zł (doz.pl), Apap 500 mg 24 tabl. powl. od 10,99 zł i Efferalgan 500 mg 16 tabl. musujących od 12,20 zł (gdziepolek.pl; w aptekach stacjonarnych drożej). Na sztukę: 0,15 / 0,46 / 0,76 zł; 12 szt.: 1,79 / 5,50 / 9,15 zł; 9,15 ÷ 1,79 = 5,11. Dawkowanie dla dorosłych: 500–1000 mg co 4–6 h, maks. 3 g na dobę (ChPL), zgodnie z ulotką. Ceny się zmieniają. Ceny w polach domyślnych (stan na 24.11.2026): Paracetamol Zentiva 500 mg 20 szt. 2,99 zł (DOZ.pl), Apap 500 mg 24 szt. od 10,99 zł i Efferalgan 500 mg 16 szt. od 12,20 zł (gdziepolek.pl). To nie jest porada medyczna.'},
{id:'zamiennik',krot:'Zamiennik leku',cat:1,nr:3,t:'Zamiennik leku: ile oszczędzasz',k:'lek leki apteka zamiennik generyk ibuprofen paracetamol krople przeziębienie',
 i:'Porównaj lek znanej marki z zamiennikiem o tej samej substancji i dawce. Wpisz ceny ze swojej apteki.',
 in:[{id:'m',l:'Cena leku znanej marki',v:'49,50',u:'zł'},{id:'z',l:'Cena zamiennika',v:'11,30',u:'zł'},{id:'n',l:'Ile opakowań w roku',v:'2',u:''}],
 pre:[['ibuprofen 200 mg · 50 tabl.',{m:'49,50',z:'11,30'}],['krople do nosa 0,1% · 10 ml',{m:'26,59',z:'13,79'}]],
 f:v=>{const d=v.m-v.z;return{l:[['Taniej za opakowanie',zl(d)],['Taniej o',v.m>0?f1(d/v.m*100)+'%':'–']],sk:'OSZCZĘDNOŚĆ/ROK',sv:d*v.n}},
 w:'(marka − zamiennik) ÷ marka × 100 = ile procent taniej',s:'Źródła cen: lekinfo24.pl i gdziepolek.pl, listopad 2026 (ceny przykładowe, w Twojej aptece mogą być inne). W aptece poproś o zamiennik. To nie jest porada medyczna.'},
{id:'abonament',krot:'Abonament komórkowy',cat:6,t:'Abonament telefonu: ile płacisz za markę',k:'abonament telefon komórkowy internet gb operator play virgin mobile umowa aktywacja sieć',
 i:'Porównaj dwie oferty abonamentu: koszt przez cały okres to abonament razy miesiące plus opłata aktywacyjna. Domyślnie: Play Oferta S (A) i Virgin Mobile S (B), ceny z listopada 2026, przykładowe.',
 in:[{id:'aa',l:'Oferta A: abonament',v:'45',u:'zł/mies.'},{id:'ak',l:'Oferta A: aktywacja',v:'50',u:'zł'},{id:'am',l:'Oferta A: liczba miesięcy',v:'24',u:''},{id:'ba',l:'Oferta B: abonament',v:'20',u:'zł/mies.'},{id:'bk',l:'Oferta B: aktywacja',v:'30',u:'zł'},{id:'bm',l:'Oferta B: liczba miesięcy',v:'24',u:''}],
 pre:[['Play S (A) vs Virgin Mobile S (B)',{aa:'45',ak:'50',am:'24',ba:'20',bk:'30',bm:'24'}]],
 f:v=>{const A=v.aa*v.am+v.ak,B=v.ba*v.bm+v.bk,d=A-B,tan=d>=0?'B':'A',pr=(d>=0?A:B)>0?f1(Math.abs(d)/(d>=0?A:B)*100)+'%':'–';return{l:[['Koszt oferty A ('+f1(v.am)+' mies.)',zl(A)],['Koszt oferty B ('+f1(v.bm)+' mies.)',zl(B)],['Taniej oferta '+tan+' o',pr]],sk:v.am===v.bm?'RÓŻNICA ZA '+f1(v.am)+' MIES.':'RÓŻNICA ZA OKRES UMOWY',sv:Math.abs(d)}},
 w:'abonament × miesiące + aktywacja; różnica = koszt A − koszt B; procent = różnica ÷ droższa oferta × 100',s:'Ceny z listopada 2026, przykładowe: Play Oferta S (umowa 24 mies.) i Virgin Mobile S (bez umowy terminowej), ceny po rabatach za e-fakturę i zgody, bez telefonu. Virgin Mobile to marka Play (ta sama sieć). Po okresie umowy ceny mogą wzrosnąć. Ceny w polach domyślnych (stan na 24.11.2026): Play Oferta S 45 zł/mies. (aktywacja 50 zł), Virgin Mobile S 20 zł/mies. (aktywacja 30 zł). To nie jest porada.'}
];
window.ILE={KALK,ODCINKI,CATS,num,f2,f1,zl,kwh,yrs};
})();
