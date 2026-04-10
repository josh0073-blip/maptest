(function () {
  function createSnapshotArchiveStorage(options) {
    const settings = options || {};
    const storageKey = settings.storageKey;
    const dbName = settings.dbName;
    const dbVersion = settings.dbVersion;
    const storeName = settings.storeName;

    let backend = 'indexeddb';

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
        if (!db) {
          backend = 'localStorage';
          const legacy = readLegacyLocalStorage();
          return legacy.length ? legacy : PRELOADED_SNAPSHOTS;
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
        return stored.length ? stored : PRELOADED_SNAPSHOTS;
      } catch (err) {
        console.error('Failed reading archive library, falling back to preloaded snapshots.', err);
        return PRELOADED_SNAPSHOTS;
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
