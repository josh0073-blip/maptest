/**
 * Unit test for collision geometry in vendor-list-tools.refreshClusterState
 * Loads the file into a jsdom environment and verifies rotated-box intersections
 */

// polyfill TextEncoder/TextDecoder for jsdom usage
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

require('../../vendor-list-tools.js');

// vendor-list-tools attaches `createVendorListTools` to window (jest jsdom provides window/document)
describe('collision geometry (rotation-aware OBB)', () => {
  let container;
  let tools;

  beforeEach(() => {
    // create a minimal DOM container
    container = document.createElement('div');
    container.id = 'pins';
    document.body.appendChild(container);

    // create dummy pins for vendor ids 1..3
    for (let i = 1; i <= 3; i++) {
      const pin = document.createElement('div');
      pin.className = 'vendor-pin';
      pin.dataset.id = String(i);
      // give measurable dimensions via inline style
      pin.style.width = '80px';
      pin.style.height = '28px';
      // create label child
      const label = document.createElement('div');
      label.className = 'label';
      pin.appendChild(label);
      container.appendChild(pin);
    }

    // placeholder vendors variable used by getVendors closure
    vendors = [];

    tools = window.createVendorListTools({
      pinsContainer: container,
      vendorList: document.createElement('div'),
      congestionKeyPanel: null,
      congestionKeyList: null,
      mapCongestionKeyPanel: null,
      mapCongestionKeyList: null,
      isCongestionModeEnabled: function () { return true; },
      getVendors: () => vendors,
      getVendorCategories: () => [],
      getBackgroundScale: () => 1
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('detects overlap for rotated boxes that should intersect', () => {
    // vendors arranged so 1 and 2 overlap when rotated
    vendors = [
      { id: 1, name: 'A', x: 100, y: 100, rotation: 30, size: 1, height: 1 },
      { id: 2, name: 'B', x: 120, y: 110, rotation: -15, size: 1, height: 1 },
      { id: 3, name: 'C', x: 400, y: 400, rotation: 0, size: 1, height: 1 }
    ];

    // updateClusters will set vendor.clustered
    tools.updateClusters();

    expect(vendors[0].clustered).toBe(true);
    expect(vendors[1].clustered).toBe(true);
    expect(vendors[2].clustered).toBe(false);
  });

  it('does not mark non-overlapping rotated boxes as clustered', () => {
    vendors = [
      { id: 1, name: 'A', x: 50, y: 50, rotation: 45, size: 1, height: 1 },
      { id: 2, name: 'B', x: 300, y: 300, rotation: 45, size: 1, height: 1 }
    ];

    tools.updateClusters();

    expect(vendors[0].clustered).toBe(false);
    expect(vendors[1].clustered).toBe(false);
  });
});
