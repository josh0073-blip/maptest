function registerRootServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(function (err) {
      console.warn('Service worker registration failed for root-hosted mode.', err);
    });
  });
}

registerRootServiceWorker();

const pinsContainer = document.getElementById('pinsContainer');
const addVendorBtn = document.getElementById('add-vendor');
const saveStateBtn = document.getElementById('save-state');
const loadStateBtn = document.getElementById('load-state');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const resetMapBtn = document.getElementById('reset-map');
const vendorList = document.getElementById('vendor-list');
const mapArea = document.getElementById('mapArea');
const congestionToolsGroup = document.getElementById('congestion-tools-group');
const featureCongestionToggle = document.getElementById('feature-congestion-toggle');
const congestionKeyPanel = document.getElementById('congestion-key-panel');
const congestionKeyList = document.getElementById('congestion-key-list');
const mapCongestionKeyPanel = document.getElementById('map-congestion-key-panel');
const mapCongestionKeyList = document.getElementById('map-congestion-key-list');
const mapCongestionKeyDragHandle = document.getElementById('map-congestion-key-drag-handle');
const mapCongestionKeyResizeHandle = document.getElementById('map-congestion-key-resize-handle');

const bgUrlInput = document.getElementById('bg-url-input');
const bgUrlBtn = document.getElementById('bg-url-btn');
const bgFileInput = document.getElementById('bg-file-input');
const bgScaleLockBtn = document.getElementById('bg-scale-lock-btn');
const resetAllPinsBtn = document.getElementById('reset-all-pins');
const rotateAllPinsBtn = document.getElementById('rotate-all-pins');
const bgSizeRange = document.getElementById('bg-size-range');
const bgSizeDecrease = document.getElementById('bg-size-decrease');
const bgSizeIncrease = document.getElementById('bg-size-increase');
const bgSizeValue = document.getElementById('bg-size-value');
const bgOpacityRange = document.getElementById('bg-opacity-range');
const bgOpacityValue = document.getElementById('bg-opacity-value');
const bgLibNameInput = document.getElementById('bg-lib-name-input');
const bgLibSaveBtn = document.getElementById('bg-lib-save-btn');
const bgLibSelect = document.getElementById('bg-lib-select');
const bgLibApplyBtn = document.getElementById('bg-lib-apply-btn');
const bgLibRenameBtn = document.getElementById('bg-lib-rename-btn');
const bgLibDeleteBtn = document.getElementById('bg-lib-delete-btn');
const bgLibExportBtn = document.getElementById('bg-lib-export-btn');
const bgLibImportInput = document.getElementById('bg-lib-import-input');
const csvFileInput = document.getElementById('csv-file-input');
const csvUploadBtn = document.getElementById('csv-upload-btn');
const templateNameInput = document.getElementById('template-name-input');
const templateAddBtn = document.getElementById('template-add-btn');
const templateList = document.getElementById('template-list');
const templateCounter = document.getElementById('template-counter');
const selectAllBtn = document.getElementById('select-all-btn');
const deselectAllBtn = document.getElementById('deselect-all-btn');
const sortTemplatesBtn = document.getElementById('sort-templates-btn');
const clearTemplatesBtn = document.getElementById('clear-templates-btn');
const vendorLibNameInput = document.getElementById('vendor-lib-name-input');
const vendorLibSaveBtn = document.getElementById('vendor-lib-save-btn');
const vendorLibSelect = document.getElementById('vendor-lib-select');
const vendorLibLoadMode = document.getElementById('vendor-lib-load-mode');
const vendorLibLoadBtn = document.getElementById('vendor-lib-load-btn');
const vendorLibRenameBtn = document.getElementById('vendor-lib-rename-btn');
const vendorLibDeleteBtn = document.getElementById('vendor-lib-delete-btn');
const vendorLibExportJsonBtn = document.getElementById('vendor-lib-export-json-btn');
const vendorLibExportCsvBtn = document.getElementById('vendor-lib-export-csv-btn');
const vendorLibImportInput = document.getElementById('vendor-lib-import-input');
const snapshotExportBtn = document.getElementById('snapshot-export-btn');
const snapshotArchiveNameInput = document.getElementById('snapshot-archive-name-input');
const snapshotArchiveEventTagInput = document.getElementById('snapshot-archive-event-tag-input');
const snapshotArchiveAutoTagToggle = document.getElementById('snapshot-archive-auto-tag-toggle');
const snapshotArchiveSaveBtn = document.getElementById('snapshot-archive-save-btn');
const snapshotArchiveSearchInput = document.getElementById('snapshot-archive-search-input');
const snapshotArchiveDateFromInput = document.getElementById('snapshot-archive-date-from');
const snapshotArchiveDateToInput = document.getElementById('snapshot-archive-date-to');
const snapshotArchiveFilterClearBtn = document.getElementById('snapshot-archive-filter-clear-btn');
const snapshotArchiveSelect = document.getElementById('snapshot-archive-select');
const snapshotArchiveRestoreBtn = document.getElementById('snapshot-archive-restore-btn');
const snapshotArchiveRenameBtn = document.getElementById('snapshot-archive-rename-btn');
const snapshotArchiveDuplicateBtn = document.getElementById('snapshot-archive-duplicate-btn');
const snapshotArchiveDeleteBtn = document.getElementById('snapshot-archive-delete-btn');
const snapshotImportInput = document.getElementById('snapshot-import-input');
const snapshotRestoreBtn = document.getElementById('snapshot-restore-btn');
const snapshotClearRecoveryBtn = document.getElementById('snapshot-clear-recovery-btn');
const selfCheckRunBtn = document.getElementById('self-check-run-btn');
const selfCheckResults = document.getElementById('self-check-results');
const toastContainer = document.getElementById('toast-container');

const zoomRange = document.getElementById('zoom-range');
const zoomValue = document.getElementById('zoom-value');
const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const mapContent = document.getElementById('mapContent');
const mapTitle = document.getElementById('mapTitle');

const togglePinControlsBtn = document.getElementById('toggle-pin-controls');
const togglePinCategoryDisplayBtn = document.getElementById('toggle-pin-category-display');
const rotateSelectedPinsBtn = document.getElementById('rotate-selected-pins');
const alignLeftBtn = document.getElementById('align-left-btn');
const alignCenterBtn = document.getElementById('align-center-btn');
const alignRightBtn = document.getElementById('align-right-btn');
const alignTopBtn = document.getElementById('align-top-btn');
const alignMiddleBtn = document.getElementById('align-middle-btn');
const alignBottomBtn = document.getElementById('align-bottom-btn');
const pinAlignRefXSelect = document.getElementById('pin-align-ref-x');
const pinAlignRefYSelect = document.getElementById('pin-align-ref-y');
const pinAlignRefApplyBtn = document.getElementById('pin-align-ref-apply-btn');
const pinColorPicker = document.getElementById('pin-color-picker');
const pinStatusPicker = document.getElementById('pin-status-picker');
const pinCategoryPicker = document.getElementById('pin-category-picker');
const categoryNameInput = document.getElementById('category-name-input');
const categoryColorInput = document.getElementById('category-color-input');
const categoryAddBtn = document.getElementById('category-add-btn');
const categoryManageSelect = document.getElementById('category-manage-select');
const categoryRenameBtn = document.getElementById('category-rename-btn');
const categoryDeleteBtn = document.getElementById('category-delete-btn');
const categoryColorUpdateBtn = document.getElementById('category-color-update-btn');

const STORAGE_KEY = 'farmersMarketVendorMapState';
const LIBRARY_STORAGE_KEY = 'farmersMarketLibraries';
const RECOVERY_STORAGE_KEY = 'farmersMarketRecoverySnapshot';
const SNAPSHOT_ARCHIVE_STORAGE_KEY = 'farmersMarketSnapshotArchiveLibrary';
const SNAPSHOT_ARCHIVE_DB_NAME = 'farmersMarketArchiveDB';
const SNAPSHOT_ARCHIVE_DB_VERSION = 1;
const SNAPSHOT_ARCHIVE_STORE_NAME = 'appKv';
const SNAPSHOT_SCHEMA_VERSION = 1;
const SNAPSHOT_ARCHIVE_LIMIT = 120;
const HISTORY_LIMIT = 100;
const BACKGROUND_SCALE_MIN = 0.1;
const BACKGROUND_SCALE_MAX = 5;
const BACKGROUND_SCALE_STEP = 0.1;
const BACKGROUND_OPACITY_MIN = 0;
const BACKGROUND_OPACITY_MAX = 1;
const FEATURE_FLAG_STORAGE_KEY = 'farmersMarketFeatureFlags';
const CONGESTION_KEY_DEFAULT_POSITION = Object.freeze({ x: 16, y: 72 });
const CONGESTION_KEY_DEFAULT_SIZE = Object.freeze({ width: 280, height: 260 });
const CONGESTION_KEY_MIN_WIDTH = 220;
const CONGESTION_KEY_MIN_HEIGHT = 150;
const TOUCH_DOUBLE_TAP_MS = 380;
const DEFAULT_FEATURE_FLAGS = Object.freeze({
  congestionLabelSubstitution: false,
  congestionMapKeyPosition: CONGESTION_KEY_DEFAULT_POSITION,
  congestionMapKeySize: CONGESTION_KEY_DEFAULT_SIZE
});

