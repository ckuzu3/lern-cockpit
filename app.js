/* Lern-Cockpit – Lern-App für Zertifikate und Studienmodule.
   Aufbau nach Apples Human Interface Guidelines: Übersicht als Startbildschirm,
   Navigationsleiste mit Zurück, gruppierte Listen, Tableiste innerhalb eines Kurses. */
'use strict';

const S = { kurse: [], fahrplan: [], kurs: null, st: null,
            root: 'uebersicht', view: 'heute', sub: null, pruefung: null, drill: null, suche: '' };
const el  = document.getElementById('app');
const nav = document.getElementById('navbar');
const tabs = document.getElementById('tabbar');
const toastEl = document.getElementById('toast');

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const DAY = 864e5;
const heute = () => new Date().setHours(0,0,0,0);
const datum = t => new Date(t).toLocaleDateString('de-CH', { day:'numeric', month:'long' });
const tage  = t => Math.ceil((new Date(t).setHours(0,0,0,0) - heute()) / DAY);

/* ---------- Symbole ---------- */
const sv = (vb, d) => `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.7"
  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  chevR: sv('0 0 9 16', '<path d="M1.3 1.5 7.2 8l-5.9 6.5" stroke-width="2.1"/>'),
  chevL: sv('0 0 12 20', '<path d="M10 1.8 2.5 10 10 18.2" stroke-width="2.1"/>'),
  heute: sv('0 0 24 24', '<rect x="3" y="4.8" width="18" height="16" rx="3.6"/><path d="M3 9.8h18M8 2.6v4.2M16 2.6v4.2"/><circle cx="12" cy="15.2" r="1.7" fill="currentColor" stroke="none"/>'),
  plan:  sv('0 0 24 24', '<path d="M8.5 6.5h11.5M8.5 12h11.5M8.5 17.5h11.5"/><circle cx="4.2" cy="6.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="4.2" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="4.2" cy="17.5" r="1.4" fill="currentColor" stroke="none"/>'),
  karten:sv('0 0 24 24', '<rect x="2.6" y="8" width="18.8" height="12.4" rx="3.2"/><path d="M5.6 5.3h12.8M7.8 2.7h8.4"/>'),
  fragen:sv('0 0 24 24', '<circle cx="12" cy="12" r="9.1"/><path d="M9.5 9.4a2.55 2.55 0 1 1 3.35 2.42c-.62.22-.95.7-.95 1.35v.5"/><circle cx="12" cy="16.9" r="1.15" fill="currentColor" stroke="none"/>'),
  wissen:sv('0 0 24 24', '<path d="M4.2 5A2 2 0 0 1 6.2 3H19.4v15.1H6.2a2 2 0 0 0-2 2z"/><path d="M4.2 18.1A2 2 0 0 1 6.2 16.1h13.2"/>'),
  buch:  sv('0 0 24 24', '<path d="M4.2 5A2 2 0 0 1 6.2 3H19.4v15.1H6.2a2 2 0 0 0-2 2z"/><path d="M4.2 18.1A2 2 0 0 1 6.2 16.1h13.2"/>'),
  karte: sv('0 0 24 24', '<path d="M9 4.2 3.4 6.6v13.2L9 17.4l6 2.4 5.6-2.4V4.2L15 6.6z"/><path d="M9 4.2v13.2M15 6.6v13.2"/>'),
  sicher:sv('0 0 24 24', '<path d="M12 3.5v11M8.2 10.8 12 14.6l3.8-3.8"/><path d="M4.5 16v2.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V16"/>'),
  info:  sv('0 0 24 24', '<circle cx="12" cy="12" r="9.1"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r="1.1" fill="currentColor" stroke="none"/>'),
  blitz: sv('0 0 24 24', '<path d="M13.4 2.5 4.6 13.4h6L10.6 21.5l8.8-10.9h-6z"/>'),
  stern: sv('0 0 24 24', '<path d="m12 3.2 2.7 5.6 6.1.86-4.4 4.3 1.04 6.1L12 17.2l-5.44 2.86L7.6 13.96 3.2 9.66l6.1-.86z"/>'),
  sternVoll: sv('0 0 24 24', '<path d="m12 3.2 2.7 5.6 6.1.86-4.4 4.3 1.04 6.1L12 17.2l-5.44 2.86L7.6 13.96 3.2 9.66l6.1-.86z" fill="currentColor"/>'),
  lupe:  sv('0 0 24 24', '<circle cx="10.6" cy="10.6" r="7.1"/><path d="m15.8 15.8 4.7 4.7"/>'),
  notiz: sv('0 0 24 24', '<path d="M4.5 19.5h15M6.4 15.2l9.9-9.9a2 2 0 0 1 2.8 2.8l-9.9 9.9-3.9 1.1z"/>'),
  flagge:sv('0 0 24 24', '<path d="M5.5 21V3.8M5.5 4.4h11.2l-2.1 3.9 2.1 3.9H5.5"/>'),
  warn:  sv('0 0 24 24', '<path d="M12 3.6 2.6 20h18.8z"/><path d="M12 9.6v4.8"/><circle cx="12" cy="17.2" r="1.05" fill="currentColor" stroke="none"/>')
};
const TABS = [['heute','Heute',I.heute],['plan','Plan',I.plan],['karten','Karten',I.karten],
              ['fragen','Fragen',I.fragen],['wissen','Wissen',I.wissen]];

/* ---------- Speicher ---------- */
const KEY = id => 'lc.' + id;
const LEER = () => ({ karten:{}, plan:{}, fragen:{}, fehler:{}, pruefungen:[],
                      marken:{}, notizen:{}, neuProTag:20, log:{} });
function load(id){
  let d = {};
  try { d = JSON.parse(localStorage.getItem(KEY(id)) || '{}'); } catch(e){}
  return Object.assign(LEER(), d);
}
function save(){ if (!S.kurs) return; try { localStorage.setItem(KEY(S.kurs.id), JSON.stringify(S.st)); } catch(e){} }

let toastTimer = null;
function toast(msg){
  toastEl.textContent = msg; toastEl.classList.add('an');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('an'), 2200);
}

/* ---------- Mini-Markdown ---------- */
function md(t){
  if (!t) return '';
  const lines = String(t).split('\n');
  const inl = s => esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
                         .replace(/`(.+?)`/g,'<code>$1</code>')
                         .replace(/\*(.+?)\*/g,'<em>$1</em>');
  let out = '', ul = false, i = 0;
  const zelle = r => r.trim().replace(/^\||\|$/g,'').split('|').map(c => c.trim());
  while (i < lines.length){
    const l = lines[i];
    if (/^\s*\|.*\|\s*$/.test(l) && i+1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i+1])){
      if (ul){ out += '</ul>'; ul = false; }
      out += '<div class="tbl"><table><thead><tr>' + zelle(l).map(c => '<th>'+inl(c)+'</th>').join('') + '</tr></thead><tbody>';
      i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])){
        out += '<tr>' + zelle(lines[i]).map(c => '<td>'+inl(c)+'</td>').join('') + '</tr>'; i++;
      }
      out += '</tbody></table></div>'; continue;
    }
    i++;
    if (/^\s*[-•]\s+/.test(l)){ if (!ul){ out += '<ul>'; ul = true; } out += '<li>'+inl(l.replace(/^\s*[-•]\s+/,''))+'</li>'; continue; }
    if (ul){ out += '</ul>'; ul = false; }
    if (/^###\s+/.test(l)) out += '<h4>'+inl(l.slice(4))+'</h4>';
    else if (/^##\s+/.test(l)) out += '<h3>'+inl(l.slice(3))+'</h3>';
    else if (l.trim()) out += '<p>'+inl(l)+'</p>';
  }
  if (ul) out += '</ul>';
  return out;
}
const roh = t => md(t).replace(/^<p>|<\/p>$/g,'');

/* ---------- Wiederholung (SM-2) ---------- */
function plane(c, q){
  const n = { ef: c && c.ef || 2.5, iv: c && c.iv || 0, rep: c && c.rep || 0 };
  if (q === 1){ n.rep = 0; n.iv = 0; n.ef = Math.max(1.3, n.ef - .2); n.due = Date.now() + 6e5; }
  else {
    if (q === 2){ n.ef = Math.max(1.3, n.ef - .15); n.iv = n.iv ? Math.max(1, Math.round(n.iv*1.2)) : 1; }
    else {
      n.rep++;
      if (n.rep === 1) n.iv = q === 4 ? 2 : 1;
      else if (n.rep === 2) n.iv = q === 4 ? 5 : 3;
      else n.iv = Math.round(n.iv * n.ef * (q === 4 ? 1.3 : 1));
      if (q === 4) n.ef = Math.min(2.8, n.ef + .1);
    }
    n.iv = Math.min(n.iv, 180);
    n.due = heute() + n.iv*DAY + 36e5*4;
  }
  n.ges = (c && c.ges || 0) + 1;
  return n;
}
function faellige(kurs, st){
  const now = Date.now();
  return (kurs.karten||[]).filter(x => st.karten[x.id] && st.karten[x.id].due <= now);
}
/* Tagesziel: rechnet vom Prüfungstermin rückwärts. Die letzte Woche bleibt zum Wiederholen frei. */
function ziel(kurs, st){
  const offeneKarten = (kurs.karten||[]).filter(x => !st.karten[x.id]).length;
  const offeneFragen = (kurs.fragen||[]).filter(f => !st.fragen[f.id]).length;
  let kNeu, fZiel, tageUebrig = null;
  if (kurs.termin && tage(kurs.termin) > 0){
    tageUebrig = tage(kurs.termin);
    const lern = Math.max(1, tageUebrig - 7);
    kNeu = Math.min(40, Math.ceil(offeneKarten / lern));
    fZiel = Math.min(30, Math.ceil(offeneFragen / lern));
  } else {
    kNeu = Math.min(20, offeneKarten);
    fZiel = Math.min(10, offeneFragen);
  }
  const d = heute();
  const kHeute = st.log['k'+d] || 0, fHeute = st.log['f'+d] || 0;
  const kSoll = faellige(kurs, st).length + Math.max(0, kNeu - (st.log['n'+d]||0)) + kHeute;
  const gesamt = Math.max(1, kSoll + fZiel), getan = Math.min(gesamt, kHeute + fHeute);
  return { kNeu, fZiel, kHeute, fHeute, kSoll, tageUebrig, offeneKarten, offeneFragen,
           pc: Math.round(getan/gesamt*100), fertig: kHeute + fHeute >= gesamt };
}
function queue(kurs, st){
  const z = ziel(kurs, st);
  const faellig = faellige(kurs, st);
  const neuH = st.log['n'+heute()] || 0;
  const neu = (kurs.karten||[]).filter(x => !st.karten[x.id]).slice(0, Math.max(0, z.kNeu - neuH));
  return { faellig, neu, alle: faellig.concat(neu) };
}
/* Zähler für den Tag */
function zaehle(art){
  const d = heute(), k = art + d;
  S.st.log[k] = (S.st.log[k] || 0) + 1;
}
/* Schwächste Domain, sobald genug Fragen beantwortet sind */
function schwaechste(kurs, st){
  let out = null;
  (kurs.domains||[]).forEach(dm => {
    const fs = (kurs.fragen||[]).filter(f => f.domain === dm.id && st.fragen[f.id]);
    if (fs.length < 5) return;
    const q = fs.filter(f => st.fragen[f.id].ok).length / fs.length;
    if (!out || q < out.q) out = { dm, q: q, n: fs.length };
  });
  return out && out.q < 0.8 ? out : null;
}
/* Verlauf der letzten 14 Tage */
function verlauf(st){
  const out = [];
  for (let i = 13; i >= 0; i--){
    const d = heute() - i*DAY;
    out.push({ d, n: (st.log['k'+d]||0) + (st.log['f'+d]||0) });
  }
  return out;
}

/* ---------- Statistik ---------- */
function stats(kurs, st){
  const kt = (kurs.karten||[]).length;
  const gelernt = (kurs.karten||[]).filter(x => st.karten[x.id] && st.karten[x.id].rep >= 2).length;
  const fr = (kurs.fragen||[]).length;
  const beant = Object.keys(st.fragen).length;
  const richtig = Object.values(st.fragen).filter(v => v.ok).length;
  const aufg = (kurs.lernplan && kurs.lernplan.wochen || []).reduce((a,w) => a + w.aufgaben.length, 0);
  const aufgOk = Object.values(st.plan).filter(Boolean).length;
  const pc = x => Math.round((x||0)*100);
  return { kt, gelernt, fr, beant, richtig, aufg, aufgOk,
    ges: pc(kt+fr+aufg ? (gelernt+richtig+aufgOk)/(kt+fr+aufg) : 0),
    quote: pc(beant ? richtig/beant : 0), planPc: pc(aufg ? aufgOk/aufg : 0),
    fehler: Object.keys(st.fehler).length };
}
function ring(p, size, farbe){
  const s = size || 44, r = s/2 - 3.2, u = 2*Math.PI*r;
  return `<div class="ring" style="width:${s}px;height:${s}px">
    <svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" style="transform:rotate(-90deg)">
      <circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="var(--fill)" stroke-width="3.6"/>
      <circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="${farbe||'var(--tint)'}" stroke-width="3.6"
        stroke-linecap="round" stroke-dasharray="${u}" stroke-dashoffset="${u*(1-p/100)}"/>
    </svg><b style="font-size:${s<40?11:12}px">${p}</b></div>`;
}
const zeile = (o) => `<button class="zeile ${o.tap===false?'':'tap'}" ${o.attr||''}>
  ${o.ikon ? `<span class="ikon" style="background:${o.farbe||'var(--tint)'}">${o.ikon}</span>` : ''}
  ${o.vor || ''}
  <span class="haupt"><span class="t">${o.t}</span>${o.s ? `<span class="s">${o.s}</span>` : ''}</span>
  ${o.wert ? `<span class="wert">${o.wert}</span>` : ''}
  ${o.badge || ''}
  ${o.chev === false ? '' : `<span class="chev">${I.chevR}</span>`}</button>`;

/* ================= Ansichten ================= */
const V = {};

/* ---------- Übersicht ---------- */
V.uebersicht = () => {
  const d = new Date().toLocaleDateString('de-CH', { weekday:'long', day:'numeric', month:'long' });
  let h = `<h1 class="gross">Lernen</h1><div class="unter">${esc(d)}</div>`;

  h += `<div class="gruppe"><div class="kopf">Kurse</div><div class="liste">`;
  S.kurse.forEach(k => {
    const st = load(k.id), s = stats(k, st), q = queue(k, st);
    const sub = k.termin
      ? (tage(k.termin) > 0 ? `Prüfung in ${tage(k.termin)} Tagen` : 'Prüfung vorbei')
      : (q.alle.length ? `${q.alle.length} Karten heute` : 'nichts fällig');
    h += zeile({ vor: ring(s.ges, 44), t: esc(k.titel), s: `${esc(k.anbieter||'')} · ${sub}`,
                 attr: `data-kurs="${k.id}"` });
  });
  h += `</div></div>`;

  if (S.fahrplan.length){
    h += `<div class="gruppe"><div class="kopf">Fahrplan</div><div class="liste">`;
    S.fahrplan.forEach((f,i) => {
      const da = S.kurse.some(k => k.id === f.id);
      h += zeile({ t: esc(f.titel), s: `${esc(f.zeitraum||'')} · ${esc(f.aufwand||'')}`,
        badge: `<span class="badge ${da?'gruen':'leise'}">${da?'✓':i+1}</span>`,
        chev:false, tap:false });
    });
    h += `</div><div class="fuss">Inhalte lade ich, sobald du mir sagst, dass ein Kurs dran ist.</div></div>`;
  }

  h += `<div class="gruppe"><div class="kopf">App</div><div class="liste">`;
  h += zeile({ ikon:I.sicher, farbe:'var(--tint)', t:'Datensicherung', s:'Fortschritt sichern oder übertragen', attr:'data-go="sicherung"' });
  h += zeile({ ikon:I.info, farbe:'var(--grau)', t:'Über diese App', attr:'data-go="info"' });
  h += `</div></div>`;
  return h;
};

/* ---------- Datensicherung ---------- */
V.sicherung = () => {
  const paket = { v:1, erstellt:new Date().toISOString(), daten:{} };
  S.kurse.forEach(k => { const r = localStorage.getItem(KEY(k.id)); if (r) paket.daten[k.id] = JSON.parse(r); });
  const anz = Object.keys(paket.daten).length;
  let h = `<h1 class="gross">Datensicherung</h1>
  <div class="unter">Dein Lernfortschritt liegt nur auf diesem Gerät und gleicht sich nicht ab.
  Hier kannst du ihn sichern und auf ein anderes Gerät übertragen.</div>`;

  h += `<div class="gruppe"><div class="kopf">Sicherung erstellen</div>
    <textarea class="feld" id="aus" readonly>${esc(JSON.stringify(paket))}</textarea>
    <button class="knopf" data-kopieren="1">Kopieren</button>
    <div class="fuss">Enthält den Stand von ${anz} ${anz===1?'Kurs':'Kursen'}: Karten, Fragen,
    Lernplan und Prüfungsergebnisse. Keine Inhalte – die kommen ohnehin vom Server.</div></div>`;

  h += `<div class="gruppe"><div class="kopf">Sicherung einspielen</div>
    <textarea class="feld" id="ein" placeholder="Sicherungstext hier einfügen"></textarea>
    <button class="knopf warnung" data-einspielen="1">Einspielen und ersetzen</button>
    <div class="fuss">Ersetzt den Fortschritt der enthaltenen Kurse auf diesem Gerät vollständig.
    Sichere vorher den aktuellen Stand, falls du ihn noch brauchst.</div></div>`;
  return h;
};

V.info = () => {
  const k = S.kurse[0];
  let h = `<h1 class="gross">Über diese App</h1>
  <div class="unter">Lern-Cockpit – Lernkarten, Übungsfragen und Prüfungssimulation
  für Zertifikate und Studienmodule.</div>`;
  h += `<div class="gruppe"><div class="kopf">Inhalte</div><div class="liste">`;
  S.kurse.forEach(c => h += zeile({ t: esc(c.titel), wert: esc(c.stand||'–'), chev:false, tap:false }));
  h += `</div><div class="fuss">Das Datum nennt den Stand der Recherche. Prüfungsziele ändern sich –
  sag im Chat Bescheid, wenn du die Prüfung buchst, dann prüfe ich sie neu.</div></div>`;
  h += `<div class="gruppe"><div class="kopf">Daten</div><div class="liste">`;
  h += zeile({ t:'Fortschritt', s:'nur auf diesem Gerät, im Browser gespeichert', chev:false, tap:false });
  h += zeile({ t:'Offline', s:'Inhalte sind zwischengespeichert und ohne Netz nutzbar', chev:false, tap:false });
  h += `</div></div>`;
  h += `<div class="gruppe"><div class="liste">`;
  h += zeile({ ikon:I.sicher, t:'Datensicherung', attr:'data-go="sicherung"' });
  h += `</div></div>`;
  return h;
};

/* ---------- Kurs: Heute ---------- */
V.heute = () => {
  const k = S.kurs, st = S.st, s = stats(k, st), q = queue(k, st), z = ziel(k, st);
  const p = k.pruefung || {}, w = aktuelleWoche(), schwach = schwaechste(k, st);
  let h = `<h1 class="gross">${esc(k.titel)}</h1>
    <div class="unter">${esc(p.name || k.anbieter || '')}</div>`;

  /* Tagesziel */
  h += `<div class="gruppe"><div class="kopf">Heute</div><div class="liste">
    <div class="zeile">${ring(z.pc, 56, z.fertig ? 'var(--green)' : 'var(--tint)')}
      <span class="haupt"><span class="t" style="font-weight:600">${z.fertig ? 'Tagesziel geschafft' : 'Tagesziel'}</span>
      <span class="s">${z.kHeute} von ${z.kSoll} Karten · ${z.fHeute} von ${z.fZiel} Fragen${
        z.tageUebrig ? ' · noch ' + z.tageUebrig + ' Tage bis zur Prüfung' : ''}</span></span></div>
    ${!k.termin ? `<div class="zeile"><span class="haupt"><span class="s">Ohne Prüfungstermin rechne ich mit
      20 neuen Karten und 10 Fragen pro Tag. Sag mir den Termin, dann rechne ich rückwärts.</span></span></div>` : ''}
  </div></div>`;

  h += `<div class="gruppe"><div class="liste">`;
  h += zeile({ ikon:I.blitz, farbe:'var(--orange)', t:'Kurz-Drill', s:'fünf Minuten, gemischt aus Karten und Fragen',
    attr:'data-drill="1"' });
  h += zeile({ ikon:I.karten, farbe:'var(--tint)', t:'Lernkarten', s:`${q.faellig.length} fällig · ${q.neu.length} neu`,
    badge:`<span class="badge ${q.alle.length?'tint':'gruen'}">${q.alle.length||'✓'}</span>`, attr:'data-tab="karten"' });
  if (w){
    const offen = w.aufgaben.filter((a,i) => !st.plan[w.nr+'.'+i]).length;
    h += zeile({ ikon:I.plan, farbe:'var(--grau)', t:`Woche ${w.nr}`, s: esc(w.thema),
      badge:`<span class="badge ${offen?'orange':'gruen'}">${offen||'✓'}</span>`, attr:'data-tab="plan"' });
  }
  if (s.fehler) h += zeile({ ikon:I.warn, farbe:'var(--red)', t:'Fehlerprotokoll', s:'falsch beantwortete Fragen',
    badge:`<span class="badge rot">${s.fehler}</span>`, attr:'data-go="fehler"' });
  const markiert = Object.keys(st.marken).length;
  if (markiert) h += zeile({ ikon:I.stern, farbe:'var(--orange)', t:'Markiert', s:'was du dir vorgemerkt hast',
    badge:`<span class="badge orange">${markiert}</span>`, attr:'data-go="markiert"' });
  h += `</div></div>`;

  if (schwach){
    h += `<div class="gruppe"><div class="kopf">Dein schwächster Bereich</div><div class="liste">`
      + zeile({ t: esc(schwach.dm.titel), s:`${Math.round(schwach.q*100)} % richtig aus ${schwach.n} Fragen · ${esc(schwach.dm.gewicht||'')} der Prüfung`,
                attr:`data-fragen="${schwach.dm.id}"` }) + `</div></div>`;
  }

  h += `<div class="gruppe"><div class="kopf">Stand</div><div class="kacheln">
    <div class="kachel"><b>${s.gelernt}<span>/${s.kt}</span></b><span>Karten sitzen</span></div>
    <div class="kachel"><b>${s.quote}%</b><span>Trefferquote</span></div>
    <div class="kachel"><b>${s.beant}<span>/${s.fr}</span></b><span>Fragen bearbeitet</span></div>
    <div class="kachel"><b>${s.planPc}%</b><span>Lernplan</span></div></div></div>`;

  /* Verlauf */
  const vl = verlauf(st), max = Math.max(1, ...vl.map(x => x.n));
  if (vl.some(x => x.n)){
    h += `<div class="gruppe"><div class="kopf">Letzte 14 Tage</div><div class="liste" style="padding:14px 16px">
      <div class="verlauf">${vl.map(x => `<i style="height:${Math.max(3, x.n/max*52)}px;
        ${x.n?'':'opacity:.25'}" title="${x.n}"></i>`).join('')}</div>
      <div class="s" style="margin-top:8px">${vl.reduce((a,x)=>a+x.n,0)} Übungen in zwei Wochen</div>
    </div></div>`;
  }

  h += `<div class="gruppe"><div class="kopf">Prüfungssimulation</div><div class="liste">`;
  (k.pruefungen||[]).forEach(pr => {
    const letzt = st.pruefungen.filter(x => x.id === pr.id).pop();
    h += zeile({ t: esc(pr.titel), s:`${pr.fragen.length} Fragen · ${pr.dauer_min} Minuten`,
      badge: letzt ? `<span class="badge ${letzt.pc>=70?'gruen':'rot'}">${letzt.pc}%</span>` : '',
      attr:`data-pruefung="${pr.id}"` });
  });
  h += `</div><div class="fuss">Die drei Prüfungen teilen sich keine Fragen.</div></div>`;

  if (k.termin){
    const d = tage(k.termin);
    h += `<div class="gruppe"><div class="liste">` + zeile({
      t:'Prüfungstermin', s: datum(k.termin), chev:false, tap:false,
      badge:`<span class="badge ${d<14?'rot':d<30?'orange':'tint'}">${d>0?'in '+d+' Tagen':d===0?'heute':'vorbei'}</span>`
    }) + `</div></div>`;
  }

  h += `<div class="gruppe"><div class="kopf">Prüfung</div><div class="liste">`;
  [['Code',p.code],['Dauer',p.dauer],['Fragen',p.fragen],['Bestehen',p.bestehen],
   ['Kosten',p.kosten],['Gültigkeit',p.gueltigkeit],['Sprache',p.sprache]]
   .filter(r => r[1]).forEach(r => h += `<div class="zeile"><span class="haupt"><span class="t">${r[0]}</span>
     <span class="s">${esc(r[1])}</span></span></div>`);
  h += `</div>`;
  if (p.quelle) h += `<div class="fuss">Nach dem offiziellen Prüfungsleitfaden, Stand ${esc(k.stand||'')}.
    ${esc(k.hinweis||'')}</div>`;
  h += `</div><button class="knopf leise" data-go="uebersicht">Anderen Kurs öffnen</button>`;
  return h;
};

/* ---------- Kurz-Drill ---------- */
function drillBauen(){
  const q = queue(S.kurs, S.st);
  const karten = q.alle.slice(0, 8).map(c => ({ typ:'karte', id:c.id }));
  const offen = (S.kurs.fragen||[]).filter(f => !S.st.fragen[f.id]);
  const quelle = offen.length ? offen : (S.kurs.fragen||[]);
  const fragen = quelle.slice(0, 3).map(f => ({ typ:'frage', id:f.id }));
  const mix = [];
  while (karten.length || fragen.length){
    for (let i = 0; i < 3 && karten.length; i++) mix.push(karten.shift());
    if (fragen.length) mix.push(fragen.shift());
  }
  return { items: mix, idx: 0, richtig: 0, fragenGesamt: mix.filter(x => x.typ === 'frage').length };
}
V.drill = () => {
  const d = S.drill;
  if (!d.items.length) return `<h1 class="gross">Kurz-Drill</h1>
    <div class="leer"><div class="gross">✓</div>Nichts offen – für heute bist du durch.</div>
    <button class="knopf leise" data-go="heute">Zurück</button>`;
  if (d.idx >= d.items.length){
    return `<h1 class="gross">Fertig</h1>
      <div class="gruppe"><div class="liste"><div class="zeile">
        ${ring(100, 56, 'var(--green)')}<span class="haupt">
        <span class="t" style="font-weight:600">${d.items.length} Übungen erledigt</span>
        <span class="s">${d.fragenGesamt ? d.richtig + ' von ' + d.fragenGesamt + ' Fragen richtig' : 'nur Karten'}</span>
      </span></div></div></div>
      <button class="knopf" data-drill="1">Noch eine Runde</button>
      <button class="knopf leise" data-go="heute">Zurück</button>`;
  }
  const it = d.items[d.idx];
  const kopf = `<div class="drillbar"><span>Kurz-Drill</span>
    <span>${d.idx+1} von ${d.items.length}</span></div>
    <div class="bar" style="margin:0 var(--inset) 10px"><i style="width:${d.idx/d.items.length*100}%"></i></div>`;
  if (it.typ === 'karte'){
    const c = (S.kurs.karten||[]).find(x => x.id === it.id);
    return kopf + karteHtml(c);
  }
  const f = (S.kurs.fragen||[]).find(x => x.id === it.id);
  return kopf + frageHtml(f);
};

function aktuelleWoche(){
  const ws = S.kurs.lernplan && S.kurs.lernplan.wochen || [];
  for (const w of ws) if (w.aufgaben.some((a,i) => !S.st.plan[w.nr+'.'+i])) return w;
  return ws[ws.length-1] || null;
}

/* ---------- Kurs: Plan ---------- */
V.plan = () => {
  const lp = S.kurs.lernplan || {}, ws = lp.wochen || [], s = stats(S.kurs, S.st);
  if (!ws.length) return `<h1 class="gross">Lernplan</h1><div class="leer">Noch kein Lernplan für diesen Kurs.</div>`;
  const akt = aktuelleWoche();
  let h = `<h1 class="gross">Lernplan</h1><div class="unter">${esc(lp.hinweis||'')}</div>
    <div class="gruppe"><div class="liste"><div class="zeile"><span class="haupt">
      <span class="t">${s.aufgOk} von ${s.aufg} Aufgaben</span>
      <span class="bar" style="margin-top:8px;display:block"><i class="${s.planPc===100?'gruen':''}" style="width:${s.planPc}%"></i></span>
    </span></div></div></div>`;
  ws.forEach(w => {
    const fertig = w.aufgaben.every((a,i) => S.st.plan[w.nr+'.'+i]);
    h += `<div class="gruppe"><div class="kopf">Woche ${w.nr} · ${esc(w.thema)}${fertig?' ✓':akt&&akt.nr===w.nr?' · jetzt':''}</div><div class="liste">`;
    w.aufgaben.forEach((a,i) => {
      const id = w.nr+'.'+i, on = !!S.st.plan[id];
      h += `<button class="zeile tap" data-plan="${id}">
        <span class="ikon" style="background:${on?'var(--green)':'var(--fill)'};color:${on?'#fff':'transparent'}">
          ${sv('0 0 24 24','<path d="M5 12.5 10 17.5 19 7" stroke-width="2.4"/>')}</span>
        <span class="haupt"><span class="t" style="font-size:16px;${on?'color:var(--label2);text-decoration:line-through':''}">${roh(a)}</span></span></button>`;
    });
    h += `</div>${w.ziel?`<div class="fuss">${esc(w.ziel)}</div>`:''}</div>`;
  });
  return h;
};

/* ---------- Kurs: Karten ---------- */
function markenLeiste(id){
  const mark = !!S.st.marken[id], notiz = S.st.notizen[id] || '';
  return `<div class="werkzeuge">
    <button data-mark="${id}" class="${mark?'an':''}">${mark?I.sternVoll:I.stern}<span>${mark?'Markiert':'Markieren'}</span></button>
    <button data-notiz="${id}" class="${notiz?'an':''}">${I.notiz}<span>${notiz?'Notiz ändern':'Notiz'}</span></button>
  </div>
  ${S.notizOffen === id
    ? `<textarea class="feld notizfeld" id="notizfeld" placeholder="Deine Notiz …">${esc(notiz)}</textarea>
       <div class="knopfreihe"><button class="knopf leise klein" data-notizab="1">Abbrechen</button>
       <button class="knopf klein" data-notizsave="${id}">Sichern</button></div>`
    : (notiz ? `<div class="notiz">${esc(notiz)}</div>` : '')}`;
}
function karteHtml(c){
  if (!c) return `<div class="leer">Keine Karte.</div>`;
  const st = S.st.karten[c.id];
  const dom = (S.kurs.domains||[]).find(d => d.id === c.domain);
  let h = `<div class="flash" data-auf="1">
      ${dom?`<div class="dom">${esc(dom.kurz||dom.titel)}</div>`:''}
      <div class="frage">${roh(c.front)}</div>
      ${S.auf ? `<div class="antwort">${md(c.back)}</div>` : `<div class="hinweis">Tippen zum Aufdecken</div>`}
    </div>`;
  h += S.auf
    ? `<div class="bewerten">
        <button data-q="1"><i>↺</i>Nochmal</button><button data-q="2"><i>◔</i>Schwer</button>
        <button data-q="3"><i>✓</i>Gut</button><button data-q="4"><i>✓✓</i>Leicht</button></div>
       ${markenLeiste(c.id)}`
    : `<button class="knopf" data-auf="1">Antwort zeigen</button>`;
  return h;
}
V.karten = () => {
  const q = queue(S.kurs, S.st);
  let liste;
  if (S.sub === 'alle') liste = S.kurs.karten||[];
  else if (S.sub === 'markiert') liste = (S.kurs.karten||[]).filter(c => S.st.marken[c.id]);
  else if (S.sub === 'treffer') liste = (S.kurs.karten||[]).filter(c => c.id === S.trefferKarte);
  else liste = q.alle;
  if (!liste.length){
    const next = (S.kurs.karten||[]).map(c => S.st.karten[c.id] && S.st.karten[c.id].due).filter(Boolean).sort((a,b)=>a-b)[0];
    return `<h1 class="gross">Lernkarten</h1>
      <div class="leer"><div class="gross">✓</div>Für heute alles wiederholt.
      ${next?`<br>Nächste Wiederholung am ${datum(next)}.`:''}</div>
      <button class="knopf leise" data-sub="alle">Trotzdem weiter üben</button>`;
  }
  const c = liste[S.kartenIdx % liste.length];
  const st = S.st.karten[c.id];
  return `<div class="statuszeile"><span>${S.sub==='markiert' ? 'Markierte Karten' : S.sub==='treffer' ? 'Aus der Suche'
      : S.sub==='alle' ? 'Alle Karten' : q.faellig.length+' fällig · '+q.neu.length+' neu'}</span>
    <span>${st ? 'Stufe '+st.rep : 'neu'}</span></div>` + karteHtml(c);
};

/* ---------- Kurs: Fragen ---------- */
V.fragen = () => {
  if (!S.sub){
    let h = `<h1 class="gross">Übungsfragen</h1>
      <div class="unter">Nach Prüfungsdomain, jede mit Begründung.</div>
      <div class="gruppe"><div class="liste">`;
    (S.kurs.domains||[]).forEach(d => {
      const fs = (S.kurs.fragen||[]).filter(f => f.domain === d.id);
      const ok = fs.filter(f => S.st.fragen[f.id] && S.st.fragen[f.id].ok).length;
      const ab = fs.filter(f => S.st.fragen[f.id]).length;
      h += zeile({ t: esc(d.titel), s:`${esc(d.gewicht||'')} · ${ab} von ${fs.length} bearbeitet`,
        badge:`<span class="badge ${ab===fs.length&&fs.length?'gruen':ab?'tint':'leise'}">${ok}/${fs.length}</span>`,
        attr:`data-sub="${d.id}"` });
    });
    return h + `</div></div>`;
  }
  const fs = (S.kurs.fragen||[]).filter(f => f.domain === S.sub);
  const d = (S.kurs.domains||[]).find(x => x.id === S.sub);
  return `<div style="margin:2px var(--inset) 0;display:flex;justify-content:space-between;
    font-size:13px;color:var(--label2)"><span>${esc(d?d.titel:'')}</span>
    <span>${(S.fragenIdx % fs.length)+1} von ${fs.length}</span></div>`
    + frageHtml(fs[S.fragenIdx % fs.length]);
};

function frageHtml(f){
  if (!f) return `<div class="leer">Keine Fragen vorhanden.</div>`;
  const sel = S.sel || [], multi = (f.richtig||[]).length > 1;
  let h = `<div class="frageblock">${roh(f.frage)}
    ${multi?`<div class="mehrfach">Mehrfachauswahl – ${f.richtig.length} Antworten</div>`:''}</div>
    <div class="optionen">`;
  (f.optionen||[]).forEach((o,i) => {
    let cl = 'opt';
    if (S.gezeigt){ if (f.richtig.includes(i)) cl += ' richtig'; else if (sel.includes(i)) cl += ' falsch'; }
    else if (sel.includes(i)) cl += ' gewaehlt';
    h += `<button class="${cl}" data-opt="${i}"><span class="b">${'ABCDEFGH'[i]}</span>
      <span>${roh(o)}</span></button>`;
  });
  h += `</div>`;
  if (S.gezeigt){
    const ok = gleich(sel, f.richtig);
    h += `<div class="erklaerung"><div class="kopfz ${ok?'ok':'nok'}">${ok?'Richtig':'Falsch'} – ${f.richtig.map(i=>'ABCDEFGH'[i]).join(' + ')}</div>
      ${md(f.erklaerung)}</div>${markenLeiste(f.id)}<button class="knopf" data-next="1">Nächste Frage</button>`;
  } else {
    h += `<button class="knopf" data-pruefen="1" ${sel.length?'':'style="opacity:.4"'}>Antwort prüfen</button>`;
  }
  return h;
}
const gleich = (a,b) => a.length === b.length && a.every(x => b.includes(x));

/* ---------- Kurs: Wissen ---------- */
V.wissen = () => {
  if (!S.sub){
    let h = `<h1 class="gross">Wissen</h1><div class="unter">Zusammenfassungen, Glossar und Last-Minute-Blatt.</div>
      <div class="gruppe"><div class="kopf">Prüfungsdomains</div><div class="liste">`;
    (S.kurs.domains||[]).forEach(d => h += zeile({ t: esc(d.titel), s: esc(d.kurz||''),
      wert: esc(d.gewicht||''), attr:`data-sub="${d.id}"` }));
    h += `</div></div><div class="gruppe"><div class="liste">`;
    if (S.kurs.lastminute) h += zeile({ ikon:I.warn, farbe:'var(--orange)', t:'Last-Minute-Blatt', s:'die letzten 48 Stunden', attr:'data-sub="__lm"' });
    if (S.kurs.glossar) h += zeile({ ikon:I.buch, farbe:'var(--grau)', t:'Glossar', s:`${S.kurs.glossar.length} Begriffe`, attr:'data-sub="__gl"' });
    h += `</div></div>`;
    if ((S.kurs.ressourcen||[]).length){
      h += `<div class="gruppe"><div class="kopf">Offizielle Ressourcen</div><div class="liste">`;
      S.kurs.ressourcen.forEach(r => h += `<a class="zeile tap" href="${esc(r.url)}" target="_blank" rel="noopener">
        <span class="haupt"><span class="t" style="color:var(--tint)">${esc(r.titel)}</span>
        <span class="s">${esc(r.was||'')}</span></span><span class="chev">${I.chevR}</span></a>`);
      h += `</div></div>`;
    }
    return h;
  }
  if (S.sub === '__lm') return `<h1 class="gross">Last-Minute</h1><div class="text">${md(S.kurs.lastminute)}</div>`;
  if (S.sub === '__gl'){
    let h = `<h1 class="gross">Glossar</h1><div class="gruppe"><div class="liste">`;
    (S.kurs.glossar||[]).forEach(g => h += `<div class="zeile"><span class="haupt">
      <span class="t">${esc(g.b)}</span><span class="s">${esc(g.d)}</span></span></div>`);
    return h + `</div></div>`;
  }
  const d = (S.kurs.domains||[]).find(x => x.id === S.sub);
  if (!d) return `<div class="leer">Nicht gefunden.</div>`;
  let h = `<h1 class="gross">${esc(d.titel)}</h1><div class="unter">${esc(d.gewicht||'')} der Prüfung</div>
    <div class="text">${md(d.zusammenfassung)}</div>`;
  if ((d.themen||[]).length){
    h += `<div class="gruppe"><div class="kopf">Geprüfte Fähigkeiten</div>
      <div class="text" style="margin-top:0"><ul>${d.themen.map(t=>'<li>'+esc(t)+'</li>').join('')}</ul></div></div>`;
  }
  h += `<button class="knopf" data-fragen="${d.id}">Fragen zu dieser Domain</button>`;
  return h;
};

/* ---------- Suche ---------- */
function treffer(begriff){
  const b = begriff.trim().toLowerCase();
  if (b.length < 2) return null;
  const hit = t => String(t||'').toLowerCase().includes(b);
  const k = S.kurs;
  return {
    karten: (k.karten||[]).filter(c => hit(c.front) || hit(c.back)).slice(0,40),
    fragen: (k.fragen||[]).filter(f => hit(f.frage) || hit(f.erklaerung) || (f.optionen||[]).some(hit)).slice(0,40),
    wissen: (k.domains||[]).filter(d => hit(d.zusammenfassung) || hit(d.titel) || (d.themen||[]).some(hit)),
    glossar: (k.glossar||[]).filter(g => hit(g.b) || hit(g.d))
  };
}
function trefferHtml(){
  const r = treffer(S.suche);
  if (!r) return `<div class="leer">Mindestens zwei Zeichen eingeben.</div>`;
  const n = r.karten.length + r.fragen.length + r.wissen.length + r.glossar.length;
  if (!n) return `<div class="leer">Nichts gefunden zu „${esc(S.suche)}“.</div>`;
  let h = '';
  if (r.wissen.length){
    h += `<div class="gruppe"><div class="kopf">Zusammenfassungen</div><div class="liste">`;
    r.wissen.forEach(d => h += zeile({ t: esc(d.titel), s: esc(d.kurz||''), attr:`data-treffer="wissen:${d.id}"` }));
    h += `</div></div>`;
  }
  if (r.glossar.length){
    h += `<div class="gruppe"><div class="kopf">Glossar</div><div class="liste">`;
    r.glossar.forEach(g => h += `<div class="zeile"><span class="haupt"><span class="t">${esc(g.b)}</span>
      <span class="s">${esc(g.d)}</span></span></div>`);
    h += `</div></div>`;
  }
  if (r.karten.length){
    h += `<div class="gruppe"><div class="kopf">Lernkarten (${r.karten.length})</div><div class="liste">`;
    r.karten.forEach(c => h += zeile({ t: esc(c.front.replace(/[*`]/g,'').slice(0,90)),
      s: esc(c.back.replace(/[*`\n]/g,' ').slice(0,80)) + '…', attr:`data-treffer="karte:${c.id}"` }));
    h += `</div></div>`;
  }
  if (r.fragen.length){
    h += `<div class="gruppe"><div class="kopf">Übungsfragen (${r.fragen.length})</div><div class="liste">`;
    r.fragen.forEach(f => { const d = (S.kurs.domains||[]).find(x => x.id === f.domain);
      h += zeile({ t: esc(f.frage.replace(/[*`]/g,'').slice(0,90)), s: esc(d?d.titel:''),
                   attr:`data-treffer="frage:${f.id}"` }); });
    h += `</div></div>`;
  }
  return h;
}
V.suche = () => `<h1 class="gross">Suchen</h1>
  <div class="suchfeld"><span>${I.lupe}</span>
    <input id="suchen" type="search" placeholder="Begriff, Frage oder Einstellung" value="${esc(S.suche)}"
      autocomplete="off" autocapitalize="off" spellcheck="false"></div>
  <div id="treffer">${trefferHtml()}</div>`;

