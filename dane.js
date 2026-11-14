// Ile Naprawdę – dane i wzory kalkulatorów (JEDEN plik). Nowy odcinek = 1 wpis w ODCINKI, nowy kalkulator = 1 obiekt w KALK.
// Po zmianach uruchom: node zbuduj.js (generuje /kalkulatory/<id>/, /1…/N/, sitemap.xml, robots.txt).
(()=>{
const num=s=>{const v=parseFloat(String(s).replace(/\s/g,'').replace(',','.'));return Number.isFinite(v)?v:NaN};
const f2=v=>v.toLocaleString('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2});
const f1=v=>v.toLocaleString('pl-PL',{maximumFractionDigits:1});
const zl=v=>f2(v)+' zł', kwh=v=>f2(v)+' kWh';
const yrs=m=>m<24?f1(m)+' mies.':f1(m/12)+' lat';
const PRAD={id:'p',l:'Cena prądu z dystrybucją',v:'1,10',u:'zł/kWh'};
const PALIWO={id:'pb',l:'Cena paliwa',v:'6,20',u:'zł/l'};
const CATS=['Prąd i dom','Apteka','Auto','Praca i pensja','Pieniądze','Mieszkanie','Telefon i internet'];
// ODCINKI: nr, id kalkulatora, wynik z filmu (tekst), kolor kwoty (red = przepłacasz, green = oszczędzasz, ink = neutralnie), podpis pod kwotą,
// yt = ID filmu na YouTube, pa = data publikacji (ISO ze strefą) – przycisk „OBEJRZYJ FILM” pojawia się dopiero od pa (miniatura: /thumbs/odcNN.jpg);
// opcjonalnie: nazwa (inna niż krot kalkulatora) i params (wartości pól w linku, np. {m:'26,59',z:'13,79'}) – /nr otwiera kalkulator z tymi wartościami.
const ODCINKI=[
{nr:1,id:'czuwanie',yt:'uru9NgthJB4',pa:'2026-11-11T12:00:00+01:00',wynik:'96 zł',kol:'red',podpis:'rocznie za nic'},
{nr:2,id:'czajnik',yt:'Jy7j-4YCH3s',pa:'2026-11-12T19:00:00+01:00',wynik:'211 zł',kol:'red',podpis:'rocznie w parę'},
{nr:3,id:'zamiennik',yt:'aHd9EIZBv8s',pa:'2026-11-13T19:00:00+01:00',nazwa:'Zamiennik: ibuprofen',wynik:'−77%',kol:'green',podpis:'ten sam ibuprofen'},
{nr:4,id:'zamiennik',yt:'FDqv7ivoM6A',pa:'2026-11-14T19:00:00+01:00',nazwa:'Zamiennik: krople do nosa',wynik:'−48%',kol:'green',podpis:'ta sama substancja',params:{m:'26,59',z:'13,79',n:'2'}},
{nr:5,id:'telefon',wynik:'9,66 zł',kol:'green',podpis:'za cały rok'},
{nr:6,id:'lpg',wynik:'2 558 zł',kol:'green',podpis:'rocznie w kieszeni'},
{nr:7,id:'ogrzewanie',wynik:'3 427 zł',kol:'red',podpis:'różnicy rocznie'},
{nr:8,id:'abonament',pa:'2026-11-18T19:00:00+01:00',wynik:'620 zł',kol:'red',podpis:'przez 2 lata za markę',params:{aa:'45',ak:'50',am:'24',ba:'20',bk:'30',bm:'24'}}
];
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
{id:'ogrzewanie',krot:'Ogrzewanie domu',cat:0,nr:7,t:'Ogrzewanie domu: co najtańsze',k:'ogrzewanie dom gaz pompa ciepła pellet ekogroszek węgiel kocioł opał',
 i:'Ile rocznie kosztuje ta sama ilość ciepła z różnych źródeł? Wpisz zapotrzebowanie domu i ceny w swojej okolicy.',
 in:[{id:'q',l:'Ciepło na rok',v:'15000',u:'kWh'},{id:'ek',l:'Ekogroszek',v:'1500',u:'zł/t'},{id:'pe',l:'Pellet',v:'2200',u:'zł/t'},{id:'g',l:'Gaz z dystrybucją',v:'0,31',u:'zł/kWh'},{id:'pr',l:'Prąd z dystrybucją',v:'1,26',u:'zł/kWh'},{id:'sc',l:'Sprawność pompy ciepła (SCOP)',v:'3',u:''}],
 f:v=>{const ek=v.q*v.ek/(7200*0.8),ga=v.q*v.g/0.95,po=v.sc>0?v.q*v.pr/v.sc:Infinity,pe=v.q*v.pe/(5000*0.9);
  const all=[ek,ga,po,pe].filter(Number.isFinite),m=all.length?Math.min(...all):0,z=x=>Number.isFinite(x)?zl(x):'brak';
  return{l:[['Ekogroszek rocznie',z(ek)],['Gaz rocznie',z(ga)],['Pompa ciepła rocznie',z(po)],['Pellet rocznie',z(pe)]],sk:'NAJTANIEJ/ROK',sv:m}},
 w:'cena paliwa ÷ (kWh w paliwie × sprawność) × kWh ciepła',s:'Ceny przykładowe: listopad 2026 (kb.pl, taryfa ORLEN + PSG, średnia G11). Wpisz aktualne ceny ze swojej okolicy. Bez kosztów instalacji.'},
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
 f:v=>{const A=v.aa*v.am+v.ak,B=v.ba*v.bm+v.bk,d=A-B,tan=d>=0?'B':'A',pr=(d>=0?A:B)>0?f1(Math.abs(d)/(d>=0?A:B)*100)+'%':'–';return{l:[['Koszt oferty A',zl(A)],['Koszt oferty B',zl(B)],['Taniej oferta '+tan+' o',pr]],sk:'RÓŻNICA',sv:Math.abs(d)}},
 w:'abonament × miesiące + aktywacja; różnica = koszt A − koszt B; procent = różnica ÷ droższa oferta × 100',s:'Ceny z listopada 2026, przykładowe: Play Oferta S (45 zł po rabatach za e-fakturę i zgody, aktywacja 50 zł, umowa 24 mies.) i Virgin Mobile S (20 zł po rabatach, aktywacja 30 zł, bez umowy terminowej), bez telefonu. Virgin Mobile to marka Play (ta sama sieć). Po okresie umowy ceny mogą wzrosnąć. To nie jest porada.'}
];
window.ILE={KALK,ODCINKI,CATS,num,f2,f1,zl,kwh,yrs};
})();