function normalizeCongestionMapKeyPosition(value) {
  const candidate = value && typeof value === 'object' ? value : {};
  const x = Number(candidate.x);
  const y = Number(candidate.y);
  return {
    x: Number.isFinite(x) ? x : CONGESTION_KEY_DEFAULT_POSITION.x,
    y: Number.isFinite(y) ? y : CONGESTION_KEY_DEFAULT_POSITION.y
  };
}

function normalizeCongestionMapKeySize(value) {
  const candidate = value && typeof value === 'object' ? value : {};
  const width = Number(candidate.width);
  const height = Number(candidate.height);
  return {
    width: Number.isFinite(width) ? width : CONGESTION_KEY_DEFAULT_SIZE.width,
    height: Number.isFinite(height) ? height : CONGESTION_KEY_DEFAULT_SIZE.height
  };
}

function readFeatureFlags() {
  try {
    const raw = localStorage.getItem(FEATURE_FLAG_STORAGE_KEY);
    if (!raw) return Object.assign({}, DEFAULT_FEATURE_FLAGS);
    const parsed = JSON.parse(raw);
    const nextFlags = Object.assign({}, DEFAULT_FEATURE_FLAGS, parsed && typeof parsed === 'object' ? parsed : {});
    nextFlags.congestionMapKeyPosition = normalizeCongestionMapKeyPosition(nextFlags.congestionMapKeyPosition);
    nextFlags.congestionMapKeySize = normalizeCongestionMapKeySize(nextFlags.congestionMapKeySize);
    return nextFlags;
  } catch (err) {
    return {
      congestionLabelSubstitution: false,
      congestionMapKeyPosition: normalizeCongestionMapKeyPosition(null),
      congestionMapKeySize: normalizeCongestionMapKeySize(null)
    };
  }
}

let featureFlags = readFeatureFlags();
const mapCongestionKeyDragState = {
  armed: false,
  dragging: false,
  pendingConfirm: false,
  lastTapAt: 0,
  pointerId: null,
  startClientX: 0,
  startClientY: 0,
  startPosX: CONGESTION_KEY_DEFAULT_POSITION.x,
  startPosY: CONGESTION_KEY_DEFAULT_POSITION.y,
  activePosX: CONGESTION_KEY_DEFAULT_POSITION.x,
  activePosY: CONGESTION_KEY_DEFAULT_POSITION.y
};
const mapCongestionKeyResizeState = {
  resizing: false,
  pointerId: null,
  startClientX: 0,
  startClientY: 0,
  startWidth: CONGESTION_KEY_DEFAULT_SIZE.width,
  startHeight: CONGESTION_KEY_DEFAULT_SIZE.height,
  activeWidth: CONGESTION_KEY_DEFAULT_SIZE.width,
  activeHeight: CONGESTION_KEY_DEFAULT_SIZE.height
};

function isCongestionModeEnabled() {
  return !!featureFlags.congestionLabelSubstitution;
}

function getCongestionMapKeyPosition() {
  return normalizeCongestionMapKeyPosition(featureFlags.congestionMapKeyPosition);
}

function getCongestionMapKeySize() {
  return normalizeCongestionMapKeySize(featureFlags.congestionMapKeySize);
}

function setCongestionMapKeyPosition(position, options) {
  const opts = options && typeof options === 'object' ? options : {};
  const persist = opts.persist !== false;
  const nextPosition = normalizeCongestionMapKeyPosition(position);

  featureFlags = Object.assign({}, featureFlags, {
    congestionMapKeyPosition: nextPosition
  });

  if (mapCongestionKeyPanel) {
    mapCongestionKeyPanel.style.left = `${Math.round(nextPosition.x)}px`;
    mapCongestionKeyPanel.style.top = `${Math.round(nextPosition.y)}px`;
  }

  if (persist) persistFeatureFlags();
}

function setCongestionMapKeySize(size, options) {
  const opts = options && typeof options === 'object' ? options : {};
  const persist = opts.persist !== false;
  const nextSize = normalizeCongestionMapKeySize(size);

  featureFlags = Object.assign({}, featureFlags, {
    congestionMapKeySize: nextSize
  });

  if (mapCongestionKeyPanel) {
    mapCongestionKeyPanel.style.width = `${Math.round(nextSize.width)}px`;
    mapCongestionKeyPanel.style.height = `${Math.round(nextSize.height)}px`;
  }

  if (persist) persistFeatureFlags();
}

function setMapCongestionKeyArmed(armed) {
  mapCongestionKeyDragState.armed = !!armed;
  if (mapCongestionKeyPanel) {
    mapCongestionKeyPanel.classList.toggle('drag-armed', mapCongestionKeyDragState.armed);
  }
}

function resetMapCongestionKeyDragState() {
  mapCongestionKeyDragState.dragging = false;
  mapCongestionKeyDragState.pointerId = null;
  mapCongestionKeyDragState.pendingConfirm = false;
  mapCongestionKeyDragState.lastTapAt = 0;
  document.removeEventListener('pointermove', onMapCongestionKeyPointerMove);
  document.removeEventListener('pointerup', onMapCongestionKeyPointerUp);
  document.removeEventListener('pointercancel', onMapCongestionKeyPointerCancel);
  setMapCongestionKeyArmed(false);
  if (mapCongestionKeyPanel) mapCongestionKeyPanel.classList.remove('dragging');
}

function resetMapCongestionKeyResizeState() {
  mapCongestionKeyResizeState.resizing = false;
  mapCongestionKeyResizeState.pointerId = null;
  document.removeEventListener('pointermove', onMapCongestionKeyResizePointerMove);
  document.removeEventListener('pointerup', onMapCongestionKeyResizePointerUp);
  document.removeEventListener('pointercancel', onMapCongestionKeyResizePointerCancel);
  if (mapCongestionKeyPanel) mapCongestionKeyPanel.classList.remove('resizing');
}

function persistFeatureFlags() {
  try {
    localStorage.setItem(FEATURE_FLAG_STORAGE_KEY, JSON.stringify(featureFlags));
  } catch (err) {
    // ignore storage failures
  }
}

function syncCongestionFeatureUi() {
  if (congestionToolsGroup) congestionToolsGroup.hidden = false;
  if (featureCongestionToggle) featureCongestionToggle.checked = isCongestionModeEnabled();
  if (!isCongestionModeEnabled() && congestionKeyPanel) congestionKeyPanel.hidden = true;
  if (mapCongestionKeyPanel) {
    mapCongestionKeyPanel.hidden = !isCongestionModeEnabled();
  }
  if (!isCongestionModeEnabled()) {
    resetMapCongestionKeyDragState();
    resetMapCongestionKeyResizeState();
  }
  applyMapCongestionKeySizeClamped({ persist: false });
  applyMapCongestionKeyPositionClamped({ persist: false });
}

syncCongestionFeatureUi();

const stateStore = window.createAppStateStore({
  nextId: 1,
  vendors: [],
  vendorCategories: [
    { id: 1, name: 'Vegetable Farmer', color: '#16a34a' },
    { id: 2, name: 'Art Vendor', color: '#0284c7' },
    { id: 3, name: 'Prepared Food', color: '#ea580c' }
  ],
  vendorTemplates: [
    { id: 1, name: 'Tomato Stand', active: false },
    { id: 2, name: 'Bakery', active: false },
    { id: 3, name: 'Cheese', active: false }
  ],
  backgroundUrl: '',
  backgroundScale: 1,
  backgroundOpacity: 1,
  backgroundScaleLocked: false,
  mapTitleText: 'Farmers Market Vendor Map',
  pinControlsVisible: false,
  pinCategoryDisplayVisible: true
});
const appState = stateStore.getState();
const patchState = stateStore.patchState;
const libraryTools = window.createLibraryStateTools();
const vendorListTools = window.createVendorListTools({
  pinsContainer,
  vendorList,
  congestionKeyPanel,
  congestionKeyList,
  mapCongestionKeyPanel,
  mapCongestionKeyList,
  isCongestionModeEnabled,
  getVendors: () => appState.vendors,
  getVendorCategories: () => appState.vendorCategories,
  getBackgroundScale: () => appState.backgroundScale
});
const updateClusters = vendorListTools.updateClusters;
const updateVendorList = vendorListTools.updateVendorList;
const benchmarkVendorListUpdate = vendorListTools.benchmarkVendorListUpdate;

if (featureCongestionToggle) {
  featureCongestionToggle.addEventListener('change', () => {
    featureFlags = Object.assign({}, featureFlags, {
      congestionLabelSubstitution: !!featureCongestionToggle.checked
    });
    persistFeatureFlags();
    syncCongestionFeatureUi();
    updateVendorList();
    persistState();
  });
}
const pinStyleTools = window.createPinStyleTools({
  getBackgroundScale: () => appState.backgroundScale
});
const applyPinPosition = pinStyleTools.applyPinPosition;
const applyPinTransform = pinStyleTools.applyPinTransform;
const animatePin = pinStyleTools.animatePin;

