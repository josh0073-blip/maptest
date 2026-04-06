(function () {
  function createStateCheckpointManager(options) {
    const settings = options || {};
    const persistenceTools = settings.persistenceTools;
    const saveRecoverySnapshot = settings.saveRecoverySnapshot;
    const pushHistorySnapshot = settings.pushHistorySnapshot;
    const clearSavedState = settings.clearSavedState;

    function commit(config) {
      const commitSettings = config || {};
      const shouldPersist = commitSettings.persist !== false;
      const shouldSaveRecovery = commitSettings.saveRecovery !== false;
      const shouldPushHistory = commitSettings.pushHistory !== false;
      const shouldClearSavedState = !!commitSettings.clearSavedState;
      const reason = commitSettings.reason || 'persist-state';

      if (shouldClearSavedState && typeof clearSavedState === 'function') {
        clearSavedState();
      }

      if (shouldPersist && persistenceTools && typeof persistenceTools.persistState === 'function') {
        persistenceTools.persistState({ download: false });
      }

      if (shouldSaveRecovery && typeof saveRecoverySnapshot === 'function') {
        saveRecoverySnapshot(reason);
      }

      if (shouldPushHistory && typeof pushHistorySnapshot === 'function') {
        pushHistorySnapshot();
      }
    }

    function persist(config) {
      const persistSettings = config || {};
      commit({
        reason: persistSettings.reason || 'persist-state',
        persist: true,
        saveRecovery: persistSettings.saveRecovery !== false,
        pushHistory: persistSettings.pushHistory !== false
      });
    }

    async function saveState() {
      if (!persistenceTools || typeof persistenceTools.saveState !== 'function') {
        return false;
      }
      const saved = await persistenceTools.saveState();
      if (!saved) return false;
      commit({
        reason: 'manual-save',
        persist: false,
        saveRecovery: true,
        pushHistory: true
      });
      return true;
    }

    function loadState(config) {
      if (!persistenceTools || typeof persistenceTools.loadState !== 'function') {
        return false;
      }
      const loaded = persistenceTools.loadState(config);
      if (loaded) {
        commit({
          reason: 'load-state',
          persist: false,
          saveRecovery: true,
          pushHistory: true
        });
      }
      return loaded;
    }

    return {
      commit: commit,
      persist: persist,
      saveState: saveState,
      loadState: loadState
    };
  }

  window.createStateCheckpointManager = createStateCheckpointManager;
})();
