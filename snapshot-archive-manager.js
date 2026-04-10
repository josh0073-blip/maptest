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

  return {
    collectTags,
    getDefaultName,
    readLibrary,
    writeLibrary,
  };
}