let selectionTools = null;
const baseMapCanvasSize = {
  width: 0,
  height: 0
};

function getBaseMapCanvasSize() {
  if (baseMapCanvasSize.width > 0 && baseMapCanvasSize.height > 0) {
    return baseMapCanvasSize;
  }

  const width = Math.max(1, mapArea.clientWidth || mapArea.offsetWidth || 1200);
  const height = Math.max(1, mapArea.clientHeight || mapArea.offsetHeight || 800);
  baseMapCanvasSize.width = width;
  baseMapCanvasSize.height = height;
  return baseMapCanvasSize;
}

const snapshotArchiveStorage = window.createSnapshotArchiveStorage({
  storageKey: SNAPSHOT_ARCHIVE_STORAGE_KEY,
  dbName: SNAPSHOT_ARCHIVE_DB_NAME,
  dbVersion: SNAPSHOT_ARCHIVE_DB_VERSION,
  storeName: SNAPSHOT_ARCHIVE_STORE_NAME
});

const actions = {
  setBackgroundUrl(url) {
    patchState({ backgroundUrl: url || '' });
  },
  setBackgroundScale(value) {
    patchState({ backgroundScale: value });
  },
  setBackgroundOpacity(value) {
    patchState({ backgroundOpacity: value });
  },
  setBackgroundScaleLocked(locked) {
    patchState({ backgroundScaleLocked: !!locked });
  },
  setPinControlsVisible(visible) {
    patchState({ pinControlsVisible: !!visible });
  },
  setPinCategoryDisplayVisible(visible) {
    patchState({ pinCategoryDisplayVisible: !!visible });
  },
  setMapTitleText(text) {
    const sanitizeText = typeof window.sanitizeEditableText === 'function'
      ? window.sanitizeEditableText
      : function (value, fallback) { return String(value || '').trim() || String(fallback || ''); };
    patchState({ mapTitleText: sanitizeText(text, 'Farmers Market Vendor Map', 80) });
  },
  addVendorRecord(initial) {
    const vendor = {
      id: appState.nextId,
      name: initial.name,
      x: initial.x,
      y: initial.y,
      templateId: initial.templateId || null,
      categoryId: initial.categoryId || null
    };
    patchState({
      nextId: appState.nextId + 1,
      vendors: [...appState.vendors, vendor]
    });
    return vendor;
  },
  removeVendorById(id) {
    const idx = appState.vendors.findIndex((v) => v.id === id);
    if (idx < 0) return null;
    const removed = appState.vendors[idx];
    const nextVendors = appState.vendors.filter((v) => v.id !== id);
    patchState({ vendors: nextVendors });
    return removed;
  },
  applyLoadedState(normalized) {
    patchState({
      nextId: normalized.nextId,
      vendorCategories: normalized.vendorCategories,
      vendorTemplates: normalized.vendorTemplates,
      vendors: normalized.vendors,
      backgroundScale: normalized.backgroundScale,
      backgroundOpacity: normalized.backgroundOpacity,
      backgroundScaleLocked: normalized.backgroundScaleLocked,
      mapTitleText: normalized.mapTitleText,
      pinCategoryDisplayVisible: normalized.pinCategoryDisplayVisible
    });
  },
  resetCoreState() {
    patchState({
      vendors: [],
      nextId: 1,
      backgroundScaleLocked: false
    });
  }
};

function setBackground(url) {
  const normalizeUrl = typeof window.normalizeBackgroundUrl === 'function'
    ? window.normalizeBackgroundUrl
    : function (value) { return String(value || '').trim(); };
  const safeUrl = normalizeUrl(url);

  actions.setBackgroundUrl(safeUrl);
  if (appState.backgroundUrl) {
    document.documentElement.style.setProperty('--bg-url', `url('${appState.backgroundUrl}')`);
  } else {
    document.documentElement.style.removeProperty('--bg-url');
  }

  return !!safeUrl;
}

const panZoomTools = window.createPanZoomTools({
  mapArea,
  mapContent,
  zoomRange,
  zoomValue
});
const applyZoomPan = panZoomTools.applyZoomPan;
const setZoom = panZoomTools.setZoom;
const getZoomLevel = panZoomTools.getZoomLevel;
const addMapPanHandlers = panZoomTools.addMapPanHandlers;

function applyBackgroundScale() {
  actions.setBackgroundScale(Math.min(BACKGROUND_SCALE_MAX, Math.max(BACKGROUND_SCALE_MIN, appState.backgroundScale)));
  const baseSize = getBaseMapCanvasSize();
  mapContent.style.width = `${Math.round(baseSize.width * appState.backgroundScale)}px`;
  mapContent.style.height = `${Math.round(baseSize.height * appState.backgroundScale)}px`;

  // Re-align existing pins to current background scale
  pinsContainer.querySelectorAll('.vendor-pin').forEach((pin) => {
    const vendor = appState.vendors.find((v) => v.id === Number(pin.dataset.id));
    if (vendor) {
      applyPinPosition(vendor, pin);
    }
  });

  bgSizeRange.value = appState.backgroundScale;
  bgSizeValue.textContent = `${Math.round(appState.backgroundScale * 100)}%`;
  applyMapCongestionKeySizeClamped({ persist: false });
  applyMapCongestionKeyPositionClamped({ persist: false });
}

function clampMapCongestionKeySize(size) {
  const nextSize = normalizeCongestionMapKeySize(size);
  if (!mapContent) return nextSize;

  const mapWidth = mapContent.clientWidth || parseFloat(mapContent.style.width) || nextSize.width;
  const mapHeight = mapContent.clientHeight || parseFloat(mapContent.style.height) || nextSize.height;
  const maxWidth = Math.max(CONGESTION_KEY_MIN_WIDTH, mapWidth - 8);
  const maxHeight = Math.max(CONGESTION_KEY_MIN_HEIGHT, mapHeight - 8);

  return {
    width: Math.min(maxWidth, Math.max(CONGESTION_KEY_MIN_WIDTH, nextSize.width)),
    height: Math.min(maxHeight, Math.max(CONGESTION_KEY_MIN_HEIGHT, nextSize.height))
  };
}

function applyMapCongestionKeySizeClamped(options) {
  const opts = options && typeof options === 'object' ? options : {};
  const clamped = clampMapCongestionKeySize(getCongestionMapKeySize());
  setCongestionMapKeySize(clamped, { persist: opts.persist !== false });
  return clamped;
}

function clampMapCongestionKeyPosition(position) {
  const nextPosition = normalizeCongestionMapKeyPosition(position);
  if (!mapCongestionKeyPanel || !mapContent) return nextPosition;

  const panelWidth = mapCongestionKeyPanel.offsetWidth || 220;
  const panelHeight = mapCongestionKeyPanel.offsetHeight || 120;
  const mapWidth = mapContent.clientWidth || parseFloat(mapContent.style.width) || panelWidth;
  const mapHeight = mapContent.clientHeight || parseFloat(mapContent.style.height) || panelHeight;
  const maxX = Math.max(0, mapWidth - panelWidth - 8);
  const maxY = Math.max(0, mapHeight - panelHeight - 8);

  return {
    x: Math.min(maxX, Math.max(0, nextPosition.x)),
    y: Math.min(maxY, Math.max(0, nextPosition.y))
  };
}

function applyMapCongestionKeyPositionClamped(options) {
  const opts = options && typeof options === 'object' ? options : {};
  const clamped = clampMapCongestionKeyPosition(getCongestionMapKeyPosition());
  setCongestionMapKeyPosition(clamped, { persist: opts.persist !== false });
  return clamped;
}

function endMapCongestionKeyDrag(persist) {
  mapCongestionKeyDragState.dragging = false;
  mapCongestionKeyDragState.pointerId = null;
  if (mapCongestionKeyPanel) mapCongestionKeyPanel.classList.remove('dragging');
  setMapCongestionKeyArmed(false);

  document.removeEventListener('pointermove', onMapCongestionKeyPointerMove);
  document.removeEventListener('pointerup', onMapCongestionKeyPointerUp);
  document.removeEventListener('pointercancel', onMapCongestionKeyPointerCancel);

  if (persist) {
    setCongestionMapKeyPosition({
      x: mapCongestionKeyDragState.activePosX,
      y: mapCongestionKeyDragState.activePosY
    }, { persist: true });
    persistState();
  }
}

function onMapCongestionKeyPointerMove(event) {
  if (!mapCongestionKeyDragState.dragging) return;
  if (event.pointerId !== mapCongestionKeyDragState.pointerId) return;

  event.preventDefault();
  event.stopPropagation();

  const zoom = typeof getZoomLevel === 'function'
    ? Math.max(0.1, Number(getZoomLevel()) || 1)
    : 1;
  const dx = (event.clientX - mapCongestionKeyDragState.startClientX) / zoom;
  const dy = (event.clientY - mapCongestionKeyDragState.startClientY) / zoom;
  const nextPosition = clampMapCongestionKeyPosition({
    x: mapCongestionKeyDragState.startPosX + dx,
    y: mapCongestionKeyDragState.startPosY + dy
  });

  mapCongestionKeyDragState.activePosX = nextPosition.x;
  mapCongestionKeyDragState.activePosY = nextPosition.y;
  setCongestionMapKeyPosition(nextPosition, { persist: false });
}

