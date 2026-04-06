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

      document.addEventListener('mousemove', (event) => {
        if (!isPanningMap) return;
        pan.x = event.clientX - panStart.x;
        pan.y = event.clientY - panStart.y;
        applyZoomPan();
      });

      document.addEventListener('pointermove', (event) => {
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
      });

      document.addEventListener('pointercancel', (event) => {
        if (!isPanningMap) return;
        if (event.pointerType === 'mouse') return;
        if (activePointerId !== null && event.pointerId !== activePointerId) return;
        isPanningMap = false;
        activePointerId = null;
        mapArea.classList.remove('grabbing');
      });

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
