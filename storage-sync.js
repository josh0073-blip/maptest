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
      onRemoteChange({
        key: event.key,
        oldValue: event.oldValue,
        newValue: event.newValue,
        url: event.url
      });
      notify.warn('This map was changed in another tab. Reload to sync the latest version.');
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