(function () {
  function createPersistenceTools(options) {
    const storageKey = options.storageKey;
    const buildState = options.buildState;
    const normalizeState = options.normalizeState;
    const validateParsedState = options.validateParsedState;
    const getNormalizationDefaults = options.getNormalizationDefaults;
    const validateNormalizedState = options.validateNormalizedState;
    const applyLoadedState = options.applyLoadedState;
    const notifier = options.notify;

    let storageWarningShown = false;

    function notifyUser(level, message) {
      const runtimeNotifier = notifier || window.appNotify;
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
        notifyUser('warn', 'Browser storage is unavailable or full. Changes may not persist until storage access is restored.');
        storageWarningShown = true;
      }
    }

    function getDateStamp() {
      return new Date().toISOString().slice(0, 10);
    }

    async function savePayloadToChosenFile(payload, filename) {
      if (typeof window.showSaveFilePicker !== 'function') {
        return false;
      }

      const pickerOptions = {
        suggestedName: filename,
        types: [{
          description: 'JSON files',
          accept: {
            'application/json': ['.json']
          }
        }]
      };

      const fileHandle = await window.showSaveFilePicker(pickerOptions);
      const writable = await fileHandle.createWritable();
      await writable.write(payload);
      await writable.close();
      return true;
    }

    function downloadPayloadFallback(payload, filename) {
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function hasSavedState() {
      try {
        return !!localStorage.getItem(storageKey);
      } catch (err) {
        warnStorageIssue('Failed checking saved state in localStorage.', err);
        return false;
      }
    }

    function persistState(config) {
      const settings = config || {};
      const download = !!settings.download;
      const payload = JSON.stringify(buildState(), null, 2);
      const filename = 'farmers-market-map-' + getDateStamp() + '.json';

      try {
        localStorage.setItem(storageKey, payload);
      } catch (err) {
        warnStorageIssue('Failed persisting map state to localStorage.', err);
        return false;
      }

      if (download) {
        downloadPayloadFallback(payload, filename);
        notifyUser('success', 'Map saved locally and download dialog opened.');
      }

      return true;
    }

    async function saveState() {
      const payload = JSON.stringify(buildState(), null, 2);
      const filename = 'farmers-market-map-' + getDateStamp() + '.json';

      try {
        localStorage.setItem(storageKey, payload);
      } catch (err) {
        warnStorageIssue('Failed persisting map state to localStorage.', err);
        return false;
      }

      try {
        const wroteViaPicker = await savePayloadToChosenFile(payload, filename);
        if (wroteViaPicker) {
          notifyUser('success', 'Map saved locally and file saved to your chosen location.');
          return true;
        }
      } catch (err) {
        // Ignore cancel; report unexpected file picker errors in console and fallback.
        if (!(err && err.name === 'AbortError')) {
          console.error('Save dialog failed; falling back to browser download.', err);
        } else {
          return true;
        }
      }

      downloadPayloadFallback(payload, filename);
      notifyUser('success', 'Map saved locally. Browser download started (location is controlled by browser download settings).');
      return true;
    }

    function loadState(config) {
      const settings = config || {};
      const shouldNotify = settings.notify !== false;
      let data = null;
      try {
        data = localStorage.getItem(storageKey);
      } catch (err) {
        warnStorageIssue('Failed reading map state from localStorage.', err);
        return false;
      }
      if (!data) {
        if (shouldNotify) {
          notifyUser('warn', 'No saved map state found.');
        }
        return false;
      }

      try {
        const parsed = JSON.parse(data);
        if (typeof validateParsedState === 'function' && !validateParsedState(parsed)) {
          if (shouldNotify) {
            notifyUser('error', 'Saved map state format is invalid. Load was skipped to protect current state.');
          }
          return false;
        }
        const normalized = normalizeState(parsed, getNormalizationDefaults());
        if (typeof validateNormalizedState === 'function' && !validateNormalizedState(normalized)) {
          if (shouldNotify) {
            notifyUser('error', 'Saved map state is invalid or incomplete. Load was skipped to protect current state.');
          }
          return false;
        }
        applyLoadedState(normalized);
        if (shouldNotify) {
          notifyUser('success', 'Map loaded from localStorage.');
        }
        return true;
      } catch (err) {
        console.error(err);
        if (shouldNotify) {
          notifyUser('error', 'Failed to parse saved map state.');
        }
        return false;
      }
    }

    return {
      hasSavedState: hasSavedState,
      persistState: persistState,
      saveState: saveState,
      loadState: loadState
    };
  }

  window.createPersistenceTools = createPersistenceTools;
})();