/* ---------- Markiert ---------- */
V.markiert = () => {
  const ids = Object.keys(S.st.marken).filter(id => S.st.marken[id]);
  const karten = (S.kurs.karten||[]).filter(c => ids.includes(c.id));
  const fragen = (S.kurs.fragen||[]).filter(f => ids.includes(f.id));
  if (!karten.length && !fragen.length) return `<h1 class="gross">Markiert</h1>
    <div class="leer">Noch nichts markiert. Tippe beim Lernen auf den Stern, um etwas vorzumerken.</div>`;
  let h = `<h1 class="gross">Markiert</h1><div class="unter">Was du dir vorgemerkt hast.</div>`;
  if (karten.length){
    h += `<div class="gruppe"><div class="kopf">Karten (${karten.length})</div><div class="liste">`;
    karten.forEach(c => h += zeile({ t: esc(c.front.replace(/[*`]/g,'').slice(0,90)),
      s: S.st.notizen[c.id] ? '✎ ' + esc(S.st.notizen[c.id].slice(0,70)) : '',
      attr:`data-treffer="karte:${c.id}"` }));
    h += `</div></div><button class="knopf" data-sub2="markiert">Markierte Karten durchgehen</button>`;
  }
  if (fragen.length){
    h += `<div class="gruppe"><div class="kopf">Fragen (${fragen.length})</div><div class="liste">`;
    fragen.forEach(f => h += zeile({ t: esc(f.frage.replace(/[*`]/g,'').slice(0,90)),
      s: S.st.notizen[f.id] ? '✎ ' + esc(S.st.notizen[f.id].slice(0,70)) : '',
      attr:`data-treffer="frage:${f.id}"` }));
    h += `</div></div>`;
  }
  return h;
};

