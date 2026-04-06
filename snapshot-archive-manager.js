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
      const fromDate = fromValue ? new Date(`${fromValue}T00:00:00`) : null;
      const toDate = toValue ? new Date(`${toValue}T23:59:59.999`) : null;

      return library.filter((entry) => {
        if (query) {
          const haystack = `${entry.name} ${(entry.tags || []).join(' ')}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }

        if (fromDate || toDate) {
          const createdDate = new Date(entry.createdAt || Date.now());
          if (fromDate && createdDate < fromDate) return false;
          if (toDate && createdDate > toDate) return false;
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
