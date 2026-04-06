(function () {
  const STORAGE_KEY = 'farmersMarketLibraries';

  function makeId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  }

  function normalizeString(value, fallback) {
    const text = typeof value === 'string' ? value.trim() : '';
    return text || fallback;
  }

  function normalizeBackgroundEntry(entry, index) {
    if (!entry || typeof entry !== 'object') return null;
    const backgroundUrl = normalizeString(entry.backgroundUrl, '');
    if (!backgroundUrl) return null;

    return {
      id: normalizeString(entry.id, makeId('bg' + index)),
      name: normalizeString(entry.name, 'Background ' + (index + 1)),
      sourceType: entry.sourceType === 'fileData' ? 'fileData' : 'url',
      backgroundUrl: backgroundUrl,
      createdAt: normalizeString(entry.createdAt, new Date().toISOString()),
      lastUsedAt: normalizeString(entry.lastUsedAt, new Date().toISOString())
    };
  }

  function normalizeVendorLibraryEntry(entry, index) {
    if (!entry || typeof entry !== 'object') return null;
    const items = Array.isArray(entry.items) ? entry.items : [];
    const normalizedItems = items
      .map(function (item) {
        const name = normalizeString(item && item.name, '');
        if (!name) return null;
        return {
          name: name,
          active: !!(item && item.active)
        };
      })
      .filter(Boolean);

    return {
      id: normalizeString(entry.id, makeId('vl' + index)),
      name: normalizeString(entry.name, 'Vendor List ' + (index + 1)),
      items: normalizedItems,
      createdAt: normalizeString(entry.createdAt, new Date().toISOString()),
      lastUsedAt: normalizeString(entry.lastUsedAt, new Date().toISOString())
    };
  }

  function normalizeLibraryState(raw) {
    const safe = raw && typeof raw === 'object' ? raw : {};
    const backgroundLibrary = (Array.isArray(safe.backgroundLibrary) ? safe.backgroundLibrary : [])
      .map(normalizeBackgroundEntry)
      .filter(Boolean);

    const vendorListLibrary = (Array.isArray(safe.vendorListLibrary) ? safe.vendorListLibrary : [])
      .map(normalizeVendorLibraryEntry)
      .filter(Boolean);

    return {
      schemaVersion: 1,
      backgroundLibrary: backgroundLibrary,
      vendorListLibrary: vendorListLibrary
    };
  }

  function createLibraryStateTools() {
    let state = normalizeLibraryState(null);
    let storageWarningShown = false;

    function notifyUser(level, message) {
      const runtimeNotifier = window.appNotify;
      if (runtimeNotifier && typeof runtimeNotifier[level] === 'function') {
        runtimeNotifier[level](message);
        return;
      }
      if (window && window.appNotify && typeof window.appNotify[level] === 'function') {
        window.appNotify[level](message);
        return;
      }
      if (level === 'error') console.error(message);
      else if (level === 'warn') console.warn(message);
      else console.log(message);
    }

    function warnStorageIssue(message, error) {
      console.error(message, error);
      if (!storageWarningShown) {
        notifyUser('warn', 'Library storage is unavailable or full. Library changes may not persist until storage access is restored.');
        storageWarningShown = true;
      }
    }

    function save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2));
      } catch (err) {
        warnStorageIssue('Failed persisting library state to localStorage.', err);
        return false;
      }
      return true;
    }

    function load() {
      let raw = null;
      try {
        raw = localStorage.getItem(STORAGE_KEY);
      } catch (err) {
        warnStorageIssue('Failed reading library state from localStorage.', err);
        return state;
      }
      if (!raw) {
        save();
        return state;
      }
      try {
        state = normalizeLibraryState(JSON.parse(raw));
        save();
      } catch (err) {
        console.error('Failed to parse library storage, reinitializing.', err);
        notifyUser('error', 'Library storage was invalid and has been reset.');
        state = normalizeLibraryState(null);
        save();
      }
      return state;
    }

    function getState() {
      return state;
    }

    function addBackgroundEntry(data) {
      const now = new Date().toISOString();
      const entry = normalizeBackgroundEntry({
        id: makeId('bg'),
        name: data && data.name,
        sourceType: data && data.sourceType,
        backgroundUrl: data && data.backgroundUrl,
        createdAt: now,
        lastUsedAt: now
      }, state.backgroundLibrary.length);
      if (!entry) return null;
      state.backgroundLibrary.push(entry);
      save();
      return entry;
    }

    function renameBackgroundEntry(id, nextName) {
      const entry = state.backgroundLibrary.find(function (item) { return item.id === id; });
      if (!entry) return false;
      entry.name = normalizeString(nextName, entry.name);
      save();
      return true;
    }

    function deleteBackgroundEntry(id) {
      const before = state.backgroundLibrary.length;
      state.backgroundLibrary = state.backgroundLibrary.filter(function (item) { return item.id !== id; });
      if (state.backgroundLibrary.length !== before) {
        save();
        return true;
      }
      return false;
    }

    function markBackgroundUsed(id) {
      const entry = state.backgroundLibrary.find(function (item) { return item.id === id; });
      if (!entry) return false;
      entry.lastUsedAt = new Date().toISOString();
      save();
      return true;
    }

    function exportBackgroundLibrary() {
      const payload = JSON.stringify({
        schemaVersion: 1,
        backgroundLibrary: state.backgroundLibrary
      }, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'background-library.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function importBackgroundLibraryJson(jsonText) {
      try {
        const parsed = normalizeLibraryState(JSON.parse(jsonText));
        const existingByUrl = new Map();
        state.backgroundLibrary.forEach(function (entry) {
          existingByUrl.set(entry.backgroundUrl, entry);
        });

        let added = 0;
        parsed.backgroundLibrary.forEach(function (entry) {
          if (existingByUrl.has(entry.backgroundUrl)) return;
          state.backgroundLibrary.push({
            id: makeId('bg'),
            name: entry.name,
            sourceType: entry.sourceType,
            backgroundUrl: entry.backgroundUrl,
            createdAt: entry.createdAt,
            lastUsedAt: entry.lastUsedAt
          });
          added++;
        });

        save();
        return { added: added };
      } catch (err) {
        console.error('Failed importing background library JSON.', err);
        notifyUser('error', 'Background library import failed. The file could not be read or saved.');
        return { added: 0 };
      }
    }

    function addVendorListEntry(data) {
      const now = new Date().toISOString();
      const entry = normalizeVendorLibraryEntry({
        id: makeId('vl'),
        name: data && data.name,
        items: data && data.items,
        createdAt: now,
        lastUsedAt: now
      }, state.vendorListLibrary.length);
      if (!entry) return null;
      state.vendorListLibrary.push(entry);
      save();
      return entry;
    }

    function updateVendorListEntry(id, data) {
      const entryIndex = state.vendorListLibrary.findIndex(function (item) { return item.id === id; });
      if (entryIndex < 0) return null;
      const current = state.vendorListLibrary[entryIndex];
      const next = normalizeVendorLibraryEntry({
        id: current.id,
        name: data && data.name !== undefined ? data.name : current.name,
        items: data && Array.isArray(data.items) ? data.items : current.items,
        createdAt: current.createdAt,
        lastUsedAt: new Date().toISOString()
      }, entryIndex);
      if (!next) return null;
      state.vendorListLibrary[entryIndex] = next;
      save();
      return next;
    }

    function renameVendorListEntry(id, nextName) {
      const entry = state.vendorListLibrary.find(function (item) { return item.id === id; });
      if (!entry) return false;
      entry.name = normalizeString(nextName, entry.name);
      entry.lastUsedAt = new Date().toISOString();
      save();
      return true;
    }

    function deleteVendorListEntry(id) {
      const before = state.vendorListLibrary.length;
      state.vendorListLibrary = state.vendorListLibrary.filter(function (item) { return item.id !== id; });
      if (state.vendorListLibrary.length !== before) {
        save();
        return true;
      }
      return false;
    }

    function markVendorListUsed(id) {
      const entry = state.vendorListLibrary.find(function (item) { return item.id === id; });
      if (!entry) return false;
      entry.lastUsedAt = new Date().toISOString();
      save();
      return true;
    }

    function exportVendorListLibrary() {
      const payload = JSON.stringify({
        schemaVersion: 1,
        vendorListLibrary: state.vendorListLibrary
      }, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vendor-list-library.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function importVendorListLibraryJson(jsonText) {
      try {
        const parsed = normalizeLibraryState(JSON.parse(jsonText));
        const existingSignatures = new Set(
          state.vendorListLibrary.map(function (entry) {
            return JSON.stringify(entry.items.map(function (item) { return item.name.toLowerCase(); }).sort());
          })
        );

        let added = 0;
        parsed.vendorListLibrary.forEach(function (entry) {
          const signature = JSON.stringify(entry.items.map(function (item) { return item.name.toLowerCase(); }).sort());
          if (existingSignatures.has(signature)) return;
          state.vendorListLibrary.push({
            id: makeId('vl'),
            name: entry.name,
            items: entry.items,
            createdAt: entry.createdAt,
            lastUsedAt: entry.lastUsedAt
          });
          existingSignatures.add(signature);
          added++;
        });

        save();
        return { added: added };
      } catch (err) {
        console.error('Failed importing vendor list library JSON.', err);
        notifyUser('error', 'Vendor list library import failed. The file could not be read or saved.');
        return { added: 0 };
      }
    }

    function parseCsvItems(csvText) {
      const lines = String(csvText || '')
        .split(/\r?\n/)
        .map(function (line) { return line.trim(); })
        .filter(Boolean);

      if (!lines.length) return [];

      let startIndex = 0;
      const firstLine = lines[0].toLowerCase();
      if (firstLine === 'name' || firstLine === 'name,active') {
        startIndex = 1;
      }

      const items = [];
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];

        if (line.includes(',')) {
          const parts = line.split(',');
          const rawName = (parts[0] || '').replace(/^"|"$/g, '').replace(/""/g, '"').trim();
          const rawActive = (parts[1] || '').replace(/^"|"$/g, '').trim().toLowerCase();
          if (!rawName) continue;
          items.push({
            name: rawName,
            active: rawActive === 'true' || rawActive === '1' || rawActive === 'yes'
          });
          continue;
        }

        items.push({ name: line, active: false });
      }

      return items;
    }

    function addVendorListFromCsv(name, csvText) {
      try {
        const items = parseCsvItems(csvText);
        return addVendorListEntry({ name: name, items: items });
      } catch (err) {
        console.error('Failed importing vendor list CSV.', err);
        notifyUser('error', 'Vendor list CSV import failed. The file could not be parsed or saved.');
        return null;
      }
    }

    load();

    return {
      getState: getState,
      addBackgroundEntry: addBackgroundEntry,
      renameBackgroundEntry: renameBackgroundEntry,
      deleteBackgroundEntry: deleteBackgroundEntry,
      markBackgroundUsed: markBackgroundUsed,
      exportBackgroundLibrary: exportBackgroundLibrary,
      importBackgroundLibraryJson: importBackgroundLibraryJson,
      addVendorListEntry: addVendorListEntry,
      updateVendorListEntry: updateVendorListEntry,
      renameVendorListEntry: renameVendorListEntry,
      deleteVendorListEntry: deleteVendorListEntry,
      markVendorListUsed: markVendorListUsed,
      exportVendorListLibrary: exportVendorListLibrary,
      importVendorListLibraryJson: importVendorListLibraryJson,
      addVendorListFromCsv: addVendorListFromCsv,
      load: load,
      save: save
    };
  }

  window.createLibraryStateTools = createLibraryStateTools;
})();