function onMapCongestionKeyPointerUp(event) {
  if (!mapCongestionKeyDragState.dragging) return;
  if (event.pointerId !== mapCongestionKeyDragState.pointerId) return;

  event.preventDefault();
  event.stopPropagation();
  endMapCongestionKeyDrag(true);
}

function onMapCongestionKeyPointerCancel(event) {
  if (!mapCongestionKeyDragState.dragging) return;
  if (event.pointerId !== mapCongestionKeyDragState.pointerId) return;

  event.preventDefault();
  event.stopPropagation();
  endMapCongestionKeyDrag(false);
}

function startMapCongestionKeyDrag(event) {
  if (!mapCongestionKeyPanel) return;

  const clamped = applyMapCongestionKeyPositionClamped({ persist: false });
  mapCongestionKeyDragState.dragging = true;
  mapCongestionKeyDragState.pointerId = event.pointerId;
  mapCongestionKeyDragState.startClientX = event.clientX;
  mapCongestionKeyDragState.startClientY = event.clientY;
  mapCongestionKeyDragState.startPosX = clamped.x;
  mapCongestionKeyDragState.startPosY = clamped.y;
  mapCongestionKeyDragState.activePosX = clamped.x;
  mapCongestionKeyDragState.activePosY = clamped.y;
  mapCongestionKeyPanel.classList.add('dragging');

  if (mapCongestionKeyDragHandle && typeof mapCongestionKeyDragHandle.setPointerCapture === 'function') {
    try {
      mapCongestionKeyDragHandle.setPointerCapture(event.pointerId);
    } catch (err) {
      // ignore capture failures
    }
  }

  document.addEventListener('pointermove', onMapCongestionKeyPointerMove);
  document.addEventListener('pointerup', onMapCongestionKeyPointerUp);
  document.addEventListener('pointercancel', onMapCongestionKeyPointerCancel);
}

async function confirmMapCongestionKeyDragArm() {
  if (mapCongestionKeyDragState.pendingConfirm) return;
  mapCongestionKeyDragState.pendingConfirm = true;
  let accepted = false;
  try {
    if (typeof window.showConfirmAsync === 'function') {
      accepted = await window.showConfirmAsync(
        'Enable touch drag for the map congestion key? Drag mode will turn off after you drop it.',
        {
          title: 'Move Congestion Key',
          acceptLabel: 'Enable Drag',
          cancelLabel: 'Cancel'
        }
      );
    } else {
      accepted = window.confirm('Enable touch drag for the map congestion key?');
    }
  } finally {
    mapCongestionKeyDragState.pendingConfirm = false;
  }

  if (!accepted) {
    setMapCongestionKeyArmed(false);
    return;
  }

  setMapCongestionKeyArmed(true);
  if (notify && typeof notify.info === 'function') {
    notify.info('Drag mode armed. Click or touch and drag the congestion key to reposition it.');
  }
}

function bindMapCongestionKeyTouchDrag() {
  if (!mapCongestionKeyDragHandle) return;

  mapCongestionKeyDragHandle.addEventListener('dblclick', function (event) {
    if (!isCongestionModeEnabled()) return;
    if (!mapCongestionKeyPanel || mapCongestionKeyPanel.hidden) return;
    if (mapCongestionKeyDragState.dragging) return;
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();
    confirmMapCongestionKeyDragArm();
  });

  mapCongestionKeyDragHandle.addEventListener('pointerdown', function (event) {
    if (!isCongestionModeEnabled()) return;
    if (!mapCongestionKeyPanel || mapCongestionKeyPanel.hidden) return;
    if (mapCongestionKeyDragState.dragging) return;

    if (event.pointerType === 'mouse') {
      if (event.button !== 0) return;
      if (!mapCongestionKeyDragState.armed) return;
      event.preventDefault();
      event.stopPropagation();
      startMapCongestionKeyDrag(event);
      return;
    }

    if (event.pointerType !== 'touch') return;

    event.preventDefault();
    event.stopPropagation();

    if (mapCongestionKeyDragState.armed) {
      startMapCongestionKeyDrag(event);
      return;
    }

    const now = Date.now();
    if (now - mapCongestionKeyDragState.lastTapAt <= TOUCH_DOUBLE_TAP_MS) {
      mapCongestionKeyDragState.lastTapAt = 0;
      confirmMapCongestionKeyDragArm();
      return;
    }

    mapCongestionKeyDragState.lastTapAt = now;
  });
}

function endMapCongestionKeyResize(persist) {
  mapCongestionKeyResizeState.resizing = false;
  mapCongestionKeyResizeState.pointerId = null;
  if (mapCongestionKeyPanel) mapCongestionKeyPanel.classList.remove('resizing');

  document.removeEventListener('pointermove', onMapCongestionKeyResizePointerMove);
  document.removeEventListener('pointerup', onMapCongestionKeyResizePointerUp);
  document.removeEventListener('pointercancel', onMapCongestionKeyResizePointerCancel);

  if (persist) {
    setCongestionMapKeySize({
      width: mapCongestionKeyResizeState.activeWidth,
      height: mapCongestionKeyResizeState.activeHeight
    }, { persist: true });
    applyMapCongestionKeyPositionClamped({ persist: false });
    persistState();
  }
}

function onMapCongestionKeyResizePointerMove(event) {
  if (!mapCongestionKeyResizeState.resizing) return;
  if (event.pointerId !== mapCongestionKeyResizeState.pointerId) return;

  event.preventDefault();
  event.stopPropagation();

  const zoom = typeof getZoomLevel === 'function'
    ? Math.max(0.1, Number(getZoomLevel()) || 1)
    : 1;
  const dx = (event.clientX - mapCongestionKeyResizeState.startClientX) / zoom;
  const dy = (event.clientY - mapCongestionKeyResizeState.startClientY) / zoom;
  const nextSize = clampMapCongestionKeySize({
    width: mapCongestionKeyResizeState.startWidth + dx,
    height: mapCongestionKeyResizeState.startHeight + dy
  });

  mapCongestionKeyResizeState.activeWidth = nextSize.width;
  mapCongestionKeyResizeState.activeHeight = nextSize.height;
  setCongestionMapKeySize(nextSize, { persist: false });
  applyMapCongestionKeyPositionClamped({ persist: false });
}

function onMapCongestionKeyResizePointerUp(event) {
  if (!mapCongestionKeyResizeState.resizing) return;
  if (event.pointerId !== mapCongestionKeyResizeState.pointerId) return;

  event.preventDefault();
  event.stopPropagation();
  endMapCongestionKeyResize(true);
}

function onMapCongestionKeyResizePointerCancel(event) {
  if (!mapCongestionKeyResizeState.resizing) return;
  if (event.pointerId !== mapCongestionKeyResizeState.pointerId) return;

  event.preventDefault();
  event.stopPropagation();
  endMapCongestionKeyResize(false);
}

function bindMapCongestionKeyResize() {
  if (!mapCongestionKeyResizeHandle) return;

  mapCongestionKeyResizeHandle.addEventListener('pointerdown', function (event) {
    if (!isCongestionModeEnabled()) return;
    if (!mapCongestionKeyPanel || mapCongestionKeyPanel.hidden) return;
    if (mapCongestionKeyResizeState.resizing || mapCongestionKeyDragState.dragging) return;

    event.preventDefault();
    event.stopPropagation();

    const size = applyMapCongestionKeySizeClamped({ persist: false });
    mapCongestionKeyResizeState.resizing = true;
    mapCongestionKeyResizeState.pointerId = event.pointerId;
    mapCongestionKeyResizeState.startClientX = event.clientX;
    mapCongestionKeyResizeState.startClientY = event.clientY;
    mapCongestionKeyResizeState.startWidth = size.width;
    mapCongestionKeyResizeState.startHeight = size.height;
    mapCongestionKeyResizeState.activeWidth = size.width;
    mapCongestionKeyResizeState.activeHeight = size.height;
    mapCongestionKeyPanel.classList.add('resizing');

    if (typeof mapCongestionKeyResizeHandle.setPointerCapture === 'function') {
      try {
        mapCongestionKeyResizeHandle.setPointerCapture(event.pointerId);
      } catch (err) {
        // ignore capture failures
      }
    }

    document.addEventListener('pointermove', onMapCongestionKeyResizePointerMove);
    document.addEventListener('pointerup', onMapCongestionKeyResizePointerUp);
    document.addEventListener('pointercancel', onMapCongestionKeyResizePointerCancel);
  });
}

function applyBackgroundOpacity() {
  actions.setBackgroundOpacity(Math.min(BACKGROUND_OPACITY_MAX, Math.max(BACKGROUND_OPACITY_MIN, appState.backgroundOpacity)));
  document.documentElement.style.setProperty('--bg-opacity', String(appState.backgroundOpacity));
  if (bgOpacityRange) {
    bgOpacityRange.value = String(appState.backgroundOpacity);
  }
  if (bgOpacityValue) {
    bgOpacityValue.textContent = `${Math.round(appState.backgroundOpacity * 100)}%`;
  }
}

