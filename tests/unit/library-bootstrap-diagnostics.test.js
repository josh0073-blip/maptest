/** @jest-environment jsdom */

require('../../library-state.js');

describe('library bootstrap diagnostics', function () {
  test('reports missing bootstrap assets when folders are empty in tests', function () {
    const diagnostics = window.getLibraryBootstrapDiagnostics();

    expect(diagnostics).toHaveProperty('backgroundCount', 0);
    expect(diagnostics).toHaveProperty('vendorListCount', 0);
    expect(diagnostics.healthy).toBe(false);
    expect(diagnostics.issues.join(' ')).toMatch(/bootstrap background images/i);
    expect(diagnostics.issues.join(' ')).toMatch(/bootstrap vendor list CSV files/i);
  });
});