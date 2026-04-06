(function () {
  function createVendorListTools(options) {
    const pinsContainer = options.pinsContainer;
    const vendorList = options.vendorList;
    const congestionKeyPanel = options.congestionKeyPanel || null;
    const congestionKeyList = options.congestionKeyList || null;
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

    function renderCongestionKey(entries) {
      if (!congestionKeyPanel || !congestionKeyList) return;
      congestionKeyList.innerHTML = '';
      if (!isCongestionModeEnabled() || !entries.length) {
        congestionKeyPanel.hidden = true;
        return;
      }

      entries.forEach(function (entry) {
        const item = document.createElement('li');
        item.textContent = entry.token + '. ' + entry.name;
        congestionKeyList.append(item);
      });
      congestionKeyPanel.hidden = false;
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
      const threshold = Math.min(140, Math.max(20, 70 / safeScale));
      const thresholdSquared = threshold * threshold;
      const cellSize = threshold;
      const cellMap = new Map();
      const pinsById = new Map();

      if (container) {
        container.querySelectorAll('.vendor-pin').forEach(function (pin) {
          const pinId = Number(pin.dataset.id);
          if (Number.isFinite(pinId)) pinsById.set(pinId, pin);
        });
      }

      vendors.forEach(function (vendor, index) {
        vendor.clustered = false;

        const cellX = Math.floor((Number(vendor.x) || 0) / cellSize);
        const cellY = Math.floor((Number(vendor.y) || 0) / cellSize);
        const key = cellX + ':' + cellY;
        if (!cellMap.has(key)) cellMap.set(key, []);
        cellMap.get(key).push({ vendor: vendor, index: index, x: Number(vendor.x) || 0, y: Number(vendor.y) || 0, cellX: cellX, cellY: cellY });
      });

      vendors.forEach(function (vendor, index) {
        const cellX = Math.floor((Number(vendor.x) || 0) / cellSize);
        const cellY = Math.floor((Number(vendor.y) || 0) / cellSize);

        for (let offsetX = -1; offsetX <= 1; offsetX++) {
          for (let offsetY = -1; offsetY <= 1; offsetY++) {
            const neighborKey = (cellX + offsetX) + ':' + (cellY + offsetY);
            const bucket = cellMap.get(neighborKey);
            if (!bucket) continue;

            for (let i = 0; i < bucket.length; i++) {
              const other = bucket[i];
              if (other.index <= index) continue;
              const dx = (vendor.x || 0) - other.x;
              const dy = (vendor.y || 0) - other.y;
              if ((dx * dx) + (dy * dy) < thresholdSquared) {
                vendor.clustered = true;
                other.vendor.clustered = true;
              }
            }
          }
        }
      });

      vendors.forEach(function (vendor) {
        const pin = pinsById.get(vendor.id) || null;
        if (!pin) return;
        pin.classList.toggle('clustered', !!vendor.clustered);
      });

      const congestionEntries = buildCongestionEntries(vendors);
      renderCongestionKey(congestionEntries);
      applyCongestionTokens(congestionEntries, pinsById, vendors);

      return {
        threshold: threshold,
        clusteredCount: vendors.filter(function (vendor) { return !!vendor.clustered; }).length
      };
    }

    function updateClusters() {
      const vendors = getVendors();
      refreshClusterState(vendors, pinsContainer, getBackgroundScale());
    }

    function updateVendorList() {
      const vendors = getVendors();
      refreshClusterState(vendors, pinsContainer, getBackgroundScale());
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
