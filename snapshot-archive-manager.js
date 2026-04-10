export const PRELOADED_SNAPSHOTS = [
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
        }
      ]
    },
    tags: ['farmers', 'market'],
  }
];

export function createSnapshotArchiveManager(options) {
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

  function safeClone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (err) {
      return null;
    }
  }

  function parseDateValue(value) {
    if (!value) return NaN;
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : NaN;
  }

  function normalizeEntry(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const snapshot = safeClone(entry.snapshot);
    if (!snapshot || typeof snapshot !== 'object') return null;

    const id = String(entry.id || `archive-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    const name = String(entry.name || '').trim() || 'Untitled Snapshot';
    const createdAt = String(entry.createdAt || new Date().toISOString());
    const tags = Array.isArray(entry.tags)
      ? entry.tags.map(normalizeTag).filter(Boolean)
      : [];

    return {
      id: id,
      name: name,
      createdAt: createdAt,
      snapshot: snapshot,
      tags: tags,
      branchFromId: entry.branchFromId ? String(entry.branchFromId) : ''
    };
  }

  function sortNewestFirst(left, right) {
    const leftTs = parseDateValue(left && left.createdAt);
    const rightTs = parseDateValue(right && right.createdAt);

    if (Number.isFinite(leftTs) && Number.isFinite(rightTs) && leftTs !== rightTs) {
      return rightTs - leftTs;
    }
    if (Number.isFinite(leftTs) && !Number.isFinite(rightTs)) return -1;
    if (!Number.isFinite(leftTs) && Number.isFinite(rightTs)) return 1;

    const leftId = String((left && left.id) || '');
    const rightId = String((right && right.id) || '');
    return rightId.localeCompare(leftId);
  }

  async function persistLibrary() {
    if (typeof writeLibrary !== 'function') return true;

    try {
      await writeLibrary(library.map(function (entry) {
        return safeClone(entry);
      }).filter(Boolean));
      return true;
    } catch (err) {
      console.error('Failed writing snapshot archive library.', err);
      notify.error('Failed to persist archived snapshots.');
      return false;
    }
  }

  function getFilteredLibrary() {
    const query = String(searchInput && searchInput.value ? searchInput.value : '').trim().toLowerCase();
    const fromTs = parseDateValue(dateFromInput && dateFromInput.value ? dateFromInput.value : '');
    const toTsRaw = parseDateValue(dateToInput && dateToInput.value ? dateToInput.value : '');
    const toTs = Number.isFinite(toTsRaw) ? toTsRaw + (24 * 60 * 60 * 1000) - 1 : NaN;

    return library.filter(function (entry) {
      if (!entry || typeof entry !== 'object') return false;

      const createdAtTs = parseDateValue(entry.createdAt);
      if (Number.isFinite(fromTs) && (!Number.isFinite(createdAtTs) || createdAtTs < fromTs)) {
        return false;
      }
      if (Number.isFinite(toTs) && (!Number.isFinite(createdAtTs) || createdAtTs > toTs)) {
        return false;
      }

      if (!query) return true;

      const haystack = [
        String(entry.name || '').toLowerCase(),
        Array.isArray(entry.tags) ? entry.tags.join(' ').toLowerCase() : '',
        String(entry.createdAt || '').toLowerCase()
      ].join(' ');

      return haystack.includes(query);
    });
  }

  function optionLabelForEntry(entry) {
    const createdAt = parseDateValue(entry.createdAt);
    const dateText = Number.isFinite(createdAt)
      ? new Date(createdAt).toLocaleDateString()
      : 'Unknown date';
    const tags = Array.isArray(entry.tags) && entry.tags.length
      ? ` [${entry.tags.join(', ')}]`
      : '';
    return `${entry.name} - ${dateText}${tags}`;
  }

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
    const source = typeof readLibrary === 'function'
      ? await readLibrary()
      : PRELOADED_SNAPSHOTS;

    const inputEntries = Array.isArray(source) && source.length ? source : PRELOADED_SNAPSHOTS;
    const normalized = inputEntries
      .map(normalizeEntry)
      .filter(Boolean)
      .sort(sortNewestFirst)
      .slice(0, limit);

    library = normalized;
    return library;
  }

  function renderOptions() {
    if (!selectElement) return;

    const selectedId = String(selectElement.value || '');
    const filtered = getFilteredLibrary();

    console.log('Filtered library entries for rendering:', JSON.stringify(filtered, null, 2));

    selectElement.innerHTML = '';
    filtered.forEach(function (entry) {
      const option = document.createElement('option');
      option.value = String(entry.id);
      option.textContent = optionLabelForEntry(entry);
      selectElement.appendChild(option);
    });

    console.log('Updated selectElement options:', selectElement.innerHTML);

    if (selectedId && filtered.some(function (entry) { return String(entry.id) === selectedId; })) {
      selectElement.value = selectedId;
    }
  }

  function getSelectedEntry() {
    if (!selectElement) return null;
    const selectedId = String(selectElement.value || '');
    if (!selectedId) return null;
    return library.find(function (entry) {
      return String(entry.id) === selectedId;
    }) || null;
  }

  async function addEntry(name, snapshot, config) {
    const trimmedName = String(name || '').trim() || getDefaultName();
    const entryConfig = config || {};
    const tags = Array.isArray(entryConfig.tags)
      ? entryConfig.tags.map(normalizeTag).filter(Boolean)
      : [];
    const normalized = normalizeEntry({
      id: `archive-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmedName,
      createdAt: new Date().toISOString(),
      snapshot: snapshot,
      tags: tags,
      branchFromId: entryConfig.branchFromId || ''
    });

    if (!normalized) {
      notify.error('Snapshot payload is invalid and could not be archived.');
      return null;
    }

    console.log('Library before adding entry:', library);
    library.unshift(normalized);
    if (library.length > limit) {
      console.log('Library exceeded limit. Removing oldest entries.');
      console.log('Library before sorting:', JSON.stringify(library.map(entry => ({ id: entry.id, timestamp: entry.timestamp })), null, 2));

      // Sort library to ensure oldest entries are at the end
      library.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      console.log('Library after sorting:', JSON.stringify(library.map(entry => ({ id: entry.id, timestamp: entry.timestamp })), null, 2));

      library = library.slice(0, limit);
      console.log('Library after slicing to limit:', JSON.stringify(library.map(entry => ({ id: entry.id, timestamp: entry.timestamp })), null, 2));

      // Verify the final state of the library
      console.log('Final library state:', JSON.stringify(library.map(entry => ({ id: entry.id, timestamp: entry.timestamp })), null, 2));
    }

    const didPersist = await persistLibrary();
    if (!didPersist) return null;

    console.log('Calling renderOptions after persisting library.');
    renderOptions();
    return normalized;
  }

  async function renameEntry(id, nextName) {
    const target = library.find(function (entry) {
      return String(entry.id) === String(id);
    });
    if (!target) return false;

    const trimmedName = String(nextName || '').trim();
    if (!trimmedName) return false;

    target.name = trimmedName;
    const didPersist = await persistLibrary();
    if (didPersist) renderOptions(); // Update UI after renaming
    return didPersist;
  }

  async function deleteEntry(id) {
    const before = library.length;
    library = library.filter(function (entry) {
      return String(entry.id) !== String(id);
    });

    if (library.length === before) return false;
    const didPersist = await persistLibrary();
    if (didPersist) renderOptions(); // Update UI after deletion
    return didPersist;
  }

  return {
    normalizeTag,
    collectTags,
    getDefaultName,
    load,
    renderOptions,
    getSelectedEntry,
    addEntry,
    renameEntry,
    deleteEntry,
  };
}

if (typeof window !== 'undefined') {
  window.PRELOADED_SNAPSHOTS = PRELOADED_SNAPSHOTS;
  window.createSnapshotArchiveManager = createSnapshotArchiveManager;
}
