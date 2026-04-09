(function () {
  function createStorageSyncTools(options) {
    const settings = options || {};
    const storageKey = settings.storageKey;
    const notify = settings.notify || { warn: function () {} };
    const onRemoteChange = settings.onRemoteChange || function () {};

    let bound = false;
    let storageListener = null;

    function handleStorageEvent(event) {
      if (!event || event.key !== storageKey) return;
      // Attempt a conservative merge if possible.
      const localRaw = (function () {
        try { return localStorage.getItem(storageKey); } catch (e) { return null; }
      })();
      const merged = mergeRemoteMapStateIfSafe(localRaw, event.newValue);

      if (merged) {
        onRemoteChange({
          key: event.key,
          oldValue: event.oldValue,
          newValue: event.newValue,
          mergedValue: merged,
          url: event.url
        });
        if (notify && typeof notify.info === 'function') {
          notify.info('Merged remote changes from another tab.');
        }
        return;
      }

      onRemoteChange({
        key: event.key,
        oldValue: event.oldValue,
        newValue: event.newValue,
        url: event.url
      });
      notify.warn('This map was changed in another tab. Reload to sync the latest version.');
    }

    function mergeRemoteMapStateIfSafe(localRaw, remoteRaw) {
      if (!localRaw || !remoteRaw) return null;
      try {
        const local = typeof localRaw === 'string' ? JSON.parse(localRaw) : localRaw;
        const remote = typeof remoteRaw === 'string' ? JSON.parse(remoteRaw) : remoteRaw;
        if (!local || !remote) return null;
        if (!Array.isArray(local.vendors) || !Array.isArray(remote.vendors)) return null;

        const localIds = new Set(local.vendors.map((v) => Number(v && v.id)));
        const remoteIds = new Set(remote.vendors.map((v) => Number(v && v.id)));

        // If vendor id sets overlap, avoid automatic merge (ambiguous).
        for (const id of remoteIds) {
          if (localIds.has(id)) return null;
        }

        // Safe to merge: concat vendor lists and choose nextId as max.
        const merged = Object.assign({}, local, remote);
        merged.vendors = [...local.vendors, ...remote.vendors];
        merged.nextId = Math.max(Number(local.nextId) || 1, Number(remote.nextId) || 1);
        return JSON.stringify(merged);
      } catch (err) {
        return null;
      }
    }

    function bindStorageSyncListener() {
      if (bound) return storageListener;
      storageListener = handleStorageEvent;
      window.addEventListener('storage', storageListener);
      bound = true;
      return storageListener;
    }

    function unbindStorageSyncListener() {
      if (!bound || !storageListener) return false;
      window.removeEventListener('storage', storageListener);
      bound = false;
      storageListener = null;
      return true;
    }

    return {
      bindStorageSyncListener: bindStorageSyncListener,
      unbindStorageSyncListener: unbindStorageSyncListener
    };
  }

  window.createStorageSyncTools = createStorageSyncTools;
})();