/* ---------- Prüfung: Fragenübersicht ---------- */
V.pruefungUebersicht = () => {
  const p = S.pruefung;
  let h = `<h1 class="gross">Fragen</h1>
    <div class="unter">Angetippt springst du direkt hin. Offen, beantwortet oder markiert.</div>
    <div class="raster">`;
  p.ids.forEach((id,i) => {
    const bea = (p.ant[i]||[]).length, mark = p.flaggen && p.flaggen[i];
    h += `<button class="feldnr ${bea?'bea':''} ${mark?'mark':''}" data-pspring="${i}">${i+1}</button>`;
  });
  h += `</div>
    <div class="gruppe"><div class="liste">
      <div class="zeile"><span class="haupt"><span class="t">${p.ant.filter(a=>a&&a.length).length} von ${p.ids.length} beantwortet</span>
      <span class="s">${(p.flaggen||[]).filter(Boolean).length} markiert</span></span></div>
    </div></div>
    <button class="knopf" data-pzurueck="1">Weiter bei Frage ${p.idx+1}</button>
    <button class="knopf warnung" data-pabgeben="1">Jetzt abgeben</button>`;
  return h;
};

/* ---------- Fehlerprotokoll ---------- */
V.fehler = () => {
  const ids = Object.keys(S.st.fehler);
  if (!ids.length) return `<h1 class="gross">Fehlerprotokoll</h1><div class="leer"><div class="gross">✓</div>Kein offener Fehler.</div>`;
  const f = (S.kurs.fragen||[]).find(x => x.id === ids[(S.fehlerIdx||0) % ids.length]);
  return `<h1 class="gross">Fehlerprotokoll</h1>
    <div class="unter">${ids.length} ${ids.length===1?'Frage':'Fragen'} offen. Richtig beantwortet verschwindet sie hier.</div>`
    + frageHtml(f);
};

