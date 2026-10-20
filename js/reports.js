/* el_Pomiary – protokoły i sprawozdanie (treść dokumentów, numeracja, wnioski) */
(function () {
  'use strict';
  const E = window.EP;

  const MONTHS = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
  const PROTO = {
    iso: { title: 'Sprawdzenie stanu izolacji obwodów i urządzeń elektrycznych', short: 'Protokół izolacji', file: 'Protokol_izolacji' },
    loop: { title: 'Sprawdzenie skuteczności ochrony przeciwporażeniowej przez szybkie wyłączenie', short: 'Protokół ochrony (pętla zwarcia)', file: 'Protokol_ochrony' },
    rcd: { title: 'Sprawdzenie skuteczności ochrony przeciwporażeniowej realizowanej przez wyłączniki różnicowoprądowe', short: 'Protokół ochrony (RCD)', file: 'Protokol_RCD' }
  };
  const ORDER = ['iso', 'loop', 'rcd'];

  /* ---------- daty ---------- */
  function monthText(iso) {
    const p = String(iso || '').split('-');
    if (p.length < 2) return '';
    return MONTHS[parseInt(p[1], 10) - 1] + ' ' + p[0] + ' r.';
  }
  function monthKey(iso) {
    const p = String(iso || '').split('-');
    return p.length < 2 ? '' : p[1] + '.' + p[0];
  }

  /* ---------- które protokoły są w projekcie ---------- */
  function protocolTypes(p) {
    const loop = E.getDoc(p, 'loop');
    return ORDER.filter(t => t === 'iso' ? !!(loop && E.getDoc(p, 'iso')) : !!E.getDoc(p, t));
  }

  /* ---------- numeracja N/MM.RRRR ---------- */
  function parseNo(s) { const m = /^\s*(\d+)\s*\/\s*(\d{2}\.\d{4})\s*$/.exec(s || ''); return m ? { n: +m[1], mk: m[2] } : null; }
  function missingNumbers(p) { return protocolTypes(p).filter(t => !(p.numbers || {})[t]); }
  function assignNumbers(p, allProjects) {
    p.numbers = p.numbers || {};
    const mk = monthKey(p.date);
    if (!mk) return false;
    let max = 0;
    (allProjects || []).concat([p]).forEach(q => {
      const nums = (q.id === p.id ? p.numbers : q.numbers) || {};
      Object.keys(nums).forEach(k => { const x = parseNo(nums[k]); if (x && x.mk === mk && x.n > max) max = x.n; });
    });
    let changed = false;
    protocolTypes(p).forEach(t => { if (!p.numbers[t]) { max++; p.numbers[t] = max + '/' + mk; changed = true; } });
    return changed;
  }

  /* ---------- wyniki i wnioski ---------- */
  function resultsFor(p, type) {
    const loop = E.getDoc(p, 'loop');
    let rows = [];
    if (type === 'iso' && loop) rows = E.flattenIso(loop).filter(x => x.type === 'row').map(x => ({ lp: x.lp, r: x.result }));
    if (type === 'loop' && loop) rows = E.flattenLoop(loop).filter(x => x.type === 'row').map(x => ({ lp: x.lp, r: x.calc.result }));
    if (type === 'rcd') { const d = E.getDoc(p, 'rcd'); rows = ((d && d.rows) || []).map((r, i) => ({ lp: i + 1, r: E.calcRcd(r).result })); }
    const neg = rows.filter(x => x.r === 'Negatywna');
    return {
      total: rows.length, pos: rows.filter(x => x.r === 'Pozytywna').length, neg: neg.length,
      empty: rows.filter(x => x.r === null).length, negLps: neg.map(x => x.lp),
      ok: rows.length > 0 && neg.length === 0 && rows.some(x => x.r === 'Pozytywna')
    };
  }
  function lpList(lps) { return lps.length > 12 ? lps.slice(0, 12).join(', ') + ' i inne' : lps.join(', '); }
  function conclusion(p, type) {
    const r = resultsFor(p, type);
    if (!r.total || r.pos + r.neg === 0) return { ok: null, text: 'Brak wyników pomiarów.' };
    if (type === 'iso') return r.neg ? { ok: false, text: 'Izolacja badanych obwodów i urządzeń elektrycznych nie spełnia wymagań przepisów (obwody z oceną negatywną: Lp. ' + lpList(r.negLps) + ').' }
      : { ok: true, text: 'Izolacja badanych obwodów i urządzeń elektrycznych spełnia wymagania przepisów.' };
    if (type === 'loop') return r.neg ? { ok: false, text: 'Ochrona przeciwporażeniowa przez szybkie wyłączenie nie jest skuteczna (obwody z oceną negatywną: Lp. ' + lpList(r.negLps) + ').' }
      : { ok: true, text: 'Ochrona przeciwporażeniowa badanych urządzeń jest skuteczna.' };
    return r.neg ? { ok: false, text: 'Ochrona przeciwporażeniowa realizowana przez wyłączniki różnicowoprądowe nie jest skuteczna (wyłączniki z oceną negatywną: Lp. ' + lpList(r.negLps) + ').' }
      : { ok: true, text: 'Wyłączniki różnicowoprądowe działają prawidłowo – ochrona przeciwporażeniowa jest skuteczna.' };
  }
  function overall(p) {
    const types = protocolTypes(p);
    const cs = types.map(t => conclusion(p, t));
    if (!types.length || cs.every(c => c.ok === null)) return null;
    return cs.every(c => c.ok !== false);
  }

  /* ---------- braki przed generowaniem ---------- */
  function issues(p, types) {
    const out = [];
    if (!(p.client || '').trim()) out.push('brak zleceniodawcy');
    if (!(p.location || '').trim()) out.push('brak nazwy obiektu (miejsca pomiarów)');
    if (!(p.executors || []).length) out.push('nie wybrano, kto przeprowadził pomiary');
    if (!p.checkedBy) out.push('nie wybrano, kto sprawdził protokół (pole zostanie puste do podpisu)');
    types.forEach(t => {
      const r = resultsFor(p, t);
      if (r.empty) out.push(PROTO[t].short + ': niekompletne pomiary – ' + r.empty);
      if (!instrumentsFor(p, t).length) out.push(PROTO[t].short + ': nie wybrano przyrządu pomiarowego');
    });
    return out;
  }

  /* ---------- pomocnicze teksty ---------- */
  function instrumentsFor(p, type) { return (p.instruments || []).filter(i => !type || i[type]); }
  function instrText(list) { return list.map(i => i.name + (i.serial ? ' nr ' + i.serial : '')).join(', '); }
  function net(p) { return Object.assign({}, E.DEFAULT_NETWORK, p.network || {}); }
  function companyLines(settings) { return String((settings && settings.company) || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean); }
  function person(ex) { return ex ? { name: ex.name, sep: E.sepText(ex) } : null; }
  function rcdIdn(p) {
    const d = E.getDoc(p, 'rcd'); const set = [];
    ((d && d.rows) || []).forEach(r => { const v = r.type && E.num(r.type.IdN); if (v !== null && v !== undefined && set.indexOf(v) < 0) set.push(v); });
    set.sort((a, b) => a - b);
    return set.length ? set.map(v => E.fmt(v) + ' mA').join(' i ') : '30 mA';
  }
  function rcdTmax(p) {
    const d = E.getDoc(p, 'rcd'); const set = [];
    ((d && d.rows) || []).forEach(r => { const v = r.type && E.num(r.type.tmax); if (v !== null && v !== undefined && set.indexOf(v) < 0) set.push(v); });
    set.sort((a, b) => a - b);
    return set.length ? set.map(v => E.fmt(v) + ' ms').join(' / ') : '300 ms';
  }
  const letters = 'abcdefghij';

  /* ---------- treść protokołu ---------- */
  function protocolBlocks(p, type, settings) {
    const n = net(p);
    const no = (p.numbers || {})[type] || '…/' + monthKey(p.date);
    const blocks = [{ t: 'company', lines: companyLines(settings) }, { t: 'title', text: 'P R O T O K Ó Ł   N R   ' + no }, { t: 'subtitle', text: PROTO[type].title }];
    const items = [];
    items.push({ label: 'Zleceniodawca:', value: p.client || '' });
    items.push({ label: 'Nazwa obiektu:', value: p.location || '' });
    items.push({ label: 'Napięcie znamionowe instalacji:', value: (n.Unom || '') + ' V' });
    items.push({ label: 'Układ sieci zasilającej:', value: n.type });
    items.push({ label: 'Napięcie dopuszczalne długotrwale:', value: 'UL = ' + n.Ul + ' V' });
    if (type === 'iso') items.push({ label: 'Wymagana przepisami wartość rezystancji izolacji:', value: '≥ ' + E.fmt(E.R_DP) + ' MΩ' });
    if (type === 'loop') items.push({ label: 'Wymagany czas zadziałania urządzenia ochronnego:', value: 't < ' + E.show(n.ta) + ' s (Zs ≤ Za = U / Ia)' });
    if (type === 'rcd') items.push({ label: 'Wymagania dla wyłączników różnicowoprądowych:', value: '0,5·IΔn ≤ IΔ ≤ IΔn, czas zadziałania t ≤ ' + rcdTmax(p) });
    const via = [];
    if (E.getDoc(p, 'loop')) via.push('urządzenia ochronne przetężeniowe');
    if (E.getDoc(p, 'rcd')) via.push('urządzenia ochronne różnicowoprądowe');
    if (!via.length) via.push(type === 'rcd' ? 'urządzenia ochronne różnicowoprądowe' : 'urządzenia ochronne przetężeniowe');
    items.push({ label: 'Samoczynne wyłączenie zasilania jest realizowane przez:', sub: via.map((v, i) => letters[i] + ') ' + v) });
    items.push({ label: 'Symbole i nazwy badanych urządzeń oraz pomieszczeń zgodne z opisem badanych urządzeń i obwodów.' });
    const ins = instrumentsFor(p, type);
    items.push({ label: 'Pomiary wykonano ' + (ins.length > 1 ? 'przyrządami:' : 'przyrządem:'), value: instrText(ins) || '—' });
    items.push({ label: 'Wyniki pomiarów zgodne z aktualnie obowiązującymi przepisami i normami oraz posiadaną wiedzą techniczną.' });
    items.push({ label: 'Data wykonania pomiarów:', value: monthText(p.date) });
    const c = conclusion(p, type);
    items.push({ label: 'Wnioski z pomiarów:', value: c.text });
    blocks.push({ t: 'items', items: items });
    blocks.push({ t: 'para', text: 'Wyniki pomiarów zawiera załączona tabela „' + E.DOC_TYPES[type].title + '”.', small: true });
    blocks.push(signBlock(p, ['Pomiary przeprowadził:', 'Protokół sprawdził:', 'Protokół otrzymał:']));
    return blocks;
  }
  function signBlock(p, labels) {
    return {
      t: 'sign', cols: [
        { label: labels[0], people: (p.executors || []).map(person) },
        { label: labels[1], people: p.checkedBy ? [person(p.checkedBy)] : [] },
        { label: labels[2], people: [] }
      ]
    };
  }

  /* ---------- treść sprawozdania ---------- */
  function reportBlocks(p, settings) {
    const n = net(p);
    const hasLoop = !!E.getDoc(p, 'loop'), hasIso = protocolTypes(p).indexOf('iso') >= 0, hasRcd = !!E.getDoc(p, 'rcd');
    const blocks = [{ t: 'company', lines: companyLines(settings) },
      { t: 'title', text: 'SPRAWOZDANIE Z BADANIA' }, { t: 'title2', text: 'OCHRONY PRZECIWPORAŻENIOWEJ' }, { t: 'title2', text: 'URZĄDZEŃ I INSTALACJI ELEKTRYCZNEJ' }];
    const items = [];
    items.push({ label: 'Zleceniodawca:', value: p.client || '' });
    items.push({ label: 'Nazwa i miejsce obiektu objętego badaniami:', value: p.location || '' });
    items.push({ label: (p.inspection === 'okresowe' ? 'Pomiary okresowe' : 'Pomiary powykonawcze') + ' i kontrola stanu technicznego.' });
    let desc = 'Instalacja została wykonana w układzie ' + n.type + '.';
    if (hasRcd) {
      desc += ' Ochrona przeciwporażeniowa zapewniona jest przez samoczynne wyłączenie zasilania realizowane przez wyłączniki różnicowoprądowe o prądzie różnicowym ' + rcdIdn(p) + ' w obwodach odbiorczych.';
      if (hasLoop) desc += ' Ponadto zastosowane przekroje przewodów (pętla zwarcia) pozwalają na osiągnięcie ochrony przez szybkie wyłączenie wyłączników samoczynnych w przypadku uszkodzenia członów różnicowoprądowych.';
    } else if (hasLoop) {
      desc += ' Ochrona przeciwporażeniowa zapewniona jest przez samoczynne wyłączenie zasilania realizowane przez urządzenia ochronne przetężeniowe (szybkie wyłączenie).';
    }
    items.push({ label: 'Opis instalacji i rodzaj ochrony przeciwporażeniowej:', paras: ['Napięcie znamionowe instalacji wynosi ' + (n.Unom || '') + ' V.', desc] });
    const scope = ['oględziny instalacji', 'opis i numeracja urządzeń'];
    if (hasIso) scope.push('pomiary stanu izolacji instalacji');
    if (hasRcd) scope.push('pomiary i ocena skuteczności ochrony przeciwporażeniowej urządzeń i instalacji elektrycznych zabezpieczonych wyłącznikami ochronnymi różnicowoprądowymi');
    if (hasLoop) scope.push('pomiary i ocena skuteczności ochrony przeciwporażeniowej przez szybkie wyłączenie wyłączników samoczynnych');
    scope.push('wykonanie protokołów z przeprowadzonych badań i pomiarów');
    items.push({ label: 'Zakres prac:', sub: scope.map((s, i) => letters[i] + ') ' + s) });
    const ok = overall(p);
    const protos = protocolTypes(p).map(t => 'Nr ' + ((p.numbers || {})[t] || '…') + ' – ' + PROTO[t].title.charAt(0).toLowerCase() + PROTO[t].title.slice(1));
    items.push({
      label: 'Wyniki:', paras: ['Na podstawie przeprowadzonych oględzin i badań urządzeń i szaf zasilająco-sterujących stwierdza się prawidłowość oznaczeń, opisów i kolorystyki użytych przewodów. Połączenia mechaniczne wykonane prawidłowo. Wyniki badań i pomiarów dołączono do niniejszego sprawozdania w formie protokołów:'],
      sub: protos,
      after: ['Ciągłość przewodów ochronnego i neutralnego została zachowana. ' + (ok === false
        ? 'Część wyników przeprowadzonych pomiarów nie mieści się w granicach wymaganych stosownymi przepisami i normami – szczegóły w załączonych protokołach.'
        : 'Wyniki przeprowadzonych pomiarów mieszczą się w granicach wymaganych stosownymi przepisami i normami.')]
    });
    items.push({
      label: 'Wnioski ze sprawdzenia i badania:', paras: [ok === false
        ? 'Badana instalacja nie spełnia wymogów bezpieczeństwa w zakresie ochrony przeciwporażeniowej i nie może zostać dopuszczona do eksploatacji do czasu usunięcia stwierdzonych usterek.'
        : 'Badana instalacja spełnia wymogi bezpieczeństwa w zakresie ochrony przeciwporażeniowej i zostaje dopuszczona do eksploatacji.']
    });
    items.push({ label: 'Wykaz sprzętu:', value: instrText(instrumentsFor(p)) || '—' });
    items.push({ label: 'Data wykonania sprawdzenia i badania:', value: monthText(p.date) });
    blocks.push({ t: 'items', items: items });
    blocks.push(signBlock(p, ['Sprawdzenia i badania przeprowadził:', 'Sprawozdanie sprawdził:', 'Sprawozdanie otrzymał:']));
    return blocks;
  }

  function fileBase(p, what) {
    const base = what === 'report' ? 'Sprawozdanie' : what === 'all' ? 'Komplet' : PROTO[what].file;
    return [base, E.safeFile(p.location || p.name), (p.date || '').slice(0, 7)].filter(Boolean).join('_');
  }

  window.REPORTS = { PROTO, ORDER, MONTHS, monthText, monthKey, protocolTypes, missingNumbers, assignNumbers, parseNo, resultsFor, conclusion, overall, issues, instrumentsFor, protocolBlocks, reportBlocks, fileBase };
})();
