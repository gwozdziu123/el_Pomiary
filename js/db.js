/* el_Pomiary – zapis lokalny (IndexedDB, awaryjnie localStorage) */
(function () {
  'use strict';
  /* nazwa bazy pozostaje 'el_proto' (z poprzedniej nazwy aplikacji), aby zachować zapisane dane */
  const DB_NAME = 'el_proto';
  const STORE = 'kv';
  let dbp = null;
  let useLS = false;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise(resolve => {
      try {
        if (!window.indexedDB) { useLS = true; return resolve(null); }
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => { useLS = true; resolve(null); };
        req.onblocked = () => { useLS = true; resolve(null); };
      } catch (e) { useLS = true; resolve(null); }
    });
    return dbp;
  }
  function tx(mode, fn) {
    return open().then(db => new Promise((resolve, reject) => {
      if (!db) return resolve(fn(null));
      const t = db.transaction(STORE, mode);
      const st = t.objectStore(STORE);
      const res = fn(st);
      t.oncomplete = () => resolve(res && res.result !== undefined ? res.result : res);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    }));
  }
  function lsGet(k) { try { const v = localStorage.getItem(DB_NAME + ':' + k); return v ? JSON.parse(v) : undefined; } catch (e) { return undefined; } }
  function lsSet(k, v) { try { localStorage.setItem(DB_NAME + ':' + k, JSON.stringify(v)); } catch (e) { console.error(e); } }
  function lsDel(k) { try { localStorage.removeItem(DB_NAME + ':' + k); } catch (e) { } }
  function lsKeys() { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.indexOf(DB_NAME + ':') === 0) out.push(k.slice(DB_NAME.length + 1)); } } catch (e) { } return out; }

  const DB = {
    get(k) {
      return open().then(db => {
        if (useLS || !db) return lsGet(k);
        return new Promise((res, rej) => {
          const r = db.transaction(STORE).objectStore(STORE).get(k);
          r.onsuccess = () => res(r.result);
          r.onerror = () => rej(r.error);
        });
      });
    },
    set(k, v) {
      return open().then(db => {
        if (useLS || !db) return lsSet(k, v);
        return tx('readwrite', st => st.put(JSON.parse(JSON.stringify(v)), k));
      });
    },
    del(k) {
      return open().then(db => {
        if (useLS || !db) return lsDel(k);
        return tx('readwrite', st => st.delete(k));
      });
    },
    keys() {
      return open().then(db => {
        if (useLS || !db) return lsKeys();
        return new Promise((res, rej) => {
          const r = db.transaction(STORE).objectStore(STORE).getAllKeys();
          r.onsuccess = () => res(r.result);
          r.onerror = () => rej(r.error);
        });
      });
    },
    /* ---- wyższy poziom ---- */
    loadSettings() {
      return DB.get('settings').then(s => {
        const def = EP.defaultSettings();
        if (!s) return def;
        const out = Object.assign(def, s, { network: Object.assign({}, def.network, s.network || {}) });
        /* jednorazowe usunięcie danych przykładowych z wersji 1.4.0–1.4.1 (porównanie skrótów, bez danych w kodzie) */
        const hs = t => { let x = 5381; for (const c of String(t)) x = ((x * 33) ^ c.codePointAt(0)) >>> 0; return x.toString(36); };
        if (hs(out.company || '') === 'x7blpj') out.company = '';
        out.instruments = (out.instruments || []).filter(i => ['3x3ey7', '1kgm9r4'].indexOf(hs((i.name || '') + '|' + (i.serial || ''))) < 0);
        return out;
      });
    },
    saveSettings(s) { return DB.set('settings', s); },
    listProjects() {
      return DB.keys().then(keys => Promise.all(keys.filter(k => String(k).indexOf('project:') === 0).map(k => DB.get(k))))
        .then(list => list.filter(Boolean).sort((a, b) => (b.updated || 0) - (a.updated || 0)));
    },
    loadProject(id) { return DB.get('project:' + id); },
    saveProject(p) { p.updated = Date.now(); return DB.set('project:' + p.id, p); },
    deleteProject(id) { return DB.del('project:' + id); },
    persist() {
      try { if (navigator.storage && navigator.storage.persist) return navigator.storage.persist(); } catch (e) { }
      return Promise.resolve(false);
    }
  };
  window.DB = DB;
})();
