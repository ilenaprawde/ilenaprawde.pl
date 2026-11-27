// N164: przełączenie strony na nowy wygląd (albo cofnięcie) jedną komendą – NIE uruchamiać bez akceptacji Pawła.
//   node przelacz_wyglad.js wlacz   → nowy_wyglad.json {"wlaczony": true}, przebudowa: nowe strony pod prawdziwymi adresami (/, /kalkulatory/<id>/,
//                                     /promocje-pizza/, /prywatnosc/, /regulamin/, 404), katalog /proba/ usunięty
//   node przelacz_wyglad.js wylacz  → {"wlaczony": false}, przebudowa: stary wygląd + próba pod /proba/
// Potem: git add -A && git commit -m "…" && git push (jeden commit). Cofnięcie = „wylacz” + commit (albo git revert tego commita).
// Adresy, tytuły, opisy, canonical, JSON-LD, FAQ i sitemap.xml są w obu trybach takie same (nagłówki SEO brane ze starych stron).
const fs = require('fs'), { execFileSync } = require('child_process');
const tryb = process.argv[2];
if (!['wlacz', 'wylacz'].includes(tryb)) { console.log('Użycie: node przelacz_wyglad.js wlacz|wylacz'); process.exit(1); }
fs.writeFileSync('nowy_wyglad.json', JSON.stringify({ wlaczony: tryb === 'wlacz', _info: 'N164: true = nowy wygląd pod prawdziwymi adresami; false = stary wygląd + próba pod /proba/. Zmieniaj przez: node przelacz_wyglad.js wlacz|wylacz' }, null, 1) + '\n');
if (tryb === 'wylacz') { try { fs.rmSync('proba', { recursive: true, force: true }); } catch (e) {} }   // proba/ i tak powstaje od nowa
execFileSync('node', ['zbuduj.js'], { stdio: 'inherit' });
console.log(`\nNowy wygląd: ${tryb === 'wlacz' ? 'WŁĄCZONY' : 'wyłączony'}. Sprawdź git status, potem jeden commit i push.`);
