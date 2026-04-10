(function () {
  function createPinDragTools(options) {
    const mapContent = options.mapContent;
    const getZoomLevel = options.getZoomLevel;
    const getBackgroundScale = options.getBackgroundScale;
    const applyPinPosition = options.applyPinPosition;
    const updateVendorList = options.updateVendorList;
    const persistState = options.persistState;
    const animatePin = options.animatePin;

    let activeDrag = null;

    function onDrag(event) {
      if (!activeDrag) return;
      if (typeof event.pointerId === 'number' && activeDrag.pointerId !== event.pointerId) return;

      const pin = activeDrag.pin;
      const vendor = activeDrag.vendor;
      const mapRect = mapContent.getBoundingClientRect();
      const displayWidth = pin.offsetWidth;
      const displayHeight = pin.offsetHeight;
      const maxDisplayX = Math.max(0, mapContent.offsetWidth - displayWidth);
      const maxDisplayY = Math.max(0, mapContent.offsetHeight - displayHeight);

      const zoomLevel = getZoomLevel();
      const backgroundScale = getBackgroundScale();
      const pointerDisplayX = (event.clientX - mapRect.left) / zoomLevel;
      const pointerDisplayY = (event.clientY - mapRect.top) / zoomLevel;
      const deltaDisplayX = pointerDisplayX - activeDrag.startPointerDisplayX;
      const deltaDisplayY = pointerDisplayY - activeDrag.startPointerDisplayY;

      const nextDisplayX = activeDrag.startVendorX * backgroundScale + deltaDisplayX;
      const nextDisplayY = activeDrag.startVendorY * backgroundScale + deltaDisplayY;

      const clampedDisplayX = Math.min(maxDisplayX, Math.max(0, nextDisplayX));
      const clampedDisplayY = Math.min(maxDisplayY, Math.max(0, nextDisplayY));

      vendor.x = clampedDisplayX / backgroundScale;
      vendor.y = clampedDisplayY / backgroundScale;

      applyPinPosition(vendor, pin);
    }

    function stopDrag(event) {
      if (activeDrag) {
        if (event && typeof event.pointerId === 'number' && activeDrag.pointerId !== event.pointerId) return;
        animatePin(activeDrag.pin);
        persistState();
        updateVendorList();
      }
      activeDrag = null;
      document.removeEventListener('pointermove', onDrag);
      document.removeEventListener('pointerup', stopDrag);
      document.removeEventListener('pointercancel', stopDrag);
    }

    function startDrag(event, pin, vendor) {
      if (event.pointerType === 'mouse' && event.button !== 0 && event.buttons !== 1) return;
      const mapRect = mapContent.getBoundingClientRect();
      const zoomLevel = getZoomLevel();
      activeDrag = {
        pin: pin,
        vendor: vendor,
        pointerId: typeof event.pointerId === 'number' ? event.pointerId : null,
        startVendorX: vendor.x || 0,
        startVendorY: vendor.y || 0,
        startPointerDisplayX: (event.clientX - mapRect.left) / zoomLevel,
        startPointerDisplayY: (event.clientY - mapRect.top) / zoomLevel
      };
      if (pin && typeof pin.setPointerCapture === 'function' && typeof event.pointerId === 'number') {
        try {
          pin.setPointerCapture(event.pointerId);
        } catch (err) {
          // Ignore failed pointer capture and continue with document listeners.
        }
      }
      document.addEventListener('pointermove', onDrag);
      document.addEventListener('pointerup', stopDrag);
      document.addEventListener('pointercancel', stopDrag);
      event.preventDefault();
    }

    return {
      startDrag: startDrag
    };
  }

  window.createPinDragTools = createPinDragTools;
})();
