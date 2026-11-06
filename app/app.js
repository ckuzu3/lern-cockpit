/* Lern-Cockpit – offline-fähige Lern-App für Zertifikate und Studium.
   Inhalte: app/kurse/*.json (Schema siehe kurse/_SCHEMA.md) */
'use strict';

const S = { kurse: [], kurs: null, view: 'start', sub: null, st: null, pruefung: null };
const $ = (s, r = document) => r.querySelector(s);
const el = $('#app');
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DAY = 864e5;
const heute = () => new Date().setHours(0, 0, 0, 0);
const datum = t => new Date(t).toLocaleDateString('de-CH', { day: '2-digit', month: 'short' });
const tage = t => Math.ceil((new Date(t).setHours(0,0,0,0) - heute()) / DAY);

/* ---------- Speicher ---------- */
const KEY = id => 'lc.' + id;
function load(id) {
  let d = {};
  try { d = JSON.parse(localStorage.getItem(KEY(id)) || '{}'); } catch (e) {}
  return Object.assign({ karten: {}, plan: {}, fragen: {}, fehler: {}, pruefungen: [], neuProTag: 20, log: {} }, d);
}
function save() {
  if (!S.kurs) return;
  try { localStorage.setItem(KEY(S.kurs.id), JSON.stringify(S.st)); } catch (e) {}
}

