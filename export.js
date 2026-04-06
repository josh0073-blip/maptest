(function () {
  function createMapExportTools(options) {
    const mapArea = options.mapArea;
    const mapContent = options.mapContent;
    const notify = (options && options.notify) || (window && window.appNotify) || null;

    function getDateStamp() {
      return new Date().toISOString().slice(0, 10);
    }

    async function renderMapViewport(backgroundColor) {
      if (typeof html2canvas === 'undefined') {
        if (notify && typeof notify.error === 'function') notify.error('html2canvas library not loaded.');
        else console.error('html2canvas library not loaded.');
        return null;
      }

      const exportScale = Math.max(2, window.devicePixelRatio || 1);

      return html2canvas(mapContent, {
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
            const computedStyle = sourcePin ? window.getComputedStyle(sourcePin) : (clonedDocument.defaultView || window).getComputedStyle(pin);
            const liveBackground = sourcePin ? sourcePin.style.background : '';
            const liveBackgroundColor = sourcePin ? sourcePin.style.backgroundColor : '';
            const nextBackground = liveBackground || liveBackgroundColor || computedStyle.backgroundColor;
            pin.style.setProperty('background', nextBackground, 'important');
            pin.style.setProperty('background-color', computedStyle.backgroundColor, 'important');
            pin.style.setProperty('border-color', computedStyle.borderColor, 'important');
          });
        }
      });
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
