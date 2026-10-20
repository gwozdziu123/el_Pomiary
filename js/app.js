/* el_Pomiary – interfejs aplikacji (system wizualny el_Fuszka) */
(function () {
  'use strict';
  const E = window.EP;
  const APP_VERSION = '1.4.3';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = o => JSON.parse(JSON.stringify(o));

  /* ---------- ikony (zestaw systemu + uzupełnienia w tym samym stylu) ---------- */
  const ICONS = {
    folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.6l2 2h8.4A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    more: '<circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    cable: '<path d="M4 18c4 0 4-12 8-12s4 12 8 12"/><circle cx="4" cy="18" r="1.6"/><circle cx="20" cy="18" r="1.6"/>',
    wave: '<path d="M3 12c1.5-4 3-4 4.5 0s3 4 4.5 0 3-4 4.5 0 3 4 4.5 0"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
    warn: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>',
    chev: '<path d="m9 5 7 7-7 7"/>',
    chevd: '<path d="m5 9 7 7 7-7"/>',
    up: '<path d="m5 15 7-7 7 7"/>',
    down: '<path d="m5 9 7 7 7-7"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    table: '<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M3.5 15h17M9.5 4v16"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>'
  };
  const ic = n => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || '') + '</svg>';

  /* ---------- stan ---------- */
  const S = { settings: null, project: null, collapsed: {}, loopView: 'list', installEvt: null, search: '' };
  const view = () => $('#view');
  const coarse = () => matchMedia('(pointer: coarse)').matches;

  /* ---------- zapis ---------- */
  let saveTimer = null, saveFn = null;
  function markSaved() {
    const el = $('#saved'); if (!el) return;
    el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 1200);
  }
  function schedule(fn) { clearTimeout(saveTimer); saveFn = fn; saveTimer = setTimeout(flush, 350); }
  function flush() {
    clearTimeout(saveTimer); saveTimer = null;
    const fn = saveFn; saveFn = null;
    return fn ? fn().then(markSaved).catch(e => toast('Nie udało się zapisać: ' + e.message)) : Promise.resolve();
  }
  const saveProject = now => { const p = S.project; if (!p) return Promise.resolve(); schedule(() => DB.saveProject(p)); return now ? flush() : Promise.resolve(); };
  const saveSettings = now => { schedule(() => DB.saveSettings(S.settings)); return now ? flush() : Promise.resolve(); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pagehide', flush);

  /* ---------- toast / arkusz / dialog ---------- */
  let toastT = null;
  function toast(msg, ms) {
    const t = $('#toast');
    t.innerHTML = msg; t.classList.add('show');
    clearTimeout(toastT);
    if (ms !== 0) toastT = setTimeout(() => t.classList.remove('show'), ms || 2600);
    return { remove: () => t.classList.remove('show') };
  }
  function openSheet(opts) {
    const root = document.createElement('div');
    root.className = 'sheet-root';
    root.innerHTML = '<div class="backdrop"></div><div class="sheet" role="dialog" aria-modal="true">' +
      '<div class="grab"></div><div class="sheet-head"><h2>' + esc(opts.title) + '</h2><button class="icon-btn" data-close aria-label="Zamknij">' + ic('close') + '</button></div>' +
      '<div class="sheet-body"></div><div class="sheet-foot"></div></div>';
    document.body.appendChild(root);
    document.body.classList.add('noscroll');
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('open')));
    const sh = { el: root, body: $('.sheet-body', root), foot: $('.sheet-foot', root), onclose: null };
    const esck = e => { if (e.key === 'Escape' && !$('.dlg-back')) sh.close(); };
    sh.close = () => {
      if (sh.closed) return; sh.closed = true;
      root.classList.remove('open');
      document.removeEventListener('keydown', esck);
      setTimeout(() => { root.remove(); if (!$('.sheet-root')) document.body.classList.remove('noscroll'); }, 230);
      if (sh.onclose) sh.onclose();
    };
    document.addEventListener('keydown', esck);
    $('[data-close]', root).onclick = () => sh.close();
    $('.backdrop', root).onclick = () => sh.close();
    return sh;
  }
  function closeAllSheets() { $$('.sheet-root, .dlg-back').forEach(o => o.remove()); document.body.classList.remove('noscroll'); }
  function dialog(html, buttons) {
    return new Promise(res => {
      const back = document.createElement('div');
      back.className = 'dlg-back';
      back.innerHTML = '<div class="dlg" role="alertdialog" aria-modal="true">' + html + '<div class="dlg-btns">' +
        buttons.map((b, i) => '<button class="btn ' + b.cls + '" data-i="' + i + '">' + esc(b.label) + '</button>').join('') + '</div></div>';
      document.body.appendChild(back);
      const done = v => { back.remove(); document.removeEventListener('keydown', k); res(v); };
      const k = e => { if (e.key === 'Escape') done(null); };
      document.addEventListener('keydown', k);
      back.onclick = e => {
        if (e.target === back) return done(null);
        const b = e.target.closest('[data-i]'); if (b) done(buttons[+b.dataset.i].value);
      };
      back._done = done;
    });
  }
  function confirmDlg(msg, okLabel, danger) {
    return dialog('<p>' + msg + '</p>', [{ label: 'Anuluj', cls: 'ghost', value: false }, { label: okLabel || 'OK', cls: danger ? 'danger' : 'primary', value: true }])
      .then(v => !!v);
  }
  function promptDlg(title, value, placeholder) {
    const p = dialog('<div class="field"><label for="pv">' + esc(title) + '</label><input class="inp" id="pv" value="' + esc(value || '') + '" placeholder="' + esc(placeholder || '') + '" enterkeyhint="done" autocomplete="off"></div>',
      [{ label: 'Anuluj', cls: 'ghost', value: null }, { label: 'Zapisz', cls: 'primary', value: 'ok' }]);
    const inp = $('#pv');
    setTimeout(() => { inp.focus(); inp.select(); }, 50);
    inp.onkeydown = e => { if (e.key === 'Enter') inp.closest('.dlg-back')._done('ok'); };
    return p.then(v => v === 'ok' ? inp.value.trim() : null);
  }
  function menuSheet(title, items) {
    return new Promise(res => {
      const sh = openSheet({ title: title });
      sh.body.innerHTML = '<div class="menu-list">' + items.map((it, i) =>
        '<button data-i="' + i + '"' + (it.danger ? ' class="danger"' : '') + (it.disabled ? ' disabled style="opacity:.45"' : '') + '>' + ic(it.icon) +
        '<span>' + esc(it.label) + (it.sub ? '<small>' + esc(it.sub) + '</small>' : '') + '</span></button>').join('') + '</div>';
      let picked = null;
      sh.onclose = () => res(picked);
      sh.body.onclick = e => { const b = e.target.closest('[data-i]'); if (!b || b.disabled) return; picked = items[+b.dataset.i].value; sh.close(); };
    });
  }

  /* ---------- pliki ---------- */
  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 5000);
  }
  function canShareFile(file) { try { return !!(navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) { return false; } }
  function fileReady(blob, name) {
    const file = new File([blob], name, { type: blob.type });
    if (!coarse() || !canShareFile(file)) { download(blob, name); toast('Plik zapisany w Pobranych'); return; }
    const sh = openSheet({ title: 'Plik gotowy' });
    sh.body.innerHTML = '<p class="muted small" style="word-break:break-all;margin:0 0 4px">' + esc(name) + '</p>';
    sh.foot.innerHTML = '<button class="btn ghost" data-a="dl">' + ic('download') + 'Pobierz</button><button class="btn primary" data-a="sh">' + ic('share') + 'Udostępnij</button>';
    sh.foot.onclick = e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a === 'dl') { download(blob, name); sh.close(); toast('Plik zapisany w Pobranych'); }
      else navigator.share({ files: [file], title: name }).then(() => sh.close()).catch(() => { });
    };
  }
  function pickFile(accept) {
    return new Promise(res => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = accept;
      inp.onchange = () => res(inp.files && inp.files[0]);
      inp.click();
    });
  }
  const loaded = {};
  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res;
      s.onerror = () => { delete loaded[src]; rej(new Error('nie można wczytać ' + src)); };
      document.head.appendChild(s);
    });
    return loaded[src];
  }
  function ensureLibs(kind) {
    if (kind === 'xlsx') return loadScript('lib/exceljs.min.js');
    if (kind === 'docx') return loadScript('lib/docx.min.js');
    return loadScript('lib/jspdf.umd.min.js').then(() => loadScript('lib/jspdf.plugin.autotable.min.js')).then(() => loadScript('fonts/fonts.js'));
  }
  function docOrder(p) { return ['loop', 'iso', 'rcd'].filter(t => E.getDoc(p, t)); }
  async function doExport(kind, types) {
    const p = S.project;
    await flush();
    if (!types.length) return toast('Brak dokumentów do eksportu');
    const t = toast('<span class="spinner"></span>Tworzę plik…', 0);
    try {
      await ensureLibs(kind);
      const blob = kind === 'pdf' ? await EXPORT.buildPdf(p, types) : await EXPORT.buildXlsx(p, types);
      t.remove();
      fileReady(blob, EXPORT.fileName(p, types, kind));
    } catch (e) {
      console.error(e); toast('Nie udało się utworzyć pliku: ' + esc(e.message), 5000);
    }
  }
  function exportJson(obj, name) { fileReady(new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' }), name); }

  /* ---------- pasek górny i zakładki ---------- */
  function setTop(title, o) {
    o = o || {};
    const top = $('#topbar');
    top.className = 'topbar' + (o.back ? ' has-back' : '');
    top.innerHTML = '<div class="topbar-in">' +
      (o.back ? '<a class="icon-btn" href="' + o.back + '" aria-label="Wstecz">' + ic('back') + '</a>' : '') +
      '<h1 id="toptitle">' + esc(title) + (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</h1>' +
      '<span class="saved" id="saved">Zapisano</span>' +
      (o.menu ? '<button class="icon-btn" data-top="menu" aria-label="Więcej">' + ic('more') + '</button>' : '') + '</div>';
    top.onclick = null;
    document.title = title + ' – el_Pomiary';
    setTabs(o.tab || 'projects');
  }
  function setTabs(active) {
    const tabs = [{ id: 'projects', href: '#/', icon: 'folder', label: 'Projekty' }, { id: 'settings', href: '#/settings', icon: 'gear', label: 'Ustawienia' }];
    $('#tabbar').innerHTML = '<div class="tabbar-in">' + tabs.map(t => '<a class="tab' + (t.id === active ? ' on' : '') + '" href="' + t.href + '"' + (t.id === active ? ' aria-current="page"' : '') + '><span class="tab-ic">' + ic(t.icon) + '</span>' + t.label + '</a>').join('') + '</div>';
  }
  function onTopMenu(fn) { $('#topbar').onclick = e => { if (e.target.closest('[data-top=menu]')) fn(); }; }

  /* ---------- pomocnicze ---------- */
  function pill(result) {
    if (result === 'Pozytywna') return '<span class="pill ok">Pozytywna</span>';
    if (result === 'Negatywna') return '<span class="pill bad">Negatywna</span>';
    return '<span class="pill na">—</span>';
  }
  function aggResult(results) {
    if (results.some(r => r === 'Negatywna')) return 'Negatywna';
    if (results.some(r => r === null)) return null;
    return results.length ? 'Pozytywna' : null;
  }
  function decInput(attr, value, placeholder) {
    const v = value == null ? '' : String(value);
    const bad = v.trim() !== '' && E.num(v) === null;
    return '<input class="inp' + (bad ? ' err' : '') + '" type="text" inputmode="decimal" enterkeyhint="next" autocomplete="off" ' + attr +
      ' value="' + esc(v) + '" placeholder="' + esc(placeholder || '') + '">';
  }
  function validateDec(inp) { const v = inp.value.trim(); inp.classList.toggle('err', v !== '' && E.num(v) === null); }
  function nextFocus(e, root) {
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
    e.preventDefault();
    const ins = $$('input:not([type=checkbox]):not([disabled])', root);
    const i = ins.indexOf(e.target);
    if (i >= 0 && ins[i + 1]) { ins[i + 1].focus(); if (ins[i + 1].select) ins[i + 1].select(); } else e.target.blur();
  }
  function refreshExecutors(p) {
    (p.executors || []).forEach((ex, i) => { const cur = S.settings.executors.find(x => x.id === ex.id); if (cur) p.executors[i] = clone(cur); });
  }
  function statPills(st) {
    let h = '<span class="pill info">' + st.total + ' pom.</span>';
    if (st.pos) h += '<span class="pill ok">Pozytywne: ' + st.pos + '</span>';
    if (st.neg) h += '<span class="pill bad">Negatywne: ' + st.neg + '</span>';
    if (st.empty) h += '<span class="pill warn">Niekompletne: ' + st.empty + '</span>';
    if (st.isoNeg) h += '<span class="pill bad">Izolacja negatywna: ' + st.isoNeg + '</span>';
    return '<div class="pills">' + h + '</div>';
  }
  function rcdStats(d) {
    const res = (d.rows || []).map(r => E.calcRcd(r).result);
    return { total: res.length, pos: res.filter(r => r === 'Pozytywna').length, neg: res.filter(r => r === 'Negatywna').length, empty: res.filter(r => r === null).length };
  }
  function projectStatus(p) {
    let total = 0, neg = 0, empty = 0;
    const loop = E.getDoc(p, 'loop');
    if (loop) { const s = E.loopStats(loop); total += s.total; neg += s.neg + s.isoNeg; empty += s.empty + s.isoEmpty; }
    const rcd = E.getDoc(p, 'rcd');
    if (rcd) { const s = rcdStats(rcd); total += s.total; neg += s.neg; empty += s.empty; }
    if (!total) return { cls: 's-new', label: 'Nowy', total };
    if (neg) return { cls: 's-neg', label: 'Wyniki negatywne', total };
    if (empty) return { cls: 's-w_trakcie', label: 'W trakcie', total };
    return { cls: 's-zakonczony', label: 'Zakończony', total };
  }

  /* =====================================================================
     PROJEKTY (lista)
     ===================================================================== */
  async function viewHome() {
    setTop('Projekty', { tab: 'projects' });
    const all = await DB.listProjects();
    let h = '';
    if (!S.settings.executors.length) {
      h += '<a class="banner" href="#/settings">' + ic('warn') + '<span><b>Dodaj wykonawców</b> w Ustawieniach, żeby pojawiali się w protokołach.</span></a>';
    }
    if (all.length > 3) h += '<div class="search">' + ic('search') + '<input type="search" id="q" placeholder="Szukaj projektu" value="' + esc(S.search) + '" autocomplete="off"></div>';
    h += '<div id="plist"></div>';
    h += '<div class="btns" style="padding:4px 0 0">' +
      (S.installEvt ? '<button class="btn primary block" data-act="install">' + ic('download') + 'Zainstaluj aplikację</button>' : '') +
      '<button class="btn ghost block" data-act="import">' + ic('upload') + 'Wczytaj projekt lub kopię z pliku</button></div>';
    h += '<p class="foot-note">Dane są zapisywane tylko na tym urządzeniu. Kopię zapasową zrobisz w Ustawieniach.</p>';
    h += '<button class="fab" data-act="new">' + ic('plus') + 'Nowy projekt</button>';
    view().innerHTML = h;
    const drawList = () => {
      const q = S.search.trim().toLowerCase();
      const list = q ? all.filter(p => (E.projectTitle(p) + ' ' + (p.location || '')).toLowerCase().indexOf(q) >= 0) : all;
      let l = '';
      if (!all.length) l = '<div class="empty">' + ic('folder') + '<p>Nie masz jeszcze projektów.<br>Utwórz pierwszy przyciskiem „Nowy projekt”.</p></div>';
      else if (!list.length) l = '<div class="empty">' + ic('search') + '<p>Brak projektów pasujących do wyszukiwania.</p></div>';
      list.forEach(p => {
        const st = projectStatus(p);
        const docs = docOrder(p).length;
        l += '<div class="card"><a class="pcard" href="#/p/' + p.id + '"><div class="pc-top"><div class="pc-name">' + esc(E.projectTitle(p)) + '</div>' +
          (st.total ? '<div class="pc-sum">' + st.total + ' pom.</div>' : '') + '</div>' +
          '<div class="pc-sub">' + esc(p.name && p.location ? p.location : (docOrder(p).map(t => E.DOC_TYPES[t].short).join(', ') || 'Brak dokumentów')) + '</div>' +
          '<div class="pc-bot"><span class="badge ' + st.cls + '">' + st.label + '</span><span class="muted">' + docs + ' dok. · ' + esc(E.uiDate(p.date)) + '</span></div></a></div>';
      });
      $('#plist').innerHTML = l;
    };
    drawList();
    view().oninput = e => { if (e.target.id === 'q') { S.search = e.target.value; drawList(); } };
    view().onchange = null;
    view().onclick = async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const a = b.dataset.act;
      if (a === 'new') {
        const p = E.newProject(S.settings);
        if (S.settings.executors.length === 1) p.executors = [clone(S.settings.executors[0])];
        S.project = p; await DB.saveProject(p);
        location.hash = '#/p/' + p.id;
      }
      if (a === 'import') importJson();
      if (a === 'install' && S.installEvt) { S.installEvt.prompt(); S.installEvt = null; }
    };
  }

  async function importJson() {
    const f = await pickFile('.json,application/json');
    if (!f) return;
    let data;
    try { data = JSON.parse(await f.text()); } catch (e) { return toast('Nie udało się odczytać pliku'); }
    if (data && data.kind === 'project' && data.project && data.project.id) {
      const exists = await DB.loadProject(data.project.id);
      if (exists && !(await confirmDlg('Projekt „' + esc(E.projectTitle(exists)) + '” już istnieje.\nZastąpić go wersją z pliku?', 'Zastąp'))) data.project.id = E.uid();
      await DB.saveProject(data.project);
      toast('Wczytano projekt');
    } else if (data && data.kind === 'backup') {
      for (const p of (data.projects || [])) await DB.saveProject(p);
      if (data.settings && await confirmDlg('Kopia zawiera ustawienia (wykonawcy, wyłączniki, typy RCD).\nZastąpić obecne ustawienia?', 'Zastąp')) {
        S.settings = Object.assign(E.defaultSettings(), data.settings);
        await DB.saveSettings(S.settings);
      }
      toast('Wczytano projekty: ' + (data.projects || []).length);
    } else return toast('To nie jest plik kopii el_Pomiary');
    render();
  }

  /* =====================================================================
     PROJEKT
     ===================================================================== */
  const DOC_ICON = { loop: 'bolt', iso: 'cable', rcd: 'wave' };
  const DOC_DESC = {
    loop: 'Grupy pomieszczeń, pomiary 1F / 3F / 3FN, ocena Zs ≤ Za',
    iso: 'Generowany z pętli zwarcia (OK → >100)',
    rcd: 'Czas i prąd wyzwolenia, ocena 0,5·IΔn ≤ IΔ ≤ IΔn'
  };
  function docSummary(p, t) {
    const loop = E.getDoc(p, 'loop');
    if (t === 'loop') { const st = E.loopStats(loop); return { s: (loop.groups || []).length + ' grup · ' + st.total + ' pom.', r: st.total ? (st.neg ? 'Negatywna' : st.empty ? null : 'Pozytywna') : undefined }; }
    if (t === 'iso') {
      if (!loop) return { s: 'Wymaga pętli zwarcia' };
      const st = E.loopStats(loop);
      return { s: 'Z pętli zwarcia · ' + st.total + ' obwodów', r: st.total ? (st.isoNeg ? 'Negatywna' : st.isoEmpty ? null : 'Pozytywna') : undefined };
    }
    const st = rcdStats(E.getDoc(p, 'rcd'));
    return { s: st.total + ' pom.', r: st.total ? (st.neg ? 'Negatywna' : st.empty ? null : 'Pozytywna') : undefined };
  }

  function refreshInstruments(p) {
    (p.instruments || []).forEach((ins, i) => { const cur = S.settings.instruments.find(x => x.id === ins.id); if (cur) p.instruments[i] = clone(cur); });
    if (p.checkedBy) { const cur = S.settings.executors.find(x => x.id === p.checkedBy.id); if (cur) p.checkedBy = clone(cur); }
  }
  function funcPills(i) {
    return [['iso', 'izolacja'], ['loop', 'pętla'], ['rcd', 'RCD']].filter(f => i[f[0]]).map(f => '<span class="pill info">' + f[1] + '</span>').join(' ');
  }
  function viewProject() {
    const p = S.project;
    p.network = Object.assign({}, E.DEFAULT_NETWORK, p.network || {});
    p.numbers = p.numbers || {}; p.instruments = p.instruments || [];
    refreshExecutors(p); refreshInstruments(p);
    setTop(E.projectTitle(p), { back: '#/', sub: 'Protokół · ' + E.uiDate(p.date), menu: true });
    onTopMenu(() => projectMenu(p));
    const n = p.network;
    let h = '<div class="sec-title">Dane pomiarów</div><div class="card card-pad">' +
      '<div class="field"><label for="f-cli">Zleceniodawca</label><textarea class="inp" id="f-cli" data-f="client" rows="2" placeholder="Ulica, Miejscowość, Kod pocztowy - Nazwa zleceniodawcy">' + esc(p.client || '') + '</textarea></div>' +
      '<div class="field"><label for="f-loc">Nazwa obiektu / miejsce pomiarów</label><textarea class="inp" id="f-loc" data-f="location" rows="2" placeholder="Ulica, Miejscowość, Kod pocztowy - Nazwa obiektu">' + esc(p.location) + '</textarea></div>' +
      '<div class="two"><div class="field"><label for="f-date">Data pomiarów</label><input class="inp" type="date" id="f-date" data-f="date" value="' + esc(p.date) + '"></div>' +
      '<div class="field"><label for="f-name">Nazwa (opcjonalnie)</label><input class="inp" id="f-name" data-f="name" value="' + esc(p.name) + '" placeholder="Nazwa projektu"></div></div>' +
      '<div class="field"><label>Rodzaj badania</label><div class="segp">' + [['powykonawcze', 'Powykonawcze'], ['okresowe', 'Okresowe']].map(o => '<button type="button" data-insp="' + o[0] + '" class="' + ((p.inspection || 'powykonawcze') === o[0] ? 'on' : '') + '">' + o[1] + '</button>').join('') + '</div></div>' +
      '<div class="hint" style="margin-top:-6px">W tabelach data pojawi się jako ' + esc(E.docDate(p.date)) + ', w protokołach jako „' + esc(REPORTS.monthText(p.date)) + '”.</div></div>';

    h += '<details class="card"><summary>Parametry sieci</summary><div class="body"><div class="hint" id="netline" style="margin:0 0 12px">' + esc(E.networkLine(n)) + '</div>' +
      '<div class="field"><label>Napięcie znamionowe instalacji</label><div class="suffix"><input class="inp" data-n="Unom" value="' + esc(n.Unom || '') + '" placeholder="400/230" autocomplete="off"><span>V</span></div></div><div class="two">' +
      ['Un', 'Uo', 'Ul'].map(k => '<div class="field"><label>' + k + '</label><div class="suffix">' + decInput('data-n="' + k + '"', n[k]) + '<span>V</span></div></div>').join('') +
      '<div class="field"><label>ko</label>' + decInput('data-n="ko"', n.ko) + '</div>' +
      '<div class="field"><label>ta</label><div class="suffix">' + decInput('data-n="ta"', n.ta) + '<span>s</span></div></div>' +
      '<div class="field"><label>Typ sieci</label><select class="inp" data-n="type">' + E.NETWORK_TYPES.map(t => '<option' + (t === n.type ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></div>' +
      '</div></div></details>';

    /* wykonawcy: jedna osoba przeprowadza, jedna sprawdza */
    const exOpt = x => esc(x.name) + (E.sepText(x) ? ' · ' + esc(E.sepText(x)) : ' · brak uprawnień SEP');
    const personSelect = (id, attr, cur, emptyLabel) => {
      const list = S.settings.executors.slice();
      if (cur && !list.find(x => x.id === cur.id)) list.push(Object.assign({ _gone: true }, cur));
      return '<select class="inp" id="' + id + '" ' + attr + '><option value="">' + emptyLabel + '</option>' +
        list.map(x => '<option value="' + x.id + '"' + (cur && x.id === cur.id ? ' selected' : '') + '>' + exOpt(x) + (x._gone ? ' (usunięty z ustawień)' : '') + '</option>').join('') + '</select>';
    };
    if ((p.executors || []).length > 1) p.executors = p.executors.slice(0, 1);
    const perf = (p.executors || [])[0] || null;
    h += '<div class="sec-title">Wykonawcy</div><div class="card card-pad">';
    if (!S.settings.executors.length && !perf && !p.checkedBy) h += '<div class="hint" style="margin:0 0 12px">Brak wykonawców. <a href="#/settings" style="color:var(--primary);font-weight:600">Dodaj w Ustawieniach</a></div>';
    const sepHint = x => x ? (esc(E.sepText(x)) || 'Brak uprawnień SEP') : '';
    h += '<div class="field"><label for="f-perf">Pomiary przeprowadził</label>' + personSelect('f-perf', 'data-perf="1"', perf, '— wybierz osobę —') + '<div class="hint" id="h-perf">' + sepHint(perf) + '</div></div>' +
      '<div class="field" style="margin:0"><label for="f-chk">Protokół sprawdził</label>' + personSelect('f-chk', 'data-chk="1"', p.checkedBy, '— pole do podpisu —') + '<div class="hint" id="h-chk">' + sepHint(p.checkedBy) + '</div></div>';
    h += '</div>';

    /* przyrządy */
    const isel = new Set(p.instruments.map(x => x.id));
    const iall = S.settings.instruments.slice();
    p.instruments.forEach(x => { if (!iall.find(a => a.id === x.id)) iall.push(Object.assign({ _gone: true }, x)); });
    h += '<div class="sec-title">Przyrządy pomiarowe</div><div class="card">';
    if (!iall.length) h += '<div class="empty-sm" style="border-bottom:0">Brak przyrządów. <a href="#/settings" style="color:var(--primary);font-weight:600">Dodaj w Ustawieniach</a></div>';
    iall.forEach(i => {
      h += '<label class="check row" style="cursor:pointer"><input type="checkbox" data-ins="' + i.id + '"' + (isel.has(i.id) ? ' checked' : '') + '><div class="row-main"><div class="row-title">' + esc(i.name) + (i._gone ? ' <span class="pill warn">usunięty z ustawień</span>' : '') + '</div>' +
        '<div class="row-sub" style="font-weight:400">nr ' + esc(i.serial || '—') + ' · ' + funcPills(i) + '</div></div></label>';
    });
    h += '</div>';

    /* dokumenty pomiarowe */
    const order = docOrder(p);
    const missing = ['loop', 'iso', 'rcd'].filter(t => !E.getDoc(p, t));
    h += '<div class="sec-title">Pomiary</div><div class="card">';
    if (missing.length) h += '<div class="sec-head"><h3>' + order.length + ' z 3</h3><button class="btn-add" data-act="adddoc">' + ic('plus') + 'Dodaj</button></div>';
    if (!order.length) h += '<div class="empty-sm" style="border-bottom:0">Dodaj dokumenty, które chcesz wykonać w tym projekcie.</div>';
    order.forEach(t => {
      const s = docSummary(p, t);
      let right = '';
      if (s.r !== undefined) right = pill(s.r);
      h += '<a class="row" href="#/p/' + p.id + '/' + t + '"><div class="row-main"><div class="row-title">' + esc(E.DOC_TYPES[t].title) + '</div><div class="row-sub">' + esc(s.s) + '</div></div>' + right + ic('chev') + '</a>';
    });
    h += '</div>';

    /* dokumenty do wydruku */
    const ptypes = REPORTS.protocolTypes(p);
    if (ptypes.length) {
      const ov = REPORTS.overall(p);
      h += '<div class="sec-title">Protokoły i sprawozdanie</div><div class="card">';
      h += '<div class="row" style="cursor:default"><div class="row-main"><div class="row-title">Sprawozdanie z badania</div><div class="row-sub">' +
        (ov === null ? 'Brak wyników' : ov ? 'Instalacja spełnia wymagania' : '<span class="neg-txt">Instalacja nie spełnia wymagań</span>') + '</div></div>' +
        '<button class="btn ghost sm" data-rep="report" data-k="pdf">PDF</button><button class="btn ghost sm" data-rep="report" data-k="docx">Word</button></div>';
      ptypes.forEach(t => {
        const c = REPORTS.conclusion(p, t);
        h += '<div class="row" style="cursor:default;flex-wrap:wrap"><div class="row-main"><div class="row-title">' + esc(REPORTS.PROTO[t].short) + '</div><div class="row-sub">' +
          (c.ok === null ? 'Brak wyników' : c.ok ? 'Spełnia wymagania' : '<span class="neg-txt">Nie spełnia wymagań</span>') + '</div></div>' +
          '<button class="btn ghost sm" data-rep="' + t + '" data-k="pdf">PDF</button><button class="btn ghost sm" data-rep="' + t + '" data-k="docx">Word</button>' +
          '<div class="field" style="margin:8px 0 0;width:100%"><label>Numer protokołu</label><input class="inp" data-no="' + t + '" value="' + esc(p.numbers[t] || '') + '" placeholder="nadawany przy pierwszym generowaniu, np. 1/' + esc(REPORTS.monthKey(p.date)) + '" autocomplete="off"></div></div>';
      });
      h += '<div class="btns" style="padding-top:12px"><button class="btn ghost block" data-act="numbers">' + ic('edit') + (REPORTS.missingNumbers(p).length ? 'Nadaj numery protokołów' : 'Nadaj numery od nowa') + '</button>' +
        '<div class="hint" style="margin:0">Numer N/MM.RRRR: kolejny wolny w miesiącu daty projektu, liczony po wszystkich projektach na tym urządzeniu. Możesz go zmienić ręcznie.</div></div></div>';
    }

    /* eksport */
    h += '<div class="sec-title">Komplet</div><div class="card"><div class="btns" style="padding-top:16px">' +
      '<button class="btn primary block" data-act="allpdf"' + (order.length ? '' : ' disabled style="opacity:.5"') + '>' + ic('file') + 'Zapisz komplet PDF</button>' +
      '<button class="btn ghost block" data-act="alldocx"' + (ptypes.length ? '' : ' disabled style="opacity:.5"') + '>' + ic('file') + 'Zapisz komplet Word</button>' +
      '<button class="btn ghost block" data-act="xlsx"' + (order.length ? '' : ' disabled style="opacity:.5"') + '>' + ic('table') + 'Zapisz tabele pomiarów Excel</button>' +
      '<div class="hint" style="margin:0">PDF: sprawozdanie, a po nim każdy protokół z tabelą pomiarów. Word: sprawozdanie i protokoły (tabele pomiarów są w PDF i Excelu).</div></div></div>';
    view().innerHTML = h;

    view().oninput = e => {
      const t = e.target;
      if (t.dataset.f) {
        p[t.dataset.f] = t.value;
        $('#toptitle').innerHTML = esc(E.projectTitle(p)) + '<small>Protokół · ' + esc(E.uiDate(p.date)) + '</small>';
        saveProject();
      }
      if (t.dataset.n && t.tagName === 'INPUT') {
        if (t.dataset.n !== 'Unom') validateDec(t);
        p.network[t.dataset.n] = t.value.trim();
        $('#netline').textContent = E.networkLine(p.network); saveProject();
      }
      if (t.dataset.no) {
        p.numbers[t.dataset.no] = t.value.trim();
        t.classList.toggle('err', !!t.value.trim() && !REPORTS.parseNo(t.value));
        saveProject();
      }
    };
    view().onchange = e => {
      const t = e.target;
      if (t.dataset.f === 'date') { saveProject(); viewProject(); }
      if (t.dataset.perf) {
        const ex = S.settings.executors.find(x => x.id === t.value) || (p.executors || []).find(x => x.id === t.value);
        p.executors = ex ? [clone(ex)] : []; saveProject();
        $('#h-perf').textContent = ex ? (E.sepText(ex) || 'Brak uprawnień SEP') : '';
      }
      if (t.dataset.chk) {
        const ex = S.settings.executors.find(x => x.id === t.value) || (p.checkedBy && p.checkedBy.id === t.value ? p.checkedBy : null);
        p.checkedBy = ex ? clone(ex) : null; saveProject();
        $('#h-chk').textContent = ex ? (E.sepText(ex) || 'Brak uprawnień SEP') : '';
      }
      if (t.dataset.ins) {
        const id = t.dataset.ins;
        if (t.checked) { const i = S.settings.instruments.find(x => x.id === id); if (i && !p.instruments.find(x => x.id === id)) p.instruments.push(clone(i)); }
        else p.instruments = p.instruments.filter(x => x.id !== id);
        const ordered = S.settings.instruments.map(x => p.instruments.find(y => y.id === x.id)).filter(Boolean);
        p.instruments = ordered.concat(p.instruments.filter(x => !ordered.includes(x)));
        saveProject();
      }
      if (t.dataset.n && t.tagName === 'SELECT') { p.network.type = t.value; $('#netline').textContent = E.networkLine(p.network); saveProject(); }
    };
    view().onclick = async e => {
      const ib = e.target.closest('[data-insp]');
      if (ib) { p.inspection = ib.dataset.insp; $$('[data-insp]').forEach(x => x.classList.toggle('on', x === ib)); saveProject(); return; }
      const rb = e.target.closest('[data-rep]');
      if (rb) return doReport(rb.dataset.k, rb.dataset.rep);
      const b = e.target.closest('[data-act]'); if (!b) return;
      const a = b.dataset.act;
      if (a === 'adddoc') return chooseDoc(p);
      if (a === 'allpdf') return doReport('pdf', 'all');
      if (a === 'alldocx') return doReport('docx', 'all');
      if (a === 'xlsx') doExport('xlsx', docOrder(p));
      if (a === 'numbers') {
        if (!REPORTS.missingNumbers(p).length) {
          if (!(await confirmDlg('Nadać numery protokołów od nowa?\nObecne numery tego projektu zostaną zastąpione kolejnymi wolnymi z miesiąca ' + esc(REPORTS.monthKey(p.date)) + '.', 'Nadaj'))) return;
          p.numbers = {};
        }
        await flush();
        REPORTS.assignNumbers(p, await DB.listProjects());
        await saveProject(true); refresh(); toast('Nadano numery');
      }
    };
  }
  /* generowanie protokołów / sprawozdania: what = 'all' | 'report' | 'iso' | 'loop' | 'rcd' */
  async function doReport(kind, what) {
    const p = S.project;
    await flush();
    const ptypes = REPORTS.protocolTypes(p);
    const types = what === 'all' || what === 'report' ? ptypes : [what];
    if (REPORTS.missingNumbers(p).length && REPORTS.assignNumbers(p, await DB.listProjects())) { await saveProject(true); refresh(); }
    const iss = REPORTS.issues(p, types);
    if (iss.length && !(await confirmDlg('Uwaga – w dokumencie są braki:\n• ' + iss.map(esc).join('\n• ') + '\n\nWygenerować mimo to?', 'Generuj'))) return;
    const t = toast('<span class="spinner"></span>Tworzę plik…', 0);
    try {
      await ensureLibs(kind === 'docx' ? 'docx' : 'pdf');
      const docs = [];
      if (what === 'all' || what === 'report') docs.push(REPORTS.reportBlocks(p, S.settings));
      if (what !== 'report') types.forEach(ty => docs.push(REPORTS.protocolBlocks(p, ty, S.settings)));
      let blob;
      if (kind === 'docx') blob = await EXPORT.buildDocx(p, docs);
      else {
        const items = [];
        if (what === 'all' || what === 'report') items.push({ blocks: docs[0] });
        if (what !== 'report') types.forEach((ty, i) => { items.push({ blocks: docs[(what === 'all' ? 1 : 0) + i] }); items.push(ty); });
        blob = await EXPORT.buildPdfDocs(p, items);
      }
      t.remove();
      fileReady(blob, REPORTS.fileBase(p, what) + '.' + kind);
    } catch (err) {
      console.error(err); toast('Nie udało się utworzyć pliku: ' + esc(err.message), 5000);
    }
  }
  function chooseDoc(p) {
    const missing = ['loop', 'iso', 'rcd'].filter(t => !E.getDoc(p, t));
    const sh = openSheet({ title: 'Dodaj dokument' });
    sh.body.innerHTML = '<div class="choose" style="padding-bottom:8px">' + missing.map(t => '<button data-t="' + t + '"><span class="ci">' + ic(DOC_ICON[t]) + '</span><span><b>' + esc(E.DOC_TYPES[t].short) + '</b><small>' + esc(DOC_DESC[t]) + '</small></span></button>').join('') + '</div>';
    sh.body.onclick = async e => {
      const b = e.target.closest('[data-t]'); if (!b) return;
      const t = b.dataset.t;
      if (t === 'iso' && !E.getDoc(p, 'loop')) { p.docs.push(E.newDoc('loop')); toast('Dodano też pętlę zwarcia – izolacja jest z niej generowana', 3500); }
      else toast('Dodano dokument');
      p.docs.push(E.newDoc(t));
      p.docs.sort((x, y) => ['loop', 'iso', 'rcd'].indexOf(x.type) - ['loop', 'iso', 'rcd'].indexOf(y.type));
      await saveProject(true); sh.close(); viewProject();
    };
  }
  async function projectMenu(p) {
    const v = await menuSheet('Projekt', [
      { icon: 'copy', label: 'Duplikuj', sub: 'Kopia z wynikami pomiarów', value: 'dup' },
      { icon: 'copy', label: 'Duplikuj bez wyników', sub: 'Te same grupy, punkty i wyłączniki – do pomiarów okresowych', value: 'dupclean' },
      { icon: 'download', label: 'Zapisz kopię projektu', sub: 'Plik .json – do przeniesienia na inne urządzenie', value: 'json' },
      { icon: 'trash', label: 'Usuń projekt', danger: true, value: 'del' }
    ]);
    if (!v) return;
    await flush();
    if (v === 'json') return exportJson({ app: 'el_Pomiary', version: 1, kind: 'project', project: p }, 'el_Pomiary_' + (E.safeFile(E.projectTitle(p)) || 'projekt') + '.json');
    if (v === 'dup' || v === 'dupclean') {
      const c = clone(p);
      c.id = E.uid(); c.created = c.updated = Date.now();
      c.name = E.projectTitle(p) + ' (kopia)';
      c.numbers = {};
      if (v === 'dupclean') {
        c.date = E.today();
        (E.getDoc(c, 'loop') || { groups: [] }).groups.forEach(g => g.measurements.forEach(m => m.rows.forEach(r => { r.Ik = r.Zs = r.U = ''; r.iso = 'OK'; r.isoVals = {}; })));
        ((E.getDoc(c, 'rcd') || {}).rows || []).forEach(r => { r.t = r.I = ''; });
      }
      await DB.saveProject(c); S.project = c;
      toast('Utworzono kopię projektu');
      location.hash = '#/p/' + c.id;
    }
    if (v === 'del') {
      if (await confirmDlg('Usunąć projekt „' + esc(E.projectTitle(p)) + '” razem ze wszystkimi pomiarami?\nTej operacji nie można cofnąć.', 'Usuń', true)) {
        clearTimeout(saveTimer); saveFn = null;
        await DB.deleteProject(p.id); S.project = null; location.hash = '#/';
        toast('Projekt usunięty');
      }
    }
  }

  /* =====================================================================
     DOKUMENTY – wspólne
     ===================================================================== */
  function docMenu(t) {
    const p = S.project;
    const items = [];
    if (t === 'loop') items.push({ icon: S.loopView === 'list' ? 'table' : 'list', label: S.loopView === 'list' ? 'Pokaż jako tabelę' : 'Pokaż jako listę', sub: S.loopView === 'list' ? 'Podgląd całego protokołu' : 'Grupy i pomiary', value: 'view' });
    items.push({ icon: 'file', label: 'Zapisz PDF', value: 'pdf' }, { icon: 'table', label: 'Zapisz Excel', value: 'xlsx' });
    items.push({ icon: 'trash', label: 'Usuń dokument', danger: true, value: 'del' });
    menuSheet(E.DOC_TYPES[t].short, items).then(async v => {
      if (v === 'view') { S.loopView = S.loopView === 'list' ? 'table' : 'list'; refresh(); }
      if (v === 'pdf' || v === 'xlsx') doExport(v, [t]);
      if (v === 'del') {
        const extra = t === 'loop' && E.getDoc(p, 'iso') ? '\nDokument izolacji jest generowany z pętli – też zostanie usunięty.' : '';
        if (await confirmDlg('Usunąć dokument „' + esc(E.DOC_TYPES[t].title) + '” z projektu?' + extra, 'Usuń', true)) {
          p.docs = p.docs.filter(d => d.type !== t && !(t === 'loop' && d.type === 'iso'));
          await saveProject(true); location.hash = '#/p/' + p.id; toast('Dokument usunięty');
        }
      }
    });
  }
  const exportBar = () => '<div class="export-bar"><button class="btn primary" data-act="pdf">' + ic('file') + 'PDF</button><button class="btn ghost" data-act="xlsx">' + ic('table') + 'Excel</button></div>';
  function lpMap(d) {
    const map = {};
    E.flattenLoop(d).forEach(x => {
      if (x.type !== 'row') return;
      const o = map[x.m.id] || (map[x.m.id] = { first: x.lp, last: x.lp, results: [] });
      o.last = x.lp; o.results.push(x.calc.result);
    });
    return map;
  }

  /* =====================================================================
     DOKUMENT: PĘTLA ZWARCIA
     ===================================================================== */
  function viewLoop() {
    const p = S.project, d = E.getDoc(p, 'loop');
    setTop('Pętla zwarcia', { back: '#/p/' + p.id, sub: E.projectTitle(p), menu: true });
    onTopMenu(() => docMenu('loop'));
    let h = '<div class="card card-pad">' + statPills(E.loopStats(d)) + '</div>' + exportBar();
    if (S.loopView === 'table') {
      h += '<div class="card"><div class="tablewrap">' + loopTable(d) + '</div></div><p class="hint" style="margin:0 4px">Dotknij wiersza, aby edytować pomiar.</p>';
    } else {
      const lps = lpMap(d);
      if (!d.groups.length) h += '<div class="card"><div class="empty">' + ic('bolt') + '<p>Dodaj pierwszą grupę – pomieszczenie lub obiekt,<br>np. „Kuchnia”, „Garaż”, „Pompa obiegowa 1”.</p></div></div>';
      d.groups.forEach(g => {
        const col = !!S.collapsed[g.id];
        const cnt = g.measurements.reduce((a, m) => a + m.rows.length, 0);
        h += '<div class="card" data-g="' + g.id + '"><div class="sec-head"' + (col ? ' style="border-bottom:0"' : '') + '><button class="tgl' + (col ? ' closed' : '') + '" data-act="toggle">' + ic('chevd') + '<h3>' + esc(g.name || '(bez nazwy)') + ' <span class="cnt">' + cnt + '</span></h3></button>' +
          '<button class="btn-add" data-act="addm">' + ic('plus') + 'Dodaj</button><button class="icon-btn" data-act="gmenu" aria-label="Opcje grupy">' + ic('more') + '</button></div>';
        if (!col) {
          g.measurements.forEach(m => {
            const L = lps[m.id] || { first: '', last: '', results: [] };
            if (m.kind === '1F') {
              const c = E.calcLoop(m, m.rows[0]);
              h += '<button class="row" data-act="editm" data-m="' + m.id + '"><span class="lp">' + L.first + '</span><div class="row-main"><div class="row-title">' + esc(m.name || '(bez nazwy)') + '</div>' +
                '<div class="row-sub">' + esc(m.rows[0].key) + ' · ' + esc(m.breaker || '—') + ' · Zs ' + (E.fmt(c.Zs, 2) || '—') + ' / Za ' + (E.fmt(c.Za, 2) || '—') + ' Ω' +
                (m.rows[0].iso === 'NOK' ? ' · <span class="neg-txt">izolacja NOK</span>' : '') + '</div></div>' + pill(c.result) + '</button>';
            } else {
              const pos = L.results.filter(r => r === 'Pozytywna').length;
              const nok = m.rows.filter(r => r.iso === 'NOK').length;
              h += '<button class="row" data-act="editm" data-m="' + m.id + '"><span class="lp">' + L.first + '–' + L.last + '</span><div class="row-main"><div class="row-title">' + esc(E.multiTitle(g, m)) + ' <span class="pill info">' + m.kind + '</span></div>' +
                '<div class="row-sub">' + esc(m.breaker || '—') + ' · ' + pos + ' z ' + m.rows.length + ' pozytywnych' + (nok ? ' · <span class="neg-txt">izolacja NOK: ' + nok + '</span>' : '') + '</div></div>' + pill(aggResult(L.results)) + '</button>';
            }
          });
          if (!g.measurements.length) h += '<div class="empty-sm" style="border-bottom:0">Brak pomiarów – użyj „Dodaj”.</div>';
        }
        h += '</div>';
      });
      h += '<button class="btn ghost block" data-act="addg">' + ic('plus') + 'Dodaj grupę</button>';
    }
    h += '<button class="fab" data-act="fab">' + ic('plus') + 'Pomiar</button>';
    view().innerHTML = h;
    view().oninput = view().onchange = null;
    view().onclick = async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const a = b.dataset.act;
      const gEl = b.closest('[data-g]');
      const gi = gEl ? d.groups.findIndex(g => g.id === gEl.dataset.g) : -1;
      const g = d.groups[gi];
      if (a === 'pdf' || a === 'xlsx') return doExport(a, ['loop']);
      if (a === 'toggle') { S.collapsed[g.id] = !S.collapsed[g.id]; return refresh(); }
      if (a === 'gmenu') return groupMenu(d, gi);
      if (a === 'addg') return addGroup(d);
      if (a === 'addm') return openMeas(d, g.id, null);
      if (a === 'editm') { const mid = b.dataset.m; const gg = d.groups.find(x => x.measurements.some(m => m.id === mid)); return openMeas(d, gg.id, mid); }
      if (a === 'fab') { if (!d.groups.length) return addGroup(d); return openMeas(d, d.groups[d.groups.length - 1].id, null); }
    };
  }
  async function groupMenu(d, gi) {
    const g = d.groups[gi];
    const v = await menuSheet(g.name || 'Grupa', [
      { icon: 'edit', label: 'Zmień nazwę', value: 'ren' },
      { icon: 'up', label: 'Przenieś wyżej', value: 'up', disabled: gi === 0 },
      { icon: 'down', label: 'Przenieś niżej', value: 'down', disabled: gi === d.groups.length - 1 },
      { icon: 'trash', label: 'Usuń grupę', sub: g.measurements.length ? 'Razem z pomiarami: ' + g.measurements.length : '', danger: true, value: 'del' }
    ]);
    if (v === 'ren') { const n = await promptDlg('Nazwa grupy', g.name); if (n) { g.name = n; saveProject(); refresh(); } }
    if (v === 'up' && gi > 0) { d.groups.splice(gi - 1, 0, d.groups.splice(gi, 1)[0]); saveProject(); refresh(); }
    if (v === 'down' && gi < d.groups.length - 1) { d.groups.splice(gi + 1, 0, d.groups.splice(gi, 1)[0]); saveProject(); refresh(); }
    if (v === 'del' && await confirmDlg('Usunąć grupę „' + esc(g.name) + '”' + (g.measurements.length ? ' razem z pomiarami (' + g.measurements.length + ')' : '') + '?', 'Usuń', true)) {
      d.groups.splice(gi, 1); saveProject(); refresh(); toast('Grupa usunięta');
    }
  }
  async function addGroup(d) {
    const n = await promptDlg('Nowa grupa – pomieszczenie lub obiekt', '', 'np. Kuchnia');
    if (!n) return;
    const g = { id: E.uid(), name: n, measurements: [] };
    d.groups.push(g); await saveProject(true);
    refresh();
    openMeas(d, g.id, null);
  }
  function loopTable(d) {
    let h = '<table class="proto"><thead><tr>' + EXPORT.LOOP_HEAD.map(x => '<th>' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' +
      '<tr class="units"><td></td><td></td><td></td><td></td><td>[A]</td><td>-</td><td>[A]</td><td>[A]</td><td>[Ω]</td><td>[Ω]</td><td>[V]</td><td>Poz/Neg</td></tr>';
    E.flattenLoop(d).forEach(x => {
      if (x.type === 'group') h += '<tr class="g"><td colspan="12">' + esc(x.text) + '</td></tr>';
      else if (x.type === 'sub') h += '<tr class="sb"><td colspan="12">' + esc(x.text) + '</td></tr>';
      else {
        const c = x.calc;
        h += '<tr data-act="editm" data-m="' + x.m.id + '"><td>' + x.lp + '</td><td class="l">' + esc(x.name) + '</td><td>' + esc(x.phase) + '</td><td>' + esc(x.m.breaker) + '</td><td>' + E.fmt(c.In) + '</td><td>' + E.fmt(c.k) +
          '</td><td>' + E.fmt(c.Ia) + '</td><td>' + E.fmt(c.Ik) + '</td><td>' + E.fmt(c.Za, 2) + '</td><td>' + E.fmt(c.Zs, 2) + '</td><td>' + E.fmt(c.U) + '</td><td class="' + (c.result === 'Negatywna' ? 'neg' : '') + '">' + (c.result || '') + '</td></tr>';
      }
    });
    return h + '</tbody></table>';
  }

  /* ---------- arkusz pomiaru pętli ---------- */
  function breakerOptions(m) {
    const list = S.settings.breakers;
    const match = list.find(b => b.name === m.breaker && E.num(b.In) === E.num(m.In) && E.num(b.k) === E.num(m.k)) || list.find(b => b.name === m.breaker);
    let h = '<option value="">Wybierz…</option>';
    list.forEach(b => { h += '<option value="' + b.id + '"' + (match && match.id === b.id ? ' selected' : '') + '>' + esc(b.name) + ' · In ' + esc(E.show(b.In)) + ' A · k ' + esc(E.show(b.k)) + '</option>'; });
    h += '<option value="__custom"' + (!match && m.breaker ? ' selected' : '') + '>Inny – wpisz nazwę</option>';
    return { html: h, custom: !match && !!m.breaker };
  }
  function measPrefill(d, gid) {
    const g = d.groups.find(x => x.id === gid);
    const last = g && g.measurements[g.measurements.length - 1];
    if (last) return { kind: last.kind, phase: last.phase, breaker: last.breaker, In: last.In, k: last.k, name: last.kind === '1F' ? E.nextName(last.name) : '' };
    let any = null;
    d.groups.forEach(x => { if (x.measurements.length) any = x.measurements[x.measurements.length - 1]; });
    if (any) return { kind: '1F', phase: any.kind === '1F' ? any.phase : 'L1', breaker: any.breaker, In: any.In, k: any.k, name: '' };
    return { kind: '1F' };
  }
  function rowCalc(m, r) {
    const c = E.calcLoop(m, r);
    let s = 'Za ' + (c.Za !== null ? E.fmt(c.Za, 2) + ' Ω' : '—');
    if (c.Za !== null && c.Zs !== null) s += ' · Zs ' + (c.result === 'Pozytywna' ? '≤' : '>') + ' Za';
    return { calc: s, pill: pill(c.result), neg: c.result === 'Negatywna' };
  }
  /* pole wartości izolacji: liczba lub ">100" / "<1" */
  function isoInput(col, value) {
    const v = value == null ? '' : String(value);
    const bad = v.trim() !== '' && E.isoNum(v) === null;
    return '<input class="inp' + (bad ? ' err' : '') + '" type="text" inputmode="decimal" enterkeyhint="next" autocomplete="off" data-iv="' + esc(col) + '" value="' + esc(v) + '" placeholder="MΩ">';
  }
  function validateIso(inp) { const v = inp.value.trim(); inp.classList.toggle('err', v !== '' && E.isoNum(v) === null); }
  function isoResHtml(m, r) {
    const res = E.isoResult(m, r);
    return 'Ocena izolacji: ' + (res ? '<b class="' + (res === 'Negatywna' ? 'neg-txt' : '') + '" style="' + (res === 'Pozytywna' ? 'color:var(--s-zakonczony)' : '') + '">' + res + '</b>' : 'uzupełnij wartości') + ' · wymagane ≥ ' + E.R_DP + ' MΩ';
  }
  const KIND_SUB = { '1F': '1-faz.', '3F': '3-faz.', '3FN': '3-faz. + N' };

  function openMeas(d, gid, mid, prefill) {
    const isNew = !mid;
    let gidTarget = gid;
    const src = mid ? d.groups.find(g => g.id === gid).measurements.find(m => m.id === mid) : null;
    const pf = prefill || (isNew ? measPrefill(d, gid) : null);
    const m = src ? clone(src) : E.newMeasurement(pf.kind || '1F', pf);
    const L0 = src ? lpMap(d)[src.id] : null;
    const sh = openSheet({ title: isNew ? 'Nowy pomiar' : 'Edycja pomiaru' + (L0 ? ' · Lp. ' + (L0.first === L0.last ? L0.first : L0.first + '–' + L0.last) : '') });

    function rowHtml(r) {
      const multi = m.kind !== '1F';
      const rc = rowCalc(m, r);
      const pair = /^L\d-L\d$/.test(r.key);
      const cols = E.isoColsFor(m.kind, r.key);
      let h = '<div class="mrow' + (rc.neg ? ' neg' : '') + '" data-r="' + r.id + '"><div class="mh"><b>' + (multi ? esc(r.key) : 'Wynik') + '</b><span class="calc" data-calc>' + rc.calc + '</span><span data-pill>' + rc.pill + '</span></div>' +
        '<div class="three">' +
        '<div class="field"><label>Ik [A]</label>' + decInput('data-rf="Ik"', r.Ik) + '</div>' +
        '<div class="field"><label>Zs [Ω]</label>' + decInput('data-rf="Zs"', r.Zs) + '</div>' +
        '<div class="field"><label>U [V]</label>' + decInput('data-rf="U"', r.U, pair ? '400' : '230') + '</div></div>' +
        '<div class="isorow"><span class="flabel">Izolacja</span><div class="segp iso">' +
        ['OK', 'NOK'].map(v => '<button type="button" data-seg="iso" data-v="' + v + '" class="' + (r.iso === v ? 'on' : '') + '">' + v + '</button>').join('') + '</div>' +
        '<span class="hint" style="margin:0">' + cols.join(', ') + '</span>';
      if (r.iso === 'NOK') h += '<div class="isovals three">' + cols.map(c => '<div class="field"><label>' + esc(c) + ' [MΩ]</label>' + isoInput(c, (r.isoVals || {})[c]) + '</div>').join('') + '</div>' +
        '<div class="hint" style="margin:8px 0 0;width:100%" data-isores>' + isoResHtml(m, r) + '</div>';
      return h + '</div></div>';
    }
    function bodyHtml() {
      const multi = m.kind !== '1F';
      const bo = breakerOptions(m);
      const Ia = E.num(m.In) !== null && E.num(m.k) !== null ? E.num(m.In) * E.num(m.k) : null;
      let h = '<div class="field"><label>Rodzaj pomiaru</label><div class="segp">' + E.KINDS.map(k => '<button type="button" data-seg="kind" data-v="' + k + '" class="' + (m.kind === k ? 'on' : '') + '">' + k + '<small>' + KIND_SUB[k] + '</small></button>').join('') + '</div></div>';
      h += '<div class="field"><label for="m-name">' + (multi ? 'Nazwa punktu (w protokole: „' + esc(d.groups.find(x => x.id === gidTarget).name || 'Grupa') + ' - nazwa”)' : 'Nazwa punktu') + '</label><input class="inp" id="m-name" data-mf="name" enterkeyhint="next" autocomplete="off" value="' + esc(m.name) + '" placeholder="' + (multi ? 'np. Indukcja' : 'np. Gniazdo 1') + '"></div>';
      if (!multi) h += '<div class="field"><label>Faza</label><div class="segp">' + E.PHASES.map(ph => '<button type="button" data-seg="phase" data-v="' + ph + '" class="' + (m.phase === ph ? 'on' : '') + '">' + ph + '</button>').join('') + '</div></div>';
      h += '<div class="field"><label for="m-br">Wyłącznik</label><select class="inp" id="m-br" data-mf="breakerSel">' + bo.html + '</select></div>' +
        '<div class="field' + (bo.custom ? '' : ' hidden') + '" id="bcustom"><label>Nazwa wyłącznika</label><input class="inp" data-mf="breaker" autocomplete="off" value="' + esc(m.breaker) + '"></div>' +
        '<div class="two"><div class="field"><label>In</label><div class="suffix">' + decInput('data-mf="In"', m.In) + '<span>A</span></div></div><div class="field"><label>k</label>' + decInput('data-mf="k"', m.k) + '</div></div>' +
        '<div class="total-box" style="margin:-4px 0 14px"><span><small>Ia = In · k</small>Za = U / Ia, ocena Zs ≤ Za</span><b><span id="ia">' + (Ia !== null ? E.fmt(Ia) : '—') + '</span> A</b></div>';
      if (multi) h += '<div class="field-row"><span class="flabel grow" style="margin:0">Wiersze pomiarowe</span><button type="button" class="btn ghost sm" data-act="allok">Wszystkie izolacje OK</button></div>';
      h += m.rows.map(rowHtml).join('');
      if (d.groups.length > 1) h += '<div class="field" style="margin-top:14px"><label for="m-g">Grupa</label><select class="inp" id="m-g" data-mf="group">' + d.groups.map(g => '<option value="' + g.id + '"' + (g.id === gidTarget ? ' selected' : '') + '>' + esc(g.name) + '</option>').join('') + '</select></div>';
      if (!isNew) h += '<div class="field-row" style="margin-top:4px"><span class="flabel grow" style="margin:0">Kolejność w grupie</span><button type="button" class="btn ghost sm" data-act="mup">' + ic('up') + 'Wyżej</button><button type="button" class="btn ghost sm" data-act="mdown">' + ic('down') + 'Niżej</button></div>';
      return h;
    }
    function draw(keepScroll) { const st = sh.body.scrollTop; sh.body.innerHTML = bodyHtml(); if (keepScroll) sh.body.scrollTop = st; }
    function updRow(r) {
      const el = $('[data-r="' + r.id + '"]', sh.body); if (!el) return;
      const rc = rowCalc(m, r);
      $('[data-calc]', el).innerHTML = rc.calc; $('[data-pill]', el).innerHTML = rc.pill;
      el.classList.toggle('neg', rc.neg);
    }
    function updAll() {
      const Ia = E.num(m.In) !== null && E.num(m.k) !== null ? E.num(m.In) * E.num(m.k) : null;
      const ia = $('#ia', sh.body); if (ia) ia.textContent = Ia !== null ? E.fmt(Ia) : '—';
      m.rows.forEach(updRow);
    }
    draw();
    sh.foot.innerHTML = (isNew ? '' : '<button class="btn danger-ghost icon-only" data-a="del" aria-label="Usuń pomiar">' + ic('trash') + '</button>') +
      '<button class="btn ghost" data-a="next">Zapisz i następny</button><button class="btn primary" data-a="save">Zapisz</button>';
    if (isNew && !coarse()) setTimeout(() => { const n = $('[data-mf=name]', sh.body); if (n) n.focus(); }, 260);

    sh.body.onkeydown = e => nextFocus(e, sh.body);
    sh.body.oninput = e => {
      const t = e.target;
      if (t.dataset.mf && t.tagName === 'INPUT') {
        m[t.dataset.mf] = t.value;
        if (t.dataset.mf === 'In' || t.dataset.mf === 'k') { validateDec(t); updAll(); }
      }
      const rEl = t.closest('[data-r]');
      if (rEl) {
        const r = m.rows.find(x => x.id === rEl.dataset.r);
        if (t.dataset.rf) { r[t.dataset.rf] = t.value; validateDec(t); updRow(r); }
        if (t.dataset.iv) { r.isoVals = r.isoVals || {}; r.isoVals[t.dataset.iv] = t.value; validateIso(t); const ir = $('[data-isores]', rEl); if (ir) ir.innerHTML = isoResHtml(m, r); }
      }
    };
    sh.body.onchange = e => {
      const t = e.target;
      if (t.dataset.mf === 'breakerSel') {
        if (t.value === '__custom') { $('#bcustom', sh.body).classList.remove('hidden'); $('[data-mf=breaker]', sh.body).focus(); return; }
        $('#bcustom', sh.body).classList.add('hidden');
        const b = S.settings.breakers.find(x => x.id === t.value);
        if (b) { m.breaker = b.name; m.In = b.In; m.k = b.k; } else m.breaker = '';
        $('[data-mf=breaker]', sh.body).value = m.breaker;
        $('[data-mf=In]', sh.body).value = m.In; $('[data-mf=k]', sh.body).value = m.k;
        updAll();
      }
      if (t.dataset.mf === 'group') gidTarget = t.value;
    };
    sh.body.onclick = e => {
      const sb = e.target.closest('[data-seg]');
      if (sb) {
        const seg = sb.dataset.seg, v = sb.dataset.v;
        if (seg === 'kind' && m.kind !== v) { m.kind = v; E.rebuildRows(m); draw(true); }
        if (seg === 'phase' && m.phase !== v) { m.phase = v; E.rebuildRows(m); draw(true); }
        if (seg === 'iso') { const r = m.rows.find(x => x.id === sb.closest('[data-r]').dataset.r); r.iso = v; draw(true); }
        return;
      }
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'allok') { m.rows.forEach(r => { r.iso = 'OK'; }); draw(true); }
      if (b.dataset.act === 'mup' || b.dataset.act === 'mdown') {
        const g = d.groups.find(x => x.measurements.some(y => y.id === m.id));
        const i = g.measurements.findIndex(x => x.id === m.id);
        const j = b.dataset.act === 'mup' ? i - 1 : i + 1;
        if (i < 0 || j < 0 || j >= g.measurements.length) return;
        g.measurements.splice(j, 0, g.measurements.splice(i, 1)[0]);
        saveProject(); refresh(); toast(b.dataset.act === 'mup' ? 'Przeniesiono wyżej' : 'Przeniesiono niżej', 1200);
      }
    };
    function commit() {
      const target = d.groups.find(g => g.id === gidTarget) || d.groups.find(g => g.id === gid);
      if (isNew) target.measurements.push(m);
      else {
        const og = d.groups.find(g => g.measurements.some(x => x.id === m.id));
        const i = og.measurements.findIndex(x => x.id === m.id);
        if (og === target) og.measurements[i] = m; else { og.measurements.splice(i, 1); target.measurements.push(m); }
      }
      return saveProject(true);
    }
    sh.foot.onclick = async e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'del') {
        if (!(await confirmDlg('Usunąć ten pomiar?', 'Usuń', true))) return;
        const og = d.groups.find(g => g.measurements.some(x => x.id === m.id));
        og.measurements = og.measurements.filter(x => x.id !== m.id);
        await saveProject(true); sh.close(); refresh(); toast('Pomiar usunięty'); return;
      }
      await commit(); sh.close(); refresh();
      toast('Zapisano', 1200);
      if (a !== 'next') return;
      if (!isNew) {
        /* edycja: otwórz kolejny istniejący pomiar (kolejność jak w protokole) */
        const all = [];
        d.groups.forEach(g => g.measurements.forEach(x => all.push({ g: g, m: x })));
        const i = all.findIndex(x => x.m.id === m.id);
        const nx = all[i + 1];
        if (nx) openMeas(d, nx.g.id, nx.m.id);
        else toast('Zapisano – to był ostatni pomiar', 2200);
        return;
      }
      openMeas(d, gidTarget, null, { kind: m.kind, phase: m.phase, breaker: m.breaker, In: m.In, k: m.k, name: m.kind === '1F' ? E.nextName(m.name) : '' });
    };
  }

  /* =====================================================================
     DOKUMENT: IZOLACJA
     ===================================================================== */
  function viewIso() {
    const p = S.project, loop = E.getDoc(p, 'loop');
    setTop('Rezystancja izolacji', { back: '#/p/' + p.id, sub: E.projectTitle(p), menu: true });
    onTopMenu(() => docMenu('iso'));
    let h = '<div class="card card-pad small">Dokument powstaje automatycznie z <a href="#/p/' + p.id + '/loop" style="color:var(--primary);font-weight:600">pętli zwarcia</a>. ' +
      'Izolacja OK → „&gt;100” w kolumnach danej fazy, NOK → wartości wpisane ręcznie. Ocena pozytywna, gdy wszystkie wartości ≥ R dp = 1 MΩ.</div>';
    if (!loop) { view().innerHTML = h + '<div class="card"><div class="empty">' + ic('cable') + '<p>Brak dokumentu pętli zwarcia.</p></div></div>'; return; }
    h += exportBar();
    h += '<div class="card"><div class="tablewrap"><table class="proto"><thead><tr>' + EXPORT.ISO_HEAD.map(x => '<th>' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' +
      '<tr class="units"><td></td><td></td>' + '<td>[MΩ]</td>'.repeat(10) + '<td>Poz/Neg</td></tr>';
    const rows = E.flattenIso(loop);
    rows.forEach(x => {
      if (x.type === 'group') h += '<tr class="g"><td colspan="13">' + esc(x.text) + '</td></tr>';
      else if (x.type === 'sub') h += '<tr class="sb"><td colspan="13">' + esc(x.text) + '</td></tr>';
      else {
        h += '<tr data-act="editm" data-m="' + x.m.id + '"><td>' + x.lp + '</td><td class="l">' + esc(x.name) + '</td>' +
          E.ISO_COLS.map(c => { const v = x.iso[c]; return '<td class="' + (v !== undefined && E.isoBelow(v) ? 'neg' : '') + '">' + (v === undefined ? '' : (esc(E.show(v)) || '?')) + '</td>'; }).join('') + '<td class="' + (x.result === 'Negatywna' ? 'neg' : '') + '">' + (x.result || '') + '</td></tr>';
      }
    });
    if (!rows.length) h += '<tr><td colspan="13" class="l" style="color:var(--muted)">Brak pomiarów w pętli zwarcia.</td></tr>';
    h += '</tbody></table></div></div><p class="hint" style="margin:0 4px">Dotknij wiersza, aby zmienić izolację OK / NOK.</p>';
    view().innerHTML = h;
    view().oninput = view().onchange = null;
    view().onclick = e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'pdf' || b.dataset.act === 'xlsx') return doExport(b.dataset.act, ['iso']);
      if (b.dataset.act === 'editm') { const g = loop.groups.find(x => x.measurements.some(m => m.id === b.dataset.m)); openMeas(loop, g.id, b.dataset.m); }
    };
  }

  /* =====================================================================
     DOKUMENT: RCD
     ===================================================================== */
  function viewRcd() {
    const p = S.project, d = E.getDoc(p, 'rcd');
    setTop('Różnicówki', { back: '#/p/' + p.id, sub: E.projectTitle(p), menu: true });
    onTopMenu(() => docMenu('rcd'));
    let h = '<div class="card card-pad">' + statPills(rcdStats(d)) + '</div>' + exportBar();
    if (!S.settings.rcdTypes.length) h += '<a class="banner" href="#/settings">' + ic('warn') + '<span><b>Dodaj typy wyłączników RCD</b> w Ustawieniach.</span></a>';
    h += '<div class="card"><div class="sec-head"><h3>Pomiary</h3><button class="btn-add" data-act="add">' + ic('plus') + 'Dodaj</button></div>';
    if (!d.rows.length) h += '<div class="empty">' + ic('wave') + '<p>Brak pomiarów.<br>Dodaj pierwszy przyciskiem „Pomiar”.</p></div>';
    d.rows.forEach((r, i) => {
      const c = E.calcRcd(r);
      h += '<button class="row" data-act="edit" data-id="' + r.id + '"><span class="lp">' + (i + 1) + '</span><div class="row-main"><div class="row-title">' + esc(r.name || '(bez nazwy)') + '</div>' +
        '<div class="row-sub">' + esc(c.label || 'Brak typu') + ' · ' + (E.fmt(c.t) || '—') + ' ms · ' + (E.fmt(c.I) || '—') + ' mA</div></div>' + pill(c.result) + '</button>';
    });
    h += '</div><p class="hint" style="margin:0 4px">Ocena pozytywna, gdy 0,5 · IΔn ≤ IΔ ≤ IΔn oraz czas wyzwolenia ≤ t max typu.</p>';
    h += '<button class="fab" data-act="add">' + ic('plus') + 'Pomiar</button>';
    view().innerHTML = h;
    view().oninput = view().onchange = null;
    view().onclick = e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'pdf' || b.dataset.act === 'xlsx') return doExport(b.dataset.act, ['rcd']);
      if (b.dataset.act === 'add') return openRcd(d, null);
      if (b.dataset.act === 'edit') return openRcd(d, b.dataset.id);
    };
  }
  function openRcd(d, id, prefill) {
    const isNew = !id;
    const src = id ? d.rows.find(r => r.id === id) : null;
    let r;
    if (src) r = clone(src);
    else {
      const last = d.rows[d.rows.length - 1];
      const pf = prefill || (last ? { type: last.type, name: E.nextName(last.name) } : {});
      r = E.newRcdRow(null);
      r.type = pf.type ? clone(pf.type) : (S.settings.rcdTypes[0] ? E.snapRcd(S.settings.rcdTypes[0]) : null);
      r.name = pf.name && pf.name !== (last && last.name) ? pf.name : '';
    }
    const sh = openSheet({ title: isNew ? 'Nowy pomiar RCD' : 'Edycja pomiaru RCD · Lp. ' + (d.rows.findIndex(x => x.id === id) + 1) });
    function typeOpts() {
      const list = S.settings.rcdTypes, cur = r.type;
      const selId = cur ? (list.find(t => t.id === cur.id && E.rcdLabel(t) === E.rcdLabel(cur) && E.num(t.tmax) === E.num(cur.tmax)) || {}).id : '';
      let h = '<option value="">Wybierz…</option>';
      list.forEach(t => { h += '<option value="' + t.id + '"' + (t.id === selId ? ' selected' : '') + '>' + esc(E.rcdLabel(t)) + ' · t max ' + esc(E.show(t.tmax)) + ' ms</option>'; });
      if (cur && !selId) h += '<option value="__cur" selected>' + esc(E.rcdLabel(cur)) + ' · t max ' + esc(E.show(cur.tmax)) + ' ms (zapisany)</option>';
      return h;
    }
    function resHtml() {
      const c = E.calcRcd(r);
      const crit = c.IdN !== null ? E.fmt(c.IdN * 0.5) + ' mA ≤ IΔ ≤ ' + E.fmt(c.IdN) + ' mA' + (c.tmax !== null ? ' · t ≤ ' + E.fmt(c.tmax) + ' ms' : '') : 'wybierz typ zabezpieczenia';
      const cls = c.result === 'Pozytywna' ? 'ok' : c.result === 'Negatywna' ? 'bad' : '';
      return '<div class="res-head" style="padding:12px 14px 2px">Ocena</div><div class="res-big ' + cls + '" style="padding:2px 14px 4px"><b>' + (c.result || '—') + '</b></div><div class="hint" style="padding:0 14px 12px;margin:0">Wymagane: ' + crit + '</div>';
    }
    sh.body.innerHTML =
      '<div class="field"><label for="r-name">Nazwa punktu / obwodu</label><input class="inp" id="r-name" data-k="name" enterkeyhint="next" autocomplete="off" value="' + esc(r.name) + '"></div>' +
      '<div class="field"><label for="r-type">Typ zabezpieczenia</label><select class="inp" id="r-type" data-k="type">' + typeOpts() + '</select></div>' +
      '<div class="two"><div class="field"><label>Czas wyzwolenia</label><div class="suffix">' + decInput('data-k="t"', r.t) + '<span>ms</span></div></div>' +
      '<div class="field"><label>Prąd wyzwolenia</label><div class="suffix">' + decInput('data-k="I"', r.I) + '<span>mA</span></div></div></div>' +
      '<div class="card" style="box-shadow:none;border:1px solid var(--line)" id="rres">' + resHtml() + '</div>' +
      (isNew ? '' : '<div class="field-row"><span class="flabel grow" style="margin:0">Kolejność</span><button type="button" class="btn ghost sm" data-act="up">' + ic('up') + 'Wyżej</button><button type="button" class="btn ghost sm" data-act="down">' + ic('down') + 'Niżej</button></div>');
    sh.foot.innerHTML = (isNew ? '' : '<button class="btn danger-ghost icon-only" data-a="del" aria-label="Usuń pomiar">' + ic('trash') + '</button>') +
      '<button class="btn ghost" data-a="next">Zapisz i następny</button><button class="btn primary" data-a="save">Zapisz</button>';
    const upd = () => { $('#rres', sh.body).innerHTML = resHtml(); };
    sh.body.onkeydown = e => nextFocus(e, sh.body);
    sh.body.oninput = e => { const t = e.target; if (!t.dataset.k || t.tagName !== 'INPUT') return; r[t.dataset.k] = t.value; if (t.dataset.k !== 'name') validateDec(t); upd(); };
    sh.body.onchange = e => {
      const t = e.target;
      if (t.dataset.k === 'type' && t.value !== '__cur') { const ty = S.settings.rcdTypes.find(x => x.id === t.value); r.type = ty ? E.snapRcd(ty) : null; upd(); }
    };
    sh.body.onclick = e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const i = d.rows.findIndex(x => x.id === r.id);
      const j = b.dataset.act === 'up' ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= d.rows.length) return;
      d.rows.splice(j, 0, d.rows.splice(i, 1)[0]);
      saveProject(); refresh(); toast(b.dataset.act === 'up' ? 'Przeniesiono wyżej' : 'Przeniesiono niżej', 1200);
    };
    sh.foot.onclick = async e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'del') {
        if (!(await confirmDlg('Usunąć ten pomiar?', 'Usuń', true))) return;
        d.rows = d.rows.filter(x => x.id !== r.id); await saveProject(true); sh.close(); refresh(); toast('Pomiar usunięty'); return;
      }
      if (isNew) d.rows.push(r); else d.rows[d.rows.findIndex(x => x.id === r.id)] = r;
      await saveProject(true); sh.close(); refresh();
      toast('Zapisano', 1200);
      if (a !== 'next') return;
      if (!isNew) {
        const nx = d.rows[d.rows.findIndex(x => x.id === r.id) + 1];
        if (nx) openRcd(d, nx.id); else toast('Zapisano – to był ostatni pomiar', 2200);
        return;
      }
      openRcd(d, null, { type: r.type, name: E.nextName(r.name) });
    };
  }

  /* =====================================================================
     USTAWIENIA
     ===================================================================== */
  const OPEN = { br: false, rcd: true, net: false };
  async function viewSettings() {
    const s = S.settings;
    setTop('Ustawienia', { tab: 'settings' });
    const projects = await DB.listProjects();
    let persisted = null;
    try { if (navigator.storage && navigator.storage.persisted) persisted = await navigator.storage.persisted(); } catch (e) { }
    s.instruments = s.instruments || [];
    let h = '<div class="sec-title">Dane firmy</div><div class="card card-pad"><div class="field" style="margin:0"><label for="s-co">Nagłówek protokołów i sprawozdań</label>' +
      '<textarea class="inp" id="s-co" data-co="1" rows="3" placeholder="Nazwa firmy&#10;Ulica, Miejscowość, Kod pocztowy - Imię i nazwisko">' + esc(s.company || '') + '</textarea>' +
      '<div class="hint">Pierwsza linia drukowana pogrubioną czcionką, kolejne pod nią.</div></div></div>';
    h += '<div class="sec-title">Wykonawcy</div><div class="card"><div class="sec-head"><h3>Osoby wykonujące pomiary</h3><button class="btn-add" data-act="exadd">' + ic('plus') + 'Dodaj</button></div>';
    if (!s.executors.length) h += '<div class="empty-sm" style="border-bottom:0">Dodaj siebie i współpracowników z uprawnieniami SEP.</div>';
    s.executors.forEach(ex => {
      h += '<button class="row" data-act="exedit" data-id="' + ex.id + '"><div class="row-main"><div class="row-title">' + esc(ex.name) + '</div><div class="row-sub">' + (esc(E.sepText(ex)) || 'Brak uprawnień SEP') + '</div></div>' + ic('chev') + '</button>';
    });
    h += '</div>';

    h += '<div class="sec-title">Przyrządy pomiarowe</div><div class="card"><div class="sec-head"><h3>Mierniki</h3><button class="btn-add" data-act="iadd">' + ic('plus') + 'Dodaj</button></div><div class="card-pad">';
    if (!s.instruments.length) h += '<div class="hint" style="margin:0">Dodaj mierniki – w projekcie wybierzesz, którymi wykonano pomiary.</div>';
    s.instruments.forEach(i => {
      h += '<div class="cert" data-i="' + i.id + '"><div class="two"><div class="field"><label>Nazwa / typ</label><input class="inp" data-ik="name" value="' + esc(i.name) + '" placeholder="Producent Model" autocomplete="off"></div>' +
        '<div class="field"><label>Nr seryjny</label><input class="inp" data-ik="serial" value="' + esc(i.serial) + '" placeholder="Numer seryjny" autocomplete="off"></div></div>' +
        '<div class="field-row" style="margin-bottom:8px;flex-wrap:wrap">' + [['iso', 'Izolacja'], ['loop', 'Pętla zwarcia'], ['rcd', 'RCD']].map(f => '<label class="check" style="min-height:40px;gap:8px"><input type="checkbox" data-if="' + f[0] + '"' + (i[f[0]] ? ' checked' : '') + '>' + f[1] + '</label>').join('') +
        '<span class="grow"></span><button type="button" class="icon-btn" style="color:var(--danger)" data-act="idel" aria-label="Usuń przyrząd">' + ic('trash') + '</button></div></div>';
    });
    h += '</div></div>';
    h += '<div class="sec-title">Zabezpieczenia</div>';
    h += '<details class="card" data-open="br"' + (OPEN.br ? ' open' : '') + '><summary>Wyłączniki – pętla zwarcia (' + s.breakers.length + ')</summary><div class="body">' +
      '<div class="hint" style="margin:0 0 10px">In i k są kopiowane do pomiaru – zmiana listy nie zmienia zapisanych pomiarów. In możesz zmienić w pojedynczym pomiarze.</div>' +
      '<table class="set-table"><thead><tr><th>Nazwa</th><th>In [A]</th><th>k</th><th></th></tr></thead><tbody>' +
      s.breakers.map(b => '<tr data-b="' + b.id + '"><td><input class="inp" data-k="name" value="' + esc(b.name) + '" autocomplete="off"></td><td>' + decInput('data-k="In"', b.In) + '</td><td>' + decInput('data-k="k"', b.k) + '</td>' +
        '<td class="act"><button class="icon-btn" data-act="bdel" aria-label="Usuń">' + ic('trash') + '</button></td></tr>').join('') +
      '</tbody></table><div class="two" style="margin-top:10px"><button class="btn ghost" data-act="badd">' + ic('plus') + 'Dodaj</button><button class="btn ghost" data-act="breset">Przywróć domyślne</button></div></div></details>';

    h += '<details class="card" data-open="rcd"' + (OPEN.rcd ? ' open' : '') + '><summary>Wyłączniki różnicowo-prądowe (' + s.rcdTypes.length + ')</summary><div class="body">' +
      '<table class="set-table"><thead><tr><th>In [A]</th><th>IΔn [mA]</th><th>t max [ms]</th><th>Typ</th><th></th></tr></thead><tbody>' +
      s.rcdTypes.map(t => '<tr data-rt="' + t.id + '"><td>' + decInput('data-k="In"', t.In) + '</td><td>' + decInput('data-k="IdN"', t.IdN) + '</td><td>' + decInput('data-k="tmax"', t.tmax) + '</td>' +
        '<td><select class="inp" data-k="cls">' + ['', 'AC', 'A', 'F', 'B'].map(c => '<option value="' + c + '"' + ((t.cls || '') === c ? ' selected' : '') + '>' + (c || '—') + '</option>').join('') + '</select></td>' +
        '<td class="act"><button class="icon-btn" data-act="rdel" aria-label="Usuń">' + ic('trash') + '</button></td></tr>').join('') +
      '</tbody></table><button class="btn ghost block" style="margin-top:10px" data-act="radd">' + ic('plus') + 'Dodaj typ</button>' +
      '<div class="hint">W protokole w kolumnie „Dane” pojawi się np. „25A 30mA”. Typowo t max = 300 ms (RCD ogólny), 500 ms (selektywny).</div></div></details>';

    const n = s.network;
    h += '<details class="card" data-open="net"' + (OPEN.net ? ' open' : '') + '><summary>Parametry sieci dla nowych projektów</summary><div class="body"><div class="two">' +
      ['Un', 'Uo', 'Ul'].map(k => '<div class="field"><label>' + k + '</label><div class="suffix">' + decInput('data-n="' + k + '"', n[k]) + '<span>V</span></div></div>').join('') +
      '<div class="field"><label>ko</label>' + decInput('data-n="ko"', n.ko) + '</div><div class="field"><label>ta</label><div class="suffix">' + decInput('data-n="ta"', n.ta) + '<span>s</span></div></div>' +
      '<div class="field"><label>Typ sieci</label><select class="inp" data-n="type">' + E.NETWORK_TYPES.map(t => '<option' + (t === n.type ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></div></div></div></details>';

    h += '<div class="sec-title">Kopia zapasowa</div><div class="card"><div class="kv"><span>Projekty na urządzeniu</span><b>' + projects.length + '</b></div>' +
      '<div class="kv"><span>Trwały zapis danych</span><b>' + (persisted === null ? '—' : persisted ? 'tak' : (S.installEvt ? '<button class="link-btn" data-act="install">nie (zainstaluj aplikację)</button>' : 'nie (zainstaluj aplikację)')) + '</b></div>' +
      '<div class="kv"><span>Wersja aplikacji</span><b>' + APP_VERSION + '</b></div>' +
      '<div class="btns" style="padding-top:12px"><button class="btn primary block" data-act="backup">' + ic('download') + 'Zapisz kopię do pliku</button><button class="btn ghost block" data-act="import">' + ic('upload') + 'Wczytaj kopię z pliku</button>' +
      '<div class="hint" style="margin:0">Kopia zawiera wszystkie projekty i ustawienia – pozwala przenieść dane między telefonem a komputerem.</div></div></div>';
    view().innerHTML = h;

    $$('details[data-open]').forEach(dt => dt.addEventListener('toggle', () => { OPEN[dt.dataset.open] = dt.open; }));
    view().oninput = e => {
      const t = e.target;
      if (t.tagName === 'INPUT' && t.getAttribute('inputmode') === 'decimal') validateDec(t);
      const br = t.closest('[data-b]'), rt = t.closest('[data-rt]');
      if (br) { s.breakers.find(x => x.id === br.dataset.b)[t.dataset.k] = t.value; saveSettings(); }
      if (rt && t.tagName === 'INPUT') { s.rcdTypes.find(y => y.id === rt.dataset.rt)[t.dataset.k] = t.value; saveSettings(); }
      if (t.dataset.n && t.tagName === 'INPUT') { s.network[t.dataset.n] = t.value.trim(); saveSettings(); }
      if (t.dataset.co) { s.company = t.value; saveSettings(); }
      const ib = t.closest('[data-i]');
      if (ib && t.dataset.ik) { s.instruments.find(x => x.id === ib.dataset.i)[t.dataset.ik] = t.value; saveSettings(); }
    };
    view().onchange = e => {
      const t = e.target, rt = t.closest('[data-rt]');
      if (rt && t.tagName === 'SELECT') { s.rcdTypes.find(y => y.id === rt.dataset.rt).cls = t.value; saveSettings(); }
      if (t.dataset.n && t.tagName === 'SELECT') { s.network.type = t.value; saveSettings(); }
      const ib = t.closest('[data-i]');
      if (ib && t.dataset.if) { s.instruments.find(x => x.id === ib.dataset.i)[t.dataset.if] = t.checked; saveSettings(); }
    };
    view().onclick = async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const a = b.dataset.act;
      if (a === 'exadd') return openExecutor(null);
      if (a === 'iadd') { s.instruments.push({ id: E.uid(), name: '', serial: '', iso: true, loop: true, rcd: true }); await saveSettings(true); await viewSettings(); const ins = $$('[data-i] [data-ik=name]'); ins[ins.length - 1].focus(); return; }
      if (a === 'idel') {
        const id = b.closest('[data-i]').dataset.i, it = s.instruments.find(x => x.id === id);
        if (!(await confirmDlg('Usunąć przyrząd „' + esc(it.name || 'bez nazwy') + '”?\nIstniejące projekty zachowają jego dane.', 'Usuń', true))) return;
        s.instruments = s.instruments.filter(x => x.id !== id); await saveSettings(true); return viewSettings();
      }
      if (a === 'exedit') return openExecutor(b.dataset.id);
      if (a === 'badd') { s.breakers.push({ id: E.uid(), name: '', In: '', k: '5' }); await saveSettings(true); await viewSettings(); const ins = $$('[data-b] input[data-k=name]'); ins[ins.length - 1].focus(); return; }
      if (a === 'bdel') { s.breakers = s.breakers.filter(x => x.id !== b.closest('[data-b]').dataset.b); await saveSettings(true); return viewSettings(); }
      if (a === 'breset') { if (await confirmDlg('Przywrócić domyślną listę wyłączników (B6–B63, C6–C63, PKZM0)?\nWłasne pozycje zostaną usunięte.', 'Przywróć')) { s.breakers = E.defaultBreakers(); await saveSettings(true); viewSettings(); toast('Przywrócono domyślne'); } return; }
      if (a === 'radd') { s.rcdTypes.push({ id: E.uid(), In: '', IdN: '30', tmax: '300', cls: '' }); await saveSettings(true); await viewSettings(); const ins = $$('[data-rt] input[data-k=In]'); ins[ins.length - 1].focus(); return; }
      if (a === 'rdel') { s.rcdTypes = s.rcdTypes.filter(x => x.id !== b.closest('[data-rt]').dataset.rt); await saveSettings(true); return viewSettings(); }
      if (a === 'backup') {
        await flush();
        exportJson({ app: 'el_Pomiary', version: 1, kind: 'backup', created: new Date().toISOString(), settings: s, projects: await DB.listProjects() }, 'el_Pomiary_kopia_' + E.today() + '.json');
      }
      if (a === 'import') importJson();
      if (a === 'install' && S.installEvt) {
        const ev = S.installEvt; S.installEvt = null;
        ev.prompt();
        try { await ev.userChoice; } catch (err) { }
        await DB.persist(); viewSettings();
      }
    };
  }

  function openExecutor(id) {
    const s = S.settings;
    const src = id ? s.executors.find(x => x.id === id) : null;
    const ex = src ? clone(src) : { id: E.uid(), name: '', certs: [{ cat: 'E', group: 'G1', nr: '' }] };
    ex.certs = ex.certs || [];
    const sh = openSheet({ title: id ? 'Wykonawca' : 'Nowy wykonawca' });
    const isG1 = c => !c.group || c.group === 'G1';
    function draw() {
      const shown = ex.certs.map((c, i) => ({ c: c, i: i })).filter(x => isG1(x.c));
      sh.body.innerHTML = '<div class="field"><label for="e-name">Imię i nazwisko</label><input class="inp" id="e-name" data-k="name" autocomplete="off" value="' + esc(ex.name) + '" placeholder="Imię i nazwisko"></div>' +
        '<div class="field-row"><span class="flabel grow" style="margin:0">Uprawnienia SEP – grupa G1</span><button type="button" class="btn-add" data-act="cadd">' + ic('plus') + 'Dodaj</button></div>' +
        (shown.length ? '' : '<div class="hint" style="margin:-6px 0 14px">Brak uprawnień – w protokole pojawi się tylko imię i nazwisko.</div>') +
        shown.map(x => { const c = x.c; return '<div class="cert" data-c="' + x.i + '"><div class="two">' +
          '<div class="field"><label>Rodzaj</label><select class="inp" data-ck="cat">' + ['E', 'D'].map(v => '<option value="' + v + '"' + (c.cat === v ? ' selected' : '') + '>' + (v === 'E' ? 'E – eksploat.' : 'D – dozór') + '</option>').join('') + '</select></div>' +
          '<div class="field"><label>Nr świadectwa</label><input class="inp" data-ck="nr" autocomplete="off" value="' + esc(c.nr) + '" placeholder="Numer świadectwa"></div></div>' +
          '<div class="field-row" style="margin-bottom:8px"><span class="hint grow" style="margin:0" data-prev>' + esc(E.sepText({ certs: [c] })) + '</span><button type="button" class="btn danger-ghost sm" data-act="cdel">' + ic('trash') + 'Usuń</button></div></div>'; }).join('') +
        '<div class="hint">Do pomiarów wymagane są uprawnienia grupy G1. W protokole pod nazwiskiem pojawi się np. „SEP E G1 nr Numer świadectwa”.</div>';
    }
    draw();
    sh.foot.innerHTML = (id ? '<button class="btn danger-ghost icon-only" data-a="del" aria-label="Usuń wykonawcę">' + ic('trash') + '</button>' : '') + '<button class="btn ghost" data-a="cancel">Anuluj</button><button class="btn primary" data-a="save">Zapisz</button>';
    sh.body.oninput = e => {
      const t = e.target;
      if (t.dataset.k) ex[t.dataset.k] = t.value;
      if (t.dataset.ck) { const box = t.closest('[data-c]'); const c = ex.certs[+box.dataset.c]; c[t.dataset.ck] = t.value; $('[data-prev]', box).textContent = E.sepText({ certs: [c] }); }
    };
    sh.body.onchange = sh.body.oninput;
    sh.body.onclick = e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'cadd') { ex.certs.push({ cat: 'E', group: 'G1', nr: '' }); draw(); }
      if (b.dataset.act === 'cdel') { ex.certs.splice(+b.closest('[data-c]').dataset.c, 1); draw(); }
    };
    sh.foot.onclick = async e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a === 'cancel') return sh.close();
      if (b.dataset.a === 'del') {
        if (!(await confirmDlg('Usunąć wykonawcę „' + esc(ex.name) + '”?\nIstniejące projekty zachowają jego dane.', 'Usuń', true))) return;
        s.executors = s.executors.filter(x => x.id !== ex.id);
        toast('Wykonawca usunięty');
      } else {
        ex.name = (ex.name || '').trim();
        if (!ex.name) { $('#e-name', sh.body).classList.add('err'); return toast('Podaj imię i nazwisko'); }
        if (src) s.executors[s.executors.findIndex(x => x.id === ex.id)] = ex; else s.executors.push(ex);
        toast('Zapisano');
      }
      await saveSettings(true); sh.close(); viewSettings();
    };
  }

  /* =====================================================================
     ROUTER
     ===================================================================== */
  async function render() {
    await flush();
    closeAllSheets();
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (parts[0] === 'settings') return viewSettings();
    if (parts[0] === 'p' && parts[1]) {
      if (!S.project || S.project.id !== parts[1]) S.project = await DB.loadProject(parts[1]);
      const p = S.project;
      if (!p) { location.hash = '#/'; return; }
      const t = parts[2];
      if (t && E.getDoc(p, t)) return ({ loop: viewLoop, iso: viewIso, rcd: viewRcd })[t]();
      return viewProject();
    }
    return viewHome();
  }
  /* odświeżenie bieżącego widoku bez zamykania otwartych arkuszy */
  function refresh() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    const y = window.scrollY;
    if (parts[0] === 'p' && S.project && parts[2] && E.getDoc(S.project, parts[2])) ({ loop: viewLoop, iso: viewIso, rcd: viewRcd })[parts[2]]();
    else if (parts[0] === 'p' && S.project) viewProject();
    else return render();
    window.scrollTo(0, y);
  }
  window.addEventListener('hashchange', () => { render().then(() => window.scrollTo(0, 0)); });
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.installEvt = e; if (!location.hash || location.hash === '#/' || location.hash === '#/settings') render(); });

  async function start() {
    S.settings = await DB.loadSettings();
    DB.persist();
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW', e));
    }
    render();
  }
  window.EL_APP = { S, render };
  start();
})();