function updateBgScaleLockButton() {
  bgScaleLockBtn.textContent = appState.backgroundScaleLocked ? 'Unlock background scale' : 'Lock background scale';
}

function updatePinControlVisibility() {
  document.body.classList.toggle('hide-pin-controls', !appState.pinControlsVisible);
}

function updatePinCategoryVisibility() {
  document.body.classList.toggle('hide-pin-categories', !appState.pinCategoryDisplayVisible);
  if (togglePinCategoryDisplayBtn) {
    togglePinCategoryDisplayBtn.textContent = appState.pinCategoryDisplayVisible
      ? 'Hide Category Display'
      : 'Show Category Display';
  }
}

function getSelectedBackgroundLibraryEntry() {
  const selectedId = bgLibSelect ? bgLibSelect.value : '';
  if (!selectedId) return null;
  return libraryTools.getState().backgroundLibrary.find((entry) => entry.id === selectedId) || null;
}

function renderBackgroundLibraryOptions() {
  if (!bgLibSelect) return;
  const selectedId = bgLibSelect.value;
  bgLibSelect.innerHTML = '';

  libraryTools.getState().backgroundLibrary.forEach((entry) => {
    const option = document.createElement('option');
    option.value = entry.id;
    option.textContent = entry.name;
    bgLibSelect.append(option);
  });

  if (selectedId && libraryTools.getState().backgroundLibrary.some((entry) => entry.id === selectedId)) {
    bgLibSelect.value = selectedId;
  }
}

function renderVendorLibraryOptions() {
  if (!vendorLibSelect) return;
  const selectedId = vendorLibSelect.value;
  vendorLibSelect.innerHTML = '';
  libraryTools.getState().vendorListLibrary.forEach((entry) => {
    const option = document.createElement('option');
    option.value = entry.id;
    option.textContent = entry.name;
    vendorLibSelect.append(option);
  });

  if (selectedId && libraryTools.getState().vendorListLibrary.some((entry) => entry.id === selectedId)) {
    vendorLibSelect.value = selectedId;
  }
}

function getSelectedVendorLibraryEntry() {
  const selectedId = vendorLibSelect ? vendorLibSelect.value : '';
  if (!selectedId) return null;
  return libraryTools.getState().vendorListLibrary.find((entry) => entry.id === selectedId) || null;
}

function normalizeTemplateName(name) {
  return String(name || '').trim().toLowerCase();
}

const notifyTools = window.createNotifyTools({ toastContainer });
const notify = notifyTools.notify;

window.appNotify = notify;

bindMapCongestionKeyTouchDrag();
bindMapCongestionKeyResize();

function buildVendorLibraryItemsFromTemplates() {
  return appState.vendorTemplates.map((template) => ({
    name: template.name,
    active: !!template.active
  }));
}

function getCategoryById(categoryId) {
  const normalized = Number(categoryId);
  if (!Number.isFinite(normalized)) return null;
  return appState.vendorCategories.find((category) => category.id === normalized) || null;
}

function renderPinCategoryOptions() {
  if (!pinCategoryPicker) return;
  const selectedValue = pinCategoryPicker.value;
  pinCategoryPicker.innerHTML = '';

  const uncategorizedOption = document.createElement('option');
  uncategorizedOption.value = '';
  uncategorizedOption.textContent = 'Uncategorized';
  pinCategoryPicker.append(uncategorizedOption);

  appState.vendorCategories.forEach((category) => {
    const option = document.createElement('option');
    option.value = String(category.id);
    option.textContent = category.name;
    pinCategoryPicker.append(option);
  });

  const hasSelected = selectedValue && appState.vendorCategories.some((category) => String(category.id) === selectedValue);
  pinCategoryPicker.value = hasSelected ? selectedValue : '';
}

