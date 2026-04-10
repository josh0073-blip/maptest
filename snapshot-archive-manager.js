(function () {
  function createSnapshotArchiveManager(options) {
    const settings = options || {};
    const limit = Math.max(1, Number(settings.limit) || 120);
    const readLibrary = settings.readLibrary;
    const writeLibrary = settings.writeLibrary;
    const notify = settings.notify || { error: function () {} };
    const getMapTitleText = settings.getMapTitleText || function () { return 'Map Snapshot'; };
    const selectElement = settings.selectElement;
    const searchInput = settings.searchInput;
    const dateFromInput = settings.dateFromInput;
    const dateToInput = settings.dateToInput;

    let library = [];

    function normalizeTag(value) {
      return String(value || '').trim().toLowerCase();
    }

    function collectTags(config) {
      const tagSettings = config || {};
      const includeAutoTags = tagSettings.includeAutoTags !== false;
      const eventTag = String(tagSettings.eventTag || '').trim();
      const tags = [];
      const seen = new Set();

      const pushTag = (tagValue) => {
        const normalized = normalizeTag(tagValue);
        if (!normalized || seen.has(normalized)) return;
        seen.add(normalized);
        tags.push(normalized);
      };

      if (includeAutoTags) {
        const now = new Date();
        pushTag(now.toISOString().slice(0, 10));
        pushTag(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
        pushTag(String(getMapTitleText() || '').slice(0, 60));
      }

      if (eventTag) pushTag(eventTag);
      return tags;
    }

    function getDefaultName() {
      return `${getMapTitleText() || 'Map Snapshot'} - ${new Date().toLocaleString()}`;
    }

    const PRELOADED_SNAPSHOTS = [
      {
        id: 'snapshot-1',
        name: 'Default Market Layout',
        createdAt: '2026-04-01T00:00:00Z',
        snapshot: { /* Snapshot data */ },
        tags: ['default', 'market'],
      },
      {
        id: 'snapshot-2',
        name: 'Spring Festival Layout',
        createdAt: '2026-04-05T00:00:00Z',
        snapshot: { /* Snapshot data */ },
        tags: ['festival', 'spring'],
      },
      {
        id: 'snapshot-3',
        name: 'Farmers Market Map - 2026-04-06',
        createdAt: '2026-04-06T00:00:00Z',
        snapshot: {
          nextId: 184,
          vendors: [
            {
              id: 149,
              name: 'Sylvatica Forest Farm',
              x: 498.5801003133111,
              y: 164.2184058425586,
              templateId: null,
              status: 'normal',
              alignRefX: 'left',
              alignRefY: 'top',
              rotation: 45,
              size: 1,
              height: 1,
              clustered: true
            },
            {
              id: 151,
              name: 'ArMi Farms',
              x: 533.8888888888888,
              y: 342.77777777777766,
              templateId: 2,
              status: 'normal',
              alignRefX: 'left',
              alignRefY: 'top',
              rotation: 45,
              size: 1,
              height: 1,
              clustered: false
            },
            // ...additional vendor data...
          ],
          vendorTemplates: [
            {
              id: 1,
              name: '4th Level Roasters',
              active: true
            },
            {
              id: 2,
              name: 'ArMi Farms',
              active: true
            },
            // ...additional template data...
          ]
        },
        tags: ['farmers-market', '2026'],
      },
    ];

    async function load() {
      try {
        const list = await readLibrary();
        library = list
          .filter((entry) => entry && typeof entry === 'object' && typeof entry.id === 'string' && entry.snapshot && typeof entry.snapshot === 'object')
          .map((entry) => ({
            id: entry.id,
            name: String(entry.name || 'Untitled Snapshot'),
            createdAt: entry.createdAt || new Date().toISOString(),
            snapshot: entry.snapshot,
            tags: Array.isArray(entry.tags) ? entry.tags.map((tag) => normalizeTag(tag)).filter(Boolean) : [],
            branchFromId: typeof entry.branchFromId === 'string' ? entry.branchFromId : ''
          }));

        if (!list.length) {
          console.log('Seeding preloaded snapshots...');
          library = PRELOADED_SNAPSHOTS;
          await persist();
        }

        renderOptions(); // Update the UI with the loaded snapshots
      } catch (err) {
        console.error('Failed loading snapshot archive library.', err);
        notify.error('Unable to load snapshot archive library. Browser persistent storage is unavailable.');
        library = [];
      }
    }

    async function persist() {
      try {
        await writeLibrary(library);
        return true;
      } catch (err) {
        console.error('Failed saving snapshot archive library.', err);
        notify.error('Unable to save snapshot archive library. Browser persistent storage is unavailable.');
        return false;
      }
    }

    function getSelectedEntry() {
      if (!selectElement) return null;
      const selectedId = selectElement.value;
      if (!selectedId) return null;
      return library.find((entry) => entry.id === selectedId) || null;
    }

    function getFilteredEntries() {
      const query = normalizeTag(searchInput && searchInput.value);
      const fromValue = dateFromInput && dateFromInput.value;
      const toValue = dateToInput && dateToInput.value;

      return library.filter((entry) => {
        if (query) {
          const haystack = `${entry.name} ${(entry.tags || []).join(' ')}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }

        // Date filtering: compare ISO date strings (YYYY-MM-DD) to avoid
        // timezone-related mismatches when using Date objects.
        if (fromValue || toValue) {
          const createdDateStr = (entry.createdAt || '').slice(0, 10);
          if (fromValue && createdDateStr < fromValue) return false;
          if (toValue && createdDateStr > toValue) return false;
        }

        return true;
      });
    }

    function renderOptions() {
      if (!selectElement) return;
      const selectedId = selectElement.value;
      selectElement.innerHTML = '';

      const visibleEntries = getFilteredEntries();

      if (!library.length) {
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'No archived snapshots yet';
        selectElement.append(emptyOption);
        selectElement.disabled = true;
        return;
      }

      if (!visibleEntries.length) {
        const emptyFilteredOption = document.createElement('option');
        emptyFilteredOption.value = '';
        emptyFilteredOption.textContent = 'No snapshots match current filters';
        selectElement.append(emptyFilteredOption);
        selectElement.disabled = true;
        return;
      }

      selectElement.disabled = false;
      visibleEntries.forEach((entry) => {
        const option = document.createElement('option');
        option.value = entry.id;
        const stamp = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'Unknown date';
        const tagText = Array.isArray(entry.tags) && entry.tags.length ? ` [${entry.tags.slice(0, 3).join(', ')}]` : '';
        option.textContent = `${entry.name} (${stamp})${tagText}`;
        selectElement.append(option);
      });

      if (selectedId && visibleEntries.some((entry) => entry.id === selectedId)) {
        selectElement.value = selectedId;
      } else {
        selectElement.selectedIndex = 0;
      }
    }

    async function addEntry(name, snapshot, config) {
      const entrySettings = config || {};
      const entry = {
        id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: String(name || '').trim() || getDefaultName(),
        createdAt: new Date().toISOString(),
        snapshot,
        tags: Array.isArray(entrySettings.tags) ? entrySettings.tags.map((tag) => normalizeTag(tag)).filter(Boolean) : [],
        branchFromId: entrySettings.branchFromId || ''
      };
      library.unshift(entry);
      if (library.length > limit) {
        library = library.slice(0, limit);
      }
      if (!await persist()) return null;
      return entry;
    }

    async function renameEntry(id, nextName) {
      const entry = library.find((item) => item.id === id);
      if (!entry) return false;
      const trimmed = String(nextName || '').trim();
      if (!trimmed) return false;
      entry.name = trimmed;
      return persist();
    }

    async function deleteEntry(id) {
      const before = library.length;
      library = library.filter((entry) => entry.id !== id);
      if (library.length === before) return false;
      return persist();
    }

    return {
      normalizeTag: normalizeTag,
      collectTags: collectTags,
      getDefaultName: getDefaultName,
      load: load,
      renderOptions: renderOptions,
      getSelectedEntry: getSelectedEntry,
      addEntry: addEntry,
      renameEntry: renameEntry,
      deleteEntry: deleteEntry
    };
  }

  window.createSnapshotArchiveManager = createSnapshotArchiveManager;
})();