/* ---------- Prüfung ---------- */
V.pruefung = () => {
  const p = S.pruefung;
  const fs = p.ids.map(id => (S.kurs.fragen||[]).find(f => f.id === id)).filter(Boolean);
  if (p.fertig){
    const perDom = {};
    fs.forEach((f,i) => { const d = f.domain; perDom[d] = perDom[d] || {n:0,ok:0};
      perDom[d].n++; if (gleich(p.ant[i]||[], f.richtig)) perDom[d].ok++; });
    const ok = fs.filter((f,i) => gleich(p.ant[i]||[], f.richtig)).length;
    const pc = Math.round(ok/fs.length*100);
    let h = `<h1 class="gross">Ergebnis</h1>
      <div class="gruppe"><div class="liste"><div class="zeile">
        ${ring(pc, 56, pc>=70?'var(--green)':'var(--red)')}
        <span class="haupt"><span class="t" style="font-weight:600">${pc>=70?'Bestanden':'Nicht bestanden'}</span>
        <span class="s">${ok} von ${fs.length} richtig · Richtwert 70 %</span></span></div></div></div>`;
    h += `<div class="gruppe"><div class="kopf">Nach Domain</div><div class="liste">`;
    Object.entries(perDom).forEach(([id,v]) => {
      const d = (S.kurs.domains||[]).find(x => x.id === id), q = Math.round(v.ok/v.n*100);
      h += `<div class="zeile"><span class="haupt"><span class="t" style="font-size:16px">${esc(d?d.titel:id)}</span>
        <span class="bar" style="margin-top:8px;display:block"><i class="${q>=70?'gruen':''}"
          style="width:${q}%;${q<70?'background:var(--red)':''}"></i></span>
        <span class="s">${v.ok}/${v.n}${q<70?' – hier nachlegen':''}</span></span>
        <span class="badge ${q>=70?'gruen':'rot'}">${q}%</span></div>`;
    });
    h += `</div></div><div class="gruppe"><div class="kopf">Durchgang</div>`;
    fs.forEach((f,i) => {
      const r = gleich(p.ant[i]||[], f.richtig);
      h += `<div class="erklaerung"><div class="kopfz ${r?'ok':'nok'}">${i+1}. ${r?'Richtig':'Falsch'}</div>
        <p style="font-weight:600;color:var(--label)">${roh(f.frage)}</p>
        <p>Richtig: ${f.richtig.map(x=>'ABCDEFGH'[x]).join(' + ')} – ${esc(f.optionen[f.richtig[0]])}</p>
        ${md(f.erklaerung)}</div>`;
    });
    h += `</div><button class="knopf" data-go="heute">Fertig</button>`;
    return h;
  }
  const i = p.idx, rest = Math.max(0, p.ende - Date.now());
  const mm = String(Math.floor(rest/6e4)).padStart(2,'0'), ss = String(Math.floor(rest%6e4/1000)).padStart(2,'0');
  S.sel = p.ant[i] || []; S.gezeigt = false;
  const markiert = p.flaggen && p.flaggen[i];
  let h = `<div class="timer ${rest<3e5?'knapp':''}"><span>Frage ${i+1} von ${p.ids.length}</span><b>${mm}:${ss}</b></div>`
    + frageHtml((S.kurs.fragen||[]).find(f => f.id === p.ids[i])).replace(/<button class="knopf" data-pruefen[\s\S]*?<\/button>/,'');
  h += `<div class="werkzeuge"><button data-pflagge="${i}" class="${markiert?'an':''}">${I.flagge}
      <span>${markiert?'Markiert':'Später ansehen'}</span></button>
    <button data-puebersicht="1">${I.plan}<span>Übersicht</span></button></div>
    <div class="knopfreihe"><button class="knopf leise" data-pnav="-1" ${i?'':'style="opacity:.4"'}>Zurück</button>
    <button class="knopf" data-pnav="1">${i===p.ids.length-1?'Abgeben':'Weiter'}</button></div>
    <button class="knopf warnung klein" data-pabbruch="1">Prüfung abbrechen</button>`;
  return h;
};