function normalizeCategoryColor(value, fallback) {
  const raw = String(value || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
  return fallback || '#16a34a';
}

function getSelectedManagedCategory() {
  if (!categoryManageSelect || !categoryManageSelect.value) return null;
  const selectedId = Number(categoryManageSelect.value);
  if (!Number.isFinite(selectedId)) return null;
  return getCategoryById(selectedId);
}

function renderCategoryManagerOptions() {
  if (!categoryManageSelect) return;
  const previousValue = categoryManageSelect.value;
  categoryManageSelect.innerHTML = '';

  appState.vendorCategories.forEach((category) => {
    const option = document.createElement('option');
    option.value = String(category.id);
    option.textContent = category.name + ' (' + category.color + ')';
    categoryManageSelect.append(option);
  });

  const hasPrevious = previousValue && appState.vendorCategories.some((category) => String(category.id) === previousValue);
  categoryManageSelect.value = hasPrevious
    ? previousValue
    : (appState.vendorCategories[0] ? String(appState.vendorCategories[0].id) : '');
}

function refreshCategoryDependentUi() {
  const validCategoryIds = new Set(appState.vendorCategories.map((category) => category.id));
  appState.vendors.forEach((vendor) => {
    if (vendor.categoryId !== null && !validCategoryIds.has(vendor.categoryId)) {
      vendor.categoryId = null;
    }
    const pin = pinsContainer.querySelector(".vendor-pin[data-id='" + vendor.id + "']");
    if (pin) setPinCategory(vendor, pin, vendor.categoryId);
  });

  renderPinCategoryOptions();
  renderCategoryManagerOptions();
  updateVendorList();
}

function bindCategoryManagerListeners() {
  const sanitizeText = typeof window.sanitizeEditableText === 'function'
    ? window.sanitizeEditableText
    : function (value, fallback) { return String(value || '').trim() || String(fallback || ''); };

  if (categoryManageSelect) {
    categoryManageSelect.addEventListener('change', () => {
      const selected = getSelectedManagedCategory();
      if (!selected) return;
      if (categoryNameInput) categoryNameInput.value = selected.name;
      if (categoryColorInput) categoryColorInput.value = normalizeCategoryColor(selected.color, '#16a34a');
    });
  }

  if (categoryAddBtn) {
    categoryAddBtn.addEventListener('click', () => {
      const proposedName = sanitizeText(categoryNameInput ? categoryNameInput.value : '', '', 40);
      if (!proposedName) {
        notify.warn('Enter a category name first.');
        return;
      }

      const duplicate = appState.vendorCategories.some((category) => String(category.name || '').toLowerCase() === proposedName.toLowerCase());
      if (duplicate) {
        notify.warn('That category already exists.');
        return;
      }

      const nextId = appState.vendorCategories.reduce((max, category) => Math.max(max, Number(category.id) || 0), 0) + 1;
      const nextColor = normalizeCategoryColor(categoryColorInput ? categoryColorInput.value : '', '#16a34a');
      const nextCategories = appState.vendorCategories.concat([{ id: nextId, name: proposedName, color: nextColor }]);
      patchState({ vendorCategories: nextCategories });
      refreshCategoryDependentUi();

      if (categoryManageSelect) categoryManageSelect.value = String(nextId);
      if (pinCategoryPicker) pinCategoryPicker.value = String(nextId);
      if (categoryNameInput) categoryNameInput.value = '';

      persistState();
      notify.success('Category added.');
    });
  }

  if (categoryRenameBtn) {
    categoryRenameBtn.addEventListener('click', async () => {
      const selected = getSelectedManagedCategory();
      if (!selected) {
        notify.warn('Select a category first.');
        return;
      }

      const rawName = await window.showInputAsync('Rename category:', {
        title: 'Rename category',
        defaultValue: selected.name,
        validator: function (v) {
          const cleaned = sanitizeText(v, selected.name, 40);
          if (!cleaned) return { valid: false, message: 'Enter a name (1-40 characters).' };
          const duplicate = appState.vendorCategories.some((category) => category.id !== selected.id && String(category.name || '').toLowerCase() === cleaned.toLowerCase());
          if (duplicate) return { valid: false, message: 'Another category already uses that name.' };
          return { valid: true };
        }
      });
      if (rawName === null) return;

      const nextName = sanitizeText(rawName, selected.name, 40);
      if (!nextName || nextName === selected.name) return;

      const duplicate = appState.vendorCategories.some((category) => category.id !== selected.id && String(category.name || '').toLowerCase() === nextName.toLowerCase());
      if (duplicate) {
        notify.warn('Another category already uses that name.');
        return;
      }

      const nextCategories = appState.vendorCategories.map((category) => {
        if (category.id !== selected.id) return category;
        return Object.assign({}, category, {
          name: nextName
        });
      });
      patchState({ vendorCategories: nextCategories });
      refreshCategoryDependentUi();
      if (categoryManageSelect) categoryManageSelect.value = String(selected.id);
      persistState();
      notify.success('Category updated.');
    });
  }

  if (categoryColorUpdateBtn) {
    categoryColorUpdateBtn.addEventListener('click', () => {
      const selected = getSelectedManagedCategory();
      if (!selected) {
        notify.warn('Select a category first.');
        return;
      }

      const nextColor = normalizeCategoryColor(categoryColorInput ? categoryColorInput.value : '', selected.color);
      if (nextColor === normalizeCategoryColor(selected.color, '#16a34a')) {
        notify.warn('Choose a different color first.');
        return;
      }

      const nextCategories = appState.vendorCategories.map((category) => {
        if (category.id !== selected.id) return category;
        return Object.assign({}, category, { color: nextColor });
      });

      patchState({ vendorCategories: nextCategories });
      refreshCategoryDependentUi();
      if (categoryManageSelect) categoryManageSelect.value = String(selected.id);
      persistState();
      notify.success('Category color updated.');
    });
  }

  if (categoryDeleteBtn) {
    categoryDeleteBtn.addEventListener('click', async () => {
      const selected = getSelectedManagedCategory();
      if (!selected) {
        notify.warn('Select a category first.');
        return;
      }

      const assignedCount = appState.vendors.filter((vendor) => vendor.categoryId === selected.id).length;
      const confirmed = await window.showConfirmAsync('Delete category "' + selected.name + '"? ' + assignedCount + ' pins will become uncategorized.');
      if (!confirmed) return;

      const nextCategories = appState.vendorCategories.filter((category) => category.id !== selected.id);
      patchState({ vendorCategories: nextCategories });
      refreshCategoryDependentUi();
      if (categoryNameInput) categoryNameInput.value = '';
      persistState();
      notify.success('Category deleted.');
    });
  }
}

function makeTemplateRecordsFromItems(items) {
  return items.map((item, index) => ({
    id: index + 1,
    name: item.name,
    active: !!item.active
  }));
}

function syncTemplatePinsToActiveState() {
  appState.vendorTemplates.forEach((template) => {
    const linkedVendor = appState.vendors.find((vendor) => vendor.templateId === template.id);
    if (template.active && !linkedVendor) {
      addVendor({ name: template.name, x: 80 + appState.vendors.length * 20, y: 80 + appState.vendors.length * 20, templateId: template.id });
      return;
    }
    if (!template.active && linkedVendor) {
      removeVendor(linkedVendor.id);
    }
  });

  renderTemplateList();
  updateVendorList();
}

function applyVendorLibraryEntry(entry, mode) {
  const items = Array.isArray(entry.items) ? entry.items : [];
  if (!items.length) {
    notify.warn('Selected vendor list has no items.');
    return false;
  }

  if (mode === 'replace') {
    const templateVendorIds = appState.vendors.filter((vendor) => vendor.templateId !== null).map((vendor) => vendor.id);
    templateVendorIds.forEach(removeVendor);
    patchState({ vendorTemplates: makeTemplateRecordsFromItems(items) });
    syncTemplatePinsToActiveState();
    return true;
  }

  const existingTemplates = appState.vendorTemplates.slice();
  const existingByName = new Map(existingTemplates.map((template) => [normalizeTemplateName(template.name), template]));
  let nextTemplateId = existingTemplates.reduce((max, template) => Math.max(max, template.id), 0) + 1;

  items.forEach((item) => {
    const key = normalizeTemplateName(item.name);
    if (!key) return;

    const existing = existingByName.get(key);
    if (existing) {
      return;
    }

    const nextTemplate = {
      id: nextTemplateId++,
      name: item.name,
      active: !!item.active
    };
    existingTemplates.push(nextTemplate);
    existingByName.set(key, nextTemplate);
  });

  patchState({ vendorTemplates: existingTemplates });
  syncTemplatePinsToActiveState();
  return true;
}

function exportVendorLibraryEntryCsv(entry) {
  const lines = ['name,active'];
  entry.items.forEach((item) => {
    const escapedName = String(item.name || '').replace(/"/g, '""');
    lines.push(`"${escapedName}",${item.active ? 'true' : 'false'}`);
  });

  const csvText = lines.join('\n');
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${entry.name.replace(/\s+/g, '-').toLowerCase() || 'vendor-list'}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function enhanceCSVImport(csvText) {
  const rows = parseCSV(csvText);
  const items = rows.map(([name, active]) => ({
    name: name.trim(),
    active: active === 'true'
  }));

  const success = applyVendorLibraryEntry({ items }, 'merge');
  if (success) {
    notify.success('CSV import enhanced and templates merged successfully.');
  } else {
    notify.warn('CSV import failed. No templates were merged.');
  }
}

const pinDragTools = window.createPinDragTools({
  mapContent,
  getZoomLevel: () => panZoomTools.getZoomLevel(),
  getBackgroundScale: () => appState.backgroundScale,
  applyPinPosition,
  updateVendorList,
  persistState,
  animatePin
});

function startDrag(event, pin, vendor) {
  pinDragTools.startDrag(event, pin, vendor);
}

let renderTemplateList = function () {};

const pinManager = window.createPinManager({
  pinsContainer,
  appState,
  actions,
  applyPinPosition,
  applyPinTransform,
  updateVendorList,
  persistState,
  startDrag,
  updateClusters,
  onTemplateLinked: () => {
    renderTemplateList();
  },
  onTemplateUpdated: () => {
    renderTemplateList();
  },
  onTemplateUnlinked: () => {
    renderTemplateList();
  }
});

const setPinStatus = pinManager.setPinStatus;
const setPinCategory = pinManager.setPinCategory;
const createPin = pinManager.createPin;
const addVendor = pinManager.addVendor;
const removeVendor = pinManager.removeVendor;

const templateTools = window.createTemplateTools({
  templateList,
  templateCounter,
  csvFileInput,
  getVendorTemplates: () => appState.vendorTemplates,
  setVendorTemplates: (nextTemplates) => {
    patchState({ vendorTemplates: nextTemplates });
  },
  getVendors: () => appState.vendors,
  addVendor,
  removeVendor,
  updateVendorList,
  persistState,
  notify
});
renderTemplateList = templateTools.renderTemplateList;
const uploadCSV = templateTools.uploadCSV;
const clearAllTemplates = templateTools.clearAllTemplates;

function buildSerializableState() {
  return {
    nextId: appState.nextId,
    vendors: appState.vendors,
    vendorCategories: appState.vendorCategories,
    vendorTemplates: appState.vendorTemplates,
    backgroundUrl: appState.backgroundUrl,
    backgroundScale: appState.backgroundScale,
    backgroundOpacity: appState.backgroundOpacity,
    backgroundScaleLocked: appState.backgroundScaleLocked,
    mapTitleText: appState.mapTitleText,
    pinCategoryDisplayVisible: appState.pinCategoryDisplayVisible
  };
}

function serializeMapStateForHistory() {
  return JSON.stringify(buildSerializableState());
}

const historyTools = window.createHistoryManager({
  historyLimit: HISTORY_LIMIT,
  serializeSnapshot: serializeMapStateForHistory,
  restoreSnapshot: restoreHistorySnapshot,
  onChange: updateUndoRedoButtons
});

function updateUndoRedoButtons() {
  const counts = historyTools.getCounts();
  if (undoBtn) undoBtn.disabled = counts.past <= 1;
  if (redoBtn) redoBtn.disabled = counts.future === 0;
}

function renderSelfCheckResults(results) {
  if (!selfCheckResults) return;
  selfCheckResults.innerHTML = '';

  const summary = document.createElement('p');
  const passCount = results.filter((item) => item.ok).length;
  const failCount = results.length - passCount;
  summary.className = failCount ? 'self-check-fail' : 'self-check-pass';
  summary.textContent = failCount
    ? `Health Check: ${passCount} passed, ${failCount} failed.`
    : `Health Check: all ${passCount} checks passed.`;

  const list = document.createElement('ul');
  list.className = 'self-check-list';

  results.forEach((item) => {
    const li = document.createElement('li');
    li.className = item.ok ? 'self-check-pass' : 'self-check-fail';
    li.textContent = `${item.ok ? 'PASSED' : 'FAILED'}: ${item.label}${item.detail ? ` (${item.detail})` : ''}`;
    list.appendChild(li);
  });

  selfCheckResults.append(summary, list);
}

function runSelfCheck() {
  const results = [];

  try {
    const serialized = serializeMapStateForHistory();
    const parsed = JSON.parse(serialized);
    const normalized = window.normalizeMapState(parsed, getNormalizationDefaults());
    const ok = Array.isArray(normalized.vendors) && Array.isArray(normalized.vendorTemplates) && Array.isArray(normalized.vendorCategories);
    results.push({ label: 'Map state serialization/normalization', ok, detail: ok ? '' : 'Normalized state invalid' });
  } catch (err) {
    results.push({ label: 'Map state serialization/normalization', ok: false, detail: String(err && err.message || err) });
  }

  try {
    const libs = libraryTools.getState();
    const ok = libs && Array.isArray(libs.backgroundLibrary) && Array.isArray(libs.vendorListLibrary);
    results.push({ label: 'Library structure integrity', ok, detail: ok ? '' : 'Expected arrays missing' });
  } catch (err) {
    results.push({ label: 'Library structure integrity', ok: false, detail: String(err && err.message || err) });
  }

  try {
    const templateIds = new Set(appState.vendorTemplates.map((t) => t.id));
    const invalidLinks = appState.vendors.filter((vendor) => vendor.templateId !== null && !templateIds.has(vendor.templateId));
    const ok = invalidLinks.length === 0;
    results.push({ label: 'Template-linked pin references', ok, detail: ok ? '' : `${invalidLinks.length} invalid links` });
  } catch (err) {
    results.push({ label: 'Template-linked pin references', ok: false, detail: String(err && err.message || err) });
  }

  try {
    const counts = historyTools.getCounts();
    const ok = counts.past >= 1 && counts.past <= HISTORY_LIMIT && counts.future >= 0;
    results.push({ label: 'Undo/redo stack bounds', ok, detail: ok ? `${counts.past} history snapshots` : 'History stack out of range' });
  } catch (err) {
    results.push({ label: 'Undo/redo stack bounds', ok: false, detail: String(err && err.message || err) });
  }

  try {
    const probeKey = '__fmv_self_check_probe__';
    const probeValue = String(Date.now());
    localStorage.setItem(probeKey, probeValue);
    const roundTrip = localStorage.getItem(probeKey) === probeValue;
    localStorage.removeItem(probeKey);
    results.push({ label: 'localStorage read/write access', ok: roundTrip, detail: roundTrip ? '' : 'Round-trip mismatch' });
  } catch (err) {
    results.push({ label: 'localStorage read/write access', ok: false, detail: String(err && err.message || err) });
  }

  renderSelfCheckResults(results);
  return results;
}

function isLikelyMapStatePayload(raw) {
  if (!raw || typeof raw !== 'object') return false;
  if (Object.prototype.hasOwnProperty.call(raw, 'vendors') && !Array.isArray(raw.vendors)) return false;
  if (Object.prototype.hasOwnProperty.call(raw, 'vendorTemplates') && !Array.isArray(raw.vendorTemplates)) return false;
  if (Object.prototype.hasOwnProperty.call(raw, 'vendorCategories') && !Array.isArray(raw.vendorCategories)) return false;
  if (Object.prototype.hasOwnProperty.call(raw, 'nextId')) {
    const nextId = Number(raw.nextId);
    if (!Number.isFinite(nextId) || nextId < 1) return false;
  }
  if (Object.prototype.hasOwnProperty.call(raw, 'backgroundScale')) {
    if (!Number.isFinite(Number(raw.backgroundScale))) return false;
  }
  if (Object.prototype.hasOwnProperty.call(raw, 'backgroundOpacity')) {
    if (!Number.isFinite(Number(raw.backgroundOpacity))) return false;
  }
  return true;
}

function isNormalizedMapStateValid(normalized) {
  if (!normalized || typeof normalized !== 'object') return false;
  if (!Array.isArray(normalized.vendors)) return false;
  if (!Array.isArray(normalized.vendorTemplates)) return false;
  if (!Array.isArray(normalized.vendorCategories)) return false;
  if (!Number.isFinite(Number(normalized.nextId)) || Number(normalized.nextId) < 1) return false;
  if (!Number.isFinite(Number(normalized.backgroundScale))) return false;
  if (!Number.isFinite(Number(normalized.backgroundOpacity))) return false;
  if (typeof normalized.backgroundScaleLocked !== 'boolean') return false;
  if (typeof normalized.pinCategoryDisplayVisible !== 'boolean') return false;
  return true;
}

function pushHistorySnapshot() {
  historyTools.pushSnapshot();
}

function restoreHistorySnapshot(snapshotText) {
  const parsed = JSON.parse(snapshotText);
  const normalized = window.normalizeMapState(parsed, getNormalizationDefaults());
  if (!isNormalizedMapStateValid(normalized)) {
    throw new Error('History snapshot normalization returned invalid state.');
  }
  applyNormalizedLoadedState(normalized);
  checkpointTools.commit({
    reason: 'undo-redo',
    persist: true,
    pushHistory: false
  });
}

function undo() {
  try {
    historyTools.undo();
  } catch (err) {
    console.error(err);
    notify.error('Unable to undo the last action.');
  }
}

function redo() {
  try {
    historyTools.redo();
  } catch (err) {
    console.error(err);
    notify.error('Unable to redo the action.');
  }
}

function getDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

const snapshotTools = window.createSnapshotTools({
  schemaVersion: SNAPSHOT_SCHEMA_VERSION,
  recoveryStorageKey: RECOVERY_STORAGE_KEY,
  buildMapState: buildSerializableState,
  getLibrariesState: () => libraryTools.getState(),
  notify
});

const storageSyncTools = window.createStorageSyncTools({
  storageKey: STORAGE_KEY,
  notify,
  onRemoteChange: (details) => {
    document.body.classList.add('storage-sync-stale');
    window.__lastRemoteStorageChange = details;
  }
});

function buildFullSnapshotPayload(reason) {
  return snapshotTools.buildFullSnapshotPayload(reason);
}
const snapshotArchiveManager = window.createSnapshotArchiveManager({
  limit: SNAPSHOT_ARCHIVE_LIMIT,
  readLibrary: () => snapshotArchiveStorage.readLibrary(),
  writeLibrary: (entries) => snapshotArchiveStorage.writeLibrary(entries),
  notify,
  getMapTitleText: () => appState.mapTitleText,
  selectElement: snapshotArchiveSelect,
  searchInput: snapshotArchiveSearchInput,
  dateFromInput: snapshotArchiveDateFromInput,
  dateToInput: snapshotArchiveDateToInput
});

function downloadJsonFile(payload, filename) {
  snapshotTools.downloadJsonFile(payload, filename);
}

function saveRecoverySnapshot(reason) {
  snapshotTools.saveRecoverySnapshot(reason || 'autosave');
}

function getRecoverySnapshot() {
  return snapshotTools.getRecoverySnapshot();
}

function getNormalizationDefaults() {
  return {
    vendorCategories: appState.vendorCategories,
    vendorTemplates: appState.vendorTemplates,
    backgroundScale: appState.backgroundScale,
    backgroundOpacity: appState.backgroundOpacity,
    mapTitleText: appState.mapTitleText,
    pinCategoryDisplayVisible: appState.pinCategoryDisplayVisible
  };
}

function applyNormalizedLoadedState(normalized) {
  actions.applyLoadedState(normalized);
  if (mapTitle) mapTitle.textContent = appState.mapTitleText;
  renderPinCategoryOptions();
  renderCategoryManagerOptions();
  setBackground(normalized.backgroundUrl);
  applyBackgroundScale();
  applyBackgroundOpacity();
  updateBgScaleLockButton();
  pinsContainer.innerHTML = '';
  appState.vendors.forEach(createPin);
  renderTemplateList();
  updateVendorList();
}

const persistenceTools = window.createPersistenceTools({
  storageKey: STORAGE_KEY,
  buildState: buildSerializableState,
  normalizeState: window.normalizeMapState,
  validateParsedState: isLikelyMapStatePayload,
  getNormalizationDefaults,
  validateNormalizedState: isNormalizedMapStateValid,
  applyLoadedState: applyNormalizedLoadedState,
  notify
});

const checkpointTools = window.createStateCheckpointManager({
  persistenceTools,
  saveRecoverySnapshot,
  pushHistorySnapshot,
  clearSavedState: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed clearing saved map state from localStorage.', err);
    }
  }
});

const snapshotArchiveController = window.createSnapshotArchiveController({
  snapshotArchiveManager,
  snapshotTools,
  buildSerializableState,
  schemaVersion: SNAPSHOT_SCHEMA_VERSION,
  notify,
  normalizeMapState: window.normalizeMapState,
  getNormalizationDefaults,
  isLikelyMapStatePayload,
  isNormalizedMapStateValid,
  applyNormalizedLoadedState,
  checkpointTools,
  libraryTools,
  renderBackgroundLibraryOptions,
  renderVendorLibraryOptions,
  libraryStorageKey: LIBRARY_STORAGE_KEY
});

const normalizeArchiveTag = snapshotArchiveController.normalizeArchiveTag;
const collectArchiveTags = snapshotArchiveController.collectArchiveTags;
const getArchiveDefaultName = snapshotArchiveController.getArchiveDefaultName;
const loadSnapshotArchiveLibrary = snapshotArchiveController.loadSnapshotArchiveLibrary;
const getSelectedSnapshotArchiveEntry = snapshotArchiveController.getSelectedSnapshotArchiveEntry;
const renderSnapshotArchiveOptions = snapshotArchiveController.renderSnapshotArchiveOptions;
const addSnapshotArchiveEntry = snapshotArchiveController.addSnapshotArchiveEntry;
const renameSnapshotArchiveEntry = snapshotArchiveController.renameSnapshotArchiveEntry;
const deleteSnapshotArchiveEntry = snapshotArchiveController.deleteSnapshotArchiveEntry;
const buildArchiveSnapshotPayload = snapshotArchiveController.buildArchiveSnapshotPayload;
const applySnapshotObject = snapshotArchiveController.applySnapshotObject;
const promptRecoveryRestore = snapshotArchiveController.promptRecoveryRestore;

function persistState(config) {
  checkpointTools.persist(config);
}

async function saveState() {
  try {
    const saved = await checkpointTools.saveState();
    if (!saved) return;
  } catch (err) {
    console.error(err);
    notify.error('Unable to save the map right now.');
  }
}

const exportTools = window.createMapExportTools({
  mapArea,
  mapContent,
  notify
});
const exportMapAsImage = exportTools.exportMapAsImage;
const exportMapAsPdf = exportTools.exportMapAsPdf;

function loadState(config) {
  return checkpointTools.loadState(config);
}

function resetMap() {
  return showConfirmAsync('Clear all vendor pins?').then((ok) => {
    if (!ok) return;
    actions.resetCoreState();
  pinsContainer.innerHTML = '';
  updateVendorList();
  setBackground('');
  bgUrlInput.value = '';
  panZoomTools.resetView();
  updateBgScaleLockButton();
  checkpointTools.commit({
    reason: 'reset-map',
    persist: false,
    saveRecovery: true,
    pushHistory: true,
    clearSavedState: true
  });
  });
}

// First-run onboarding + keyboard help
const FIRST_RUN_KEY = 'fm_first_run_seen';
const firstRunOverlay = document.getElementById('first-run-overlay');
const firstRunDismiss = document.getElementById('first-run-dismiss');
const firstRunHideToggle = document.getElementById('first-run-hide-toggle');
const keyboardHelp = document.getElementById('keyboard-help');
const keyboardHelpClose = document.getElementById('keyboard-help-close');

function showFirstRunIfNeeded() {
  try {
    const seen = localStorage.getItem(FIRST_RUN_KEY);
    if (seen === '1') return;
  } catch (e) {
    // ignore storage failures
    return;
  }
  if (firstRunOverlay) {
    firstRunOverlay.hidden = false;
  }
}

function dismissFirstRun() {
  if (firstRunOverlay) firstRunOverlay.hidden = true;
  try {
    if (firstRunHideToggle && firstRunHideToggle.checked) {
      localStorage.setItem(FIRST_RUN_KEY, '1');
    }
  } catch (e) { /* ignore */ }
}

function showKeyboardHelp() {
  if (keyboardHelp) keyboardHelp.hidden = false;
}

function closeKeyboardHelp() {
  if (keyboardHelp) keyboardHelp.hidden = true;
}

if (firstRunDismiss) firstRunDismiss.addEventListener('click', dismissFirstRun);
if (keyboardHelpClose) keyboardHelpClose.addEventListener('click', closeKeyboardHelp);
window.addEventListener('keydown', function (e) {
  if (e.key === '?' || (e.shiftKey && e.key === '?')) {
    // Show keyboard help
    e.preventDefault();
    showKeyboardHelp();
  }
});

// Close keyboard help with Escape and close when clicking outside content
window.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    // Close keyboard help or first-run overlay if open
    try { closeKeyboardHelp(); } catch (err) { /* noop */ }
    try { if (firstRunOverlay) firstRunOverlay.hidden = true; } catch (err) { /* noop */ }
  }
});

