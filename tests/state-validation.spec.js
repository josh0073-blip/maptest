const { test, expect } = require('@playwright/test');
const path = require('path');

function appUrl() {
  const fullPath = path.resolve(__dirname, '..', 'index.html');
  return 'file:///' + fullPath.replace(/\\/g, '/');
}

test.beforeEach(async ({ page }) => {
  await page.goto(appUrl(), { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'domcontentloaded' });
});

test('normalizeMapState rejects unsafe background URL and normalizes vendors', async ({ page }) => {
  const result = await page.evaluate(() => {
    const input = {
      nextId: '7',
      vendors: [{ id: '3', name: '<Bad&Name>', x: '50', y: '60', rotation: '370', size: '10' }],
      vendorCategories: [{ id: 1, name: 'Veg', color: '#16a34a' }],
      vendorTemplates: [{ id: 1, name: 'T', active: 'true' }],
      backgroundUrl: 'javascript:alert(1)'
    };
    return window.normalizeMapState(input, {});
  });

  expect(result).toBeTruthy();
  expect(result.vendors && result.vendors.length).toBe(1);
  expect(result.vendors[0].name).not.toContain('<');
  expect(result.vendors[0].rotation).toBe(10); // 370 % 360 = 10
  expect(result.backgroundUrl).toBe('');
});
