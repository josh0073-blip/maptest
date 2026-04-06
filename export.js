(function () {
  function createMapExportTools(options) {
    const mapArea = options.mapArea;
    const mapContent = options.mapContent;
    const notify = (options && options.notify) || (window && window.appNotify) || null;

    function getDateStamp() {
      return new Date().toISOString().slice(0, 10);
    }

    function trimWhitespaceFromCanvas(sourceCanvas, padding) {
      const canvas = sourceCanvas;
      if (!canvas || typeof canvas.getContext !== 'function') return canvas;

      let context = null;
      try {
        context = canvas.getContext('2d', { willReadFrequently: true }) || canvas.getContext('2d');
      } catch (err) {
        return canvas;
      }
      if (!context) return canvas;

      const width = canvas.width;
      const height = canvas.height;
      if (width <= 0 || height <= 0) return canvas;

      let data = null;
      try {
        data = context.getImageData(0, 0, width, height).data;
      } catch (err) {
        // Cross-origin images can taint the canvas; in that case keep original export.
        return canvas;
      }
      const whiteThreshold = 248;

      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;

      for (let y = 0; y < height; y++) {
        const rowOffset = y * width * 4;
        for (let x = 0; x < width; x++) {
          const offset = rowOffset + (x * 4);
          const r = data[offset];
          const g = data[offset + 1];
          const b = data[offset + 2];
          const a = data[offset + 3];

          // Keep any pixel that is not near-solid white background.
          const isContent = a > 0 && (r < whiteThreshold || g < whiteThreshold || b < whiteThreshold);
          if (!isContent) continue;

          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }

      if (maxX < minX || maxY < minY) {
        return canvas;
      }

      const pad = Math.max(0, Number(padding) || 0);
      const cropX = Math.max(0, minX - pad);
      const cropY = Math.max(0, minY - pad);
      const cropW = Math.min(width - cropX, (maxX - minX + 1) + (pad * 2));
      const cropH = Math.min(height - cropY, (maxY - minY + 1) + (pad * 2));

      if (cropW <= 0 || cropH <= 0) return canvas;

      const trimmedCanvas = document.createElement('canvas');
      trimmedCanvas.width = cropW;
      trimmedCanvas.height = cropH;
      const trimmedContext = trimmedCanvas.getContext('2d');
      if (!trimmedContext) return canvas;
      trimmedContext.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      return trimmedCanvas;
    }

    async function renderMapViewport(backgroundColor) {
      if (typeof html2canvas === 'undefined') {
        if (notify && typeof notify.error === 'function') notify.error('html2canvas library not loaded.');
        else console.error('html2canvas library not loaded.');
        return null;
      }

      const exportScale = Math.max(2, window.devicePixelRatio || 1);

      const renderedCanvas = await html2canvas(mapContent, {
        backgroundColor: backgroundColor || '#ffffff',
        scale: exportScale,
        useCORS: true,
        width: Math.round(mapContent.offsetWidth),
        height: Math.round(mapContent.offsetHeight),
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
        onclone: function (clonedDocument) {
          const clonedMapContent = clonedDocument.getElementById('mapContent');
          if (clonedMapContent) {
            clonedMapContent.style.transform = 'none';
            clonedMapContent.style.position = 'static';
          }
          const clonedMapArea = clonedDocument.getElementById('mapArea');
          if (clonedMapArea) {
            clonedMapArea.classList.remove('grabbing');
            clonedMapArea.style.cursor = 'default';
          }

          const sourcePinsById = new Map();
          document.querySelectorAll('.vendor-pin').forEach(function (sourcePin) {
            sourcePinsById.set(sourcePin.getAttribute('data-id'), sourcePin);
          });

          const clonedPins = clonedDocument.querySelectorAll('.vendor-pin');
          clonedPins.forEach(function (pin) {
            const sourcePin = sourcePinsById.get(pin.getAttribute('data-id'));
            if (!sourcePin) return;

            // Preserve only explicit inline custom pin colors. Let normal CSS/computed
            // styles render naturally in clone to avoid edge color artifacts on export.
            const liveBackground = sourcePin.style.background || sourcePin.style.backgroundColor || '';
            if (liveBackground) {
              pin.style.setProperty('background', liveBackground, 'important');
            } else {
              pin.style.removeProperty('background');
              pin.style.removeProperty('background-color');
            }
          });
        }
      });

      return trimWhitespaceFromCanvas(renderedCanvas, 18);
    }

    async function exportMapAsImage() {
      const canvas = await renderMapViewport('#ffffff');
      if (!canvas) return;

      const imgData = canvas.toDataURL('image/jpeg', 0.93);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = 'farmers-market-map-' + getDateStamp() + '.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    async function exportMapAsPdf() {
      if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
        if (notify && typeof notify.error === 'function') notify.error('Dependencies html2canvas or jsPDF are not loaded.');
        else console.error('Dependencies html2canvas or jsPDF are not loaded.');
        return;
      }

      const canvas = await renderMapViewport('#ffffff');
      if (!canvas) return;

      const imgData = canvas.toDataURL('image/jpeg', 0.93);
      const pdf = new jspdf.jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const img = new Image();
      img.onload = function () {
        const ratio = Math.min(pdfWidth / img.width, pdfHeight / img.height);
        const imgWidth = img.width * ratio;
        const imgHeight = img.height * ratio;
        const marginX = (pdfWidth - imgWidth) / 2;
        const marginY = (pdfHeight - imgHeight) / 2;
        pdf.addImage(imgData, 'JPEG', marginX, marginY, imgWidth, imgHeight);
        pdf.save('farmers-market-map-' + getDateStamp() + '.pdf');
      };
      img.src = imgData;
    }

    return {
      exportMapAsImage: exportMapAsImage,
      exportMapAsPdf: exportMapAsPdf
    };
  }

  window.createMapExportTools = createMapExportTools;
})();
