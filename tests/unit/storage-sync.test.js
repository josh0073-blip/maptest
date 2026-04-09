/** @jest-environment jsdom */

require('../../storage-sync.js');

describe('storage sync merge behavior', function () {
  let originalAddEventListener;
  let originalRemoveEventListener;
  let storageListener;

  beforeEach(function () {
    localStorage.clear();
    storageListener = null;
    originalAddEventListener = window.addEventListener;
    originalRemoveEventListener = window.removeEventListener;

    window.addEventListener = function (type, listener, options) {
      if (type === 'storage') {
        storageListener = listener;
      }
      return originalAddEventListener.call(window, type, listener, options);
    };

    window.removeEventListener = function (type, listener, options) {
      if (type === 'storage' && storageListener === listener) {
        storageListener = null;
      }
      return originalRemoveEventListener.call(window, type, listener, options);
    };
  });

  afterEach(function () {
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
  });

  test('merges disjoint vendor ids from another tab', function () {
    const notify = {
      warn: jest.fn(),
      info: jest.fn()
    };
    const onRemoteChange = jest.fn();
    const tools = window.createStorageSyncTools({
      storageKey: 'farmersMarketVendorMapState',
      notify: notify,
      onRemoteChange: onRemoteChange
    });

    tools.bindStorageSyncListener();
    expect(storageListener).toEqual(expect.any(Function));

    localStorage.setItem('farmersMarketVendorMapState', JSON.stringify({
      vendors: [{ id: 1, name: 'Alpha' }],
      nextId: 2
    }));

    storageListener({
      key: 'farmersMarketVendorMapState',
      oldValue: null,
      newValue: JSON.stringify({
        vendors: [{ id: 2, name: 'Beta' }],
        nextId: 3
      }),
      url: 'https://example.test'
    });

    expect(onRemoteChange).toHaveBeenCalledTimes(1);
    expect(onRemoteChange.mock.calls[0][0]).toHaveProperty('mergedValue');
    expect(notify.info).toHaveBeenCalledWith('Merged remote changes from another tab.');
    expect(notify.warn).not.toHaveBeenCalled();

    const merged = JSON.parse(onRemoteChange.mock.calls[0][0].mergedValue);
    expect(merged.vendors.map(function (vendor) { return vendor.id; })).toEqual([1, 2]);
    expect(merged.nextId).toBe(3);

    tools.unbindStorageSyncListener();
  });

  test('warns instead of merging overlapping vendor ids', function () {
    const notify = {
      warn: jest.fn(),
      info: jest.fn()
    };
    const onRemoteChange = jest.fn();
    const tools = window.createStorageSyncTools({
      storageKey: 'farmersMarketVendorMapState',
      notify: notify,
      onRemoteChange: onRemoteChange
    });

    tools.bindStorageSyncListener();
    expect(storageListener).toEqual(expect.any(Function));

    localStorage.setItem('farmersMarketVendorMapState', JSON.stringify({
      vendors: [{ id: 1, name: 'Alpha' }],
      nextId: 2
    }));

    storageListener({
      key: 'farmersMarketVendorMapState',
      oldValue: null,
      newValue: JSON.stringify({
        vendors: [{ id: 1, name: 'Alpha from remote' }],
        nextId: 4
      }),
      url: 'https://example.test'
    });

    expect(onRemoteChange).toHaveBeenCalledTimes(1);
    expect(onRemoteChange.mock.calls[0][0]).not.toHaveProperty('mergedValue');
    expect(notify.info).not.toHaveBeenCalled();
    expect(notify.warn).toHaveBeenCalledWith('This map was changed in another tab. Reload to sync the latest version.');

    tools.unbindStorageSyncListener();
  });
});