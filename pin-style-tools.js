(function () {
  function createPinStyleTools(options) {
    const getBackgroundScale = options.getBackgroundScale;

    function applyPinPosition(vendor, pin) {
      const backgroundScale = getBackgroundScale();
      const displayX = (vendor.x || 0) * backgroundScale;
      const displayY = (vendor.y || 0) * backgroundScale;
      pin.style.left = displayX + 'px';
      pin.style.top = displayY + 'px';
    }

    function applyPinTransform(vendor, pin) {
      if (vendor.customColor) pin.style.background = vendor.customColor;
      else pin.style.background = '';

      const size = vendor.size || 1;
      const rotation = vendor.rotation || 0;
      const height = vendor.height || 1;
      // Keep transforms anchored to a stable corner so width changes
      // (like show/hide control buttons) do not shift rotated pins sideways.
      pin.style.transformOrigin = '0 0';
      pin.style.transform = 'rotate(' + rotation + 'deg) scale(' + size + ', ' + (size * height) + ')';

      const label = pin.querySelector('.label');
      if (label) {
        label.style.transform = 'scale(' + (1 / size) + ', ' + (1 / (size * height)) + ')';
      }
      // Keep control icons at a stable visual size by inverse-scaling them
      // Controls still rotate with the pin, but do not visually grow/shrink.
      const controls = pin.querySelectorAll('.rotate, .resize, .delete, .status-indicator');
      if (controls && controls.length) {
        const invScale = 'scale(' + (1 / size) + ', ' + (1 / (size * height)) + ')';
        controls.forEach(function (c) {
          c.style.transformOrigin = 'center center';
          c.style.transform = invScale;
        });
      }
    }

    function animatePin(pin) {
      if (!pin) return;
      pin.classList.remove('animated');
      void pin.offsetWidth;
      pin.classList.add('animated');
    }

    return {
      applyPinPosition: applyPinPosition,
      applyPinTransform: applyPinTransform,
      animatePin: animatePin
    };
  }

  window.createPinStyleTools = createPinStyleTools;
})();
