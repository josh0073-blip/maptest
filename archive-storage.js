import { PRELOADED_SNAPSHOTS } from './snapshot-archive-manager.js';

(function () {
  function createSnapshotArchiveStorage(options) {
    const settings = options || {};
    const storageKey = settings.storageKey;
    const dbName = settings.dbName;
    const dbVersion = settings.dbVersion;
    const storeName = settings.storeName;
    const bootstrapStateKey = `${storageKey}:bootstrap-version`;
    const bootstrapVersion = '1';

    let backend = 'indexeddb';

    function cloneValue(value) {
      try {
        return JSON.parse(JSON.stringify(value));
      } catch (err) {
        return null;
      }
    }

    function readBootstrapVersion() {
      try {
        return localStorage.getItem(bootstrapStateKey);
      } catch (err) {
        return null;
      }
    }

    function writeBootstrapVersion() {
      try {
        localStorage.setItem(bootstrapStateKey, bootstrapVersion);
      } catch (err) {
        return false;
      }

      return true;
    }

    function mergePreloadedSnapshots(entries) {
      const merged = Array.isArray(entries) ? entries.map(cloneValue).filter(Boolean) : [];
      const seen = new Set(merged.map((entry) => String(entry && entry.id || '')));
      let added = false;

      PRELOADED_SNAPSHOTS.forEach((entry) => {
        const id = String(entry && entry.id || '');
        if (!id || seen.has(id)) return;
        const cloned = cloneValue(entry);
        if (!cloned) return;
        merged.push(cloned);
        seen.add(id);
        added = true;
      });

      return { entries: merged, added: added };
    }

    function openDatabase() {
      return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
          resolve(null);
          return;
        }

        const request = window.indexedDB.open(dbName, dbVersion);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Failed opening archive database.'));
      });
    }

    function readLegacyLocalStorage() {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.error('Failed reading legacy snapshot archive from localStorage.', err);
        return [];
      }
    }

    async function readLibrary() {
      try {
        const db = await openDatabase();
        const bootstrapVersionSeen = readBootstrapVersion();

        if (!db) {
          backend = 'localStorage';
          const storedLegacy = readLegacyLocalStorage();
          const mergedLegacy = mergePreloadedSnapshots(storedLegacy);

          if (bootstrapVersionSeen !== bootstrapVersion || mergedLegacy.added) {
            localStorage.setItem(storageKey, JSON.stringify(mergedLegacy.entries));
            writeBootstrapVersion();
          }

          return mergedLegacy.entries;
        }

        const stored = await new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const request = store.get(storageKey);
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error || new Error('Failed reading archive library from IndexedDB.'));
        });

        db.close();
        backend = 'indexeddb';

        const merged = mergePreloadedSnapshots(stored);
        if (bootstrapVersionSeen !== bootstrapVersion || merged.added) {
          await writeLibrary(merged.entries);
          writeBootstrapVersion();
          return merged.entries;
        }

        return stored;
      } catch (err) {
        console.error('Failed reading archive library, falling back to preloaded snapshots.', err);
        const mergedFallback = mergePreloadedSnapshots([]);
        writeBootstrapVersion();
        return mergedFallback.entries;
      }
    }

    async function writeLibrary(libraryEntries) {
      if (backend === 'localStorage') {
        localStorage.setItem(storageKey, JSON.stringify(libraryEntries));
        return;
      }

      const db = await openDatabase();
      if (!db) {
        backend = 'localStorage';
        localStorage.setItem(storageKey, JSON.stringify(libraryEntries));
        return;
      }

      await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(libraryEntries, storageKey);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error || new Error('Failed writing archive library to IndexedDB.'));
      });
      db.close();
    }

    function getBackend() {
      return backend;
    }

    return {
      readLibrary: readLibrary,
      writeLibrary: writeLibrary,
      getBackend: getBackend
    };
  }

  window.createSnapshotArchiveStorage = createSnapshotArchiveStorage;
})();