/* ================= Rahmen ================= */
const TITEL = { heute:'Übersicht', plan:'Lernplan', karten:'Lernkarten', fragen:'Übungsfragen',
                wissen:'Wissen', fehler:'Fehlerprotokoll', pruefung:'Prüfung',
                pruefungUebersicht:'Fragen', drill:'Kurz-Drill', markiert:'Markiert', suche:'Suchen',
                sicherung:'Datensicherung', info:'Über', uebersicht:'Lernen' };
const TABVIEWS = ['heute','plan','karten','fragen','wissen'];

function navHtml(){
  const v = S.view;
  let zurueck = null, titel = TITEL[v] || '', rechts = '';
  if (S.root === 'uebersicht'){
    titel = 'Lernen';
  } else if (S.root === 'seite'){
    zurueck = ['uebersicht','Lernen'];
  } else if (TABVIEWS.includes(v) && !S.sub){
    titel = v === 'heute' ? kurzTitel() : TITEL[v];
    zurueck = ['uebersicht','Lernen'];
    rechts = `<button class="rechts" data-go="suche" aria-label="Suchen">${I.lupe}</button>`;
  } else if (S.sub){
    zurueck = ['sub', TITEL[v]];
  } else {
    zurueck = ['heute', kurzTitel()];
  }
  const links = zurueck
    ? `<button class="zurueck" data-zurueck="${zurueck[0]}">${I.chevL}<span>${esc(zurueck[1])}</span></button>`
    : `<span style="width:8px"></span>`;
  return `<div class="inner">${links}<span class="titel">${esc(titel)}</span>${rechts}</div>`;
}
const kurzTitel = () => S.kurs ? (S.kurs.pruefung && S.kurs.pruefung.code || S.kurs.titel.split(' ')[0]) : 'Kurs';

