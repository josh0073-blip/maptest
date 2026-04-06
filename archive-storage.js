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
          return readLegacyLocalStorage();
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
        const list = Array.isArray(stored) ? stored : [];
        if (list.length) return list;

        const legacy = readLegacyLocalStorage();
        if (!legacy.length) return [];

        await writeLibrary(legacy);
        try {
          localStorage.removeItem(storageKey);
        } catch (err) {
          console.warn('Could not clear legacy archive key from localStorage after migration.', err);
        }
        return legacy;
      } catch (err) {
        console.error('Failed reading archive library from IndexedDB, falling back to localStorage.', err);
        backend = 'localStorage';
        return readLegacyLocalStorage();
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