/* ---------- Mini-Markdown ---------- */
function md(t) {
  if (!t) return '';
  const lines = String(t).split('\n');
  let out = '', ul = false;
  const inl = s => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
  let i = 0;
  while (i < lines.length) {
    let l = lines[i];
    // Tabelle: | a | b |  /  |---|---|
    if (/^\s*\|.*\|\s*$/.test(l) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      if (ul) { out += '</ul>'; ul = false; }
      const zelle = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      out += '<div class="tbl"><table><thead><tr>' + zelle(l).map(c => '<th>' + inl(c) + '</th>').join('') + '</tr></thead><tbody>';
      i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        out += '<tr>' + zelle(lines[i]).map(c => '<td>' + inl(c) + '</td>').join('') + '</tr>'; i++;
      }
      out += '</tbody></table></div>'; continue;
    }
    i++;
    if (/^\s*[-•]\s+/.test(l)) { if (!ul) { out += '<ul>'; ul = true; } out += '<li>' + inl(l.replace(/^\s*[-•]\s+/, '')) + '</li>'; continue; }
    if (ul) { out += '</ul>'; ul = false; }
    if (/^###\s+/.test(l)) out += '<h4>' + inl(l.slice(4)) + '</h4>';
    else if (/^##\s+/.test(l)) out += '<h3>' + inl(l.slice(3)) + '</h3>';
    else if (l.trim()) out += '<p>' + inl(l) + '</p>';
  }
  if (ul) out += '</ul>';
  return out;
}

/* ---------- SM-2 ---------- */
function plane(c, q) {
  const n = { ef: c && c.ef || 2.5, iv: c && c.iv || 0, rep: c && c.rep || 0 };
  if (q === 1) { n.rep = 0; n.iv = 0; n.ef = Math.max(1.3, n.ef - 0.2); n.due = Date.now() + 6e5; }
  else {
    if (q === 2) { n.ef = Math.max(1.3, n.ef - 0.15); n.iv = n.iv ? Math.max(1, Math.round(n.iv * 1.2)) : 1; }
    else {
      n.rep++;
      if (n.rep === 1) n.iv = q === 4 ? 2 : 1;
      else if (n.rep === 2) n.iv = q === 4 ? 5 : 3;
      else n.iv = Math.round(n.iv * n.ef * (q === 4 ? 1.3 : 1));
      if (q === 4) n.ef = Math.min(2.8, n.ef + 0.1);
    }
    n.iv = Math.min(n.iv, 180);
    n.due = heute() + n.iv * DAY + 36e5 * 4;
  }
  n.ges = (c && c.ges || 0) + 1;
  return n;
}
function queue() {
  const k = S.kurs.karten || [], st = S.st.karten, now = Date.now();
  const faellig = k.filter(x => st[x.id] && st[x.id].due <= now);
  const neuH = (S.st.log['neu' + heute()] || 0);
  const neu = k.filter(x => !st[x.id]).slice(0, Math.max(0, S.st.neuProTag - neuH));
  return { faellig, neu, alle: faellig.concat(neu) };
}

/* ---------- Statistik ---------- */
function stats() {
  const k = S.kurs, st = S.st;
  const kt = (k.karten || []).length;
  const gelernt = (k.karten || []).filter(x => st.karten[x.id] && st.karten[x.id].rep >= 2).length;
  const fr = (k.fragen || []).length;
  const beant = Object.keys(st.fragen).length;
  const richtig = Object.values(st.fragen).filter(v => v.ok).length;
  const aufg = (k.lernplan && k.lernplan.wochen || []).reduce((a, w) => a + w.aufgaben.length, 0);
  const aufgOk = Object.values(st.plan).filter(Boolean).length;
  const pc = x => x ? Math.round(x * 100) : 0;
  const ges = kt + fr + aufg ? (gelernt + richtig + aufgOk) / (kt + fr + aufg) : 0;
  return { kt, gelernt, fr, beant, richtig, aufg, aufgOk, ges: pc(ges),
    karten: pc(kt ? gelernt / kt : 0), quote: pc(beant ? richtig / beant : 0),
    planPc: pc(aufg ? aufgOk / aufg : 0), fehler: Object.keys(st.fehler).length };
}
function ring(p, farbe) {
  const r = 36, u = 2 * Math.PI * r;
  return `<div class="ring"><svg width="84" height="84" viewBox="0 0 84 84">
    <circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--bg3)" stroke-width="8"/>
    <circle cx="42" cy="42" r="${r}" fill="none" stroke="${farbe || 'var(--ac)'}" stroke-width="8"
      stroke-linecap="round" stroke-dasharray="${u}" stroke-dashoffset="${u * (1 - p / 100)}"/>
  </svg><b>${p}%</b></div>`;
}

/* ---------- Views ---------- */
const V = {};

V.start = () => {
  const k = S.kurs, s = stats(), q = queue();
  const p = k.pruefung || {}, w = aktuelleWoche();
  let h = `<div class="row sb" style="align-items:flex-start">
    <div><h1>${esc(k.titel)}</h1><div class="sub">${esc(k.anbieter || '')}${p.code ? ' · ' + esc(p.code) : ''}</div></div>
    ${ring(s.ges)}</div>`;

  if (k.termin) {
    const d = tage(k.termin);
    h += `<div class="card"><div class="row sb"><div><b>Prüfungstermin</b><div class="sub">${datum(k.termin)}</div></div>
      <span class="pill ${d < 14 ? 'bad' : d < 30 ? 'warn' : 'ac'}">${d > 0 ? 'in ' + d + ' Tagen' : d === 0 ? 'heute' : 'vorbei'}</span></div></div>`;
  } else {
    h += `<div class="card"><b>Kein Prüfungstermin gesetzt</b><div class="sub">Sag im Chat Bescheid, dann rechne ich den Lernplan auf das Datum.</div></div>`;
  }

  h += `<h2>Heute</h2>
  <div class="card tap" data-go="karten"><div class="row sb"><div><b>Lernkarten wiederholen</b>
    <div class="sub">${q.faellig.length} fällig · ${q.neu.length} neu</div></div>
    <span class="pill ${q.alle.length ? 'ac' : 'ok'}">${q.alle.length || '✓'}</span></div></div>`;
  if (w) {
    const offen = w.aufgaben.filter((a, i) => !S.st.plan[w.nr + '.' + i]).length;
    h += `<div class="card tap" data-go="plan"><div class="row sb"><div><b>Woche ${w.nr}: ${esc(w.thema)}</b>
      <div class="sub">${offen} von ${w.aufgaben.length} Aufgaben offen</div></div>
      <span class="pill ${offen ? 'warn' : 'ok'}">${offen || '✓'}</span></div></div>`;
  }
  if (s.fehler) h += `<div class="card tap" data-go="fehler"><div class="row sb"><div><b>Fehlerprotokoll</b>
    <div class="sub">Falsch beantwortete Fragen nochmal</div></div><span class="pill bad">${s.fehler}</span></div></div>`;

  h += `<h2>Stand</h2><div class="grid2">
    <div class="kpi"><b>${s.gelernt}/${s.kt}</b><small>Karten sitzen</small></div>
    <div class="kpi"><b>${s.quote}%</b><small>Trefferquote</small></div>
    <div class="kpi"><b>${s.beant}/${s.fr}</b><small>Fragen bearbeitet</small></div>
    <div class="kpi"><b>${s.planPc}%</b><small>Lernplan</small></div></div>`;

  h += `<h2>Prüfungssimulation</h2>`;
  (k.pruefungen || []).forEach(pr => {
    const letzt = S.st.pruefungen.filter(x => x.id === pr.id).pop();
    h += `<div class="card tap" data-pruefung="${pr.id}"><div class="row sb"><div><b>${esc(pr.titel)}</b>
      <div class="sub">${pr.fragen.length} Fragen · ${pr.dauer_min} Min</div></div>
      ${letzt ? `<span class="pill ${letzt.pc >= 70 ? 'ok' : 'bad'}">${letzt.pc}%</span>` : '<span class="pill">start</span>'}</div></div>`;
  });

  h += `<h2>Prüfungssteckbrief</h2><div class="card prose">`;
  [['Prüfung', p.name], ['Code', p.code], ['Dauer', p.dauer], ['Fragen', p.fragen],
   ['Bestehen', p.bestehen], ['Kosten', p.kosten], ['Gültigkeit', p.gueltigkeit], ['Sprache', p.sprache]]
    .filter(r => r[1]).forEach(r => h += `<div class="li"><div class="tx"><span class="sub">${r[0]}</span><br>${esc(r[1])}</div></div>`);
  h += `</div>`;
  if (p.quelle) h += `<p class="sub">Quelle: <a href="${esc(p.quelle)}" target="_blank" rel="noopener">offizieller Prüfungsleitfaden</a> · Inhalte Stand ${esc(k.stand || '')}</p>`;
  h += `<div class="btnrow" style="margin-top:14px"><button class="btn sec sm" data-go="kurse">Kurse wechseln</button>
    <button class="btn sec sm" data-reset="1">Fortschritt zurücksetzen</button></div>`;
  return h;
};

function aktuelleWoche() {
  const ws = S.kurs.lernplan && S.kurs.lernplan.wochen || [];
  for (const w of ws) if (w.aufgaben.some((a, i) => !S.st.plan[w.nr + '.' + i])) return w;
  return ws[ws.length - 1] || null;
}

V.plan = () => {
  const lp = S.kurs.lernplan || {}, ws = lp.wochen || [], s = stats();
  if (!ws.length) return `<h1>Lernplan</h1><div class="empty">Noch kein Lernplan für diesen Kurs.</div>`;
  let h = `<h1>Lernplan</h1><div class="sub">${esc(lp.hinweis || '')}</div>
    <div class="bar"><i class="${s.planPc === 100 ? 'ok' : ''}" style="width:${s.planPc}%"></i></div>
    <div class="sub">${s.aufgOk} von ${s.aufg} Aufgaben erledigt</div>`;
  const akt = aktuelleWoche();
  ws.forEach(w => {
    const fertig = w.aufgaben.every((a, i) => S.st.plan[w.nr + '.' + i]);
    h += `<div class="card"><div class="row sb"><b>Woche ${w.nr} · ${esc(w.thema)}</b>
      <span class="pill ${fertig ? 'ok' : akt && akt.nr === w.nr ? 'ac' : ''}">${fertig ? '✓' : (w.stunden || 8) + ' h'}</span></div>
      ${w.ziel ? `<div class="sub" style="margin:4px 0 8px">${esc(w.ziel)}</div>` : ''}`;
    w.aufgaben.forEach((a, i) => {
      const id = w.nr + '.' + i, on = !!S.st.plan[id];
      h += `<div class="li ${on ? 'done' : ''}" data-plan="${id}"><div class="cb">✓</div><div class="tx">${md(a).replace(/^<p>|<\/p>$/g, '')}</div></div>`;
    });
    h += `</div>`;
  });
  return h;
};

V.karten = () => {
  const q = queue();
  if (S.sub === 'alle' && !q.alle.length) S.sub = null;
  const liste = S.sub === 'alle' ? (S.kurs.karten || []) : q.alle;
  if (!liste.length) {
    const next = (S.kurs.karten || []).map(c => S.st.karten[c.id] && S.st.karten[c.id].due).filter(Boolean).sort()[0];
    return `<h1>Lernkarten</h1><div class="empty">Für heute alles wiederholt. 🎉<br>
      ${next ? 'Nächste Wiederholung: ' + datum(next) : ''}</div>
      <button class="btn sec" data-sub="alle">Trotzdem weiter üben</button>`;
  }
  const c = liste[S.kartenIdx % liste.length];
  const aufgedeckt = S.auf;
  const st = S.st.karten[c.id];
  const dom = (S.kurs.domains || []).find(d => d.id === c.domain);
  let h = `<div class="row sb"><div class="sub">${q.faellig.length} fällig · ${q.neu.length} neu</div>
    <span class="pill">${st ? 'Stufe ' + st.rep : 'neu'}</span></div>
    <div class="flash" data-auf="1">
      ${dom ? `<div class="sub" style="margin-bottom:10px">${esc(dom.kurz || dom.titel)}</div>` : ''}
      <div class="q">${md(c.front).replace(/^<p>|<\/p>$/g, '')}</div>
      ${aufgedeckt ? `<div class="a">${md(c.back)}</div>` : '<div class="sub" style="margin-top:18px">Tippen zum Aufdecken</div>'}
    </div>`;
  if (aufgedeckt) h += `<div class="rate">
      <button data-q="1"><b>↺</b>Nochmal</button><button data-q="2"><b>◔</b>Schwer</button>
      <button data-q="3"><b>✓</b>Gut</button><button data-q="4"><b>✓✓</b>Leicht</button></div>`;
  else h += `<button class="btn" data-auf="1">Antwort zeigen</button>`;
  return h;
};

V.fragen = () => {
  if (!S.sub) {
    let h = `<h1>Übungsfragen</h1><div class="sub">Nach Prüfungsdomain, mit Begründung zu jeder Antwort.</div>`;
    (S.kurs.domains || []).forEach(d => {
      const fs = (S.kurs.fragen || []).filter(f => f.domain === d.id);
      const ok = fs.filter(f => S.st.fragen[f.id] && S.st.fragen[f.id].ok).length;
      const ab = fs.filter(f => S.st.fragen[f.id]).length;
      h += `<div class="card tap" data-sub="${d.id}"><div class="row sb"><div><b>${esc(d.titel)}</b>
        <div class="sub">${esc(d.gewicht || '')} · ${fs.length} Fragen</div></div>
        <span class="pill ${ab === fs.length && fs.length ? 'ok' : ab ? 'ac' : ''}">${ok}/${fs.length}</span></div>
        <div class="bar"><i style="width:${fs.length ? ab / fs.length * 100 : 0}%"></i></div></div>`;
    });
    return h;
  }
  const fs = (S.kurs.fragen || []).filter(f => f.domain === S.sub);
  const f = fs[S.fragenIdx % fs.length];
  const d = (S.kurs.domains || []).find(x => x.id === S.sub);
  return frageHtml(f, `<a class="back" data-sub="">‹ Alle Domains</a><div class="row sb">
    <div class="sub">${esc(d ? d.titel : '')}</div><span class="pill">${(S.fragenIdx % fs.length) + 1} / ${fs.length}</span></div>`);
};

function frageHtml(f, kopf) {
  if (!f) return `${kopf || ''}<div class="empty">Keine Fragen vorhanden.</div>`;
  const sel = S.sel || [], gezeigt = S.gezeigt;
  const multi = (f.richtig || []).length > 1;
  let h = (kopf || '') + `<div class="card" style="margin-top:12px"><b>${md(f.frage).replace(/^<p>|<\/p>$/g, '')}</b>
    ${multi ? '<div class="sub" style="margin-top:6px">Mehrfachauswahl – ' + f.richtig.length + ' Antworten</div>' : ''}</div>`;
  (f.optionen || []).forEach((o, i) => {
    let cl = 'opt';
    if (gezeigt) { if (f.richtig.includes(i)) cl += ' right'; else if (sel.includes(i)) cl += ' wrong'; }
    else if (sel.includes(i)) cl += ' sel';
    h += `<button class="${cl}" data-opt="${i}"><i>${'ABCDEFGH'[i]}</i>${md(o).replace(/^<p>|<\/p>$/g, '')}</button>`;
  });
  if (gezeigt) {
    const ok = gleich(sel, f.richtig);
    h += `<div class="expl"><b>${ok ? '✓ Richtig' : '✗ Falsch'}</b> – richtig ist ${f.richtig.map(i => 'ABCDEFGH'[i]).join(' + ')}.
      <div style="margin-top:7px">${md(f.erklaerung)}</div>
      ${f.quelle ? `<div class="sub" style="margin-top:6px">${esc(f.quelle)}</div>` : ''}</div>
      <button class="btn" data-next="1">Nächste Frage</button>`;
  } else {
    h += `<button class="btn" data-pruefen="1" ${sel.length ? '' : 'style="opacity:.45"'}>Antwort prüfen</button>`;
  }
  return h;
}
const gleich = (a, b) => a.length === b.length && a.every(x => b.includes(x));

V.wissen = () => {
  if (!S.sub) {
    let h = `<h1>Wissen</h1><div class="sub">Zusammenfassungen pro Domain, Glossar und Last-Minute-Blatt.</div>`;
    (S.kurs.domains || []).forEach(d => {
      h += `<div class="card tap" data-sub="${d.id}"><div class="row sb"><div><b>${esc(d.titel)}</b>
        <div class="sub">${esc(d.kurz || '')}</div></div><span class="pill ac">${esc(d.gewicht || '')}</span></div></div>`;
    });
    if (S.kurs.lastminute) h += `<div class="card tap" data-sub="__lm"><b>⚡ Last-Minute-Blatt</b>
      <div class="sub">Die letzten 48 Stunden vor der Prüfung</div></div>`;
    if (S.kurs.glossar) h += `<div class="card tap" data-sub="__gl"><b>Glossar</b>
      <div class="sub">${(S.kurs.glossar || []).length} Begriffe</div></div>`;
    if ((S.kurs.ressourcen || []).length) {
      h += `<h2>Offizielle Ressourcen</h2><div class="card">`;
      S.kurs.ressourcen.forEach(r => h += `<div class="li"><div class="tx"><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.titel)}</a>
        <div class="sub">${esc(r.was || '')}</div></div></div>`);
      h += `</div>`;
    }
    return h;
  }
  const back = `<a class="back" data-sub="">‹ Wissen</a>`;
  if (S.sub === '__lm') return back + `<h1>Last-Minute-Blatt</h1><div class="card prose">${md(S.kurs.lastminute)}</div>`;
  if (S.sub === '__gl') {
    let h = back + `<h1>Glossar</h1><div class="card prose">`;
    (S.kurs.glossar || []).forEach(g => h += `<div class="li"><div class="tx"><b>${esc(g.b)}</b><br><span class="sub">${esc(g.d)}</span></div></div>`);
    return h + `</div>`;
  }
  const d = (S.kurs.domains || []).find(x => x.id === S.sub);
  if (!d) return back + `<div class="empty">Nicht gefunden.</div>`;
  let h = back + `<h1>${esc(d.titel)}</h1><span class="pill ac">${esc(d.gewicht || '')}</span>
    <div class="card prose">${md(d.zusammenfassung)}</div>`;
  if ((d.themen || []).length) h += `<h2>Geprüfte Fähigkeiten</h2><div class="card prose"><ul>
    ${d.themen.map(t => '<li>' + esc(t) + '</li>').join('')}</ul></div>`;
  h += `<button class="btn" data-fragen="${d.id}">Fragen zu dieser Domain</button>`;
  return h;
};

V.fehler = () => {
  const ids = Object.keys(S.st.fehler);
  if (!ids.length) return `<a class="back" data-go="start">‹ Start</a><div class="empty">Kein offener Fehler. Sauber.</div>`;
  const f = (S.kurs.fragen || []).find(x => x.id === ids[S.fehlerIdx % ids.length]);
  return frageHtml(f, `<a class="back" data-go="start">‹ Start</a>
    <div class="row sb"><div class="sub">Fehlerprotokoll</div><span class="pill bad">${ids.length} offen</span></div>`);
};

V.pruefung = () => {
  const p = S.pruefung;
  const fs = p.ids.map(id => (S.kurs.fragen || []).find(f => f.id === id)).filter(Boolean);
  if (p.fertig) {
    const perDom = {};
    fs.forEach((f, i) => {
      const d = f.domain; perDom[d] = perDom[d] || { n: 0, ok: 0 };
      perDom[d].n++; if (gleich(p.ant[i] || [], f.richtig)) perDom[d].ok++;
    });
    const ok = fs.filter((f, i) => gleich(p.ant[i] || [], f.richtig)).length;
    const pc = Math.round(ok / fs.length * 100);
    let h = `<h1>Ergebnis</h1><div class="row" style="gap:16px;margin:14px 0">
      ${ring(pc, pc >= 70 ? 'var(--ok)' : 'var(--bad)')}
      <div><b style="font-size:19px">${pc >= 70 ? 'Bestanden' : 'Nicht bestanden'}</b>
      <div class="sub">${ok} von ${fs.length} richtig · Richtwert 70 %</div></div></div>`;
    h += `<h2>Nach Domain</h2>`;
    Object.entries(perDom).forEach(([id, v]) => {
      const d = (S.kurs.domains || []).find(x => x.id === id);
      const q = Math.round(v.ok / v.n * 100);
      h += `<div class="card"><div class="row sb"><b style="font-size:14.5px">${esc(d ? d.titel : id)}</b>
        <span class="pill ${q >= 70 ? 'ok' : 'bad'}">${q}%</span></div>
        <div class="bar"><i class="${q >= 70 ? 'ok' : ''}" style="width:${q}%;background:${q >= 70 ? 'var(--ok)' : 'var(--bad)'}"></i></div>
        <div class="sub">${v.ok}/${v.n} richtig${q < 70 ? ' – hier nachlegen' : ''}</div></div>`;
    });
    h += `<h2>Durchgang ansehen</h2>`;
    fs.forEach((f, i) => {
      const r = gleich(p.ant[i] || [], f.richtig);
      h += `<div class="card"><div class="row sb"><span class="pill ${r ? 'ok' : 'bad'}">${i + 1}</span>
        <span class="sub">${esc(((S.kurs.domains || []).find(x => x.id === f.domain) || {}).titel || '')}</span></div>
        <div style="margin-top:8px;font-size:14.5px"><b>${md(f.frage).replace(/^<p>|<\/p>$/g, '')}</b></div>
        <div class="expl" style="margin-top:9px">Richtig: ${f.richtig.map(x => 'ABCDEFGH'[x]).join(' + ')} – ${esc(f.optionen[f.richtig[0]])}
        <div style="margin-top:6px">${md(f.erklaerung)}</div></div></div>`;
    });
    h += `<button class="btn" data-go="start">Zurück zum Start</button>`;
    return h;
  }
  const i = p.idx, f = fs[i];
  const rest = Math.max(0, p.ende - Date.now());
  const mm = String(Math.floor(rest / 6e4)).padStart(2, '0'), ss = String(Math.floor(rest % 6e4 / 1000)).padStart(2, '0');
  let h = `<div class="timer ${rest < 3e5 ? 'low' : ''}"><div class="sub">Frage ${i + 1} von ${fs.length}</div><b>${mm}:${ss}</b></div>
    <div class="bar"><i style="width:${(i) / fs.length * 100}%"></i></div>`;
  S.sel = p.ant[i] || []; S.gezeigt = false;
  h += frageHtml(f, '').replace(/<button class="btn" data-pruefen[\s\S]*?<\/button>/, '');
  h += `<div class="btnrow"><button class="btn sec" data-pnav="-1" ${i ? '' : 'style="opacity:.4"'}>Zurück</button>
    <button class="btn" data-pnav="1">${i === fs.length - 1 ? 'Abgeben' : 'Weiter'}</button></div>
    <button class="btn sec sm" data-pabbruch="1">Prüfung abbrechen</button>`;
  return h;
};

V.kurse = () => {
  let h = `<h1>Kurse</h1><div class="sub">Aktive Zertifikate und Studienmodule.</div>`;
  S.kurse.forEach(k => {
    const akt = S.kurs && k.id === S.kurs.id;
    h += `<div class="card tap" data-kurs="${k.id}"><div class="row sb"><div><b>${esc(k.titel)}</b>
      <div class="sub">${esc(k.anbieter || '')}${k.termin ? ' · Prüfung ' + datum(k.termin) : ''}</div></div>
      <span class="pill ${akt ? 'ok' : 'ac'}">${akt ? 'aktiv' : 'öffnen'}</span></div></div>`;
  });
  if ((S.fahrplan || []).length) {
    h += `<h2>Fahrplan</h2><div class="sub">Reihenfolge und Empfehlung – Inhalte lade ich, sobald du einen Kurs startest.</div>`;
    S.fahrplan.forEach((f, i) => {
      const da = S.kurse.some(k => k.id === f.id);
      h += `<div class="card"><div class="row sb"><div><b>${i + 1}. ${esc(f.titel)}</b>
        <div class="sub">${esc(f.zeitraum || '')} · ${esc(f.aufwand || '')}</div></div>
        <span class="pill ${da ? 'ok' : ''}">${da ? 'geladen' : 'offen'}</span></div>
        ${f.warum ? `<div class="sub" style="margin-top:7px">${esc(f.warum)}</div>` : ''}</div>`;
    });
  }
  return h;
};

/* ---------- Render ---------- */
let timerId = null;
function render() {
  clearInterval(timerId); timerId = null;
  el.innerHTML = (V[S.view] || V.start)();
  el.scrollIntoView ? window.scrollTo(0, S.keepScroll ? window.scrollY : 0) : 0;
  S.keepScroll = false;
  const tb = $('#tabbar'); tb.hidden = false;
  tb.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.view === S.view));
  if (S.view === 'pruefung' && S.pruefung && !S.pruefung.fertig) {
    timerId = setInterval(() => {
      if (Date.now() >= S.pruefung.ende) { abgeben(); return; }
      const t = $('.timer b'); if (!t) return;
      const r = S.pruefung.ende - Date.now();
      t.textContent = String(Math.floor(r / 6e4)).padStart(2, '0') + ':' + String(Math.floor(r % 6e4 / 1000)).padStart(2, '0');
      if (r < 3e5) $('.timer').classList.add('low');
    }, 1000);
  }
}
function go(v, sub) { S.view = v; S.sub = sub === undefined ? null : sub; S.sel = []; S.gezeigt = false; render(); }