function tabsHtml(){
  return TABS.map(([id,label,ikon]) =>
    `<button data-tab="${id}" class="${S.view===id&&!S.sub?'an':''}">${ikon}<span>${label}</span></button>`).join('');
}

let timerId = null;
function render(keepScroll){
  clearInterval(timerId); timerId = null;
  const y = window.scrollY;
  el.innerHTML = (V[S.view] || V.uebersicht)();
  nav.hidden = false; nav.innerHTML = navHtml();
  const imKurs = S.root === 'kurs';
  tabs.hidden = !imKurs;
  el.classList.toggle('ohne-tabs', !imKurs);
  if (imKurs) tabs.innerHTML = tabsHtml();
  const su = document.getElementById('suchen');
  if (su){ su.focus(); su.setSelectionRange(su.value.length, su.value.length); }
  window.scrollTo(0, keepScroll ? y : 0);
  setFest();
  if (S.view === 'pruefung' && S.pruefung && !S.pruefung.fertig){
    timerId = setInterval(() => {
      if (!S.pruefung) return clearInterval(timerId);
      if (Date.now() >= S.pruefung.ende) return abgeben();
      const t = nav.ownerDocument.querySelector('.timer b'); if (!t) return;
      const r = S.pruefung.ende - Date.now();
      t.textContent = String(Math.floor(r/6e4)).padStart(2,'0')+':'+String(Math.floor(r%6e4/1000)).padStart(2,'0');
      if (r < 3e5) document.querySelector('.timer').classList.add('knapp');
    }, 1000);
  }
}
const setFest = () => nav.classList.toggle('fest', window.scrollY > 26);
window.addEventListener('scroll', setFest, { passive:true });

