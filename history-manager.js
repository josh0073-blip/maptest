(function () {
  function createHistoryManager(options) {
    const settings = options || {};
    const historyLimit = Math.max(1, Number(settings.historyLimit) || 100);
    const serializeSnapshot = settings.serializeSnapshot;
    const restoreSnapshot = settings.restoreSnapshot;
    const onChange = typeof settings.onChange === 'function' ? settings.onChange : function () {};

    const state = {
      past: [],
      future: [],
      isRestoring: false
    };

    function getCounts() {
      return {
        past: state.past.length,
        future: state.future.length
      };
    }

    function notifyChange() {
      onChange(getCounts());
    }

    function ensureIntegrity() {
      if (!Array.isArray(state.past)) state.past = [];
      if (!Array.isArray(state.future)) state.future = [];
      state.isRestoring = !!state.isRestoring;

      if (state.past.length > historyLimit) {
        state.past = state.past.slice(-historyLimit);
      }

      if (!state.past.length && typeof serializeSnapshot === 'function') {
        state.past.push(serializeSnapshot());
      }

      notifyChange();
    }

    function pushSnapshot() {
      ensureIntegrity();
      if (state.isRestoring) return;
      if (typeof serializeSnapshot !== 'function') return;

      const snapshot = serializeSnapshot();
      const last = state.past[state.past.length - 1];
      if (last === snapshot) {
        notifyChange();
        return;
      }

      state.past.push(snapshot);
      if (state.past.length > historyLimit) {
        state.past.shift();
      }
      state.future = [];
      notifyChange();
    }

    function undo() {
      ensureIntegrity();
      if (state.past.length <= 1) return false;
      if (typeof restoreSnapshot !== 'function') return false;

      const current = state.past.pop();
      state.future.push(current);
      const previous = state.past[state.past.length - 1];

      try {
        state.isRestoring = true;
        restoreSnapshot(previous);
      } catch (err) {
        state.past.push(current);
        state.future.pop();
        throw err;
      } finally {
        state.isRestoring = false;
      }

      notifyChange();
      return true;
    }

    function redo() {
      ensureIntegrity();
      if (!state.future.length) return false;
      if (typeof restoreSnapshot !== 'function') return false;

      const next = state.future.pop();
      state.past.push(next);

      try {
        state.isRestoring = true;
        restoreSnapshot(next);
      } catch (err) {
        state.future.push(next);
        state.past.pop();
        throw err;
      } finally {
        state.isRestoring = false;
      }

      notifyChange();
      return true;
    }

    return {
      ensureIntegrity: ensureIntegrity,
      pushSnapshot: pushSnapshot,
      undo: undo,
      redo: redo,
      getCounts: getCounts,
      isRestoring: function () { return state.isRestoring; }
    };
  }

  window.createHistoryManager = createHistoryManager;
})();
