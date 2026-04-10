const { test, expect } = require('@playwright/test');

function appUrl() {
  const configuredBaseUrl = process.env.SMOKE_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173/';
  return new URL('.', configuredBaseUrl).href;
}

test.beforeEach(async ({ page }) => {
  await page.goto(appUrl(), { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.normalizeMapState === 'function');
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

test('normalizeMapState rescales vendor positions when map canvas size changes', async ({ page }) => {
  const result = await page.evaluate(() => {
    const input = {
      vendors: [{ id: 1, name: 'A', x: 100, y: 50 }],
      mapCanvasWidth: 1000,
      mapCanvasHeight: 500
    };

    const defaults = {
      mapCanvasWidth: 1200,
      mapCanvasHeight: 600,
      vendorCategories: [],
      vendorTemplates: []
    };

    return window.normalizeMapState(input, defaults);
  });

  expect(result.vendors && result.vendors.length).toBe(1);
  expect(result.vendors[0].x).toBeCloseTo(120, 3);
  expect(result.vendors[0].y).toBeCloseTo(60, 3);
});
