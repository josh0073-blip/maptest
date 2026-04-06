(function () {
  function createVendorListTools(options) {
    const pinsContainer = options.pinsContainer;
    const vendorList = options.vendorList;
    const congestionKeyPanel = options.congestionKeyPanel || null;
    const congestionKeyList = options.congestionKeyList || null;
    const mapCongestionKeyPanel = options.mapCongestionKeyPanel || null;
    const mapCongestionKeyList = options.mapCongestionKeyList || null;
    const isCongestionModeEnabled = options.isCongestionModeEnabled || function () { return false; };
    const getVendors = options.getVendors;
    const getVendorCategories = options.getVendorCategories || function () { return []; };
    const getBackgroundScale = options.getBackgroundScale || function () { return 1; };

    function buildCongestionEntries(vendors) {
      const clustered = vendors.filter(function (vendor) { return !!vendor.clustered; });
      clustered.sort(function (a, b) {
        const ay = Number(a.y) || 0;
        const by = Number(b.y) || 0;
        if (ay !== by) return ay - by;
        const ax = Number(a.x) || 0;
        const bx = Number(b.x) || 0;
        if (ax !== bx) return ax - bx;
        return Number(a.id) - Number(b.id);
      });
      return clustered.map(function (vendor, index) {
        return {
          id: vendor.id,
          token: String(index + 1),
          name: String(vendor.name || 'Vendor')
        };
      });
    }

    function renderCongestionKeyInto(panel, list, entries) {
      if (!panel || !list) return;
      list.innerHTML = '';
      if (!isCongestionModeEnabled() || !entries.length) {
        panel.hidden = true;
        return;
      }

      entries.forEach(function (entry) {
        const item = document.createElement('li');
        const name = String(entry.name || 'Vendor');
        const duplicatePrefix = new RegExp('^' + entry.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.\\s+');
        const displayName = name.replace(duplicatePrefix, '');
        item.textContent = displayName;
        list.append(item);
      });
      panel.hidden = false;
    }

    function renderCongestionKey(entries) {
      renderCongestionKeyInto(congestionKeyPanel, congestionKeyList, entries);
      renderCongestionKeyInto(mapCongestionKeyPanel, mapCongestionKeyList, entries);
    }

    function applyCongestionTokens(entries, pinsById, vendors) {
      const tokenById = new Map(entries.map(function (entry) {
        return [Number(entry.id), entry.token];
      }));
      const nameById = new Map(vendors.map(function (vendor) {
        return [Number(vendor.id), String(vendor.name || 'Vendor')];
      }));
      const enabled = isCongestionModeEnabled();

      pinsById.forEach(function (pin, id) {
        const label = pin.querySelector('.label');
        if (!label) return;

        const token = tokenById.get(Number(id));
        const canSubstitute = enabled && !!token && !label.isContentEditable;

        pin.classList.toggle('congestion-token', canSubstitute);
        if (canSubstitute) {
          label.textContent = token;
          label.setAttribute('aria-label', nameById.get(Number(id)) || ('Vendor ' + token));
          pin.dataset.congestionToken = token;
        } else {
          const fullName = nameById.get(Number(id));
          if (fullName && !label.isContentEditable) label.textContent = fullName;
          label.removeAttribute('aria-label');
          delete pin.dataset.congestionToken;
        }
      });
    }

    function refreshClusterState(vendors, container, scale) {
      const rawScale = Number(scale);
      const safeScale = Number.isFinite(rawScale) && rawScale > 0 ? rawScale : 1;
      const thresholdX = Math.min(180, Math.max(28, 95 / safeScale));
      const verticalCompression = 0.15;
      const minVerticalHalfExtent = 6 / safeScale;
      const horizontalInflation = 8 / safeScale;
      const pinsById = new Map();

      if (container) {
        container.querySelectorAll('.vendor-pin').forEach(function (pin) {
          const pinId = Number(pin.dataset.id);
          if (Number.isFinite(pinId)) pinsById.set(pinId, pin);
        });
      }

      function buildCollisionGeometry(vendor) {
        const pin = pinsById.get(Number(vendor.id));
        const baseWidth = Math.max(64, Number(pin && pin.offsetWidth) || 0);
        const baseHeight = Math.max(26, Number(pin && pin.offsetHeight) || 0);
        const size = Math.max(0.5, Number(vendor.size) || 1);
        const height = Math.max(0.5, Number(vendor.height) || 1);
        const rotationDeg = Number(vendor.rotation) || 0;
        const rotation = (rotationDeg * Math.PI) / 180;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        const fullWidth = (baseWidth * size) / safeScale;
        const fullHeight = (baseHeight * size * height) / safeScale;
        const halfWidth = (fullWidth / 2) + horizontalInflation;
        const halfHeight = Math.max((fullHeight * verticalCompression) / 2, minVerticalHalfExtent);

        const originX = Number(vendor.x) || 0;
        const originY = Number(vendor.y) || 0;
        const ux = { x: cos, y: sin };
        const uy = { x: -sin, y: cos };

        // Pin transforms rotate around the top-left corner, so center must be projected from origin.
        const centerX = originX + (ux.x * (fullWidth / 2)) + (uy.x * (fullHeight / 2));
        const centerY = originY + (ux.y * (fullWidth / 2)) + (uy.y * (fullHeight / 2));

        return {
          centerX: centerX,
          centerY: centerY,
          halfWidth: halfWidth,
          halfHeight: halfHeight,
          ux: ux,
          uy: uy
        };
      }

      function hasProjectedOverlap(axis, a, b) {
        const axisLength = Math.hypot(axis.x, axis.y) || 1;
        const nx = axis.x / axisLength;
        const ny = axis.y / axisLength;

        const centerDelta = Math.abs(((b.centerX - a.centerX) * nx) + ((b.centerY - a.centerY) * ny));
        const radiusA =
          (a.halfWidth * Math.abs((a.ux.x * nx) + (a.ux.y * ny))) +
          (a.halfHeight * Math.abs((a.uy.x * nx) + (a.uy.y * ny)));
        const radiusB =
          (b.halfWidth * Math.abs((b.ux.x * nx) + (b.ux.y * ny))) +
          (b.halfHeight * Math.abs((b.uy.x * nx) + (b.uy.y * ny)));

        return centerDelta <= (radiusA + radiusB);
      }

      function intersectsOrientedBoxes(a, b) {
        return (
          hasProjectedOverlap(a.ux, a, b) &&
          hasProjectedOverlap(a.uy, a, b) &&
          hasProjectedOverlap(b.ux, a, b) &&
          hasProjectedOverlap(b.uy, a, b)
        );
      }

      const geometries = vendors.map(function (vendor) {
        vendor.clustered = false;
        return buildCollisionGeometry(vendor);
      });

      for (let i = 0; i < vendors.length; i++) {
        for (let j = i + 1; j < vendors.length; j++) {
          if (intersectsOrientedBoxes(geometries[i], geometries[j])) {
            vendors[i].clustered = true;
            vendors[j].clustered = true;
          }
        }
      }

      vendors.forEach(function (vendor) {
        const pin = pinsById.get(vendor.id) || null;
        if (!pin) return;
        pin.classList.toggle('clustered', !!vendor.clustered);
      });

      const congestionEntries = buildCongestionEntries(vendors);
      renderCongestionKey(congestionEntries);
      applyCongestionTokens(congestionEntries, pinsById, vendors);

      return {
        threshold: thresholdX,
        thresholdX: thresholdX,
        thresholdY: thresholdX * verticalCompression,
        clusteredCount: vendors.filter(function (vendor) { return !!vendor.clustered; }).length
      };
    }

    function updateClusters() {
      const vendors = getVendors();
      if (!isCongestionModeEnabled()) {
        // Clear any residual clustered/token state for stability when feature is disabled
        const pinsById = new Map();
        if (pinsContainer) {
          pinsContainer.querySelectorAll('.vendor-pin').forEach(function (pin) {
            const pid = Number(pin.dataset.id);
            if (Number.isFinite(pid)) pinsById.set(pid, pin);
            pin.classList.remove('clustered');
            pin.classList.remove('congestion-token');
            pin.removeAttribute('aria-label');
            delete pin.dataset.congestionToken;
          });
        }
        // Restore original labels via applyCongestionTokens with empty entries
        try {
          applyCongestionTokens([], pinsById, vendors);
        } catch (err) {
          // defensive: fallback to manual label restore
          if (pinsById.size) {
            pinsById.forEach(function (pin, id) {
              const label = pin.querySelector('.label');
              if (!label || label.isContentEditable) return;
              const vendor = vendors.find(function (v) { return Number(v.id) === Number(id); });
              if (vendor) label.textContent = String(vendor.name || 'Vendor');
            });
          }
        }
        // Ensure congestion key UI is hidden
        renderCongestionKey([]);
        return;
      }

      refreshClusterState(vendors, pinsContainer, getBackgroundScale());
    }

    function updateVendorList() {
      const vendors = getVendors();
      if (isCongestionModeEnabled()) {
        refreshClusterState(vendors, pinsContainer, getBackgroundScale());
      } else {
        // When disabled, ensure list rendering still shows vendor items without clustering markers
        const pinsById = new Map();
        if (pinsContainer) {
          pinsContainer.querySelectorAll('.vendor-pin').forEach(function (pin) {
            const pid = Number(pin.dataset.id);
            if (Number.isFinite(pid)) pinsById.set(pid, pin);
            pin.classList.remove('clustered');
            pin.classList.remove('congestion-token');
            pin.removeAttribute('aria-label');
            delete pin.dataset.congestionToken;
          });
        }
        try {
          applyCongestionTokens([], pinsById, vendors);
        } catch (err) {
          // ignore
        }
        renderCongestionKey([]);
      }
      vendorList.innerHTML = '';
      const categoryById = new Map(getVendorCategories().map(function (category) {
        return [category.id, category.name];
      }));
      vendors.forEach(function (v) {
        const item = document.createElement('div');
        const categorySuffix = v.categoryId && categoryById.has(v.categoryId)
          ? ' · ' + categoryById.get(v.categoryId)
          : '';
        item.textContent =
          v.id + ': ' + v.name + ' (' + Math.round(v.x) + ', ' + Math.round(v.y) + ') [' + (v.status || 'normal') + ']' +
          categorySuffix +
          (v.clustered ? ' · clustered' : '') +
          (v.rotation ? ' · ' + v.rotation + '°' : '') +
          (v.size && v.size !== 1 ? ' · s' + v.size.toFixed(1) : '') +
          (v.height && v.height !== 1 ? ' · h' + v.height : '');
        vendorList.append(item);
      });
    }

    function benchmarkVendorListUpdate(count) {
      const sampleCount = Math.max(1, Math.floor(Number(count) || 100));
      const benchmarkContainer = document.createElement('div');
      const benchmarkVendors = [];

      for (let index = 0; index < sampleCount; index++) {
        const vendor = {
          id: index + 1,
          name: 'Vendor ' + (index + 1),
          x: (index % 20) * 18 + ((index % 3) * 2),
          y: Math.floor(index / 20) * 18 + ((index % 5) * 2),
          status: 'normal'
        };
        benchmarkVendors.push(vendor);

        const pin = document.createElement('div');
        pin.className = 'vendor-pin';
        pin.dataset.id = String(vendor.id);
        benchmarkContainer.appendChild(pin);
      }

      const start = performance.now();
      const result = refreshClusterState(benchmarkVendors, benchmarkContainer, 1);
      const durationMs = performance.now() - start;

      return {
        vendorCount: sampleCount,
        clusteredCount: result.clusteredCount,
        threshold: result.threshold,
        durationMs: durationMs
      };
    }

    return {
      updateClusters: updateClusters,
      updateVendorList: updateVendorList,
      benchmarkVendorListUpdate: benchmarkVendorListUpdate
    };
  }

  window.createVendorListTools = createVendorListTools;
})();
