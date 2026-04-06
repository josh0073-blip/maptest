(function () {
  function createPinManager(options) {
    const settings = options || {};
    const pinsContainer = settings.pinsContainer;
    const appState = settings.appState;
    const actions = settings.actions;
    const applyPinPosition = settings.applyPinPosition;
    const applyPinTransform = settings.applyPinTransform;
    const updateVendorList = settings.updateVendorList;
    const persistState = settings.persistState;
    const startDrag = settings.startDrag;
    const updateClusters = settings.updateClusters;
    const onTemplateLinked = settings.onTemplateLinked || function () {};
    const onTemplateUpdated = settings.onTemplateUpdated || function () {};
    const onTemplateUnlinked = settings.onTemplateUnlinked || function () {};
    const sanitizeText = typeof window.sanitizeEditableText === 'function'
      ? window.sanitizeEditableText
      : function (value, fallback) { return String(value || '').trim() || String(fallback || ''); };

    let maxZIndex = 1;

    function setPinStatus(vendor, pin, status) {
      vendor.status = status;
      pin.classList.remove('status-normal', 'status-standby', 'status-alert');
      if (status === 'standby') pin.classList.add('status-standby');
      else if (status === 'alert') pin.classList.add('status-alert');
      else pin.classList.add('status-normal');
    }

    function setPinCategory(vendor, pin, categoryId) {
      const normalizedCategoryId = Number.isFinite(Number(categoryId)) ? Number(categoryId) : null;
      const category = appState.vendorCategories.find(function (entry) { return entry.id === normalizedCategoryId; }) || null;
      vendor.categoryId = category ? category.id : null;

      pin.removeAttribute('data-category-id');
      pin.style.removeProperty('--pin-category-color');

      if (!category) {
        pin.title = vendor.name;
        return;
      }

      pin.dataset.categoryId = String(category.id);
      pin.style.setProperty('--pin-category-color', category.color || '#166534');
      pin.title = vendor.name + ' (' + category.name + ')';
    }

    function nextStatus(current) {
      if (current === 'normal') return 'standby';
      if (current === 'standby') return 'alert';
      return 'normal';
    }

    function createPin(vendor) {
      const pin = document.createElement('div');
      pin.className = 'vendor-pin';
      pin.dataset.id = vendor.id;

      const indicator = document.createElement('div');
      indicator.className = 'status-indicator';

      const label = document.createElement('div');
      label.className = 'label';
      label.contentEditable = 'false';
      label.textContent = vendor.name;

      function commitLabelEdit() {
        vendor.name = sanitizeText(label.textContent, 'Vendor', 80);
        label.textContent = vendor.name;
        label.contentEditable = 'false';
        setPinCategory(vendor, pin, vendor.categoryId);

        if (vendor.templateId !== null) {
          const template = appState.vendorTemplates.find((t) => t.id === vendor.templateId);
          if (template) {
            template.name = vendor.name;
            onTemplateUpdated();
          }
        }

        updateVendorList();
        persistState();
      }

      label.addEventListener('dblclick', (event) => {
        event.stopPropagation();
        label.contentEditable = 'true';
        label.focus();
        document.execCommand('selectAll', false, null);
      });

      label.addEventListener('blur', () => {
        if (label.isContentEditable) {
          commitLabelEdit();
        }
      });

      label.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          label.blur();
        }
      });

      label.addEventListener('input', () => {
        vendor.name = sanitizeText(label.textContent, 'Vendor', 80);
        if (label.textContent !== vendor.name) {
          label.textContent = vendor.name;
        }
        setPinCategory(vendor, pin, vendor.categoryId);
        updateVendorList();
      });

      const rotateBtn = document.createElement('button');
      rotateBtn.className = 'rotate';
      rotateBtn.textContent = '↻';
      rotateBtn.title = 'Rotate pin (45°)';
      rotateBtn.addEventListener('click', () => {
        vendor.rotation = (vendor.rotation || 0) + 45;
        if (vendor.rotation >= 360) vendor.rotation = 0;
        applyPinTransform(vendor, pin);
        updateVendorList();
        persistState();
      });

      const shrinkBtn = document.createElement('button');
      shrinkBtn.className = 'resize';
      shrinkBtn.textContent = '−';
      shrinkBtn.title = 'Reduce pin size';
      shrinkBtn.addEventListener('click', () => {
        vendor.size = Math.max(0.5, (vendor.size || 1) - 0.1);
        applyPinTransform(vendor, pin);
        updateVendorList();
        persistState();
      });

      const growBtn = document.createElement('button');
      growBtn.className = 'resize';
      growBtn.textContent = '+';
      growBtn.title = 'Increase pin size';
      growBtn.addEventListener('click', () => {
        vendor.size = Math.min(2, (vendor.size || 1) + 0.1);
        applyPinTransform(vendor, pin);
        updateVendorList();
        persistState();
      });

      const shorterBtn = document.createElement('button');
      shorterBtn.className = 'resize';
      shorterBtn.textContent = '↓';
      shorterBtn.title = 'Reduce pin height';
      shorterBtn.addEventListener('click', () => {
        vendor.height = Math.max(0.5, (vendor.height || 1) - 0.5);
        applyPinTransform(vendor, pin);
        updateVendorList();
        persistState();
      });

      const tallerBtn = document.createElement('button');
      tallerBtn.className = 'resize';
      tallerBtn.textContent = '↑';
      tallerBtn.title = 'Increase pin height';
      tallerBtn.addEventListener('click', () => {
        vendor.height = Math.min(3, (vendor.height || 1) + 0.5);
        applyPinTransform(vendor, pin);
        updateVendorList();
        persistState();
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete';
      deleteBtn.textContent = '✕';
      deleteBtn.title = 'Remove vendor pin';
      deleteBtn.addEventListener('click', () => removeVendor(vendor.id));

      pin.append(indicator, label, rotateBtn, shrinkBtn, growBtn, shorterBtn, tallerBtn, deleteBtn);
      pin.style.zIndex = String(++maxZIndex);

      vendor.status = vendor.status || 'normal';
      vendor.categoryId = Number.isFinite(Number(vendor.categoryId)) ? Number(vendor.categoryId) : null;
      vendor.alignRefX = vendor.alignRefX || 'left';
      vendor.alignRefY = vendor.alignRefY || 'top';
      vendor.rotation = vendor.rotation || 0;
      vendor.size = vendor.size || 1;
      vendor.height = vendor.height || 1;
      setPinStatus(vendor, pin, vendor.status);
      setPinCategory(vendor, pin, vendor.categoryId);
      applyPinPosition(vendor, pin);
      applyPinTransform(vendor, pin);

      pin.addEventListener('pointerdown', (event) => {
        if (event.target.closest('button') || event.target.closest('.label')) return;
        event.stopPropagation();
        startDrag(event, pin, vendor);
      });

      pin.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        const newStatus = nextStatus(vendor.status);
        setPinStatus(vendor, pin, newStatus);
        updateVendorList();
        persistState();
      });

      pinsContainer.appendChild(pin);
      updateClusters();
      return { pin, vendor, label };
    }

    function addVendor(initial) {
      const base = initial || { name: 'Vendor', x: 60, y: 60, templateId: null };
      const vendor = actions.addVendorRecord(base);

      // Add to vendorTemplates if not already present
      if (!vendor.templateId) {
        const nextTemplateId = appState.vendorTemplates.reduce((max, t) => Math.max(max, t.id), 0) + 1;
        const newTemplate = { id: nextTemplateId, name: vendor.name, active: true };
        appState.vendorTemplates.push(newTemplate);
        vendor.templateId = newTemplate.id;
        onTemplateLinked();
      }

      createPin(vendor);
      updateVendorList();
      persistState();
      return vendor;
    }

    function removeVendor(id) {
      const removed = actions.removeVendorById(id);
      if (removed) {
        const pin = pinsContainer.querySelector(".vendor-pin[data-id='" + id + "']");
        if (pin) pin.remove();
        if (removed.templateId !== null) {
          const template = appState.vendorTemplates.find((t) => t.id === removed.templateId);
          if (template) {
            template.active = false;
            onTemplateUnlinked();
          }
        }
        updateVendorList();
      }
      return removed;
    }

    return {
      setPinStatus: setPinStatus,
      setPinCategory: setPinCategory,
      createPin: createPin,
      addVendor: addVendor,
      removeVendor: removeVendor
    };
  }

  window.createPinManager = createPinManager;
})();
