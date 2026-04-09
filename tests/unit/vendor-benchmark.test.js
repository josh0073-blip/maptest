require('../../vendor-list-tools.js');

describe('vendor-list-tools benchmark', function () {
  test('benchmarkVendorListUpdate returns metrics for requested count', function () {
    const tools = window.createVendorListTools({
      vendorList: document.createElement('div'),
      getVendors: function () { return []; }
    });

    const result = tools.benchmarkVendorListUpdate(200);
    expect(result).toHaveProperty('vendorCount', 200);
    expect(typeof result.durationMs).toBe('number');
    expect(typeof result.clusteredCount).toBe('number');
  });
});
