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
        },
        {
          id: 152,
          name: 'Baby Leaf Farm',
          x: 390.5555555555555,
          y: 343.33333333333326,
          templateId: 3,
          status: 'normal',
          alignRefX: 'left',
          alignRefY: 'top',
          rotation: 45,
          size: 1,
          height: 1,
          clustered: false
        }
      ],
      vendorCategories: [
        { id: 1, name: 'Vegetable Farmer', color: '#16a34a' },
        { id: 2, name: 'Art Vendor', color: '#0284c7' },
        { id: 3, name: 'Prepared Food', color: '#ea580c' }
      ],
      vendorTemplates: [
        { id: 1, name: 'Tomato Stand', active: false },
        { id: 2, name: 'Bakery', active: false },
        { id: 3, name: 'Cheese', active: false }
      ],
      backgroundUrl: '',
      backgroundScale: 1,
      backgroundOpacity: 1,
      backgroundScaleLocked: false,
      mapTitleText: 'Farmers Market Vendor Map',
      pinCategoryDisplayVisible: true
    },
    tags: ['farmers', 'market'],
  }
];

export function createSnapshotArchiveManager(options) {
  const settings = options || {};
  const notify = settings.notify || { error: function () {} };
  const library = [...PRELOADED_SNAPSHOTS];

  function load() {
    console.log('Loading preloaded snapshots:', library);
    return library;
  }

  function restoreSnapshot(snapshot) {
    if (!snapshot) {
      notify.error('No snapshot provided for restoration.');
      return;
    }
    console.log('Restoring snapshot:', snapshot);
    // Add logic to handle the snapshot restoration
  }

  return {
    load,
    restoreSnapshot,
  };
}

if (typeof window !== 'undefined') {
  window.PRELOADED_SNAPSHOTS = PRELOADED_SNAPSHOTS;
  window.createSnapshotArchiveManager = createSnapshotArchiveManager;
}
