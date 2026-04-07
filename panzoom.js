(function () {
  function createPanZoomTools(options) {
    const mapArea = options.mapArea;
    const mapContent = options.mapContent;
    const zoomRange = options.zoomRange;
    const zoomValue = options.zoomValue;

    let zoomLevel = 1;
    let pan = { x: 0, y: 0 };
    let isPanningMap = false;
    let activePointerId = null;
    let panStart = { x: 0, y: 0 };
    // Track active touch pointers for pinch-to-zoom
    const activePointers = new Map(); // pointerId -> { clientX, clientY }
    let pinchStartDistance = 0;
    let pinchStartZoom = 1;
    let pinchMidpoint = null;

    function applyZoomPan() {
      mapContent.style.transform = 'translate(' + pan.x + 'px, ' + pan.y + 'px) scale(' + zoomLevel + ')';
      zoomRange.value = String(zoomLevel);
      zoomValue.textContent = Math.round(zoomLevel * 100) + '%';
    }

    function setZoom(newZoom) {
      zoomLevel = Math.min(2.5, Math.max(0.1, newZoom));
      applyZoomPan();
    }

    function getZoomLevel() {
      return zoomLevel;
    }

    function addMapPanHandlers() {
      mapArea.addEventListener('wheel', (event) => {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          const delta = -event.deltaY * 0.0015;
          setZoom(zoomLevel + delta);
        }
      }, { passive: false });

      mapArea.addEventListener('mousedown', (event) => {
        if (event.button !== 2 && !event.altKey) return;
        isPanningMap = true;
        mapArea.classList.add('grabbing');
        panStart = { x: event.clientX - pan.x, y: event.clientY - pan.y };
        event.preventDefault();
      });

      mapArea.addEventListener('pointerdown', (event) => {
        // Track touch pointers for pinch gestures
        if (event.pointerType === 'touch') {
          activePointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
        }
        // Preserve original behavior: ignore mouse pointerdown here so
        // `mousedown` still controls mouse panning (right-click/alt).
        if (event.pointerType === 'mouse') return;
        if (event.target && event.target.closest && event.target.closest('.vendor-pin')) return;
        if (event.target && (event.target.isContentEditable || event.target.closest('input, textarea, select, button'))) return;
        if (isPanningMap) return;
        isPanningMap = true;
        activePointerId = event.pointerId;
        mapArea.classList.add('grabbing');
        panStart = { x: event.clientX - pan.x, y: event.clientY - pan.y };
        if (typeof mapArea.setPointerCapture === 'function') {
          try {
            mapArea.setPointerCapture(event.pointerId);
          } catch (err) {
            // Pointer capture can fail for some inputs; fallback to document listeners.
          }
        }
        event.preventDefault();
      });

      // Pointer move should also update active touch pointers
      mapArea.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch') {
          if (activePointers.has(event.pointerId)) {
            activePointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
          }
        }
      });

      document.addEventListener('mousemove', (event) => {
        if (!isPanningMap) return;
        pan.x = event.clientX - panStart.x;
        pan.y = event.clientY - panStart.y;
        applyZoomPan();
      });

      document.addEventListener('pointermove', (event) => {
        // Handle pinch-to-zoom when two touch pointers are active
        if (event.pointerType === 'touch' && activePointers.size >= 2) {
          // ensure the latest coordinates are recorded
          if (activePointers.has(event.pointerId)) {
            activePointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
          }

          const pts = Array.from(activePointers.values()).slice(0, 2);
          const dx = pts[0].clientX - pts[1].clientX;
          const dy = pts[0].clientY - pts[1].clientY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (!pinchStartDistance) {
            pinchStartDistance = distance || 0.0001;
            pinchStartZoom = zoomLevel;
            pinchMidpoint = {
              x: (pts[0].clientX + pts[1].clientX) / 2,
              y: (pts[0].clientY + pts[1].clientY) / 2
            };
          } else {
            const scaleFactor = distance / Math.max(0.0001, pinchStartDistance);
            const nextZoom = Math.min(2.5, Math.max(0.1, pinchStartZoom * scaleFactor));

            // adjust pan so the midpoint remains fixed relative to content
            const beforeZoom = zoomLevel;
            const mapRect = mapContent.getBoundingClientRect();
            const midClientX = pinchMidpoint.x;
            const midClientY = pinchMidpoint.y;

            // content coordinates of midpoint before change
            const contentX = (midClientX - mapRect.left - pan.x) / beforeZoom;
            const contentY = (midClientY - mapRect.top - pan.y) / beforeZoom;

            zoomLevel = nextZoom;

            // compute new pan so contentX/contentY maps back to same client coords
            pan.x = midClientX - mapRect.left - contentX * zoomLevel;
            pan.y = midClientY - mapRect.top - contentY * zoomLevel;
            applyZoomPan();
          }

          event.preventDefault();
          return;
        }

        // regular touch panning
        if (!isPanningMap) return;
        if (event.pointerType === 'mouse') return;
        if (activePointerId !== null && event.pointerId !== activePointerId) return;
        pan.x = event.clientX - panStart.x;
        pan.y = event.clientY - panStart.y;
        applyZoomPan();
        event.preventDefault();
      }, { passive: false });

      document.addEventListener('mouseup', () => {
        if (!isPanningMap) return;
        isPanningMap = false;
        activePointerId = null;
        mapArea.classList.remove('grabbing');
      });

      document.addEventListener('pointerup', (event) => {
        if (!isPanningMap) return;
        if (event.pointerType === 'mouse') return;
        if (activePointerId !== null && event.pointerId !== activePointerId) return;
        isPanningMap = false;
        activePointerId = null;
        mapArea.classList.remove('grabbing');
        // remove pointer from activePointers and reset pinch state if needed
        if (event.pointerType === 'touch') {
          activePointers.delete(event.pointerId);
          if (activePointers.size < 2) {
            pinchStartDistance = 0;
            pinchStartZoom = zoomLevel;
            pinchMidpoint = null;
          }
        }
      });

      document.addEventListener('pointercancel', (event) => {
        if (!isPanningMap) return;
        if (event.pointerType === 'mouse') return;
        if (activePointerId !== null && event.pointerId !== activePointerId) return;
        isPanningMap = false;
        activePointerId = null;
        mapArea.classList.remove('grabbing');
        if (event.pointerType === 'touch') {
          activePointers.delete(event.pointerId);
          if (activePointers.size < 2) {
            pinchStartDistance = 0;
            pinchStartZoom = zoomLevel;
            pinchMidpoint = null;
          }
        }
      });

      // Always clean up any tracked active touch pointers on pointerup/cancel,
      // even when the map is not in panning state, to avoid stale entries.
      function cleanupTrackedPointer(event) {
        if (!event || event.pointerType !== 'touch') return;
        if (activePointers.has(event.pointerId)) {
          activePointers.delete(event.pointerId);
        }
        if (activePointers.size < 2) {
          pinchStartDistance = 0;
          pinchStartZoom = zoomLevel;
          pinchMidpoint = null;
        }
      }

      document.addEventListener('pointerup', cleanupTrackedPointer);
      document.addEventListener('pointercancel', cleanupTrackedPointer);

      mapArea.addEventListener('contextmenu', (event) => {
        event.preventDefault();
      });
    }

    function resetView() {
      pan = { x: 0, y: 0 };
      setZoom(1);
    }

    return {
      applyZoomPan: applyZoomPan,
      setZoom: setZoom,
      getZoomLevel: getZoomLevel,
      addMapPanHandlers: addMapPanHandlers,
      resetView: resetView
    };
  }

  window.createPanZoomTools = createPanZoomTools;
})();
