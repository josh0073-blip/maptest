(function () {
  function toFiniteNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function sanitizeEditableText(value, fallback, maxLength) {
    const fallbackText = String(fallback || '').trim() || 'Untitled';
    const raw = String(value || '');
    const withoutUnsafeChars = raw.replace(/[<>"'&]/g, '');
    const compact = withoutUnsafeChars.replace(/\s+/g, ' ').trim();
    const clipped = maxLength > 0 ? compact.slice(0, maxLength) : compact;
    return clipped || fallbackText;
  }

  function normalizeBackgroundUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';

    if (raw.startsWith('data:image/')) return raw;
    if (raw.startsWith('./') || raw.startsWith('../') || raw.startsWith('/')) return raw;

    try {
      const parsed = new URL(raw, window.location.href);
      const protocol = String(parsed.protocol || '').toLowerCase();
      if (protocol === 'http:' || protocol === 'https:' || protocol === 'blob:' || protocol === 'file:') {
        return parsed.href;
      }
    } catch (err) {
      return '';
    }

    return '';
  }

  function normalizeTemplate(template, index) {
    const id = Math.max(1, Math.floor(toFiniteNumber(template && template.id, index + 1)));
    const name = sanitizeEditableText(template && template.name, 'Template ' + id, 80);
    const active = !!(template && template.active);
    return { id: id, name: name, active: active };
  }

  function normalizeCategory(category, index) {
    const fallbackColors = ['#16a34a', '#0284c7', '#ea580c', '#7c3aed', '#be123c'];
    const id = Math.max(1, Math.floor(toFiniteNumber(category && category.id, index + 1)));
    const name = sanitizeEditableText(category && category.name, 'Category ' + id, 40);
    const rawColor = String(category && category.color || '').trim();
    const color = /^#[0-9a-fA-F]{6}$/.test(rawColor)
      ? rawColor.toLowerCase()
      : fallbackColors[index % fallbackColors.length];
    return { id: id, name: name, color: color };
  }

  function normalizeVendor(vendor, index, validCategoryIds) {
    const id = Math.max(1, Math.floor(toFiniteNumber(vendor && vendor.id, index + 1)));
    const name = sanitizeEditableText(vendor && vendor.name, 'Vendor ' + id, 80);
    const x = toFiniteNumber(vendor && vendor.x, 60);
    const y = toFiniteNumber(vendor && vendor.y, 60);

    let templateId = null;
    if (vendor && vendor.templateId !== null && vendor.templateId !== undefined) {
      const normalizedTemplateId = Math.floor(toFiniteNumber(vendor.templateId, 0));
      templateId = normalizedTemplateId > 0 ? normalizedTemplateId : null;
    }

    let categoryId = null;
    if (vendor && vendor.categoryId !== null && vendor.categoryId !== undefined) {
      const normalizedCategoryId = Math.floor(toFiniteNumber(vendor.categoryId, 0));
      if (normalizedCategoryId > 0 && validCategoryIds.has(normalizedCategoryId)) {
        categoryId = normalizedCategoryId;
      }
    }

    const status = vendor && (vendor.status === 'standby' || vendor.status === 'alert') ? vendor.status : 'normal';
    const alignRefX = vendor && (vendor.alignRefX === 'center' || vendor.alignRefX === 'right') ? vendor.alignRefX : 'left';
    const alignRefY = vendor && (vendor.alignRefY === 'middle' || vendor.alignRefY === 'bottom') ? vendor.alignRefY : 'top';
    const rotationRaw = toFiniteNumber(vendor && vendor.rotation, 0);
    const rotation = ((rotationRaw % 360) + 360) % 360;
    const size = clamp(toFiniteNumber(vendor && vendor.size, 1), 0.5, 2);
    const height = clamp(toFiniteNumber(vendor && vendor.height, 1), 0.5, 3);

    const normalized = {
      id: id,
      name: name,
      x: x,
      y: y,
      templateId: templateId,
      categoryId: categoryId,
      status: status,
      alignRefX: alignRefX,
      alignRefY: alignRefY,
      rotation: rotation,
      size: size,
      height: height
    };

    if (vendor && typeof vendor.customColor === 'string' && vendor.customColor.trim()) {
      normalized.customColor = vendor.customColor;
    }

    return normalized;
  }

  function normalizeMapState(parsed, defaults) {
    const safeParsed = parsed && typeof parsed === 'object' ? parsed : {};
    const safeDefaults = defaults && typeof defaults === 'object' ? defaults : {};

    const fallbackCategories = Array.isArray(safeDefaults.vendorCategories) ? safeDefaults.vendorCategories : [];
    const categoryInput = Array.isArray(safeParsed.vendorCategories) ? safeParsed.vendorCategories : fallbackCategories;
    const vendorCategories = categoryInput.map(normalizeCategory);
    const validCategoryIds = new Set(vendorCategories.map(function (category) { return category.id; }));

    const fallbackTemplates = Array.isArray(safeDefaults.vendorTemplates) ? safeDefaults.vendorTemplates : [];
    const templateInput = Array.isArray(safeParsed.vendorTemplates) ? safeParsed.vendorTemplates : fallbackTemplates;
    const vendorTemplates = templateInput.map(normalizeTemplate);

    const vendorInput = Array.isArray(safeParsed.vendors) ? safeParsed.vendors : [];
    const vendors = vendorInput.map(function (vendor, index) {
      return normalizeVendor(vendor, index, validCategoryIds);
    });

    const maxVendorId = vendors.reduce(function (max, vendor) {
      return Math.max(max, vendor.id);
    }, 0);

    const nextIdFromState = Math.floor(toFiniteNumber(safeParsed.nextId, maxVendorId + 1));
    const nextId = Math.max(maxVendorId + 1, nextIdFromState, 1);

    const backgroundScaleDefault = toFiniteNumber(safeDefaults.backgroundScale, 1);
    const backgroundScale = clamp(toFiniteNumber(safeParsed.backgroundScale, backgroundScaleDefault), 0.1, 5);
    const backgroundOpacityDefault = clamp(toFiniteNumber(safeDefaults.backgroundOpacity, 1), 0, 1);
    const backgroundOpacity = clamp(toFiniteNumber(safeParsed.backgroundOpacity, backgroundOpacityDefault), 0, 1);

    const backgroundScaleLocked = !!safeParsed.backgroundScaleLocked;
    const backgroundUrl = normalizeBackgroundUrl(safeParsed.backgroundUrl);

    const defaultTitle = sanitizeEditableText(safeDefaults.mapTitleText, 'Farmers Market Vendor Map', 80);
    const mapTitleCandidate = typeof safeParsed.mapTitleText === 'string' ? safeParsed.mapTitleText : '';
    const mapTitleText = sanitizeEditableText(mapTitleCandidate, defaultTitle, 80);
    const pinCategoryDisplayVisible = safeParsed.pinCategoryDisplayVisible !== undefined
      ? !!safeParsed.pinCategoryDisplayVisible
      : (safeDefaults.pinCategoryDisplayVisible !== undefined ? !!safeDefaults.pinCategoryDisplayVisible : true);

    return {
      nextId: nextId,
      vendorCategories: vendorCategories,
      vendorTemplates: vendorTemplates,
      vendors: vendors,
      backgroundScale: backgroundScale,
      backgroundOpacity: backgroundOpacity,
      backgroundScaleLocked: backgroundScaleLocked,
      backgroundUrl: backgroundUrl,
      mapTitleText: mapTitleText,
      pinCategoryDisplayVisible: pinCategoryDisplayVisible
    };
  }

  window.normalizeMapState = normalizeMapState;
  window.sanitizeEditableText = sanitizeEditableText;
  window.normalizeBackgroundUrl = normalizeBackgroundUrl;
})();
