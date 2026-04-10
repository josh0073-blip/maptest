(function () {
  function createSnapshotArchiveController(options) {
    const settings = options || {};
    const snapshotArchiveManager = settings.snapshotArchiveManager;
    const snapshotTools = settings.snapshotTools;
    const buildSerializableState = settings.buildSerializableState || function () { return {}; };
    const schemaVersion = Math.max(1, Number(settings.schemaVersion) || 1);
    const notify = settings.notify || { error: function () {}, success: function () {}, warn: function () {} };
    const normalizeMapState = settings.normalizeMapState || window.normalizeMapState;
    const getNormalizationDefaults = settings.getNormalizationDefaults || function () { return {}; };
    const isLikelyMapStatePayload = settings.isLikelyMapStatePayload || function () { return false; };
    const isNormalizedMapStateValid = settings.isNormalizedMapStateValid || function () { return false; };
    const applyNormalizedLoadedState = settings.applyNormalizedLoadedState;
    const checkpointTools = settings.checkpointTools;
    const libraryTools = settings.libraryTools;
    const renderBackgroundLibraryOptions = settings.renderBackgroundLibraryOptions || function () {};
    const renderVendorLibraryOptions = settings.renderVendorLibraryOptions || function () {};
    const libraryStorageKey = settings.libraryStorageKey;

    function normalizeArchiveTag(value) {
      return snapshotArchiveManager.normalizeTag(value);
    }

    function collectArchiveTags(config) {
      return snapshotArchiveManager.collectTags(config);
    }

    function getArchiveDefaultName() {
      return snapshotArchiveManager.getDefaultName();
    }

    function loadSnapshotArchiveLibrary() {
      return snapshotArchiveManager.load();
    }

    function getSelectedSnapshotArchiveEntry() {
      return snapshotArchiveManager.getSelectedEntry();
    }

    function renderSnapshotArchiveOptions() {
      if (typeof snapshotArchiveManager.renderOptions === 'function') {
        snapshotArchiveManager.renderOptions();
      } else {
        console.error('Snapshot archive manager cannot render options.');
      }
    }

    function addSnapshotArchiveEntry(name, snapshot, config) {
      return snapshotArchiveManager.addEntry(name, snapshot, config);
    }

    function renameSnapshotArchiveEntry(id, nextName) {
      return snapshotArchiveManager.renameEntry(id, nextName);
    }

    function deleteSnapshotArchiveEntry(id) {
      return snapshotArchiveManager.deleteEntry(id);
    }

    function buildArchiveSnapshotPayload() {
      return {
        schemaVersion: schemaVersion,
        createdAt: new Date().toISOString(),
        reason: 'archive-library-save',
        mapState: buildSerializableState()
      };
    }

    function extractSnapshotState(snapshot) {
      if (!snapshot || typeof snapshot !== 'object') {
        return null;
      }

      if (snapshot.mapState && typeof snapshot.mapState === 'object') {
        return {
          mapState: snapshot.mapState,
          libraries: snapshot.libraries && typeof snapshot.libraries === 'object' ? snapshot.libraries : null
        };
      }

      if (snapshot.snapshot && typeof snapshot.snapshot === 'object') {
        return extractSnapshotState(snapshot.snapshot);
      }

      if (snapshot.state && typeof snapshot.state === 'object') {
        return {
          mapState: snapshot.state,
          libraries: snapshot.libraries && typeof snapshot.libraries === 'object' ? snapshot.libraries : null
        };
      }

      return {
        mapState: snapshot,
        libraries: snapshot.libraries && typeof snapshot.libraries === 'object' ? snapshot.libraries : null
      };
    }

    function applySnapshotObject(snapshot, options) {
      const settings = options || {};
      const extracted = extractSnapshotState(snapshot);
      const mapStatePayload = extracted && extracted.mapState;
      const snapshotLibraries = extracted && extracted.libraries;

      if (!mapStatePayload || typeof mapStatePayload !== 'object') {
        notify.error('Snapshot does not include valid map state.');
        return false;
      }

      if (!isLikelyMapStatePayload(mapStatePayload)) {
        notify.error('Snapshot map state format is invalid. Restore skipped.');
        return false;
      }

      if (!settings.skipConfirm) {
        // show async confirm; since this function can be used synchronously by some callers,
        // we convert to a promise-aware flow by returning a Promise when confirmation is needed.
        // Caller should await applySnapshotObject when calling with skipConfirm=false.
        return (async function () {
          const ok = await window.showConfirmAsync('Restore snapshot now? This will overwrite current map and library state in this browser.');
          if (!ok) return false;

          // proceed with the rest of the function after confirmation
          let normalized;
          try {
            normalized = normalizeMapState(mapStatePayload, getNormalizationDefaults());
          } catch (err) {
            console.error(err);
            notify.error('Snapshot map state could not be normalized. Restore skipped.');
            return false;
          }

          if (!isNormalizedMapStateValid(normalized)) {
            notify.error('Snapshot map state is invalid or incomplete. Restore skipped.');
            return false;
          }

          applyNormalizedLoadedState(normalized);
          checkpointTools.commit({
            reason: 'snapshot-restore',
            persist: true,
            saveRecovery: true,
            pushHistory: true
          });

          if (snapshotLibraries && typeof snapshotLibraries === 'object') {
            try {
              localStorage.setItem(libraryStorageKey, JSON.stringify(snapshotLibraries, null, 2));
            } catch (err) {
              console.error('Failed restoring library state from snapshot.', err);
            }
            libraryTools.load();
            renderBackgroundLibraryOptions();
            renderVendorLibraryOptions();
          }

          if (settings.showSuccess !== false) {
            notify.success('Snapshot restored successfully.');
          }
          return true;
        })();
      }

      let normalized;
      try {
        normalized = normalizeMapState(mapStatePayload, getNormalizationDefaults());
      } catch (err) {
        console.error(err);
        notify.error('Snapshot map state could not be normalized. Restore skipped.');
        return false;
      }

      if (!isNormalizedMapStateValid(normalized)) {
        notify.error('Snapshot map state is invalid or incomplete. Restore skipped.');
        return false;
      }

      applyNormalizedLoadedState(normalized);
      checkpointTools.commit({
        reason: 'snapshot-restore',
        persist: true,
        saveRecovery: true,
        pushHistory: true
      });

      if (snapshotLibraries && typeof snapshotLibraries === 'object') {
        try {
          localStorage.setItem(libraryStorageKey, JSON.stringify(snapshotLibraries, null, 2));
        } catch (err) {
          console.error('Failed restoring library state from snapshot.', err);
        }
        libraryTools.load();
        renderBackgroundLibraryOptions();
        renderVendorLibraryOptions();
      }

      if (settings.showSuccess !== false) {
        notify.success('Snapshot restored successfully.');
      }
      return true;
    }

    function promptRecoveryRestore(reason) {
      snapshotTools.promptRecoveryRestore(reason, applySnapshotObject);
    }

    return {
      normalizeArchiveTag: normalizeArchiveTag,
      collectArchiveTags: collectArchiveTags,
      getArchiveDefaultName: getArchiveDefaultName,
      loadSnapshotArchiveLibrary: loadSnapshotArchiveLibrary,
      getSelectedSnapshotArchiveEntry: getSelectedSnapshotArchiveEntry,
      renderSnapshotArchiveOptions: renderSnapshotArchiveOptions,
      addSnapshotArchiveEntry: addSnapshotArchiveEntry,
      renameSnapshotArchiveEntry: renameSnapshotArchiveEntry,
      deleteSnapshotArchiveEntry: deleteSnapshotArchiveEntry,
      buildArchiveSnapshotPayload: buildArchiveSnapshotPayload,
      applySnapshotObject: applySnapshotObject,
      promptRecoveryRestore: promptRecoveryRestore
    };
  }

  window.createSnapshotArchiveController = createSnapshotArchiveController;
})();