/* Baut aus app/ eine einzige, in sich geschlossene HTML-Datei.
   Nutzen: in iCloud Drive legen und auf dem iPhone in "Dateien" öffnen – läuft ohne Server und ohne Netz.
   Aufruf: node tools/build-single.js [zielpfad]                                   */
const fs = require('fs'), path = require('path');
const APP = path.resolve(__dirname, '..', 'app');
const ZIEL = process.argv[2] || path.resolve(__dirname, '..', 'dist', 'Lern-Cockpit.html');

const lies = f => fs.readFileSync(path.join(APP, f), 'utf8');
const idx = JSON.parse(lies('kurse/index.json'));
const daten = { fahrplan: idx.fahrplan || [], kurse: idx.kurse.map(f => JSON.parse(lies('kurse/' + f))) };

let html = lies('index.html')
  .replace('<link rel="stylesheet" href="style.css">', '<style>\n' + lies('style.css') + '\n</style>')
  .replace('<link rel="manifest" href="manifest.webmanifest">', '')
  .replace('<script src="app.js"></script>',
    '<script>window.KURSE=' + JSON.stringify(daten).replace(/<\//g, '<\\/') + ';</script>\n' +
    '<script>\n' + lies('app.js') + '\n</script>');

fs.mkdirSync(path.dirname(ZIEL), { recursive: true });
fs.writeFileSync(ZIEL, html);
console.log('geschrieben:', ZIEL, (fs.statSync(ZIEL).size / 1024 / 1024).toFixed(2) + ' MB',
  '·', daten.kurse.length, 'Kurs(e)');