function go(root, view, sub){
  S.root = root; S.view = view; S.sub = sub === undefined ? null : sub;
  S.sel = []; S.gezeigt = false; S.auf = false;
  render();
}
function oeffneKurs(id){
  S.kurs = S.kurse.find(k => k.id === id) || S.kurse[0];
  S.st = load(S.kurs.id);
  S.kartenIdx = 0; S.fragenIdx = 0; S.fehlerIdx = 0; S.auf = false;
  try { localStorage.setItem('lc.aktiv', S.kurs.id); } catch(e){}
  go('kurs','heute');
}

/* ================= Eingaben ================= */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-go],[data-tab],[data-sub],[data-kurs],[data-zurueck],[data-plan],[data-auf],[data-q],[data-opt],[data-pruefen],[data-next],[data-pruefung],[data-pnav],[data-pabbruch],[data-fragen],[data-kopieren],[data-einspielen],[data-drill],[data-mark],[data-notiz],[data-notizsave],[data-notizab],[data-treffer],[data-sub2],[data-pflagge],[data-puebersicht],[data-pspring],[data-pzurueck],[data-pabgeben]');
  if (!t) return;
  const d = t.dataset;

  if (d.kurs) return oeffneKurs(d.kurs);
  if (d.go === 'uebersicht') return go('uebersicht','uebersicht');
  if (d.go === 'sicherung' || d.go === 'info') return go('seite', d.go);
  if (d.go === 'heute') { S.pruefung = null; return go('kurs','heute'); }
  if (d.go === 'fehler') { S.fehlerIdx = 0; return go('kurs','fehler'); }
  if (d.go === 'markiert') return go('kurs','markiert');
  if (d.go === 'suche') { S.suche = ''; return go('kurs','suche'); }
  if (d.tab) { S.kartenIdx = 0; S.fragenIdx = 0; return go('kurs', d.tab); }
  if (d.fragen) { S.fragenIdx = 0; return go('kurs','fragen', d.fragen); }
  if (d.zurueck === 'uebersicht') return go('uebersicht','uebersicht');
  if (d.zurueck === 'sub') return go('kurs', S.view, null);
  if (d.zurueck) { if (S.view !== 'pruefung') S.pruefung = S.pruefung; return go('kurs','heute'); }
  if (d.sub !== undefined) { S.fragenIdx = 0; S.sel = []; S.gezeigt = false; S.sub = d.sub || null;
    if (d.sub === 'alle') S.kartenIdx = 0; return render(); }

  if (d.drill) { S.drill = drillBauen(); S.auf = false; S.sel = []; S.gezeigt = false; return go('kurs','drill'); }
  if (d.sub2) { S.kartenIdx = 0; return go('kurs','karten', d.sub2); }

  if (d.mark) {
    if (S.st.marken[d.mark]) delete S.st.marken[d.mark]; else S.st.marken[d.mark] = true;
    save(); return render(true);
  }
  if (d.notiz) { S.notizOffen = S.notizOffen === d.notiz ? null : d.notiz; return render(true); }
  if (d.notizab) { S.notizOffen = null; return render(true); }
  if (d.notizsave) {
    const v = (document.getElementById('notizfeld')||{}).value || '';
    if (v.trim()) S.st.notizen[d.notizsave] = v.trim(); else delete S.st.notizen[d.notizsave];
    S.notizOffen = null; save(); toast('Notiz gesichert'); return render(true);
  }
  if (d.treffer) {
    const [art, id] = d.treffer.split(':');
    if (art === 'wissen') return go('kurs','wissen', id);
    if (art === 'karte') { S.trefferKarte = id; S.kartenIdx = 0; S.auf = false; return go('kurs','karten','treffer'); }
    if (art === 'frage') {
      const f = (S.kurs.fragen||[]).find(x => x.id === id); if (!f) return;
      const fs = (S.kurs.fragen||[]).filter(x => x.domain === f.domain);
      S.fragenIdx = fs.findIndex(x => x.id === id);
      return go('kurs','fragen', f.domain);
    }
    return;
  }

  if (d.pflagge !== undefined) {
    const i = +d.pflagge; S.pruefung.flaggen[i] = !S.pruefung.flaggen[i]; return render(true);
  }
  if (d.puebersicht) { S.view = 'pruefungUebersicht'; return render(); }
  if (d.pspring) { S.pruefung.idx = +d.pspring; S.sel = S.pruefung.ant[+d.pspring]||[]; S.gezeigt = false;
    S.view = 'pruefung'; return render(); }
  if (d.pzurueck) { S.view = 'pruefung'; return render(); }
  if (d.pabgeben) { S.view = 'pruefung'; return abgeben(); }

  if (d.plan) { S.st.plan[d.plan] = !S.st.plan[d.plan]; save(); return render(true); }

  if (d.auf) { S.auf = true; return render(); }
  if (d.q){
    const c = aktuelleKarte(); if (!c) return;
    const neu = !S.st.karten[c.id];
    S.st.karten[c.id] = plane(S.st.karten[c.id], +d.q);
    if (neu) zaehle('n');
    zaehle('k');
    if (S.view === 'drill'){ S.drill.idx++; S.auf = false; save(); return render(); }
    if (+d.q === 1 || S.sub === 'alle' || S.sub === 'markiert' || S.sub === 'treffer') S.kartenIdx++;
    S.auf = false; save(); return render();
  }

  if (d.opt !== undefined){
    const f = aktuelleFrage(); if (!f || S.gezeigt) return;
    const i = +d.opt;
    S.sel = (f.richtig.length > 1)
      ? (S.sel.includes(i) ? S.sel.filter(x => x !== i) : S.sel.concat(i))
      : [i];
    if (S.view === 'pruefung') S.pruefung.ant[S.pruefung.idx] = S.sel;
    return render(true);
  }
  if (d.pruefen){
    const f = aktuelleFrage(); if (!f || !(S.sel||[]).length) return;
    const ok = gleich(S.sel, f.richtig);
    if (!S.st.fragen[f.id]) zaehle('f');
    S.st.fragen[f.id] = { ok, t:Date.now() };
    if (ok) delete S.st.fehler[f.id]; else S.st.fehler[f.id] = (S.st.fehler[f.id]||0) + 1;
    if (S.view === 'drill' && ok) S.drill.richtig++;
    S.gezeigt = true; save(); return render(true);
  }
  if (d.next){
    S.sel = []; S.gezeigt = false; S.notizOffen = null;
    if (S.view === 'drill') S.drill.idx++;
    else if (S.view === 'fehler') S.fehlerIdx = (S.fehlerIdx||0) + 1;
    else S.fragenIdx = (S.fragenIdx||0) + 1;
    return render();
  }

  if (d.pruefung){
    const pr = (S.kurs.pruefungen||[]).find(x => x.id === d.pruefung); if (!pr) return;
    S.pruefung = { id:pr.id, ids:pr.fragen.slice(), idx:0, ant:[], flaggen:[], ende:Date.now()+pr.dauer_min*6e4, fertig:false };
    return go('kurs','pruefung');
  }
  if (d.pnav){
    const p = S.pruefung, n = p.idx + (+d.pnav);
    if (n < 0) return;
    if (n >= p.ids.length) return abgeben();
    p.idx = n; S.sel = p.ant[n] || []; S.gezeigt = false; return render();
  }
  if (d.pabbruch){ S.pruefung = null; return go('kurs','heute'); }

  if (d.kopieren){
    const ta = document.getElementById('aus');
    navigator.clipboard.writeText(ta.value)
      .then(() => toast('Sicherung kopiert'))
      .catch(() => { ta.select(); toast('Markiert – jetzt kopieren'); });
    return;
  }
  if (d.einspielen){
    const ta = document.getElementById('ein');
    let p;
    try { p = JSON.parse(ta.value.trim()); } catch(err){ return toast('Das ist kein gültiger Sicherungstext'); }
    if (!p || !p.daten || typeof p.daten !== 'object') return toast('Das ist kein gültiger Sicherungstext');
    if (!S.bestaetigt){ S.bestaetigt = true; t.textContent = 'Wirklich ersetzen? Nochmal tippen'; return; }
    let n = 0;
    Object.entries(p.daten).forEach(([id,wert]) => { localStorage.setItem(KEY(id), JSON.stringify(wert)); n++; });
    S.bestaetigt = false;
    if (S.kurs) S.st = load(S.kurs.id);
    toast(`${n} ${n===1?'Kurs':'Kurse'} übernommen`);
    return go('uebersicht','uebersicht');
  }
});