/* ---------- Events ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-go],[data-sub],[data-plan],[data-auf],[data-q],[data-opt],[data-pruefen],[data-next],[data-kurs],[data-pruefung],[data-pnav],[data-pabbruch],[data-fragen],[data-reset],[data-view]');
  if (!t) return;
  const d = t.dataset;

  if (d.view) return go(d.view);
  if (d.go) return go(d.go);
  if (d.fragen) { S.fragenIdx = 0; return go('fragen', d.fragen); }
  if (d.sub !== undefined) { S.fragenIdx = 0; S.sel = []; S.gezeigt = false; S.sub = d.sub || null; if (d.sub === 'alle') S.kartenIdx = 0; return render(); }
  if (d.kurs) { oeffne(d.kurs); return go('start'); }

  if (d.plan) { S.st.plan[d.plan] = !S.st.plan[d.plan]; save(); S.keepScroll = true; return render(); }

  if (d.auf) { S.auf = true; return render(); }
  if (d.q) {
    const liste = S.sub === 'alle' ? (S.kurs.karten || []) : queue().alle;
    const c = liste[S.kartenIdx % liste.length]; if (!c) return;
    const neu = !S.st.karten[c.id];
    S.st.karten[c.id] = plane(S.st.karten[c.id], +d.q);
    if (neu) S.st.log['neu' + heute()] = (S.st.log['neu' + heute()] || 0) + 1;
    S.auf = false; S.kartenIdx = +d.q === 1 ? S.kartenIdx + 1 : S.kartenIdx; save();
    if (+d.q !== 1) S.kartenIdx = S.kartenIdx; // Karte verlässt die Queue von selbst
    return render();
  }

  if (d.opt !== undefined) {
    const f = aktuelleFrage(); if (!f || S.gezeigt) return;
    const i = +d.opt, multi = f.richtig.length > 1;
    S.sel = S.sel || [];
    if (multi) S.sel = S.sel.includes(i) ? S.sel.filter(x => x !== i) : S.sel.concat(i);
    else S.sel = [i];
    if (S.view === 'pruefung') S.pruefung.ant[S.pruefung.idx] = S.sel;
    S.keepScroll = true; return render();
  }
  if (d.pruefen) {
    const f = aktuelleFrage(); if (!f || !(S.sel || []).length) return;
    const ok = gleich(S.sel, f.richtig);
    S.st.fragen[f.id] = { ok, t: Date.now() };
    if (ok) delete S.st.fehler[f.id]; else S.st.fehler[f.id] = (S.st.fehler[f.id] || 0) + 1;
    S.gezeigt = true; save(); S.keepScroll = true; return render();
  }
  if (d.next) {
    S.sel = []; S.gezeigt = false;
    if (S.view === 'fehler') S.fehlerIdx = (S.fehlerIdx || 0) + 1; else S.fragenIdx = (S.fragenIdx || 0) + 1;
    return render();
  }

  if (d.pruefung) {
    const pr = (S.kurs.pruefungen || []).find(x => x.id === d.pruefung); if (!pr) return;
    S.pruefung = { id: pr.id, ids: pr.fragen.slice(), idx: 0, ant: [], ende: Date.now() + pr.dauer_min * 6e4, fertig: false };
    return go('pruefung');
  }
  if (d.pnav) {
    const p = S.pruefung, n = p.idx + (+d.pnav);
    if (n < 0) return;
    if (n >= p.ids.length) return abgeben();
    p.idx = n; S.sel = p.ant[n] || []; S.gezeigt = false; return render();
  }
  if (d.pabbruch) { S.pruefung = null; return go('start'); }
  if (d.reset) {
    if (!S.resetArm) { S.resetArm = true; t.textContent = 'Wirklich? Nochmal tippen'; t.style.background = 'var(--bad)'; t.style.color = '#fff'; return; }
    S.resetArm = false; S.st = load('__leer'); save(); return go('start');
  }
});
function aktuelleFrage() {
  if (S.view === 'pruefung') return (S.kurs.fragen || []).find(f => f.id === S.pruefung.ids[S.pruefung.idx]);
  if (S.view === 'fehler') { const ids = Object.keys(S.st.fehler); return (S.kurs.fragen || []).find(x => x.id === ids[(S.fehlerIdx || 0) % ids.length]); }
  const fs = (S.kurs.fragen || []).filter(f => f.domain === S.sub);
  return fs[(S.fragenIdx || 0) % fs.length];
}
function abgeben() {
  const p = S.pruefung; p.fertig = true;
  const fs = p.ids.map(id => (S.kurs.fragen || []).find(f => f.id === id)).filter(Boolean);
  let ok = 0;
  fs.forEach((f, i) => {
    const r = gleich(p.ant[i] || [], f.richtig); if (r) ok++;
    S.st.fragen[f.id] = { ok: r, t: Date.now() };
    if (r) delete S.st.fehler[f.id]; else S.st.fehler[f.id] = (S.st.fehler[f.id] || 0) + 1;
  });
  p.pc = Math.round(ok / fs.length * 100);
  S.st.pruefungen.push({ id: p.id, pc: p.pc, t: Date.now() });
  save(); render();
}

/* ---------- Start ---------- */
function oeffne(id) {
  S.kurs = S.kurse.find(k => k.id === id) || S.kurse[0];
  S.st = load(S.kurs.id);
  S.kartenIdx = 0; S.fragenIdx = 0; S.fehlerIdx = 0; S.auf = false;
  try { localStorage.setItem('lc.aktiv', S.kurs.id); } catch (e) {}
}
async function start() {
  try {
    if (window.KURSE) { S.kurse = window.KURSE.kurse; S.fahrplan = window.KURSE.fahrplan || []; }
    else {
      const idx = await (await fetch('kurse/index.json?v=' + Date.now())).json();
      S.fahrplan = idx.fahrplan || [];
      S.kurse = await Promise.all(idx.kurse.map(f => fetch('kurse/' + f + '?v=' + Date.now()).then(r => r.json())));
    }
  } catch (e) {
    el.innerHTML = `<h1>Keine Inhalte</h1><div class="empty">Die Kursdateien konnten nicht geladen werden.<br><small>${esc(e.message)}</small></div>`;
    return;
  }
  if (!S.kurse.length) { el.innerHTML = `<div class="empty">Noch keine Kurse geladen.</div>`; return; }
  let aktiv = null; try { aktiv = localStorage.getItem('lc.aktiv'); } catch (e) {}
  oeffne(aktiv || S.kurse[0].id);
  render();
}
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
start();
