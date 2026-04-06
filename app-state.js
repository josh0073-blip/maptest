(function () {
  function createAppStateStore(initialState) {
    const state = Object.assign({}, initialState);

    function getState() {
      return state;
    }

    function patchState(patch) {
      Object.assign(state, patch || {});
      return state;
    }

    return {
      getState: getState,
      patchState: patchState
    };
  }

  window.createAppStateStore = createAppStateStore;
})();