if (keyboardHelp) {
  keyboardHelp.addEventListener('click', function (ev) {
    if (ev.target === keyboardHelp) {
      closeKeyboardHelp();
    }
  });
}
if (firstRunOverlay) {
  firstRunOverlay.addEventListener('click', function (ev) {
    if (ev.target === firstRunOverlay) {
      dismissFirstRun();
    }
  });
}

// Show after a short delay once app initializes
window.setTimeout(showFirstRunIfNeeded, 600);

window.initializeAppState({
  renderTemplateList,
  applyZoomPan,
  addMapPanHandlers,
  updatePinControlVisibility,
  updatePinCategoryVisibility,
  updateBgScaleLockButton,
  updateVendorList,
  hasSavedState: () => persistenceTools.hasSavedState(),
  loadState,
  promptRecoveryRestore,
  historyTools,
  pushHistorySnapshot
});

storageSyncTools.bindStorageSyncListener();

const exportJpgBtn = document.getElementById('export-jpg');
const exportPdfBtn = document.getElementById('export-pdf');

window.bindCoreEventListeners({
  appState,
  actions,
  notify,
  panZoomTools,
  applyPinPosition,
  applyPinTransform,
  applyBackgroundScale,
  applyBackgroundOpacity,
  updateBgScaleLockButton,
  updatePinControlVisibility,
  updatePinCategoryVisibility,
  updateVendorList,
  persistState,
  saveState,
  loadState,
  resetMap,
  addVendor,
  undo,
  redo,
  uploadCSV,
  templateTools,
  clearAllTemplates,
  templateNameInput,
  templateAddBtn,
  mapTitle,
  setBackground,
  setZoom,
  BACKGROUND_SCALE_MIN,
  BACKGROUND_SCALE_MAX,
  BACKGROUND_SCALE_STEP,
  canUndo: () => historyTools.getCounts().past > 1,
  canRedo: () => historyTools.getCounts().future > 0,
  getSelectionTools: () => selectionTools,
  animatePin,
  elements: {
    undoBtn,
    redoBtn,
    addVendorBtn,
    saveStateBtn,
    loadStateBtn,
    resetMapBtn,
    resetAllPinsBtn,
    rotateAllPinsBtn,
    pinsContainer,
    csvUploadBtn,
    templateNameInput,
    templateAddBtn,
    selectAllBtn,
    deselectAllBtn,
    sortTemplatesBtn,
    clearTemplatesBtn,
    togglePinControlsBtn,
    togglePinCategoryDisplayBtn,
    rotateSelectedPinsBtn,
    alignLeftBtn,
    alignCenterBtn,
    alignRightBtn,
    alignTopBtn,
    alignMiddleBtn,
    alignBottomBtn,
    pinAlignRefXSelect,
    pinAlignRefYSelect,
    pinAlignRefApplyBtn,
    bgSizeDecrease,
    bgSizeIncrease,
    bgSizeRange,
    bgOpacityRange,
    bgScaleLockBtn,
    zoomInBtn,
    zoomOutBtn,
    zoomRange,
    bgUrlBtn,
    bgUrlInput,
    bgFileInput,
    exportJpgBtn,
    exportPdfBtn,
    exportMapAsImage,
    exportMapAsPdf
  }
});

