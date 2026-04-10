(function () {
  function createSelectionTools(options) {
    const pinsContainer = options.pinsContainer;
    const mapContent = options.mapContent;
    const getZoomLevel = options.getZoomLevel || function () { return 1; };
    const getVendors = options.getVendors;
    const getBackgroundScale = options.getBackgroundScale;
    const applyPinPosition = options.applyPinPosition;
    const animatePin = options.animatePin;
    const persistState = options.persistState;
    const setPinStatus = options.setPinStatus;
    const setPinCategory = options.setPinCategory;
    const pinColorPicker = options.pinColorPicker;
    const pinStatusPicker = options.pinStatusPicker;
    const pinCategoryPicker = options.pinCategoryPicker;
    const pinAlignRefXSelect = options.pinAlignRefXSelect;
    const pinAlignRefYSelect = options.pinAlignRefYSelect;
    const pinAlignRefApplyBtn = options.pinAlignRefApplyBtn;

    const selectedPins = new Set();
    const lassoBox = document.createElement('div');
    lassoBox.className = 'lasso-box';
    lassoBox.hidden = true;
    if (pinsContainer) pinsContainer.appendChild(lassoBox);

    const lassoState = {
      active: false,
      additive: false,
      moved: false,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0
    };

    let suppressNextClick = false;

    function updatePinSelection() {
      pinsContainer.querySelectorAll('.vendor-pin').forEach(function (pin) {
        if (selectedPins.has(Number(pin.dataset.id))) pin.classList.add('selected');
        else pin.classList.remove('selected');
      });
      updatePinSelectionUI();
    }

    function updatePinSelectionUI() {
      if (!selectedPins.size) return;
      const firstId = Array.from(selectedPins)[0];
      const vendor = getVendors().find(function (v) { return v.id === firstId; });
      if (vendor && pinColorPicker) pinColorPicker.value = vendor.customColor || '#a7f3d0';
      if (vendor && pinStatusPicker) pinStatusPicker.value = vendor.status || 'normal';
      if (vendor && pinCategoryPicker) pinCategoryPicker.value = vendor.categoryId ? String(vendor.categoryId) : '';
    }

    function isEditableTarget(target) {
      return !!(target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ));
    }

    function pointClientToDisplay(clientX, clientY) {
      if (!mapContent) return { x: 0, y: 0 };
      const mapRect = mapContent.getBoundingClientRect();
      const zoomLevel = getZoomLevel() || 1;
      const x = (clientX - mapRect.left) / zoomLevel;
      const y = (clientY - mapRect.top) / zoomLevel;
      return {
        x: Math.min(Math.max(0, x), mapContent.offsetWidth),
        y: Math.min(Math.max(0, y), mapContent.offsetHeight)
      };
    }

    function getRectBounds(x1, y1, x2, y2) {
      return {
        left: Math.min(x1, x2),
        top: Math.min(y1, y2),
        right: Math.max(x1, x2),
        bottom: Math.max(y1, y2)
      };
    }

    function setLassoBox(bounds) {
      if (!lassoBox) return;
      lassoBox.hidden = false;
      lassoBox.style.left = bounds.left + 'px';
      lassoBox.style.top = bounds.top + 'px';
      lassoBox.style.width = Math.max(0, bounds.right - bounds.left) + 'px';
      lassoBox.style.height = Math.max(0, bounds.bottom - bounds.top) + 'px';
    }

    function hideLassoBox() {
      if (!lassoBox) return;
      lassoBox.hidden = true;
      lassoBox.style.width = '0px';
      lassoBox.style.height = '0px';
    }

    function rectsIntersect(a, b) {
      return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
    }

    function selectPinsInRect(bounds, additive) {
      if (!additive) selectedPins.clear();
      const mapRect = mapContent ? mapContent.getBoundingClientRect() : null;
      const zoomLevel = getZoomLevel() || 1;
      pinsContainer.querySelectorAll('.vendor-pin').forEach(function (pin) {
        const pinRectPx = pin.getBoundingClientRect();
        let pinRect;
        if (mapRect) {
          pinRect = {
            left: (pinRectPx.left - mapRect.left) / zoomLevel,
            top: (pinRectPx.top - mapRect.top) / zoomLevel,
            right: (pinRectPx.right - mapRect.left) / zoomLevel,
            bottom: (pinRectPx.bottom - mapRect.top) / zoomLevel
          };
        } else {
          pinRect = {
            left: pin.offsetLeft,
            top: pin.offsetTop,
            right: pin.offsetLeft + pin.offsetWidth,
            bottom: pin.offsetTop + pin.offsetHeight
          };
        }
        if (rectsIntersect(bounds, pinRect)) {
          selectedPins.add(Number(pin.dataset.id));
        }
      });
      updatePinSelection();
    }

    function finishLassoSelection() {
      if (!lassoState.active) return;
      const bounds = getRectBounds(lassoState.startX, lassoState.startY, lassoState.endX, lassoState.endY);
      if (lassoState.moved) {
        selectPinsInRect(bounds, lassoState.additive);
        suppressNextClick = true;
      }
      lassoState.active = false;
      hideLassoBox();
      document.removeEventListener('mousemove', onLassoMouseMove);
      document.removeEventListener('mouseup', onLassoMouseUp);
    }

    function onLassoMouseMove(event) {
      if (!lassoState.active) return;
      const point = pointClientToDisplay(event.clientX, event.clientY);
      lassoState.endX = point.x;
      lassoState.endY = point.y;
      const distance = Math.abs(lassoState.endX - lassoState.startX) + Math.abs(lassoState.endY - lassoState.startY);
      lassoState.moved = lassoState.moved || distance > 4;
      setLassoBox(getRectBounds(lassoState.startX, lassoState.startY, lassoState.endX, lassoState.endY));
    }

    function onLassoMouseUp() {
      finishLassoSelection();
    }

    function getVendorAlignRefX(vendor) {
      if (!vendor) return 'left';
      if (vendor.alignRefX === 'center' || vendor.alignRefX === 'right') return vendor.alignRefX;
      return 'left';
    }

    function getVendorAlignRefY(vendor) {
      if (!vendor) return 'top';
      if (vendor.alignRefY === 'middle' || vendor.alignRefY === 'bottom') return vendor.alignRefY;
      return 'top';
    }

    function getTransformedLocalBounds(item) {
      const width = item.width;
      const height = item.height;
      const rotation = ((Number(item.vendor.rotation) || 0) * Math.PI) / 180;
      const scaleX = Number(item.vendor.size) || 1;
      const scaleY = (Number(item.vendor.size) || 1) * (Number(item.vendor.height) || 1);
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);

      const points = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: 0, y: height },
        { x: width, y: height }
      ].map(function (p) {
        const sx = p.x * scaleX;
        const sy = p.y * scaleY;
        return {
          x: (sx * cos) - (sy * sin),
          y: (sx * sin) + (sy * cos)
        };
      });

      return {
        minX: Math.min.apply(null, points.map(function (p) { return p.x; })),
        maxX: Math.max.apply(null, points.map(function (p) { return p.x; })),
        minY: Math.min.apply(null, points.map(function (p) { return p.y; })),
        maxY: Math.max.apply(null, points.map(function (p) { return p.y; }))
      };
    }

    function getAnchorDisplayPosition(item) {
      const bounds = getTransformedLocalBounds(item);
      const refX = getVendorAlignRefX(item.vendor);
      const refY = getVendorAlignRefY(item.vendor);

      const anchorX = refX === 'center'
        ? (bounds.minX + bounds.maxX) / 2
        : refX === 'right'
          ? bounds.maxX
          : bounds.minX;

      const anchorY = refY === 'middle'
        ? (bounds.minY + bounds.maxY) / 2
        : refY === 'bottom'
          ? bounds.maxY
          : bounds.minY;

      return {
        x: item.left + anchorX,
        y: item.top + anchorY
      };
    }

    function clampDisplayPositionWithTransform(pin, vendor, nextDisplayX, nextDisplayY) {
      if (!mapContent) {
        return {
          x: Math.max(0, nextDisplayX),
          y: Math.max(0, nextDisplayY)
        };
      }

      const tempItem = {
        pin: pin,
        vendor: vendor,
        width: pin.offsetWidth,
        height: pin.offsetHeight
      };
      const localBounds = getTransformedLocalBounds(tempItem);
      let adjustedX = nextDisplayX;
      let adjustedY = nextDisplayY;

      const minX = adjustedX + localBounds.minX;
      const maxX = adjustedX + localBounds.maxX;
      const minY = adjustedY + localBounds.minY;
      const maxY = adjustedY + localBounds.maxY;

      if (minX < 0) adjustedX -= minX;
      if (maxX > mapContent.offsetWidth) adjustedX -= (maxX - mapContent.offsetWidth);
      if (minY < 0) adjustedY -= minY;
      if (maxY > mapContent.offsetHeight) adjustedY -= (maxY - mapContent.offsetHeight);

      return {
        x: adjustedX,
        y: adjustedY
      };
    }

    function alignSelectedPins(mode) {
      const selectedIds = Array.from(selectedPins);
      if (selectedIds.length < 2) return false;

      const backgroundScale = getBackgroundScale();
      const items = selectedIds.map(function (id) {
        const pin = pinsContainer.querySelector(".vendor-pin[data-id='" + id + "']");
        const vendor = getVendors().find(function (v) { return v.id === id; });
        if (!pin || !vendor) return null;
        const left = (vendor.x || 0) * backgroundScale;
        const top = (vendor.y || 0) * backgroundScale;
        return {
          id: id,
          pin: pin,
          vendor: vendor,
          left: left,
          top: top,
          width: pin.offsetWidth,
          height: pin.offsetHeight
        };
      }).filter(Boolean);

      if (items.length < 2) return false;

      const anchors = items.map(function (item) {
        return {
          item: item,
          anchor: getAnchorDisplayPosition(item)
        };
      });

      const minAnchorX = Math.min.apply(null, anchors.map(function (a) { return a.anchor.x; }));
      const maxAnchorX = Math.max.apply(null, anchors.map(function (a) { return a.anchor.x; }));
      const minAnchorY = Math.min.apply(null, anchors.map(function (a) { return a.anchor.y; }));
      const maxAnchorY = Math.max.apply(null, anchors.map(function (a) { return a.anchor.y; }));
      const centerAnchorX = (minAnchorX + maxAnchorX) / 2;
      const centerAnchorY = (minAnchorY + maxAnchorY) / 2;

      let moved = false;
      anchors.forEach(function (entry) {
        const item = entry.item;
        const anchor = entry.anchor;

        let deltaX = 0;
        let deltaY = 0;

        if (mode === 'left') deltaX = minAnchorX - anchor.x;
        if (mode === 'center-x') deltaX = centerAnchorX - anchor.x;
        if (mode === 'right') deltaX = maxAnchorX - anchor.x;
        if (mode === 'top') deltaY = minAnchorY - anchor.y;
        if (mode === 'center-y') deltaY = centerAnchorY - anchor.y;
        if (mode === 'bottom') deltaY = maxAnchorY - anchor.y;

        const clamped = clampDisplayPositionWithTransform(item.pin, item.vendor, item.left + deltaX, item.top + deltaY);
        item.vendor.x = clamped.x / backgroundScale;
        item.vendor.y = clamped.y / backgroundScale;
        applyPinPosition(item.vendor, item.pin);
        animatePin(item.pin);
        moved = true;
      });

      if (moved) updatePinSelection();
      return moved;
    }

    function clampDisplayPosition(pin, nextDisplayX, nextDisplayY) {
      if (!mapContent) {
        return {
          x: Math.max(0, nextDisplayX),
          y: Math.max(0, nextDisplayY)
        };
      }
      const maxDisplayX = Math.max(0, mapContent.offsetWidth - pin.offsetWidth);
      const maxDisplayY = Math.max(0, mapContent.offsetHeight - pin.offsetHeight);
      return {
        x: Math.min(maxDisplayX, Math.max(0, nextDisplayX)),
        y: Math.min(maxDisplayY, Math.max(0, nextDisplayY))
      };
    }

    function nudgeSelectedPins(key, stepDisplay) {
      if (!selectedPins.size) return false;
      let deltaX = 0;
      let deltaY = 0;
      if (key === 'ArrowUp') deltaY = -stepDisplay;
      if (key === 'ArrowDown') deltaY = stepDisplay;
      if (key === 'ArrowLeft') deltaX = -stepDisplay;
      if (key === 'ArrowRight') deltaX = stepDisplay;
      if (!deltaX && !deltaY) return false;

      const backgroundScale = getBackgroundScale();
      let moved = false;
      selectedPins.forEach(function (id) {
        const pin = pinsContainer.querySelector(".vendor-pin[data-id='" + id + "']");
        const vendor = getVendors().find(function (v) { return v.id === id; });
        if (!pin || !vendor) return;

        const currentDisplayX = (vendor.x || 0) * backgroundScale;
        const currentDisplayY = (vendor.y || 0) * backgroundScale;
        const clamped = clampDisplayPosition(pin, currentDisplayX + deltaX, currentDisplayY + deltaY);
        vendor.x = clamped.x / backgroundScale;
        vendor.y = clamped.y / backgroundScale;
        applyPinPosition(vendor, pin);
        animatePin(pin);
        moved = true;
      });
      return moved;
    }

    function applyPinSelectionFromEvent(pin, e) {
      const id = Number(pin.dataset.id);
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        if (selectedPins.has(id)) selectedPins.delete(id);
        else selectedPins.add(id);
      } else {
        selectedPins.clear();
        selectedPins.add(id);
      }
      updatePinSelection();
    }

    pinsContainer.addEventListener('pointerdown', function (e) {
      const pin = e.target.closest('.vendor-pin');
      if (!pin) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      applyPinSelectionFromEvent(pin, e);
    });

    pinsContainer.addEventListener('click', function (e) {
      if (suppressNextClick) {
        suppressNextClick = false;
        return;
      }
      const pin = e.target.closest('.vendor-pin');
      if (pin) {
        applyPinSelectionFromEvent(pin, e);
        return;
      }

      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        selectedPins.clear();
        updatePinSelection();
      }
    });

    pinsContainer.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      if (e.altKey) return;
      if (isEditableTarget(e.target)) return;
      if (e.target.closest('.vendor-pin')) return;

      const start = pointClientToDisplay(e.clientX, e.clientY);
      lassoState.active = true;
      lassoState.additive = !!(e.shiftKey || e.ctrlKey || e.metaKey);
      lassoState.moved = false;
      lassoState.startX = start.x;
      lassoState.startY = start.y;
      lassoState.endX = start.x;
      lassoState.endY = start.y;
      setLassoBox(getRectBounds(start.x, start.y, start.x, start.y));
      document.addEventListener('mousemove', onLassoMouseMove);
      document.addEventListener('mouseup', onLassoMouseUp);
      e.preventDefault();
    });

    document.addEventListener('keydown', function (e) {
      if (isEditableTarget(e.target)) return;
      if (!selectedPins.size) return;
      const stepDisplay = e.shiftKey ? 20 : 5;
      const moved = nudgeSelectedPins(e.key, stepDisplay);
      if (!moved) return;
      persistState();
      e.preventDefault();
    });

    if (pinColorPicker) {
      pinColorPicker.addEventListener('input', function () {
        selectedPins.forEach(function (id) {
          const vendor = getVendors().find(function (v) { return v.id === id; });
          if (vendor) vendor.customColor = pinColorPicker.value;
          const pin = pinsContainer.querySelector(".vendor-pin[data-id='" + id + "']");
          if (pin) pin.style.background = pinColorPicker.value;
        });
        persistState();
      });
    }

    if (pinStatusPicker) {
      pinStatusPicker.addEventListener('change', function () {
        selectedPins.forEach(function (id) {
          const vendor = getVendors().find(function (v) { return v.id === id; });
          if (vendor) vendor.status = pinStatusPicker.value;
          const pin = pinsContainer.querySelector(".vendor-pin[data-id='" + id + "']");
          if (pin && vendor) setPinStatus(vendor, pin, pinStatusPicker.value);
        });
        persistState();
      });
    }

    if (pinCategoryPicker) {
      pinCategoryPicker.addEventListener('change', function () {
        const nextCategoryId = pinCategoryPicker.value ? Number(pinCategoryPicker.value) : null;
        selectedPins.forEach(function (id) {
          const vendor = getVendors().find(function (v) { return v.id === id; });
          const pin = pinsContainer.querySelector(".vendor-pin[data-id='" + id + "']");
          if (pin && vendor && typeof setPinCategory === 'function') {
            setPinCategory(vendor, pin, nextCategoryId);
          }
        });
        persistState();
      });
    }

    if (pinAlignRefApplyBtn && pinAlignRefXSelect && pinAlignRefYSelect) {
      pinAlignRefApplyBtn.addEventListener('click', function () {
        if (!selectedPins.size) return;
        const refX = pinAlignRefXSelect.value;
        const refY = pinAlignRefYSelect.value;
        selectedPins.forEach(function (id) {
          const vendor = getVendors().find(function (v) { return v.id === id; });
          if (!vendor) return;
          vendor.alignRefX = (refX === 'center' || refX === 'right') ? refX : 'left';
          vendor.alignRefY = (refY === 'middle' || refY === 'bottom') ? refY : 'top';
        });
        persistState();
      });
    }

    return {
      updatePinSelection: updatePinSelection,
      getSelectedPins: function () { return selectedPins; },
      alignSelectedPins: alignSelectedPins
    };
  }

  window.createSelectionTools = createSelectionTools;
})();
