(function () {
  function initializeAppState(options) {
    const settings = options || {};
    const renderTemplateList = settings.renderTemplateList;
    const applyZoomPan = settings.applyZoomPan;
    const addMapPanHandlers = settings.addMapPanHandlers;
    const updatePinControlVisibility = settings.updatePinControlVisibility;
    const updatePinCategoryVisibility = settings.updatePinCategoryVisibility;
    const updateBgScaleLockButton = settings.updateBgScaleLockButton;
    const updateVendorList = settings.updateVendorList;
    const hasSavedState = settings.hasSavedState;
    const loadState = settings.loadState;
    const promptRecoveryRestore = settings.promptRecoveryRestore;
    const historyTools = settings.historyTools;
    const pushHistorySnapshot = settings.pushHistorySnapshot;

    renderTemplateList();
    applyZoomPan();
    addMapPanHandlers();
    updatePinControlVisibility();
    if (typeof updatePinCategoryVisibility === 'function') {
      updatePinCategoryVisibility();
    }
    updateBgScaleLockButton();
    updateVendorList();

    if (hasSavedState()) {
      const loaded = loadState({ notify: false });
      if (!loaded) {
        promptRecoveryRestore('saved map state could not be loaded');
      }
    } else {
      promptRecoveryRestore('no saved map state was found');
    }

    historyTools.ensureIntegrity();
    pushHistorySnapshot();
  }

  function initializeRuntime(options) {
    const settings = options || {};
    const renderBackgroundLibraryOptions = settings.renderBackgroundLibraryOptions;
    const renderVendorLibraryOptions = settings.renderVendorLibraryOptions;
    const loadSnapshotArchiveLibrary = settings.loadSnapshotArchiveLibrary;
    const renderSnapshotArchiveOptions = settings.renderSnapshotArchiveOptions;
    const runSelfCheck = settings.runSelfCheck;
    const createSelectionTools = settings.createSelectionTools;

    renderBackgroundLibraryOptions();
    renderVendorLibraryOptions();

    loadSnapshotArchiveLibrary()
      .then(() => {
        renderSnapshotArchiveOptions();
      })
      .catch((err) => {
        console.error('Failed initializing snapshot archive library.', err);
        renderSnapshotArchiveOptions();
      });

    runSelfCheck();
    return createSelectionTools();
  }

  window.initializeAppState = initializeAppState;
  window.initializeRuntime = initializeRuntime;
})();
