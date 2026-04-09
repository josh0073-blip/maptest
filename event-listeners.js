(function () {
  function bindCoreEventListeners(options) {
    const settings = options || {};
    const appState = settings.appState;
    const actions = settings.actions;
    const notify = settings.notify;
    const panZoomTools = settings.panZoomTools;
    const applyPinPosition = settings.applyPinPosition;
    const applyPinTransform = settings.applyPinTransform;
    const applyBackgroundScale = settings.applyBackgroundScale;
    const applyBackgroundOpacity = settings.applyBackgroundOpacity;
    const updateBgScaleLockButton = settings.updateBgScaleLockButton;
    const updatePinControlVisibility = settings.updatePinControlVisibility;
    const updatePinCategoryVisibility = settings.updatePinCategoryVisibility;
    const updateVendorList = settings.updateVendorList;
    const syncMapCanvasLayout = settings.syncMapCanvasLayout;
    const persistState = settings.persistState;
    const saveState = settings.saveState;
    const loadState = settings.loadState;
    const resetMap = settings.resetMap;
    const addVendor = settings.addVendor;
    const undo = settings.undo;
    const redo = settings.redo;
    const uploadCSV = settings.uploadCSV;
    const templateTools = settings.templateTools;
    const clearAllTemplates = settings.clearAllTemplates;
    const templateNameInput = settings.templateNameInput;
    const templateAddBtn = settings.templateAddBtn;
    const mapTitle = settings.mapTitle;
    const setBackground = settings.setBackground;
    const BACKGROUND_SCALE_MIN = settings.BACKGROUND_SCALE_MIN;
    const BACKGROUND_SCALE_MAX = settings.BACKGROUND_SCALE_MAX;
    const BACKGROUND_SCALE_STEP = settings.BACKGROUND_SCALE_STEP;
    const getSelectionTools = settings.getSelectionTools;
    const animatePin = settings.animatePin;
    const canUndo = typeof settings.canUndo === 'function'
      ? settings.canUndo
      : function () { return !!(undoBtn && !undoBtn.disabled); };
    const canRedo = typeof settings.canRedo === 'function'
      ? settings.canRedo
      : function () { return !!(redoBtn && !redoBtn.disabled); };

    const elements = settings.elements || {};
    const undoBtn = elements.undoBtn;
    const redoBtn = elements.redoBtn;
    const addVendorBtn = elements.addVendorBtn;
    const saveStateBtn = elements.saveStateBtn;
    const loadStateBtn = elements.loadStateBtn;
    const resetMapBtn = elements.resetMapBtn;
    const resetAllPinsBtn = elements.resetAllPinsBtn;
    const rotateAllPinsBtn = elements.rotateAllPinsBtn;
    const pinsContainer = elements.pinsContainer;
    const csvUploadBtn = elements.csvUploadBtn;
    const templateNameInputEl = elements.templateNameInput || templateNameInput;
    const templateAddBtnEl = elements.templateAddBtn || templateAddBtn;
    const selectAllBtn = elements.selectAllBtn;
    const deselectAllBtn = elements.deselectAllBtn;
    const sortTemplatesBtn = elements.sortTemplatesBtn;
    const clearTemplatesBtn = elements.clearTemplatesBtn;
    const togglePinControlsBtn = elements.togglePinControlsBtn;
    const togglePinCategoryDisplayBtn = elements.togglePinCategoryDisplayBtn;
    const rotateSelectedPinsBtn = elements.rotateSelectedPinsBtn;
    const alignLeftBtn = elements.alignLeftBtn;
    const alignCenterBtn = elements.alignCenterBtn;
    const alignRightBtn = elements.alignRightBtn;
    const alignTopBtn = elements.alignTopBtn;
    const alignMiddleBtn = elements.alignMiddleBtn;
    const alignBottomBtn = elements.alignBottomBtn;
    const bgSizeDecrease = elements.bgSizeDecrease;
    const bgSizeIncrease = elements.bgSizeIncrease;
    const bgSizeRange = elements.bgSizeRange;
    const bgOpacityRange = elements.bgOpacityRange;
    const bgScaleLockBtn = elements.bgScaleLockBtn;
    const zoomInBtn = elements.zoomInBtn;
    const zoomOutBtn = elements.zoomOutBtn;
    const zoomRange = elements.zoomRange;
    const bgUrlBtn = elements.bgUrlBtn;
    const bgUrlInput = elements.bgUrlInput;
    const bgFileInput = elements.bgFileInput;
    const exportJpgBtn = elements.exportJpgBtn;
    const exportPdfBtn = elements.exportPdfBtn;
    const printMapBtn = elements.printMapBtn;
    const exportMapAsImage = elements.exportMapAsImage;
    const exportMapAsPdf = elements.exportMapAsPdf;

    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        if (!canUndo()) {
          notify.warn('No actions to undo.');
          return;
        }
        undo();
        persistState({ reason: 'undo-action', pushHistory: false, saveRecovery: false });
      });
    }

    if (redoBtn) {
      redoBtn.addEventListener('click', () => {
        if (!canRedo()) {
          notify.warn('No actions to redo.');
          return;
        }
        redo();
        persistState({ reason: 'redo-action', pushHistory: false, saveRecovery: false });
      });
    }

    document.addEventListener('keydown', (event) => {
      const key = String(event.key || '').toLowerCase();
      const modifierPressed = event.ctrlKey || event.metaKey;
      if (!modifierPressed) return;

      const target = event.target;
      const inEditable = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );

      if (inEditable) return;

      if (key === 'z' && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }

      if (key === 'z') {
        event.preventDefault();
        undo();
        return;
      }

      if (key === 'y') {
        event.preventDefault();
        redo();
      }
    });

    if (addVendorBtn) {
      addVendorBtn.addEventListener('click', () => {
        // Compute initial vendor coordinates near the visible top-left of the map viewport
        // so newly-added pins appear in the main visual area even when the map is panned/zoomed.
        let initX = 60;
        let initY = 60;
        try {
          const mapAreaEl = document.getElementById('mapArea');
          const mapContentEl = document.getElementById('mapContent');
          const zoom = (panZoomTools && typeof panZoomTools.getZoomLevel === 'function') ? panZoomTools.getZoomLevel() : 1;
          const bgScale = Number(appState.backgroundScale) || 1;
          if (mapAreaEl && mapContentEl) {
            const areaRect = mapAreaEl.getBoundingClientRect();
            const mapRect = mapContentEl.getBoundingClientRect();
              // Prefer a more top-left spawn so the pin is easier to find in the viewport
              const offsetX = Math.round(areaRect.width * 0.15); // ~15% from left
              const offsetY = Math.round(areaRect.height * 0.12); // ~12% from top
              // Convert viewport offset to display coordinates (divide by zoom), then to map units (divide by bgScale)
              let displayX = (areaRect.left - mapRect.left + offsetX) / Math.max(0.0001, zoom);
              let displayY = (areaRect.top - mapRect.top + offsetY) / Math.max(0.0001, zoom);
              // Clamp to map content bounds so pins aren't placed outside visible content
              try {
                const maxDisplayX = Math.max(0, mapContentEl.offsetWidth - 8);
                const maxDisplayY = Math.max(0, mapContentEl.offsetHeight - 8);
                displayX = Math.min(maxDisplayX, Math.max(0, displayX));
                displayY = Math.min(maxDisplayY, Math.max(0, displayY));
              } catch (e) {
                // ignore clamp errors and use unclamped values
              }
              initX = displayX / Math.max(0.0001, bgScale);
              initY = displayY / Math.max(0.0001, bgScale);
          }
        } catch (err) {
          // fallback to defaults
          initX = 60;
          initY = 60;
        }

        addVendor({ name: `Vendor ${appState.nextId}`, x: initX, y: initY });
        persistState();
      });
    }

    if (saveStateBtn) saveStateBtn.addEventListener('click', saveState);
    if (loadStateBtn) loadStateBtn.addEventListener('click', loadState);
    if (resetMapBtn) resetMapBtn.addEventListener('click', resetMap);

    if (resetAllPinsBtn) {
      resetAllPinsBtn.addEventListener('click', async () => {
        const ok = await window.showConfirmAsync('Reset all pins to default rotation/size/height?');
        if (!ok) return;
        appState.vendors.forEach((vendor) => {
          vendor.rotation = 0;
          vendor.size = 1;
          vendor.height = 1;
        });
        pinsContainer.querySelectorAll('.vendor-pin').forEach((pin) => {
          const vendor = appState.vendors.find((v) => Number(v.id) === Number(pin.dataset.id));
          if (vendor) {
            applyPinPosition(vendor, pin);
            applyPinTransform(vendor, pin);
          }
        });
        updateVendorList();
        persistState();
      });
    }

    if (rotateAllPinsBtn) {
      rotateAllPinsBtn.addEventListener('click', async () => {
        const ok = await window.showConfirmAsync('Rotate all pins by 45 degrees?');
        if (!ok) return;
        appState.vendors.forEach((vendor) => {
          vendor.rotation = (vendor.rotation || 0) + 45;
          if (vendor.rotation >= 360) vendor.rotation -= 360;
        });
        pinsContainer.querySelectorAll('.vendor-pin').forEach((pin) => {
          const vendor = appState.vendors.find((v) => Number(v.id) === Number(pin.dataset.id));
          if (vendor) {
            applyPinTransform(vendor, pin);
          }
        });
        updateVendorList();
        persistState();
      });
    }

    if (csvUploadBtn) {
      csvUploadBtn.addEventListener('click', uploadCSV);
    }

    if (templateAddBtnEl) {
      templateAddBtnEl.addEventListener('click', () => {
        const rawName = templateNameInputEl ? templateNameInputEl.value : '';
        const added = templateTools.addTemplateFromInput(rawName);
        if (!added) return;
        if (templateNameInputEl) templateNameInputEl.value = '';
      });
    }

    if (templateNameInputEl) {
      templateNameInputEl.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        if (templateAddBtnEl) templateAddBtnEl.click();
      });
    }

    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        templateTools.selectAllTemplates();
      });
    }

    if (deselectAllBtn) {
      deselectAllBtn.addEventListener('click', () => {
        templateTools.deselectAllTemplates();
      });
    }

    if (sortTemplatesBtn) {
      sortTemplatesBtn.addEventListener('click', () => {
        templateTools.sortTemplatesAlphabetical();
      });
    }

    if (clearTemplatesBtn) {
      clearTemplatesBtn.addEventListener('click', clearAllTemplates);
    }

    if (togglePinControlsBtn) {
      togglePinControlsBtn.addEventListener('click', () => {
        actions.setPinControlsVisible(!appState.pinControlsVisible);
        togglePinControlsBtn.textContent = appState.pinControlsVisible ? 'Hide Pin Controls' : 'Show Pin Controls';
        updatePinControlVisibility();
      });
    }

    if (togglePinCategoryDisplayBtn) {
      togglePinCategoryDisplayBtn.addEventListener('click', () => {
        actions.setPinCategoryDisplayVisible(!appState.pinCategoryDisplayVisible);
        if (typeof updatePinCategoryVisibility === 'function') {
          updatePinCategoryVisibility();
        }
        persistState();
      });
    }

    if (rotateSelectedPinsBtn) {
      rotateSelectedPinsBtn.addEventListener('click', () => {
        const selectionTools = getSelectionTools();
        if (!selectionTools) {
          notify.warn('Selection tools are not ready yet.');
          return;
        }

        const selectedIds = Array.from(selectionTools.getSelectedPins());
        if (!selectedIds.length) {
          notify.warn('Select one or more pins first.');
          return;
        }

        selectedIds.forEach((id) => {
          const vendor = appState.vendors.find((v) => v.id === id);
          const pin = pinsContainer.querySelector(`.vendor-pin[data-id='${id}']`);
          if (!vendor || !pin) return;
          vendor.rotation = (vendor.rotation || 0) + 45;
          if (vendor.rotation >= 360) vendor.rotation -= 360;
          applyPinTransform(vendor, pin);
          animatePin(pin);
        });

        updateVendorList();
        persistState();
      });
    }

    [
      { button: alignLeftBtn, mode: 'left' },
      { button: alignCenterBtn, mode: 'center-x' },
      { button: alignRightBtn, mode: 'right' },
      { button: alignTopBtn, mode: 'top' },
      { button: alignMiddleBtn, mode: 'center-y' },
      { button: alignBottomBtn, mode: 'bottom' }
    ].forEach(({ button, mode }) => {
      if (!button) return;
      button.addEventListener('click', () => {
        const selectionTools = getSelectionTools();
        if (!selectionTools || !selectionTools.alignSelectedPins(mode)) {
          notify.warn('Select at least two pins to align.');
          return;
        }
        persistState();
      });
    });

    if (bgSizeDecrease) {
      bgSizeDecrease.addEventListener('click', () => {
        if (appState.backgroundScaleLocked) {
          notify.warn('Background scale is locked. Unlock to change.');
          return;
        }
        actions.setBackgroundScale(Math.max(BACKGROUND_SCALE_MIN, appState.backgroundScale - BACKGROUND_SCALE_STEP));
        applyBackgroundScale();
        persistState();
      });
    }

    if (bgSizeIncrease) {
      bgSizeIncrease.addEventListener('click', () => {
        if (appState.backgroundScaleLocked) {
          notify.warn('Background scale is locked. Unlock to change.');
          return;
        }
        actions.setBackgroundScale(Math.min(BACKGROUND_SCALE_MAX, appState.backgroundScale + BACKGROUND_SCALE_STEP));
        applyBackgroundScale();
        persistState();
      });
    }

    if (bgSizeRange) {
      bgSizeRange.addEventListener('input', () => {
        if (appState.backgroundScaleLocked) {
          notify.warn('Background scale is locked. Unlock to change.');
          bgSizeRange.value = appState.backgroundScale;
          return;
        }
        actions.setBackgroundScale(parseFloat(bgSizeRange.value));
        applyBackgroundScale();
        persistState();
      });
    }

    if (bgOpacityRange) {
      bgOpacityRange.addEventListener('input', () => {
        actions.setBackgroundOpacity(parseFloat(bgOpacityRange.value));
        applyBackgroundOpacity();
        persistState();
      });
    }

    if (bgScaleLockBtn) {
      bgScaleLockBtn.addEventListener('click', () => {
        actions.setBackgroundScaleLocked(!appState.backgroundScaleLocked);
        updateBgScaleLockButton();
        persistState();
      });
    }

    if (exportJpgBtn) exportJpgBtn.addEventListener('click', exportMapAsImage);
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportMapAsPdf);
    if (printMapBtn) {
      printMapBtn.addEventListener('click', () => {
        const userAgent = navigator.userAgent || '';
        const platform = navigator.platform || '';
        const isIPadLike = /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
        if (isIPadLike) {
          notify.info('On iPad, use Export PDF for the most reliable print/share flow.');
          exportMapAsPdf();
          return;
        }
        if (typeof window.print !== 'function') {
          notify.warn('Native printing is not available in this browser. Use Export PDF instead.');
          return;
        }
        window.print();
      });
    }

    if (zoomInBtn) zoomInBtn.addEventListener('click', () => settings.setZoom(panZoomTools.getZoomLevel() + 0.1));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => settings.setZoom(panZoomTools.getZoomLevel() - 0.1));
    if (zoomRange) zoomRange.addEventListener('input', () => settings.setZoom(parseFloat(zoomRange.value)));

    if (mapTitle) {
      mapTitle.textContent = appState.mapTitleText;
      mapTitle.addEventListener('input', () => {
        actions.setMapTitleText(mapTitle.textContent || 'Farmers Market Vendor Map');
        if (mapTitle.textContent !== appState.mapTitleText) {
          mapTitle.textContent = appState.mapTitleText;
        }
        persistState();
      });
    }

    if (bgUrlBtn) {
      bgUrlBtn.addEventListener('click', () => {
        const url = bgUrlInput.value.trim();
        if (!url) {
          notify.warn('Enter a valid image URL.');
          return;
        }
        const applied = setBackground(url);
        if (!applied) {
          notify.warn('Use a valid image URL (http/https, blob, data:image, file, or relative path).');
          return;
        }
        persistState();
      });
    }

    if (bgFileInput) {
      bgFileInput.addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target.result;
          setBackground(imageUrl);
          bgUrlInput.value = imageUrl;
          persistState();
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function bindLibrarySnapshotAndSidebarListeners(options) {
    const settings = options || {};
    const appState = settings.appState;
    const notify = settings.notify;
    const libraryTools = settings.libraryTools;
    const renderBackgroundLibraryOptions = settings.renderBackgroundLibraryOptions;
    const renderVendorLibraryOptions = settings.renderVendorLibraryOptions;
    const getSelectedBackgroundLibraryEntry = settings.getSelectedBackgroundLibraryEntry;
    const getSelectedVendorLibraryEntry = settings.getSelectedVendorLibraryEntry;
    const buildVendorLibraryItemsFromTemplates = settings.buildVendorLibraryItemsFromTemplates;
    const applyVendorLibraryEntry = settings.applyVendorLibraryEntry;
    const exportVendorLibraryEntryCsv = settings.exportVendorLibraryEntryCsv;
    const persistState = settings.persistState;
    const setBackground = settings.setBackground;
    const runSelfCheck = settings.runSelfCheck;
    const buildFullSnapshotPayload = settings.buildFullSnapshotPayload;
    const downloadJsonFile = settings.downloadJsonFile;
    const getDateStamp = settings.getDateStamp;
    const saveRecoverySnapshot = settings.saveRecoverySnapshot;
    const buildArchiveSnapshotPayload = settings.buildArchiveSnapshotPayload;
    const getArchiveDefaultName = settings.getArchiveDefaultName;
    const collectArchiveTags = settings.collectArchiveTags;
    const addSnapshotArchiveEntry = settings.addSnapshotArchiveEntry;
    const renderSnapshotArchiveOptions = settings.renderSnapshotArchiveOptions;
    const getSelectedSnapshotArchiveEntry = settings.getSelectedSnapshotArchiveEntry;
    const applySnapshotObject = settings.applySnapshotObject;
    const renameSnapshotArchiveEntry = settings.renameSnapshotArchiveEntry;
    const deleteSnapshotArchiveEntry = settings.deleteSnapshotArchiveEntry;

    const elements = settings.elements || {};
    const bgLibSaveBtn = elements.bgLibSaveBtn;
    const bgLibApplyBtn = elements.bgLibApplyBtn;
    const bgLibRenameBtn = elements.bgLibRenameBtn;
    const bgLibDeleteBtn = elements.bgLibDeleteBtn;
    const bgLibExportBtn = elements.bgLibExportBtn;
    const bgLibImportInput = elements.bgLibImportInput;
    const bgLibNameInput = elements.bgLibNameInput;
    const bgLibSelect = elements.bgLibSelect;
    const bgUrlInput = elements.bgUrlInput;
    const vendorLibSaveBtn = elements.vendorLibSaveBtn;
    const vendorLibLoadBtn = elements.vendorLibLoadBtn;
    const vendorLibRenameBtn = elements.vendorLibRenameBtn;
    const vendorLibDeleteBtn = elements.vendorLibDeleteBtn;
    const vendorLibExportJsonBtn = elements.vendorLibExportJsonBtn;
    const vendorLibExportCsvBtn = elements.vendorLibExportCsvBtn;
    const vendorLibImportInput = elements.vendorLibImportInput;
    const vendorLibNameInput = elements.vendorLibNameInput;
    const vendorLibSelect = elements.vendorLibSelect;
    const vendorLibLoadMode = elements.vendorLibLoadMode;
    const snapshotExportBtn = elements.snapshotExportBtn;
    const snapshotArchiveSaveBtn = elements.snapshotArchiveSaveBtn;
    const snapshotArchiveNameInput = elements.snapshotArchiveNameInput;
    const snapshotArchiveEventTagInput = elements.snapshotArchiveEventTagInput;
    const snapshotArchiveAutoTagToggle = elements.snapshotArchiveAutoTagToggle;
    const snapshotArchiveSelect = elements.snapshotArchiveSelect;
    const snapshotArchiveRestoreBtn = elements.snapshotArchiveRestoreBtn;
    const snapshotArchiveRenameBtn = elements.snapshotArchiveRenameBtn;
    const snapshotArchiveDuplicateBtn = elements.snapshotArchiveDuplicateBtn;
    const snapshotArchiveDeleteBtn = elements.snapshotArchiveDeleteBtn;
    const snapshotArchiveSearchInput = elements.snapshotArchiveSearchInput;
    const snapshotArchiveDateFromInput = elements.snapshotArchiveDateFromInput;
    const snapshotArchiveDateToInput = elements.snapshotArchiveDateToInput;
    const snapshotArchiveFilterClearBtn = elements.snapshotArchiveFilterClearBtn;
    const snapshotRestoreBtn = elements.snapshotRestoreBtn;
    const snapshotImportInput = elements.snapshotImportInput;
    const snapshotClearRecoveryBtn = elements.snapshotClearRecoveryBtn;
    const RECOVERY_STORAGE_KEY = elements.RECOVERY_STORAGE_KEY;
    const selfCheckRunBtn = elements.selfCheckRunBtn;
    const sidebar = elements.sidebar;
    const sidebarToggle = elements.sidebarToggle;

    if (bgLibSaveBtn) {
      bgLibSaveBtn.addEventListener('click', () => {
        if (!appState.backgroundUrl) {
          notify.warn('Set a background image first before saving to library.');
          return;
        }
        const name = (bgLibNameInput && bgLibNameInput.value.trim()) || `Background ${libraryTools.getState().backgroundLibrary.length + 1}`;
        const sourceType = appState.backgroundUrl.startsWith('data:') ? 'fileData' : 'url';
        const added = libraryTools.addBackgroundEntry({
          name,
          sourceType,
          backgroundUrl: appState.backgroundUrl
        });
        if (!added) {
          notify.error('Unable to save background to library.');
          return;
        }
        if (bgLibNameInput) bgLibNameInput.value = '';
        renderBackgroundLibraryOptions();
        bgLibSelect.value = added.id;
      });
    }

    if (bgLibApplyBtn) {
      bgLibApplyBtn.addEventListener('click', () => {
        const entry = getSelectedBackgroundLibraryEntry();
        if (!entry) {
          notify.warn('Select a background from the library first.');
          return;
        }
        setBackground(entry.backgroundUrl);
        bgUrlInput.value = entry.backgroundUrl;
        libraryTools.markBackgroundUsed(entry.id);
        renderBackgroundLibraryOptions();
        persistState();
      });
    }

    if (bgLibRenameBtn) {
      bgLibRenameBtn.addEventListener('click', async () => {
        const entry = getSelectedBackgroundLibraryEntry();
        if (!entry) {
          notify.warn('Select a background to rename.');
          return;
        }
        const proposedName = (bgLibNameInput && bgLibNameInput.value.trim()) || (await window.showInputAsync('Enter a new name for this background:', { title: 'Rename background', defaultValue: entry.name })) || '';
        if (!proposedName) return;
        libraryTools.renameBackgroundEntry(entry.id, proposedName);
        if (bgLibNameInput) bgLibNameInput.value = '';
        renderBackgroundLibraryOptions();
        bgLibSelect.value = entry.id;
      });
    }

    if (bgLibDeleteBtn) {
      bgLibDeleteBtn.addEventListener('click', () => {
        const entry = getSelectedBackgroundLibraryEntry();
        if (!entry) {
          notify.warn('Select a background to delete.');
          return;
        }
        window.showConfirmAsync(`Delete background library item "${entry.name}"?`).then((ok) => {
          if (!ok) return;
          libraryTools.deleteBackgroundEntry(entry.id);
          renderBackgroundLibraryOptions();
        });
      });
    }

    if (bgLibExportBtn) {
      bgLibExportBtn.addEventListener('click', () => {
        libraryTools.exportBackgroundLibrary();
      });
    }

    if (bgLibImportInput) {
      bgLibImportInput.addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const isImage = typeof file.type === 'string' && file.type.startsWith('image/');
        const isJson = file.name.toLowerCase().endsWith('.json') || file.type === 'application/json';

        if (isImage) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const backgroundUrl = String(e.target.result || '');
              if (!backgroundUrl) throw new Error('Image import produced empty data.');

              const inferredName = (bgLibNameInput && bgLibNameInput.value.trim()) || file.name.replace(/\.[^/.]+$/, '') || `Background ${libraryTools.getState().backgroundLibrary.length + 1}`;
              const added = libraryTools.addBackgroundEntry({
                name: inferredName,
                sourceType: 'fileData',
                backgroundUrl
              });
              if (!added) throw new Error('Failed to add image to background library.');

              renderBackgroundLibraryOptions();
              bgLibSelect.value = added.id;
              if (bgLibNameInput) bgLibNameInput.value = '';
              notify.success(`Imported image as background library item: ${added.name}`);
            } catch (err) {
              console.error(err);
              notify.error('Failed to import image into Background Library.');
            }
            bgLibImportInput.value = '';
          };
          reader.readAsDataURL(file);
          return;
        }

        if (isJson) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const result = libraryTools.importBackgroundLibraryJson(String(e.target.result || ''));
              renderBackgroundLibraryOptions();
              notify.success(`Imported ${result.added} background item(s).`);
            } catch (err) {
              console.error(err);
              notify.error('Failed to import background library JSON.');
            }
            bgLibImportInput.value = '';
          };
          reader.readAsText(file);
          return;
        }

        notify.warn('Unsupported file type. Use a .json library export or an image file.');
        bgLibImportInput.value = '';
      });
    }

    if (vendorLibSaveBtn) {
      vendorLibSaveBtn.addEventListener('click', () => {
        const items = buildVendorLibraryItemsFromTemplates();
        if (!items.length) {
          notify.warn('No vendor templates to save.');
          return;
        }

        const name = (vendorLibNameInput && vendorLibNameInput.value.trim()) || `Vendor List ${libraryTools.getState().vendorListLibrary.length + 1}`;
        const added = libraryTools.addVendorListEntry({ name, items });
        if (!added) {
          notify.error('Failed to save current templates to Vendor List Library.');
          return;
        }

        if (vendorLibNameInput) vendorLibNameInput.value = '';
        renderVendorLibraryOptions();
        vendorLibSelect.value = added.id;
      });
    }

    if (vendorLibLoadBtn) {
      vendorLibLoadBtn.addEventListener('click', () => {
        const entry = getSelectedVendorLibraryEntry();
        if (!entry) {
          notify.warn('Select a vendor list first.');
          return;
        }

        const mode = (vendorLibLoadMode && vendorLibLoadMode.value) || 'replace';
        const success = applyVendorLibraryEntry(entry, mode);
        if (!success) return;

        libraryTools.markVendorListUsed(entry.id);
        renderVendorLibraryOptions();
        persistState();
      });
    }

    if (vendorLibRenameBtn) {
      vendorLibRenameBtn.addEventListener('click', async () => {
        const entry = getSelectedVendorLibraryEntry();
        if (!entry) {
          notify.warn('Select a vendor list to rename.');
          return;
        }
        const proposedName = (vendorLibNameInput && vendorLibNameInput.value.trim()) || (await window.showInputAsync('Enter a new name for this vendor list:', { title: 'Rename vendor list', defaultValue: entry.name })) || '';
        if (!proposedName) return;

        libraryTools.renameVendorListEntry(entry.id, proposedName);
        if (vendorLibNameInput) vendorLibNameInput.value = '';
        renderVendorLibraryOptions();
        vendorLibSelect.value = entry.id;
      });
    }

    if (vendorLibDeleteBtn) {
      vendorLibDeleteBtn.addEventListener('click', () => {
        const entry = getSelectedVendorLibraryEntry();
        if (!entry) {
          notify.warn('Select a vendor list to delete.');
          return;
        }
        window.showConfirmAsync(`Delete vendor list library item "${entry.name}"?`).then((ok) => {
          if (!ok) return;
          libraryTools.deleteVendorListEntry(entry.id);
          renderVendorLibraryOptions();
        });
      });
    }

    if (vendorLibExportJsonBtn) {
      vendorLibExportJsonBtn.addEventListener('click', () => {
        libraryTools.exportVendorListLibrary();
      });
    }

    if (vendorLibExportCsvBtn) {
      vendorLibExportCsvBtn.addEventListener('click', () => {
        const entry = getSelectedVendorLibraryEntry();
        if (!entry) {
          notify.warn('Select a vendor list to export as CSV.');
          return;
        }
        exportVendorLibraryEntryCsv(entry);
      });
    }

    if (vendorLibImportInput) {
      vendorLibImportInput.addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const fileName = file.name || '';
        const lowerName = fileName.toLowerCase();
        const isJson = lowerName.endsWith('.json') || file.type === 'application/json';
        const isCsv = lowerName.endsWith('.csv') || file.type === 'text/csv';

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = String((e.target && e.target.result) || '');
            if (isJson) {
              const result = libraryTools.importVendorListLibraryJson(text);
              renderVendorLibraryOptions();
              notify.success(`Imported ${result.added} vendor list library item(s).`);
              return;
            }

            if (isCsv) {
              const listName = (vendorLibNameInput && vendorLibNameInput.value.trim()) || fileName.replace(/\.[^/.]+$/, '') || `Vendor List ${libraryTools.getState().vendorListLibrary.length + 1}`;
              const added = libraryTools.addVendorListFromCsv(listName, text);
              if (!added) {
                notify.error('Failed to import CSV as vendor list library item.');
                return;
              }
              renderVendorLibraryOptions();
              vendorLibSelect.value = added.id;
              if (vendorLibNameInput) vendorLibNameInput.value = '';
              notify.success(`Imported CSV as vendor list: ${added.name}`);
              return;
            }

            notify.warn('Unsupported file type. Use .json or .csv.');
          } catch (err) {
            console.error(err);
            notify.error('Failed to import Vendor List Library file.');
          } finally {
            vendorLibImportInput.value = '';
          }
        };

        reader.readAsText(file);
      });
    }

    if (snapshotExportBtn) {
      snapshotExportBtn.addEventListener('click', () => {
        const payload = buildFullSnapshotPayload('manual-export');
        downloadJsonFile(payload, `farmers-market-snapshot-${getDateStamp()}.json`);
        saveRecoverySnapshot('manual-export');
      });
    }

    if (snapshotArchiveSaveBtn) {
      snapshotArchiveSaveBtn.addEventListener('click', async () => {
        const payload = buildArchiveSnapshotPayload();
        const name = (snapshotArchiveNameInput && snapshotArchiveNameInput.value.trim()) || getArchiveDefaultName();
        const includeAutoTags = !snapshotArchiveAutoTagToggle || snapshotArchiveAutoTagToggle.checked;
        const tags = collectArchiveTags({
          includeAutoTags,
          eventTag: snapshotArchiveEventTagInput && snapshotArchiveEventTagInput.value
        });
        const added = await addSnapshotArchiveEntry(name, payload, { tags });
        if (!added) return;
        renderSnapshotArchiveOptions();
        if (snapshotArchiveSelect) snapshotArchiveSelect.value = added.id;
        if (snapshotArchiveNameInput) snapshotArchiveNameInput.value = '';
        if (snapshotArchiveEventTagInput) snapshotArchiveEventTagInput.value = '';
        notify.success(`Saved snapshot to archive library: ${added.name}`);
      });
    }

    if (snapshotArchiveRestoreBtn) {
      snapshotArchiveRestoreBtn.addEventListener('click', async () => {
        const entry = getSelectedSnapshotArchiveEntry();
        if (!entry) {
          notify.warn('Select an archived snapshot first.');
          return;
        }
        try {
          await applySnapshotObject(entry.snapshot, { skipConfirm: false, showSuccess: true });
        } catch (err) {
          console.error(err);
          notify.error('Failed to restore archived snapshot.');
        }
      });
    }

    if (snapshotArchiveRenameBtn) {
      snapshotArchiveRenameBtn.addEventListener('click', async () => {
        const entry = getSelectedSnapshotArchiveEntry();
        if (!entry) {
          notify.warn('Select an archived snapshot first.');
          return;
        }

        const proposedName = (snapshotArchiveNameInput && snapshotArchiveNameInput.value.trim()) || (await window.showInputAsync('Enter a new archive name:', { title: 'Rename archive', defaultValue: entry.name })) || '';
        if (!proposedName) return;

        if (!await renameSnapshotArchiveEntry(entry.id, proposedName)) {
          notify.error('Unable to rename archived snapshot.');
          return;
        }

        if (snapshotArchiveNameInput) snapshotArchiveNameInput.value = '';
        renderSnapshotArchiveOptions();
        if (snapshotArchiveSelect) snapshotArchiveSelect.value = entry.id;
      });
    }

    if (snapshotArchiveDeleteBtn) {
      snapshotArchiveDeleteBtn.addEventListener('click', async () => {
        const entry = getSelectedSnapshotArchiveEntry();
        if (!entry) {
          notify.warn('Select an archived snapshot first.');
          return;
        }

        const ok = await window.showConfirmAsync(`Delete archived snapshot "${entry.name}"?`);
        if (!ok) return;
        const deleted = await deleteSnapshotArchiveEntry(entry.id);
        if (!deleted) {
          notify.error('Unable to delete archived snapshot.');
          return;
        }
        renderSnapshotArchiveOptions();
      });
    }

    if (snapshotArchiveDuplicateBtn) {
      snapshotArchiveDuplicateBtn.addEventListener('click', async () => {
        const entry = getSelectedSnapshotArchiveEntry();
        if (!entry) {
          notify.warn('Select an archived snapshot first.');
          return;
        }

        const branchName = `${entry.name} (Branch ${new Date().toLocaleDateString()})`;
        const snapshotClone = JSON.parse(JSON.stringify(entry.snapshot));
        const branchTags = Array.isArray(entry.tags) ? entry.tags.slice() : [];
        branchTags.push('branch');

        const added = await addSnapshotArchiveEntry(branchName, snapshotClone, {
          tags: branchTags,
          branchFromId: entry.id
        });
        if (!added) return;

        renderSnapshotArchiveOptions();
        if (snapshotArchiveSelect) snapshotArchiveSelect.value = added.id;
        notify.success(`Created branch snapshot: ${added.name}`);
      });
    }

    if (snapshotArchiveSearchInput) {
      snapshotArchiveSearchInput.addEventListener('input', () => {
        renderSnapshotArchiveOptions();
      });
    }

    if (snapshotArchiveDateFromInput) {
      snapshotArchiveDateFromInput.addEventListener('change', () => {
        renderSnapshotArchiveOptions();
      });
    }

    if (snapshotArchiveDateToInput) {
      snapshotArchiveDateToInput.addEventListener('change', () => {
        renderSnapshotArchiveOptions();
      });
    }

    if (snapshotArchiveFilterClearBtn) {
      snapshotArchiveFilterClearBtn.addEventListener('click', () => {
        if (snapshotArchiveSearchInput) snapshotArchiveSearchInput.value = '';
        if (snapshotArchiveDateFromInput) snapshotArchiveDateFromInput.value = '';
        if (snapshotArchiveDateToInput) snapshotArchiveDateToInput.value = '';
        renderSnapshotArchiveOptions();
      });
    }

    if (snapshotRestoreBtn) {
      snapshotRestoreBtn.addEventListener('click', async () => {
        const file = snapshotImportInput && snapshotImportInput.files && snapshotImportInput.files[0];
        if (!file) {
          notify.warn('Select a snapshot JSON file first.');
          return;
        }
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const text = String((e.target && e.target.result) || '');
            const parsed = JSON.parse(text);
            await applySnapshotObject(parsed, { skipConfirm: false, showSuccess: true });
          } catch (err) {
            console.error(err);
            notify.error('Failed to restore snapshot JSON.');
          } finally {
            if (snapshotImportInput) snapshotImportInput.value = '';
          }
        };
        reader.readAsText(file);
      });
    }

    if (snapshotClearRecoveryBtn) {
      snapshotClearRecoveryBtn.addEventListener('click', () => {
        if (!localStorage.getItem(RECOVERY_STORAGE_KEY)) {
          notify.warn('No recovery snapshot is currently stored.');
          return;
        }
        window.showConfirmAsync('Clear the local recovery snapshot?').then((ok) => {
          if (!ok) return;
          localStorage.removeItem(RECOVERY_STORAGE_KEY);
          notify.success('Recovery snapshot cleared.');
        });
      });
    }

    if (selfCheckRunBtn) {
      selfCheckRunBtn.addEventListener('click', () => {
        runSelfCheck();
      });
    }

    function syncSidebarToggleState(isOpen) {
      if (!sidebarToggle) return;
      sidebarToggle.setAttribute('aria-expanded', String(!!isOpen));
      sidebarToggle.setAttribute('aria-label', isOpen ? 'Close sidebar' : 'Open sidebar');
      sidebarToggle.textContent = isOpen ? '✕ Close' : '☰ Menu';
    }

    if (sidebarToggle && sidebar) {
      syncSidebarToggleState(sidebar.classList.contains('open'));
      sidebarToggle.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('open');
        syncSidebarToggleState(isOpen);
      });

      document.addEventListener('click', (event) => {
        if (!sidebar.classList.contains('open')) return;
        if (sidebar.contains(event.target) || sidebarToggle.contains(event.target)) return;
        sidebar.classList.remove('open');
        syncSidebarToggleState(false);
        sidebarToggle.focus();
      });

      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (!sidebar.classList.contains('open')) return;
        sidebar.classList.remove('open');
        syncSidebarToggleState(false);
        sidebarToggle.focus();
      });

      window.addEventListener('resize', () => {
        if (window.innerWidth > 900) {
          sidebar.classList.remove('open');
          syncSidebarToggleState(false);
          sidebarToggle.focus();
        }

        if (typeof syncMapCanvasLayout === 'function') {
          syncMapCanvasLayout();
        }
      });
    }
  }

  window.bindCoreEventListeners = bindCoreEventListeners;
  window.bindLibrarySnapshotAndSidebarListeners = bindLibrarySnapshotAndSidebarListeners;
})();
