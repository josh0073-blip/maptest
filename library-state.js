(function () {
  const STORAGE_KEY = 'farmersMarketLibraries';
  const SEED_VERSION_STORAGE_KEY = 'farmersMarketLibrarySeedVersion';
  const SEED_VERSION = 7;

  // Replaced by Vite plugin at build/dev time.
  const BOOTSTRAP_BACKGROUND_FILES = typeof __BOOTSTRAP_BACKGROUND_FILES__ !== 'undefined' ? __BOOTSTRAP_BACKGROUND_FILES__ : [];
  const BOOTSTRAP_VENDOR_LIST_FILES = typeof __BOOTSTRAP_VENDOR_LIST_FILES__ !== 'undefined' ? __BOOTSTRAP_VENDOR_LIST_FILES__ : [];

  function svgToDataUrl(svgText) {
    return 'data:image/svg+xml;base64,' + window.btoa(svgText);
  }

  function formatSeedNameFromFile(filename) {
    const base = String(filename || '')
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim();
    if (!base) return 'Background';
    return base.replace(/\b\w/g, function (char) { return char.toUpperCase(); });
  }

  function makeSeedIdFromFile(filename) {
    return 'seed-bg-folder-' + String(filename || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function makeVendorListSeedIdFromFile(filename) {
    return 'seed-vl-folder-' + String(filename || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function toBootstrapBackgroundUrl(filename) {
    return 'bootstrap-backgrounds/' + encodeURIComponent(String(filename || '').trim());
  }

  const BOOTSTRAP_BACKGROUND_SEEDS = [].concat(
    (Array.isArray(BOOTSTRAP_BACKGROUND_FILES) ? BOOTSTRAP_BACKGROUND_FILES : []).map(function (filename) {
      return {
        id: makeSeedIdFromFile(filename),
        name: formatSeedNameFromFile(filename),
        sourceType: 'url',
        backgroundUrl: toBootstrapBackgroundUrl(filename)
      };
    })
  );

  const BOOTSTRAP_VENDOR_LIST_SEEDS = [].concat(
    (Array.isArray(BOOTSTRAP_VENDOR_LIST_FILES) ? BOOTSTRAP_VENDOR_LIST_FILES : []).map(function (file) {
      const filename = String(file && file.filename || '').trim();
      const csvText = String(file && file.content || '');
      return {
        id: makeVendorListSeedIdFromFile(filename),
        name: formatSeedNameFromFile(filename),
        csvText: csvText
      };
    })
  );

  let bootstrapDiagnosticsWarned = false;

  function getBootstrapDiagnostics() {
    const backgroundCount = Array.isArray(BOOTSTRAP_BACKGROUND_FILES) ? BOOTSTRAP_BACKGROUND_FILES.length : 0;
    const vendorListCount = Array.isArray(BOOTSTRAP_VENDOR_LIST_FILES) ? BOOTSTRAP_VENDOR_LIST_FILES.length : 0;
    const issues = [];

    if (backgroundCount === 0) {
      issues.push('No bootstrap background images were found in public/bootstrap-backgrounds.');
    }

    if (vendorListCount === 0) {
      issues.push('No bootstrap vendor list CSV files were found in public/bootstrap-vendor-lists.');
    }

    return {
      backgroundCount: backgroundCount,
      vendorListCount: vendorListCount,
      issues: issues,
      healthy: issues.length === 0
    };
  }

  function reportBootstrapDiagnostics(notify) {
    const diagnostics = getBootstrapDiagnostics();
    if (diagnostics.healthy || bootstrapDiagnosticsWarned) {
      return diagnostics;
    }

    bootstrapDiagnosticsWarned = true;
    const runtimeNotifier = notify || window.appNotify;
    const message = 'Bootstrap assets are missing. ' + diagnostics.issues.join(' ') + ' Offline defaults may be incomplete.';

    if (runtimeNotifier && typeof runtimeNotifier.warn === 'function') {
      runtimeNotifier.warn(message);
      return diagnostics;
    }

    console.warn(message);
    return diagnostics;
  }

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
    const normalizedBackgroundLibrary = (Array.isArray(safe.backgroundLibrary) ? safe.backgroundLibrary : [])
      .map(normalizeBackgroundEntry)
      .filter(Boolean);

    // Canonicalize by id first (last value wins), then remove duplicate URLs.
    const backgroundById = new Map();
    normalizedBackgroundLibrary.forEach(function (entry) {
      backgroundById.set(entry.id, entry);
    });
    const seenBackgroundUrls = new Set();
    const backgroundLibrary = [];
    backgroundById.forEach(function (entry) {
      if (seenBackgroundUrls.has(entry.backgroundUrl)) return;
      seenBackgroundUrls.add(entry.backgroundUrl);
      backgroundLibrary.push(entry);
    });

    const normalizedVendorListLibrary = (Array.isArray(safe.vendorListLibrary) ? safe.vendorListLibrary : [])
      .map(normalizeVendorLibraryEntry)
      .filter(Boolean);

    // Canonicalize vendor list entries by id (last value wins).
    const vendorById = new Map();
    normalizedVendorListLibrary.forEach(function (entry) {
      vendorById.set(entry.id, entry);
    });
    const vendorListLibrary = Array.from(vendorById.values());

    return {
      schemaVersion: 1,
      backgroundLibrary: backgroundLibrary,
      vendorListLibrary: vendorListLibrary
    };
  }

  function createLibraryStateTools() {
    let state = normalizeLibraryState(null);
    let storageWarningShown = false;

    function getSeedVersion() {
      try {
        const raw = localStorage.getItem(SEED_VERSION_STORAGE_KEY);
        const version = Number(raw);
        return Number.isFinite(version) ? version : 0;
      } catch (err) {
        return 0;
      }
    }

    function setSeedVersion(version) {
      try {
        localStorage.setItem(SEED_VERSION_STORAGE_KEY, String(version));
      } catch (err) {
        warnStorageIssue('Failed updating seed version in localStorage.', err);
      }
    }

    function signatureForVendorList(items) {
      return JSON.stringify((Array.isArray(items) ? items : []).map(function (item) {
        return String(item && item.name || '').trim().toLowerCase();
      }).sort());
    }

    function isSeedBackgroundId(id) {
      return /^seed-bg-/.test(String(id || ''));
    }

    function isSeedVendorListId(id) {
      return /^seed-vl-/.test(String(id || ''));
    }

    function buildVendorItemsFromSeed(seed) {
      if (!seed || typeof seed !== 'object') return [];
      if (typeof seed.csvText === 'string') {
        return parseCsvItems(seed.csvText);
      }
      if (!Array.isArray(seed.items)) return [];
      return seed.items.map(function (item) {
        return {
          name: String(item && item.name || '').trim(),
          active: !!(item && item.active)
        };
      }).filter(function (item) {
        return !!item.name;
      });
    }

    function applyBootstrapSeeds() {
      const now = new Date().toISOString();
      const existingBackgroundById = new Map(state.backgroundLibrary.map(function (entry) {
        return [entry.id, entry];
      }));
      const existingBackgroundUrls = new Set(state.backgroundLibrary.map(function (entry) { return entry.backgroundUrl; }));
      const existingVendorListById = new Map(state.vendorListLibrary.map(function (entry) {
        return [entry.id, entry];
      }));
      const existingVendorListSignatures = new Set(state.vendorListLibrary.map(function (entry) {
        return signatureForVendorList(entry.items);
      }));

      let changed = false;

      // Keep folder-seeded entries in sync with current file scan results.
      const activeBootstrapBackgroundIds = new Set(BOOTSTRAP_BACKGROUND_SEEDS.map(function (seed) {
        return seed.id;
      }));
      const beforeBackgroundCount = state.backgroundLibrary.length;
      state.backgroundLibrary = state.backgroundLibrary.filter(function (entry) {
        if (!isSeedBackgroundId(entry.id)) return true;
        return activeBootstrapBackgroundIds.has(entry.id);
      });
      if (state.backgroundLibrary.length !== beforeBackgroundCount) {
        changed = true;
      }

      const activeBootstrapVendorListIds = new Set(BOOTSTRAP_VENDOR_LIST_SEEDS.map(function (seed) {
        return seed.id;
      }));
      const beforeVendorListCount = state.vendorListLibrary.length;
      state.vendorListLibrary = state.vendorListLibrary.filter(function (entry) {
        if (!isSeedVendorListId(entry.id)) return true;
        return activeBootstrapVendorListIds.has(entry.id);
      });
      if (state.vendorListLibrary.length !== beforeVendorListCount) {
        changed = true;
      }

      // Rebuild maps after potential removals.
      existingBackgroundById.clear();
      existingBackgroundUrls.clear();
      state.backgroundLibrary.forEach(function (entry) {
        existingBackgroundById.set(entry.id, entry);
        existingBackgroundUrls.add(entry.backgroundUrl);
      });
      existingVendorListById.clear();
      existingVendorListSignatures.clear();
      state.vendorListLibrary.forEach(function (entry) {
        existingVendorListById.set(entry.id, entry);
        existingVendorListSignatures.add(signatureForVendorList(entry.items));
      });

      BOOTSTRAP_BACKGROUND_SEEDS.forEach(function (seed) {
        const existingById = existingBackgroundById.get(seed.id);
        if (existingById) {
          const nextSourceType = seed.sourceType === 'fileData' ? 'fileData' : 'url';
          if (
            existingById.name !== seed.name ||
            existingById.sourceType !== nextSourceType ||
            existingById.backgroundUrl !== seed.backgroundUrl
          ) {
            existingById.name = seed.name;
            existingById.sourceType = nextSourceType;
            existingById.backgroundUrl = seed.backgroundUrl;
            existingById.lastUsedAt = now;
            changed = true;
          }
          existingBackgroundUrls.add(seed.backgroundUrl);
          return;
        }

        if (existingBackgroundUrls.has(seed.backgroundUrl)) return;
        const nextEntry = {
          id: seed.id,
          name: seed.name,
          sourceType: seed.sourceType,
          backgroundUrl: seed.backgroundUrl,
          createdAt: now,
          lastUsedAt: now
        };
        state.backgroundLibrary.push(nextEntry);
        existingBackgroundById.set(seed.id, nextEntry);
        existingBackgroundUrls.add(seed.backgroundUrl);
        changed = true;
      });

      BOOTSTRAP_VENDOR_LIST_SEEDS.forEach(function (seed) {
        const seedItems = buildVendorItemsFromSeed(seed);
        if (!seedItems.length) return;
        const signature = signatureForVendorList(seedItems);
        const existingById = existingVendorListById.get(seed.id);
        if (existingById) {
          const existingSignature = signatureForVendorList(existingById.items);
          if (existingById.name !== seed.name || existingSignature !== signature) {
            existingById.name = seed.name;
            existingById.items = seedItems;
            existingById.lastUsedAt = now;
            changed = true;
          }
          existingVendorListSignatures.add(signature);
          return;
        }

        if (existingVendorListSignatures.has(signature)) return;
        const nextEntry = {
          id: seed.id,
          name: seed.name,
          items: seedItems,
          createdAt: now,
          lastUsedAt: now
        };
        state.vendorListLibrary.push(nextEntry);
        existingVendorListById.set(seed.id, nextEntry);
        existingVendorListSignatures.add(signature);
        changed = true;
      });

      setSeedVersion(SEED_VERSION);
      if (changed) save();
      return changed;
    }

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
        applyBootstrapSeeds();
        save();
        return state;
      }
      try {
        state = normalizeLibraryState(JSON.parse(raw));
        applyBootstrapSeeds();
        save();
      } catch (err) {
        console.error('Failed to parse library storage, reinitializing.', err);
        notifyUser('error', 'Library storage was invalid and has been reset.');
        state = normalizeLibraryState(null);
        applyBootstrapSeeds();
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
      save: save,
      getBootstrapDiagnostics: getBootstrapDiagnostics,
      reportBootstrapDiagnostics: reportBootstrapDiagnostics
    };
  }

  window.createLibraryStateTools = createLibraryStateTools;
  window.getLibraryBootstrapDiagnostics = getBootstrapDiagnostics;
  window.reportLibraryBootstrapDiagnostics = reportBootstrapDiagnostics;
})();