function aktuelleKarte(){
  if (S.view === 'drill'){
    const it = S.drill.items[S.drill.idx];
    return it && it.typ === 'karte' ? (S.kurs.karten||[]).find(c => c.id === it.id) : null;
  }
  let liste;
  if (S.sub === 'alle') liste = S.kurs.karten||[];
  else if (S.sub === 'markiert') liste = (S.kurs.karten||[]).filter(c => S.st.marken[c.id]);
  else if (S.sub === 'treffer') liste = (S.kurs.karten||[]).filter(c => c.id === S.trefferKarte);
  else liste = queue(S.kurs, S.st).alle;
  return liste.length ? liste[S.kartenIdx % liste.length] : null;
}
function aktuelleFrage(){
  if (S.view === 'drill'){
    const it = S.drill.items[S.drill.idx];
    return it && it.typ === 'frage' ? (S.kurs.fragen||[]).find(f => f.id === it.id) : null;
  }
  if (S.view === 'pruefung') return (S.kurs.fragen||[]).find(f => f.id === S.pruefung.ids[S.pruefung.idx]);
  if (S.view === 'fehler'){ const ids = Object.keys(S.st.fehler);
    return (S.kurs.fragen||[]).find(x => x.id === ids[(S.fehlerIdx||0) % ids.length]); }
  const fs = (S.kurs.fragen||[]).filter(f => f.domain === S.sub);
  return fs[(S.fragenIdx||0) % fs.length];
}
function abgeben(){
  const p = S.pruefung; p.fertig = true;
  const fs = p.ids.map(id => (S.kurs.fragen||[]).find(f => f.id === id)).filter(Boolean);
  let ok = 0;
  fs.forEach((f,i) => {
    const r = gleich(p.ant[i]||[], f.richtig); if (r) ok++;
    S.st.fragen[f.id] = { ok:r, t:Date.now() };
    if (r) delete S.st.fehler[f.id]; else S.st.fehler[f.id] = (S.st.fehler[f.id]||0) + 1;
  });
  p.pc = Math.round(ok/fs.length*100);
  S.st.pruefungen.push({ id:p.id, pc:p.pc, t:Date.now() });
  save(); render();
}

/* ---------- Suche: tippen ohne Neuaufbau der Seite ---------- */
let suchTimer = null;
document.addEventListener('input', e => {
  if (e.target.id !== 'suchen') return;
  S.suche = e.target.value;
  clearTimeout(suchTimer);
  suchTimer = setTimeout(() => {
    const ziel = document.getElementById('treffer');
    if (ziel) ziel.innerHTML = trefferHtml();
  }, 140);
});

/* ---------- Wischen auf der Lernkarte ---------- */
let tx = 0, ty = 0;
document.addEventListener('touchstart', e => {
  const f = e.target.closest('.flash'); if (!f) return;
  tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY;
}, { passive:true });
document.addEventListener('touchend', e => {
  const f = e.target.closest('.flash'); if (!f || !S.auf) return;
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) < 65 || Math.abs(dy) > 55) return;
  const b = document.querySelector(dx < 0 ? '[data-q="1"]' : '[data-q="3"]');
  if (b) b.click();
}, { passive:true });

/* ---------- Tastatur am Mac ---------- */
document.addEventListener('keydown', e => {
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
  const istKarte = !!document.querySelector('.flash');
  if (istKarte){
    if (e.key === ' ' || e.key === 'Enter'){
      e.preventDefault();
      const b = document.querySelector(S.auf ? '[data-q="3"]' : '[data-auf]');
      if (b) b.click();
      return;
    }
    if (S.auf && ['1','2','3','4'].includes(e.key)){
      e.preventDefault();
      const b = document.querySelector(`[data-q="${e.key}"]`); if (b) b.click();
      return;
    }
  }
  if (document.querySelector('.optionen')){
    const i = 'abcdefgh'.indexOf(e.key.toLowerCase());
    const n = parseInt(e.key, 10);
    if (!S.gezeigt && (i >= 0 || (n >= 1 && n <= 8))){
      const idx = i >= 0 ? i : n - 1;
      const b = document.querySelector(`[data-opt="${idx}"]`);
      if (b){ e.preventDefault(); b.click(); }
      return;
    }
    if (e.key === 'Enter'){
      const b = document.querySelector('[data-pruefen]') || document.querySelector('[data-next]')
             || document.querySelector('[data-pnav="1"]');
      if (b){ e.preventDefault(); b.click(); }
      return;
    }
  }
  if (e.key === 'Escape'){
    const b = document.querySelector('[data-zurueck]'); if (b) b.click();
  }
});

/* ================= Start ================= */
async function start(){
  try {
    if (window.KURSE){ S.kurse = window.KURSE.kurse; S.fahrplan = window.KURSE.fahrplan || []; }
    else {
      const idx = await (await fetch('kurse/index.json?v='+Date.now())).json();
      S.fahrplan = idx.fahrplan || [];
      S.kurse = await Promise.all(idx.kurse.map(f => fetch('kurse/'+f+'?v='+Date.now()).then(r => r.json())));
    }
  } catch(e){
    el.innerHTML = `<h1 class="gross">Keine Inhalte</h1><div class="leer">Die Kursdateien konnten nicht geladen werden.<br><br>${esc(e.message)}</div>`;
    nav.hidden = false; nav.innerHTML = '<div class="inner"></div>'; return;
  }
  if (!S.kurse.length){ el.innerHTML = `<div class="leer">Noch keine Kurse geladen.</div>`; return; }
  go('uebersicht','uebersicht');
}
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(()=>{});
start();
