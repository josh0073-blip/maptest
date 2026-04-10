(function () {
  function createTemplateTools(options) {
    const templateList = options.templateList;
    const templateCounter = options.templateCounter;
    const csvFileInput = options.csvFileInput;
    const getVendorTemplates = options.getVendorTemplates;
    const setVendorTemplates = options.setVendorTemplates;
    const getVendors = options.getVendors;
    const addVendor = options.addVendor;
    const removeVendor = options.removeVendor;
    const updateVendorList = options.updateVendorList;
    const persistState = options.persistState;
    const sanitizeText = typeof window.sanitizeEditableText === 'function'
      ? window.sanitizeEditableText
      : function (value, fallback) { return String(value || '').trim() || String(fallback || ''); };
    const notify = options.notify || (window && window.appNotify) || {
      success: function (message) { console.log(message); },
      info: function (message) { console.log(message); },
      warn: function (message) { console.warn(message); },
      error: function (message) { console.error(message); }
    };

    function parseCSV(csvText) {
      const source = String(csvText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const rows = [];
      let field = '';
      let row = [];
      let inQuotes = false;

      for (let i = 0; i < source.length; i++) {
        const ch = source[i];
        const next = source[i + 1];

        if (ch === '"') {
          if (inQuotes && next === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
          continue;
        }

        if (ch === ',' && !inQuotes) {
          row.push(field);
          field = '';
          continue;
        }

        if (ch === '\n' && !inQuotes) {
          row.push(field);
          rows.push(row);
          row = [];
          field = '';
          continue;
        }

        field += ch;
      }

      if (field.length || row.length) {
        row.push(field);
        rows.push(row);
      }

      const result = [];
      rows.forEach(function (cells, index) {
        const first = String((cells && cells[0]) || '').trim();
        if (!first) return;
        if (index === 0 && first.toLowerCase() === 'name') return;
        result.push(first);
      });

      return result;
    }

    function validateCSVContent(rows) {
      const sourceRows = Array.isArray(rows) ? rows : [];
      const sanitizedRows = [];
      const seenNames = new Set();
      const unsafePattern = /[<>"'&]/;

      sourceRows.forEach(function (row) {
        const rawName = Array.isArray(row) ? row[0] : row;
        const name = String(rawName || '').trim();
        if (!name) return;
        if (name.toLowerCase() === 'name') return;

        const normalizedName = name.toLowerCase();
        if (seenNames.has(normalizedName) || unsafePattern.test(name)) {
          return;
        }

        seenNames.add(normalizedName);
        sanitizedRows.push([name]);
      });

      return sanitizedRows;
    }

    function renderTemplateList() {
      const vendorTemplates = getVendorTemplates();
      templateList.innerHTML = '';
      vendorTemplates.forEach((template) => {
        const row = document.createElement('div');
        row.className = 'template-item';

        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !!template.active;
        checkbox.addEventListener('change', () => toggleVendorFromTemplate(template.id, checkbox.checked));

        const text = document.createElement('span');
        text.textContent = template.name;
        text.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
        });
        text.addEventListener('dblclick', async (event) => {
          event.preventDefault();
          event.stopPropagation();
          const newName = await window.showInputAsync('Edit template name:', { title: 'Edit template name', defaultValue: template.name });
          if (newName === null) return;

          const cleaned = sanitizeText(newName, template.name, 80);
          if (!cleaned || cleaned === template.name) return;

          template.name = cleaned;
          updateVendorList();
          persistState();
          renderTemplateList();
        });

        label.append(checkbox, text);

        const remove = document.createElement('button');
        remove.className = 'template-remove';
        remove.textContent = '✕';
        remove.title = 'Remove vendor from list';
        remove.addEventListener('click', () => {
          if (template.active) {
            const existing = getVendors().find((v) => v.templateId === template.id);
            if (existing) removeVendor(existing.id);
          }
          setVendorTemplates(getVendorTemplates().filter((t) => t.id !== template.id));
          renderTemplateList();
          persistState();
        });

        row.append(label, remove);
        templateList.append(row);
      });

      if (templateCounter) {
        const total = vendorTemplates.length;
        const active = vendorTemplates.filter((template) => !!template.active).length;
        templateCounter.textContent = 'Vendors: ' + total + ' | Active: ' + active;
      }
    }

    function toggleVendorFromTemplate(templateId, status) {
      const template = getVendorTemplates().find((t) => t.id === templateId);
      if (!template) return;
      template.active = status;

      if (status) {
        const existing = getVendors().find((v) => v.templateId === templateId);
        if (!existing) {
          // Let the central addVendorRecord compute a viewport-relative spawn
          addVendor({ name: template.name, templateId: templateId });
        }
      } else {
        const existing = getVendors().find((v) => v.templateId === templateId);
        if (existing) removeVendor(existing.id);
      }

      renderTemplateList();
      updateVendorList();
      persistState();
    }

    function uploadCSV() {
      const file = csvFileInput.files && csvFileInput.files[0];
      if (!file) {
        notify.warn('Please select a CSV file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const csvText = e.target && e.target.result;
        const rows = parseCSV(String(csvText || ''));
        const sanitizedRows = validateCSVContent(rows);

        const templates = getVendorTemplates();
        const existingNames = new Set(templates.map((template) => String(template.name || '').trim().toLowerCase()));
        let nextId = templates.reduce((acc, t) => Math.max(acc, t.id), 0) + 1;
        let addedCount = 0;
        let skippedCount = rows.length - sanitizedRows.length;

        sanitizedRows.forEach(([name]) => {
          if (existingNames.has(name.toLowerCase())) {
            skippedCount++;
            return;
          }
          templates.push({ id: nextId++, name, active: false });
          existingNames.add(name.toLowerCase());
          addedCount++;
        });

        renderTemplateList();
        persistState();
        if (addedCount) {
          const suffix = skippedCount ? ` (${skippedCount} duplicate or unsafe names skipped).` : '.';
          notify.success(`Added ${addedCount} vendor templates from CSV${suffix}`);
        } else {
          notify.warn('No new vendor templates were added from this CSV.');
        }
      };
      reader.readAsText(file);
    }

    async function clearAllTemplates() {
      const templates = getVendorTemplates();
      if (!templates.length) {
        notify.warn('No vendor templates to delete.');
        return;
      }

      const templateVendorIds = getVendors().filter((v) => v.templateId !== null).map((v) => v.id);
      const confirmed = await window.showConfirmAsync('Delete all ' + templates.length + ' vendor templates? This will also remove ' + templateVendorIds.length + ' template-linked pins.');
      if (!confirmed) return;

      templateVendorIds.forEach(removeVendor);
      setVendorTemplates([]);
      renderTemplateList();
      updateVendorList();
      persistState();
    }

    function selectAllTemplates() {
      getVendorTemplates().forEach((t) => {
        if (!t.active) {
          t.active = true;
          toggleVendorFromTemplate(t.id, true);
        }
      });
      renderTemplateList();
      persistState();
    }

    function deselectAllTemplates() {
      getVendorTemplates().forEach((t) => {
        t.active = false;
      });
      const activeVendorIds = getVendors().filter((v) => v.templateId !== null).map((v) => v.id);
      activeVendorIds.forEach(removeVendor);
      renderTemplateList();
      persistState();
    }

    function sortTemplatesAlphabetical() {
      const templates = getVendorTemplates().slice();
      if (templates.length < 2) return;

      const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
      templates.sort((a, b) => collator.compare(String(a.name || ''), String(b.name || '')));

      setVendorTemplates(templates);
      renderTemplateList();
      persistState();
    }

    function addTemplateFromInput(rawName) {
      const cleaned = sanitizeText(rawName, '', 80);
      const name = String(cleaned || '').trim();
      if (!name) {
        notify.warn('Enter a vendor name first.');
        return false;
      }

      const templates = getVendorTemplates();
      const normalized = name.toLowerCase();
      const duplicate = templates.some((template) => String(template.name || '').trim().toLowerCase() === normalized);
      if (duplicate) {
        notify.warn('That vendor template already exists.');
        return false;
      }

      const nextId = templates.reduce((max, template) => Math.max(max, template.id), 0) + 1;
      templates.push({ id: nextId, name: name, active: false });
      renderTemplateList();
      persistState();
      notify.success('Vendor template added.');
      return true;
    }

    function updateTemplate(templateId, updates) {
      const templates = getVendorTemplates();
      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        notify.warn('Template not found.');
        return;
      }

      Object.assign(template, updates);
      renderTemplateList();
      persistState();
      notify.success('Template updated successfully.');
    }

    async function deleteTemplate(templateId) {
      const templates = getVendorTemplates();
      const index = templates.findIndex((t) => t.id === templateId);
      if (index === -1) {
        notify.warn('Template not found.');
        return;
      }

      const confirmed = await window.showConfirmAsync('Are you sure you want to delete this template?');
      if (!confirmed) return;

      templates.splice(index, 1);
      renderTemplateList();
      persistState();
      notify.success('Template deleted successfully.');
    }

    return {
      renderTemplateList: renderTemplateList,
      toggleVendorFromTemplate: toggleVendorFromTemplate,
      uploadCSV: uploadCSV,
      clearAllTemplates: clearAllTemplates,
      addTemplateFromInput: addTemplateFromInput,
      selectAllTemplates: selectAllTemplates,
      deselectAllTemplates: deselectAllTemplates,
      sortTemplatesAlphabetical: sortTemplatesAlphabetical,
      updateTemplate: updateTemplate,
      deleteTemplate: deleteTemplate
    };
  }

  window.createTemplateTools = createTemplateTools;
})();
