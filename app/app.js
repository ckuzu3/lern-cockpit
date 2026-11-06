/* Lern-Cockpit – Lern-App für Zertifikate und Studienmodule.
   Aufbau nach Apples Human Interface Guidelines: Übersicht als Startbildschirm,
   Navigationsleiste mit Zurück, gruppierte Listen, Tableiste innerhalb eines Kurses. */
'use strict';

const S = { kurse: [], fahrplan: [], kurs: null, st: null,
            root: 'uebersicht', view: 'heute', sub: null, pruefung: null };
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
  warn:  sv('0 0 24 24', '<path d="M12 3.6 2.6 20h18.8z"/><path d="M12 9.6v4.8"/><circle cx="12" cy="17.2" r="1.05" fill="currentColor" stroke="none"/>')
};
const TABS = [['heute','Heute',I.heute],['plan','Plan',I.plan],['karten','Karten',I.karten],
              ['fragen','Fragen',I.fragen],['wissen','Wissen',I.wissen]];

/* ---------- Speicher ---------- */
const KEY = id => 'lc.' + id;
const LEER = () => ({ karten:{}, plan:{}, fragen:{}, fehler:{}, pruefungen:[], neuProTag:20, log:{} });
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
function queue(kurs, st){
  const k = kurs.karten || [], now = Date.now();
  const faellig = k.filter(x => st.karten[x.id] && st.karten[x.id].due <= now);
  const neuH = st.log['neu'+heute()] || 0;
  const neu = k.filter(x => !st.karten[x.id]).slice(0, Math.max(0, st.neuProTag - neuH));
  return { faellig, neu, alle: faellig.concat(neu) };
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
  const k = S.kurs, s = stats(k, S.st), q = queue(k, S.st), p = k.pruefung || {}, w = aktuelleWoche();
  let h = `<h1 class="gross">${esc(k.titel)}</h1>
    <div class="unter">${esc(p.name || k.anbieter || '')}</div>`;

  if (k.termin){
    const d = tage(k.termin);
    h += `<div class="gruppe"><div class="liste">` + zeile({
      t:'Prüfungstermin', s: datum(k.termin), chev:false, tap:false,
      badge:`<span class="badge ${d<14?'rot':d<30?'orange':'tint'}">${d>0?'in '+d+' Tagen':d===0?'heute':'vorbei'}</span>`
    }) + `</div></div>`;
  }

  h += `<div class="gruppe"><div class="kopf">Heute</div><div class="liste">`;
  h += zeile({ ikon:I.karten, farbe:'var(--tint)', t:'Lernkarten', s:`${q.faellig.length} fällig · ${q.neu.length} neu`,
    badge:`<span class="badge ${q.alle.length?'tint':'gruen'}">${q.alle.length||'✓'}</span>`, attr:'data-tab="karten"' });
  if (w){
    const offen = w.aufgaben.filter((a,i) => !S.st.plan[w.nr+'.'+i]).length;
    h += zeile({ ikon:I.plan, farbe:'var(--orange)', t:`Woche ${w.nr}`, s: esc(w.thema),
      badge:`<span class="badge ${offen?'orange':'gruen'}">${offen||'✓'}</span>`, attr:'data-tab="plan"' });
  }
  if (s.fehler) h += zeile({ ikon:I.warn, farbe:'var(--red)', t:'Fehlerprotokoll', s:'falsch beantwortete Fragen',
    badge:`<span class="badge rot">${s.fehler}</span>`, attr:'data-go="fehler"' });
  h += `</div></div>`;

  h += `<div class="gruppe"><div class="kopf">Stand</div><div class="kacheln">
    <div class="kachel"><b>${s.gelernt}<span>/${s.kt}</span></b><span>Karten sitzen</span></div>
    <div class="kachel"><b>${s.quote}%</b><span>Trefferquote</span></div>
    <div class="kachel"><b>${s.beant}<span>/${s.fr}</span></b><span>Fragen bearbeitet</span></div>
    <div class="kachel"><b>${s.planPc}%</b><span>Lernplan</span></div></div></div>`;

  h += `<div class="gruppe"><div class="kopf">Prüfungssimulation</div><div class="liste">`;
  (k.pruefungen||[]).forEach(pr => {
    const letzt = S.st.pruefungen.filter(x => x.id === pr.id).pop();
    h += zeile({ t: esc(pr.titel), s:`${pr.fragen.length} Fragen · ${pr.dauer_min} Minuten`,
      badge: letzt ? `<span class="badge ${letzt.pc>=70?'gruen':'rot'}">${letzt.pc}%</span>` : '',
      attr:`data-pruefung="${pr.id}"` });
  });
  h += `</div></div>`;

  h += `<div class="gruppe"><div class="kopf">Prüfung</div><div class="liste">`;
  [['Code',p.code],['Dauer',p.dauer],['Fragen',p.fragen],['Bestehen',p.bestehen],
   ['Kosten',p.kosten],['Gültigkeit',p.gueltigkeit],['Sprache',p.sprache]]
   .filter(r => r[1]).forEach(r => h += `<div class="zeile"><span class="haupt"><span class="t">${r[0]}</span>
     <span class="s">${esc(r[1])}</span></span></div>`);
  h += `</div>`;
  if (p.quelle) h += `<div class="fuss">Nach dem offiziellen Prüfungsleitfaden, Stand ${esc(k.stand||'')}.
    ${esc(k.hinweis||'')}</div>`;
  h += `</div>`;
  h += `<button class="knopf leise" data-go="uebersicht">Anderen Kurs öffnen</button>`;
  return h;
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
V.karten = () => {
  const q = queue(S.kurs, S.st);
  const liste = S.sub === 'alle' ? (S.kurs.karten||[]) : q.alle;
  if (!liste.length){
    const next = (S.kurs.karten||[]).map(c => S.st.karten[c.id] && S.st.karten[c.id].due).filter(Boolean).sort((a,b)=>a-b)[0];
    return `<h1 class="gross">Lernkarten</h1>
      <div class="leer"><div class="gross">✓</div>Für heute alles wiederholt.
      ${next?`<br>Nächste Wiederholung am ${datum(next)}.`:''}</div>
      <button class="knopf leise" data-sub="alle">Trotzdem weiter üben</button>`;
  }
  const c = liste[S.kartenIdx % liste.length];
  const st = S.st.karten[c.id];
  const dom = (S.kurs.domains||[]).find(d => d.id === c.domain);
  let h = `<div style="display:flex;justify-content:space-between;align-items:center;margin:2px var(--inset) 0;
    font-size:13px;color:var(--label2)"><span>${q.faellig.length} fällig · ${q.neu.length} neu</span>
    <span>${st ? 'Stufe '+st.rep : 'neu'}</span></div>
    <div class="flash" data-auf="1">
      ${dom?`<div class="dom">${esc(dom.kurz||dom.titel)}</div>`:''}
      <div class="frage">${roh(c.front)}</div>
      ${S.auf ? `<div class="antwort">${md(c.back)}</div>` : `<div class="hinweis">Tippen zum Aufdecken</div>`}
    </div>`;
  h += S.auf
    ? `<div class="bewerten">
        <button data-q="1"><i>↺</i>Nochmal</button><button data-q="2"><i>◔</i>Schwer</button>
        <button data-q="3"><i>✓</i>Gut</button><button data-q="4"><i>✓✓</i>Leicht</button></div>`
    : `<button class="knopf" data-auf="1">Antwort zeigen</button>`;
  return h;
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
      ${md(f.erklaerung)}</div><button class="knopf" data-next="1">Nächste Frage</button>`;
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
  let h = `<div class="timer ${rest<3e5?'knapp':''}"><span>Frage ${i+1} von ${p.ids.length}</span><b>${mm}:${ss}</b></div>`
    + frageHtml((S.kurs.fragen||[]).find(f => f.id === p.ids[i])).replace(/<button class="knopf" data-pruefen[\s\S]*?<\/button>/,'');
  h += `<div class="knopfreihe"><button class="knopf leise" data-pnav="-1" ${i?'':'style="opacity:.4"'}>Zurück</button>
    <button class="knopf" data-pnav="1">${i===p.ids.length-1?'Abgeben':'Weiter'}</button></div>
    <button class="knopf warnung klein" data-pabbruch="1">Prüfung abbrechen</button>`;
  return h;
};

/* ================= Rahmen ================= */
const TITEL = { heute:'Übersicht', plan:'Lernplan', karten:'Lernkarten', fragen:'Übungsfragen',
                wissen:'Wissen', fehler:'Fehlerprotokoll', pruefung:'Prüfung',
                sicherung:'Datensicherung', info:'Über', uebersicht:'Lernen' };

function navHtml(){
  const v = S.view;
  let zurueck = '', titel = TITEL[v] || '';
  if (S.root === 'uebersicht'){ titel = 'Lernen'; }
  else if (S.root === 'seite'){ zurueck = ['uebersicht','Lernen']; }
  else {
    if (S.sub || v === 'fehler' || v === 'pruefung') zurueck = ['zurueck', TITEL[v] && v !== 'heute' ? kurzTitel() : kurzTitel()];
    else if (v !== 'heute') zurueck = null;
    if (v === 'heute') titel = kurzTitel();
    else if (S.sub) titel = TITEL[v];
  }
  const links = zurueck
    ? `<button class="zurueck" data-zurueck="${zurueck[0]}">${I.chevL}<span>${esc(zurueck[1])}</span></button>`
    : `<span style="width:8px"></span>`;
  return `<div class="inner">${links}<span class="titel">${esc(titel)}</span></div>`;
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
  const t = e.target.closest('[data-go],[data-tab],[data-sub],[data-kurs],[data-zurueck],[data-plan],[data-auf],[data-q],[data-opt],[data-pruefen],[data-next],[data-pruefung],[data-pnav],[data-pabbruch],[data-fragen],[data-kopieren],[data-einspielen]');
  if (!t) return;
  const d = t.dataset;

  if (d.kurs) return oeffneKurs(d.kurs);
  if (d.go === 'uebersicht') return go('uebersicht','uebersicht');
  if (d.go === 'sicherung' || d.go === 'info') return go('seite', d.go);
  if (d.go === 'heute') { S.pruefung = null; return go('kurs','heute'); }
  if (d.go === 'fehler') { S.fehlerIdx = 0; return go('kurs','fehler'); }
  if (d.tab) { S.kartenIdx = 0; S.fragenIdx = 0; return go('kurs', d.tab); }
  if (d.fragen) { S.fragenIdx = 0; return go('kurs','fragen', d.fragen); }
  if (d.zurueck === 'uebersicht') return go('uebersicht','uebersicht');
  if (d.zurueck) { S.pruefung = null; return go('kurs', S.sub ? S.view : 'heute', null); }
  if (d.sub !== undefined) { S.fragenIdx = 0; S.sel = []; S.gezeigt = false; S.sub = d.sub || null;
    if (d.sub === 'alle') S.kartenIdx = 0; return render(); }

  if (d.plan) { S.st.plan[d.plan] = !S.st.plan[d.plan]; save(); return render(true); }

  if (d.auf) { S.auf = true; return render(); }
  if (d.q){
    const liste = S.sub === 'alle' ? (S.kurs.karten||[]) : queue(S.kurs, S.st).alle;
    const c = liste[S.kartenIdx % liste.length]; if (!c) return;
    const neu = !S.st.karten[c.id];
    S.st.karten[c.id] = plane(S.st.karten[c.id], +d.q);
    if (neu) S.st.log['neu'+heute()] = (S.st.log['neu'+heute()] || 0) + 1;
    if (+d.q === 1 || S.sub === 'alle') S.kartenIdx++;
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
    S.st.fragen[f.id] = { ok, t:Date.now() };
    if (ok) delete S.st.fehler[f.id]; else S.st.fehler[f.id] = (S.st.fehler[f.id]||0) + 1;
    S.gezeigt = true; save(); return render(true);
  }
  if (d.next){
    S.sel = []; S.gezeigt = false;
    if (S.view === 'fehler') S.fehlerIdx = (S.fehlerIdx||0) + 1; else S.fragenIdx = (S.fragenIdx||0) + 1;
    return render();
  }

  if (d.pruefung){
    const pr = (S.kurs.pruefungen||[]).find(x => x.id === d.pruefung); if (!pr) return;
    S.pruefung = { id:pr.id, ids:pr.fragen.slice(), idx:0, ant:[], ende:Date.now()+pr.dauer_min*6e4, fertig:false };
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

function aktuelleFrage(){
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