const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.querySelector('.sidebar-toggle');

window.bindLibrarySnapshotAndSidebarListeners({
  appState,
  notify,
  libraryTools,
  renderBackgroundLibraryOptions,
  renderVendorLibraryOptions,
  getSelectedBackgroundLibraryEntry,
  getSelectedVendorLibraryEntry,
  buildVendorLibraryItemsFromTemplates,
  applyVendorLibraryEntry,
  exportVendorLibraryEntryCsv,
  persistState,
  setBackground,
  runSelfCheck,
  buildFullSnapshotPayload,
  downloadJsonFile,
  getDateStamp,
  saveRecoverySnapshot,
  buildArchiveSnapshotPayload,
  getArchiveDefaultName,
  collectArchiveTags,
  addSnapshotArchiveEntry,
  renderSnapshotArchiveOptions,
  getSelectedSnapshotArchiveEntry,
  applySnapshotObject,
  renameSnapshotArchiveEntry,
  deleteSnapshotArchiveEntry,
  elements: {
    bgLibSaveBtn,
    bgLibApplyBtn,
    bgLibRenameBtn,
    bgLibDeleteBtn,
    bgLibExportBtn,
    bgLibImportInput,
    bgLibNameInput,
    bgLibSelect,
    bgUrlInput,
    vendorLibSaveBtn,
    vendorLibLoadBtn,
    vendorLibRenameBtn,
    vendorLibDeleteBtn,
    vendorLibExportJsonBtn,
    vendorLibExportCsvBtn,
    vendorLibImportInput,
    vendorLibNameInput,
    vendorLibSelect,
    vendorLibLoadMode,
    snapshotExportBtn,
    snapshotArchiveSaveBtn,
    snapshotArchiveNameInput,
    snapshotArchiveEventTagInput,
    snapshotArchiveAutoTagToggle,
    snapshotArchiveSelect,
    snapshotArchiveRestoreBtn,
    snapshotArchiveRenameBtn,
    snapshotArchiveDuplicateBtn,
    snapshotArchiveDeleteBtn,
    snapshotArchiveSearchInput,
    snapshotArchiveDateFromInput,
    snapshotArchiveDateToInput,
    snapshotArchiveFilterClearBtn,
    snapshotRestoreBtn,
    snapshotImportInput,
    snapshotClearRecoveryBtn,
    RECOVERY_STORAGE_KEY,
    selfCheckRunBtn,
    sidebar,
    sidebarToggle
  }
});

renderPinCategoryOptions();
renderCategoryManagerOptions();
bindCategoryManagerListeners();
window.benchmarkVendorListUpdate = benchmarkVendorListUpdate;

selectionTools = window.initializeRuntime({
  renderBackgroundLibraryOptions,
  renderVendorLibraryOptions,
  loadSnapshotArchiveLibrary,
  renderSnapshotArchiveOptions,
  runSelfCheck,
  createSelectionTools: () => window.createSelectionTools({
    pinsContainer,
    mapContent,
    getZoomLevel: () => panZoomTools.getZoomLevel(),
    getVendors: () => appState.vendors,
    getBackgroundScale: () => appState.backgroundScale,
    applyPinPosition,
    animatePin,
    persistState,
    setPinStatus,
    setPinCategory,
    pinColorPicker,
    pinStatusPicker,
    pinCategoryPicker,
    pinAlignRefXSelect,
    pinAlignRefYSelect,
    pinAlignRefApplyBtn
  })
});
