/* el_Pomiary – model danych i obliczenia */
(function () {
  'use strict';

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  /* ---------- liczby ---------- */
  function num(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    const s = String(v).trim().replace(/\s/g, '').replace(',', '.');
    if (s === '') return null;
    const n = Number(s);
    return isFinite(n) ? n : null;
  }
  function fmt(n, dec) {
    if (n === null || n === undefined || !isFinite(n)) return '';
    let s;
    if (dec === undefined) {
      s = String(Math.round(n * 1e6) / 1e6);
    } else {
      s = n.toFixed(dec);
    }
    return s.replace('.', ',');
  }
  /* wartość wpisana -> do wyświetlenia (z przecinkiem) */
  function show(v) {
    const n = num(v);
    return n === null ? (v == null ? '' : String(v)) : fmt(n);
  }

  /* ---------- pętla zwarcia ---------- */
  const KINDS = ['1F', '3F', '3FN'];
  const ROWS_3F = ['L1-PE', 'L2-PE', 'L3-PE', 'L1-L2', 'L1-L3', 'L2-L3'];
  const ROWS_3FN = ROWS_3F.concat(['L1-N', 'L2-N', 'L3-N']);
  const PHASES = ['L1', 'L2', 'L3'];

  function rowKeysFor(kind, phase) {
    if (kind === '3F') return ROWS_3F.slice();
    if (kind === '3FN') return ROWS_3FN.slice();
    return [phase || 'L1'];
  }
  /* kolumna "Faza" w protokole */
  function phaseLabel(kind, key) {
    if (kind === '1F') return key;
    if (/-PE$|-N$/.test(key)) return key.split('-')[0];
    return key; // L1-L2 itd.
  }
  function newRow(key) {
    return { id: uid(), key: key, Ik: '', Zs: '', U: '', iso: 'OK', isoVals: {} };
  }
  function newMeasurement(kind, opts) {
    opts = opts || {};
    const phase = opts.phase || 'L1';
    return {
      id: uid(),
      kind: kind || '1F',
      name: opts.name || '',
      phase: phase,
      breaker: opts.breaker || '',
      In: opts.In != null ? String(opts.In) : '',
      k: opts.k != null ? String(opts.k) : '',
      rows: rowKeysFor(kind || '1F', phase).map(newRow)
    };
  }
  /* zmiana typu/fazy – zachowuje wartości wierszy o tych samych kluczach */
  function rebuildRows(m) {
    const keys = rowKeysFor(m.kind, m.phase);
    const old = m.rows || [];
    if (m.kind === '1F') {
      const src = old[0] || newRow(keys[0]);
      src.key = keys[0];
      m.rows = [src];
      return;
    }
    m.rows = keys.map(k => old.find(r => r.key === k) || newRow(k));
  }

  function calcLoop(m, row) {
    const In = num(m.In), k = num(m.k), U = num(row.U), Zs = num(row.Zs);
    const Ia = In !== null && k !== null ? In * k : null;
    const Za = Ia && U !== null ? U / Ia : null;
    let result = null;
    if (Za !== null && Zs !== null) result = Zs <= Za ? 'Pozytywna' : 'Negatywna';
    return { In, k, Ia, Za, Zs, U, Ik: num(row.Ik), result };
  }

  /* nazwa nagłówka pomiaru 3F/3FN: „Grupa - Nazwa punktu” */
  function multiTitle(g, m) {
    const gn = (g.name || '').trim(), mn = (m.name || '').trim();
    if (!mn || mn === gn) return gn || '(bez nazwy)';
    return gn ? gn + ' - ' + mn : mn;
  }
  /* płaska lista wierszy dokumentu pętli (z numeracją Lp.)
     Pomiar 3F/3FN z własną nazwą dostaje nagłówek „Grupa - Nazwa” w stylu grupy;
     kolejne pomiary 1F tej grupy wracają pod nagłówek grupy. */
  function flattenLoop(doc) {
    const out = [];
    let lp = 0;
    (doc.groups || []).forEach(g => {
      let needGroup = true;
      const groupRow = () => { out.push({ type: 'group', text: g.name || '(bez nazwy)', group: g }); needGroup = false; };
      if (!(g.measurements || []).length) groupRow();
      (g.measurements || []).forEach(m => {
        const multi = m.kind !== '1F';
        const named = multi && multiTitle(g, m) !== (g.name || '(bez nazwy)').trim();
        if (named) { out.push({ type: 'group', text: multiTitle(g, m), group: g, m: m }); needGroup = true; }
        else if (needGroup) groupRow();
        m.rows.forEach(r => {
          lp++;
          out.push({
            type: 'row', lp: lp, group: g, m: m, r: r,
            name: multi ? r.key : (m.name || ''),
            phase: phaseLabel(m.kind, r.key),
            calc: calcLoop(m, r)
          });
        });
      });
    });
    return out;
  }

  function loopStats(doc) {
    const rows = flattenLoop(doc).filter(x => x.type === 'row');
    return {
      total: rows.length,
      pos: rows.filter(x => x.calc.result === 'Pozytywna').length,
      neg: rows.filter(x => x.calc.result === 'Negatywna').length,
      empty: rows.filter(x => x.calc.result === null).length,
      nok: rows.filter(x => x.r.iso === 'NOK').length,
      isoNeg: rows.filter(x => isoResult(x.m, x.r) === 'Negatywna').length,
      isoEmpty: rows.filter(x => isoResult(x.m, x.r) === null).length
    };
  }

  /* ---------- izolacja ---------- */
  const ISO_COLS = ['L1/L2', 'L2/L3', 'L3/L1', 'L1/N', 'L2/N', 'L3/N', 'L1/PE', 'L2/PE', 'L3/PE', 'N/PE'];
  const PAIR_COL = { 'L1-L2': 'L1/L2', 'L2-L3': 'L2/L3', 'L1-L3': 'L3/L1' };

  function isoColsFor(kind, key) {
    if (kind === '1F') return [key + '/N', key + '/PE', 'N/PE'];
    let cols;
    if (/-PE$/.test(key)) cols = [key.split('-')[0] + '/PE'];
    else if (/-N$/.test(key)) cols = [key.split('-')[0] + '/N'];
    else cols = [PAIR_COL[key]];
    if (kind === '3FN' && cols.indexOf('N/PE') < 0) cols.push('N/PE');
    return cols;
  }
  /* wartości w kolumnach izolacji dla wiersza pomiaru */
  function isoValues(m, r) {
    const cols = isoColsFor(m.kind, r.key);
    const vals = {};
    cols.forEach(c => {
      if (r.iso === 'NOK') {
        const v = r.isoVals && r.isoVals[c];
        vals[c] = v == null ? '' : String(v).trim();
      } else {
        vals[c] = '>100';
      }
    });
    return vals;
  }
  /* R dp – minimalna dopuszczalna rezystancja izolacji [MΩ] */
  const R_DP = 1;
  /* wartość z kolumny izolacji jako liczba: ">100" -> 100, "<1" -> tuż poniżej 1 */
  function isoNum(v) {
    const s = v == null ? '' : String(v).trim();
    if (!s) return null;
    const mm = /^([<>]?)\s*(.*)$/.exec(s);
    const n = num(mm[2]);
    if (n === null) return null;
    return mm[1] === '<' ? n - 1e-9 : n;
  }
  function isoBelow(v) { const n = isoNum(v); return n !== null && n < R_DP; }
  /* ocena izolacji wiersza: pozytywna gdy wszystkie wartości >= R dp */
  function isoResult(m, r) {
    const vals = isoValues(m, r);
    const nums = Object.keys(vals).map(c => isoNum(vals[c]));
    if (!nums.length || nums.some(n => n === null)) return null;
    return nums.every(n => n >= R_DP) ? 'Pozytywna' : 'Negatywna';
  }
  function flattenIso(loopDoc) {
    return flattenLoop(loopDoc).map(x => {
      if (x.type !== 'row') return x;
      return Object.assign({}, x, { iso: isoValues(x.m, x.r), result: isoResult(x.m, x.r) });
    });
  }

  /* ---------- RCD ---------- */
  function rcdLabel(t) {
    if (!t) return '';
    const parts = [fmt(num(t.In)) + 'A', fmt(num(t.IdN)) + 'mA'];
    if (t.cls) parts.push(t.cls);
    return parts.join(' ');
  }
  function calcRcd(row) {
    const t = row.type || {};
    const IdN = num(t.IdN), tmax = num(t.tmax), tt = num(row.t), I = num(row.I);
    let result = null;
    if (IdN !== null && tmax !== null && tt !== null && I !== null) {
      result = (I >= 0.5 * IdN && I <= IdN && tt <= tmax) ? 'Pozytywna' : 'Negatywna';
    }
    return { IdN, tmax, t: tt, I, result, label: rcdLabel(t) };
  }
  function newRcdRow(type) {
    return { id: uid(), name: '', type: type ? snapRcd(type) : null, t: '', I: '' };
  }
  function snapRcd(t) {
    return { id: t.id, In: t.In, IdN: t.IdN, tmax: t.tmax, cls: t.cls || '' };
  }

  /* ---------- wykonawcy / SEP ---------- */
  function sepText(ex) {
    const certs = (ex && ex.certs) || [];
    return certs.filter(c => c.group || c.cat || c.nr).map(c => {
      let s = 'SEP ' + [c.cat, c.group].filter(Boolean).join(' ');
      if (c.nr) s += ' nr ' + c.nr;
      return s.trim();
    }).join('; ');
  }

  /* ---------- parametry sieci ---------- */
  const DEFAULT_NETWORK = { Un: '230', Uo: '230', Ul: '50', ko: '1,0', ta: '0,20', type: 'TN-S' };
  const NETWORK_TYPES = ['TN-S', 'TN-C', 'TN-C-S', 'TT', 'IT'];
  function networkLine(n) {
    n = Object.assign({}, DEFAULT_NETWORK, n || {});
    return 'Un = ' + n.Un + ' V, Uo = ' + n.Uo + ' V, Ul = ' + n.Ul + ' V, ko = ' + n.ko +
      ', ta = ' + n.ta + ' s, Typ sieci = ' + n.type;
  }

  /* ---------- daty ---------- */
  function docDate(iso) {
    if (!iso) return '';
    const p = String(iso).split('-');
    if (p.length < 2) return iso;
    return p[1] + '/' + p[0];
  }
  function uiDate(iso) {
    if (!iso) return '';
    const p = String(iso).split('-');
    return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : iso;
  }
  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ---------- ustawienia domyślne ---------- */
  function defaultBreakers() {
    const sizes = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63];
    const list = [];
    sizes.forEach(s => list.push({ id: uid(), name: 'B' + s, In: String(s), k: '5' }));
    sizes.forEach(s => list.push({ id: uid(), name: 'C' + s, In: String(s), k: '10' }));
    list.push({ id: uid(), name: 'PKZM0', In: '6,3', k: '5' });
    return list;
  }
  function defaultRcdTypes() {
    return [
      { id: uid(), In: '10', IdN: '30', tmax: '300', cls: '' },
      { id: uid(), In: '25', IdN: '30', tmax: '300', cls: '' },
      { id: uid(), In: '40', IdN: '30', tmax: '300', cls: '' },
      { id: uid(), In: '63', IdN: '30', tmax: '300', cls: '' }
    ];
  }
  function defaultSettings() {
    return {
      executors: [],
      breakers: defaultBreakers(),
      rcdTypes: defaultRcdTypes(),
      network: Object.assign({}, DEFAULT_NETWORK)
    };
  }

  /* ---------- projekt / dokumenty ---------- */
  const DOC_TYPES = {
    loop: { title: 'Pomiar impedancji pętli zwarcia', short: 'Pętla zwarcia', file: 'Petla' },
    iso: { title: 'Pomiar rezystancji izolacji', short: 'Rezystancja izolacji', file: 'Izolacja' },
    rcd: { title: 'Pomiar zabezpieczeń różnicowo-prądowych', short: 'Różnicówki (RCD)', file: 'Roznicowo-pradowe' }
  };
  const DOC_HEADINGS = {
    loop: '(TN-C, TN-S) Badanie ochrony przed porażeniem przez samoczynne wyłączenie',
    iso: '(TN-C, TN-S) Badanie rezystancji izolacji obwodów',
    rcd: '(TN-C, TN-S) Badanie zabezpieczenia różnicowo prądowego'
  };
  function newDoc(type) {
    const d = { id: uid(), type: type };
    if (type === 'loop') d.groups = [];
    if (type === 'rcd') d.rows = [];
    return d;
  }
  function newProject(settings) {
    const now = Date.now();
    return {
      id: uid(), name: '', location: '', date: today(),
      executors: [],
      network: Object.assign({}, (settings && settings.network) || DEFAULT_NETWORK),
      docs: [], created: now, updated: now
    };
  }
  function getDoc(p, type) { return (p.docs || []).find(d => d.type === type) || null; }

  /* kolejna nazwa: "Gniazdo 3" -> "Gniazdo 4" */
  function nextName(name) {
    const m = /^(.*?)(\d+)(\s*)$/.exec(name || '');
    if (!m) return name || '';
    return m[1] + (parseInt(m[2], 10) + 1) + m[3];
  }

  function safeFile(s) {
    const map = { 'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z', 'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z' };
    return String(s || '').replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, c => map[c])
      .replace(/[^A-Za-z0-9_-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 60);
  }
  function projectTitle(p) { return (p.name && p.name.trim()) || (p.location && p.location.trim()) || 'Projekt bez nazwy'; }

  window.EP = {
    uid, num, fmt, show,
    KINDS, PHASES, ROWS_3F, ROWS_3FN, ISO_COLS, NETWORK_TYPES, DEFAULT_NETWORK, DOC_TYPES, DOC_HEADINGS,
    rowKeysFor, phaseLabel, multiTitle, newRow, newMeasurement, rebuildRows, calcLoop, flattenLoop, loopStats,
    isoColsFor, isoValues, flattenIso, isoNum, isoBelow, isoResult, R_DP,
    rcdLabel, calcRcd, newRcdRow, snapRcd,
    sepText, networkLine, docDate, uiDate, today,
    defaultSettings, defaultBreakers, defaultRcdTypes,
    newDoc, newProject, getDoc, nextName, safeFile, projectTitle
  };
})();
