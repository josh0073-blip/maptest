(function () {
  function createSnapshotTools(options) {
    const settings = options || {};
    const schemaVersion = settings.schemaVersion;
    const recoveryStorageKey = settings.recoveryStorageKey;
    const buildMapState = settings.buildMapState;
    const getLibrariesState = settings.getLibrariesState;
    const notify = settings.notify || { error: function () {} };

    function buildFullSnapshotPayload(reason) {
      return {
        schemaVersion: schemaVersion,
        createdAt: new Date().toISOString(),
        reason: reason || 'manual',
        mapState: buildMapState(),
        libraries: getLibrariesState()
      };
    }

    function downloadJsonFile(payload, filename) {
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function saveRecoverySnapshot(reason) {
      const payload = buildFullSnapshotPayload(reason || 'autosave');
      try {
        localStorage.setItem(recoveryStorageKey, JSON.stringify(payload));
      } catch (err) {
        console.error('Failed persisting recovery snapshot.', err);
      }
    }

    function getRecoverySnapshot() {
      let raw = null;
      try {
        raw = localStorage.getItem(recoveryStorageKey);
      } catch (err) {
        console.error('Failed reading recovery snapshot from localStorage.', err);
        return null;
      }
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        if (!parsed.mapState || typeof parsed.mapState !== 'object') return null;
        return parsed;
      } catch (err) {
        console.error('Failed to parse recovery snapshot.', err);
        return null;
      }
    }

    function promptRecoveryRestore(reason, applySnapshotObject) {
      const recovery = getRecoverySnapshot();
      if (!recovery) return;
      const when = recovery.createdAt ? new Date(recovery.createdAt).toLocaleString() : 'unknown time';
      window.showConfirmAsync(`Recovery snapshot found (${when}) because ${reason}. Restore it now?`).then((ok) => {
        if (!ok) return;
        try {
          // skip confirm here because user just affirmed
          applySnapshotObject(recovery, { skipConfirm: true, showSuccess: true });
        } catch (err) {
          console.error(err);
          notify.error('Recovery snapshot exists but could not be restored.');
        }
      });
    }

    return {
      buildFullSnapshotPayload: buildFullSnapshotPayload,
      downloadJsonFile: downloadJsonFile,
      saveRecoverySnapshot: saveRecoverySnapshot,
      getRecoverySnapshot: getRecoverySnapshot,
      promptRecoveryRestore: promptRecoveryRestore
    };
  }

  window.createSnapshotTools = createSnapshotTools;
})();
