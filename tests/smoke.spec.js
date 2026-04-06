const { test, expect } = require('@playwright/test');
const path = require('path');

function appUrl() {
  const fullPath = path.resolve(__dirname, '..', 'index.html');
  return 'file:///' + fullPath.replace(/\\/g, '/');
}

function distance(a, b) {
  const dx = (a.x || 0) - (b.x || 0);
  const dy = (a.y || 0) - (b.y || 0);
  return Math.sqrt(dx * dx + dy * dy);
}

async function acceptConfirm(page) {
  const root = page.locator('#confirm-dialog-root');
  await expect(root).toBeVisible();
  await root.locator('.confirm-accept').click();
}

async function acceptInput(page, value) {
  const root = page.locator('#input-dialog-root');
  await expect(root).toBeVisible();
  await root.locator('.input-field').fill(value);
  await root.locator('.input-accept').click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      value: undefined
    });
  });
  await page.goto(appUrl(), { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.evaluate(async () => {
    if (!window.indexedDB) return;
    await new Promise((resolve) => {
      const request = indexedDB.deleteDatabase('farmersMarketArchiveDB');
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  });
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Controls are inside <details>; open them so visibility checks reflect test intent.
  await page.evaluate(() => {
    document.querySelectorAll('details.control-group').forEach((group) => {
      group.open = true;
    });
  });

  const firstRunDismiss = page.locator('#first-run-dismiss');
  if (await firstRunDismiss.isVisible().catch(() => false)) {
    await firstRunDismiss.click();
  }

  await expect(page.locator('#self-check-run-btn')).toBeVisible();
  await expect(page.locator('#add-vendor')).toBeVisible();
});

test('loads app shell and self-check panel', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('Vendor Map Editor');
  await expect(page.locator('#self-check-run-btn')).toBeVisible();
  await expect(page.locator('#self-check-results')).toContainText('Health Check');
});

test('add vendor then undo/redo', async ({ page }) => {
  const pins = page.locator('.vendor-pin');
  await expect(pins).toHaveCount(0);

  await page.locator('#add-vendor').click();
  await expect(pins).toHaveCount(1);

  await page.locator('#undo-btn').click();
  await expect(pins).toHaveCount(0);

  await page.locator('#redo-btn').click();
  await expect(pins).toHaveCount(1);
});

test('interleaved undo/redo keeps snapshots coherent', async ({ page }) => {
  const pins = page.locator('.vendor-pin');
  const title = page.locator('#mapTitle');

  await expect(pins).toHaveCount(0);
  await expect(title).toContainText('Farmers Market Vendor Map');

  await page.locator('#add-vendor').click();
  await expect(pins).toHaveCount(1);

  await page.evaluate(() => {
    const titleEl = document.getElementById('mapTitle');
    if (!titleEl) return;
    titleEl.textContent = 'Weekend Market';
    titleEl.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(title).toContainText('Weekend Market');

  await page.locator('#undo-btn').click();
  await expect(title).toContainText('Farmers Market Vendor Map');
  await expect(pins).toHaveCount(1);

  await page.locator('#undo-btn').click();
  await expect(pins).toHaveCount(0);

  await page.locator('#redo-btn').click();
  await expect(pins).toHaveCount(1);
  await expect(title).toContainText('Farmers Market Vendor Map');

  await page.locator('#redo-btn').click();
  await expect(title).toContainText('Weekend Market');
  await expect(pins).toHaveCount(1);

  await page.locator('#undo-btn').click();
  await expect(title).toContainText('Farmers Market Vendor Map');

  await page.locator('#add-vendor').click();
  await expect(pins).toHaveCount(2);

  await expect(page.locator('#redo-btn')).toBeDisabled();
  await expect(pins).toHaveCount(2);
  await expect(title).toContainText('Farmers Market Vendor Map');
});

test('dragging a pin is reversible with undo/redo', async ({ page }) => {
  await page.locator('#add-vendor').click();
  const pin = page.locator('.vendor-pin').first();
  await expect(pin).toBeVisible();

  const start = await pin.boundingBox();
  expect(start).toBeTruthy();

  const dragStartX = start.x + 4;
  const dragStartY = start.y + 4;

  await page.mouse.move(dragStartX, dragStartY);
  await page.mouse.down();
  await page.mouse.move(dragStartX + 120, dragStartY + 70, { steps: 8 });
  await page.mouse.up();

  const moved = await pin.boundingBox();
  expect(moved).toBeTruthy();
  expect(distance(moved, start)).toBeGreaterThan(20);

  await page.locator('#undo-btn').click();
  const undone = await pin.boundingBox();
  expect(undone).toBeTruthy();
  expect(distance(undone, start)).toBeLessThan(10);

  await page.locator('#redo-btn').click();
  const redone = await pin.boundingBox();
  expect(redone).toBeTruthy();
  expect(distance(redone, moved)).toBeLessThan(10);
});

test('double-clicking pin label enables inline editing', async ({ page }) => {
  await page.locator('#add-vendor').click();
  const label = page.locator('.vendor-pin .label').first();

  await label.dblclick();
  await expect(label).toBeEditable();

  await page.keyboard.press('Control+a');
  await page.keyboard.type('Edited <Vendor> & Co.');
  await page.keyboard.press('Enter');

  await expect(label).toContainText('Edited');
  await expect(label).toContainText('Vendor');
  await expect(label).toContainText('Co.');
  await expect(label).not.toContainText('<');
  await expect(label).not.toContainText('&');
  await expect(page.locator('#template-list')).toContainText('Edited');
  await expect(page.locator('#template-list')).toContainText('Vendor');
  await expect(page.locator('#template-list')).toContainText('Co.');
});

test('template toggle interleaving clears redo after new commit', async ({ page }) => {
  const pins = page.locator('.vendor-pin');
  const firstTemplateToggle = page.locator('#template-list .template-item input[type="checkbox"]').first();

  await expect(pins).toHaveCount(0);
  await firstTemplateToggle.check();
  await expect(pins).toHaveCount(1);

  await page.locator('#undo-btn').click();
  await expect(pins).toHaveCount(0);

  await page.locator('#redo-btn').click();
  await expect(pins).toHaveCount(1);

  await page.locator('#undo-btn').click();
  await expect(pins).toHaveCount(0);

  await page.locator('#add-vendor').click();
  await expect(pins).toHaveCount(1);

  await expect(page.locator('#redo-btn')).toBeDisabled();
  await expect(pins).toHaveCount(1);
});

test('vendor list library save and load', async ({ page }) => {
  await page.locator('#vendor-lib-save-btn').click();
  await expect(page.locator('#vendor-lib-select option')).toHaveCount(1);

  await page.locator('#vendor-lib-load-mode').selectOption('replace');
  await page.locator('#vendor-lib-load-btn').click();

  await expect(page.locator('#template-list .template-item')).toHaveCount(3);
});

test('undo/redo remains coherent across save and load interleaving', async ({ page }) => {
  const pins = page.locator('.vendor-pin');
  const title = page.locator('#mapTitle');
  const firstTemplateToggle = page.locator('#template-list .template-item input[type="checkbox"]').first();

  await page.locator('#add-vendor').click();
  await expect(pins).toHaveCount(1);

  await page.evaluate(() => {
    const titleEl = document.getElementById('mapTitle');
    if (!titleEl) return;
    titleEl.textContent = 'Harvest Market';
    titleEl.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(title).toContainText('Harvest Market');

  await firstTemplateToggle.check();
  await expect(pins).toHaveCount(2);

  await page.locator('#save-state').click();

  await page.evaluate(() => {
    const titleEl = document.getElementById('mapTitle');
    if (!titleEl) return;
    titleEl.textContent = 'Temporary Draft';
  });
  await expect(title).toContainText('Temporary Draft');

  await page.locator('#load-state').click();
  await expect(title).toContainText('Harvest Market');
  await expect(pins).toHaveCount(2);

  await page.locator('#undo-btn').click();
  await expect(pins).toHaveCount(1);
  await expect(title).toContainText('Harvest Market');

  await page.locator('#undo-btn').click();
  await expect(title).toContainText('Farmers Market Vendor Map');
  await expect(pins).toHaveCount(1);

  await page.locator('#redo-btn').click();
  await expect(title).toContainText('Harvest Market');
  await expect(pins).toHaveCount(1);

  await page.locator('#redo-btn').click();
  await expect(pins).toHaveCount(2);
});

test('library storage write failures warn without breaking the editor', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(Storage.prototype, 'setItem', {
      configurable: true,
      value: function () {
        throw new Error('QuotaExceededError');
      }
    });
  });

  await page.locator('#vendor-lib-save-btn').click();
  await expect(page.locator('#toast-container .toast').last()).toHaveText(/Library storage is unavailable or full/i);

  await page.locator('#add-vendor').click();
  await expect(page.locator('.vendor-pin')).toHaveCount(1);
});

test('manual template add from input works and dedupes', async ({ page }) => {
  const templates = page.locator('#template-list .template-item');
  await expect(templates).toHaveCount(3);

  await page.locator('#template-name-input').fill('Fruit Stand');
  await page.locator('#template-add-btn').click();
  await expect(templates).toHaveCount(4);
  await expect(page.locator('#template-list')).toContainText('Fruit Stand');

  await page.locator('#template-name-input').fill('fruit stand');
  await page.locator('#template-add-btn').click();
  await expect(templates).toHaveCount(4);
  await expect(page.locator('#toast-container')).toContainText('already exists');
});

test('pin category assignment persists through save and load', async ({ page }) => {
  await page.locator('#add-vendor').click();
  const pin = page.locator('.vendor-pin').first();
  await pin.click();

  await page.locator('#pin-category-picker').selectOption('2');
  await expect(pin).toHaveAttribute('data-category-id', '2');

  await page.locator('#save-state').click();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.vendor-pin')).toHaveCount(1);
  await expect(page.locator('.vendor-pin').first()).toHaveAttribute('data-category-id', '2');
});

test('pin category stripe color survives status changes', async ({ page }) => {
  await page.locator('#add-vendor').click();
  const pin = page.locator('.vendor-pin').first();
  await pin.click();

  await page.locator('#pin-category-picker').selectOption('2');
  const mapBox = await page.locator('#mapContent').boundingBox();
  expect(mapBox).toBeTruthy();
  await page.mouse.click(mapBox.x + mapBox.width - 10, mapBox.y + 10);

  const categoryBorderBefore = await pin.evaluate((element) => getComputedStyle(element).borderLeftColor);
  const statusBorderBefore = await pin.evaluate((element) => getComputedStyle(element).borderTopColor);

  await pin.dispatchEvent('contextmenu', { bubbles: true, cancelable: true });
  await expect(pin).toHaveClass(/status-standby/);

  const categoryBorderAfterStandby = await pin.evaluate((element) => getComputedStyle(element).borderLeftColor);
  const statusBorderAfterStandby = await pin.evaluate((element) => getComputedStyle(element).borderTopColor);

  await pin.dispatchEvent('contextmenu', { bubbles: true, cancelable: true });
  await expect(pin).toHaveClass(/status-alert/);

  const categoryBorderAfterAlert = await pin.evaluate((element) => getComputedStyle(element).borderLeftColor);

  expect(categoryBorderBefore).toBe(categoryBorderAfterStandby);
  expect(categoryBorderBefore).toBe(categoryBorderAfterAlert);
  expect(statusBorderBefore).not.toBe(statusBorderAfterStandby);
});

test('corrupt saved map payload is rejected without breaking interaction', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('farmersMarketVendorMapState', JSON.stringify({
      nextId: 1,
      vendors: 'oops-not-an-array',
      vendorTemplates: [],
      vendorCategories: []
    }));
  });

  await page.locator('#load-state').click();
  await expect(page.locator('#toast-container')).toContainText('format is invalid');

  await page.locator('#add-vendor').click();
  await expect(page.locator('.vendor-pin')).toHaveCount(1);
});

test('category manager can add and delete categories', async ({ page }) => {
  await expect(page.locator('#pin-category-picker option')).toHaveCount(4);

  await page.locator('#category-name-input').fill('Flower Grower');
  await page.locator('#category-color-input').fill('#a21caf');
  await page.locator('#category-add-btn').click();

  await expect(page.locator('#pin-category-picker')).toContainText('Flower Grower');
  await page.locator('#add-vendor').click();
  const pin = page.locator('.vendor-pin').first();
  await pin.click();

  await page.locator('#pin-category-picker').selectOption({ label: 'Flower Grower' });
  await expect(pin).toHaveAttribute('data-category-id', '4');

  await page.locator('#category-color-input').fill('#be123c');
  await page.locator('#category-color-update-btn').click();
  await expect(pin).toHaveAttribute('style', /--pin-category-color:\s*#be123c/i);

  await page.locator('#category-manage-select').selectOption('4');
  await page.locator('#category-delete-btn').click();
  await acceptConfirm(page);

  await expect(pin).not.toHaveAttribute('data-category-id', '4');
  await expect(page.locator('#pin-category-picker')).not.toContainText('Flower Grower');
});

test('category display toggle hides category stripe visuals', async ({ page }) => {
  await page.locator('#add-vendor').click();
  const pin = page.locator('.vendor-pin').first();
  await pin.click();
  await page.locator('#pin-category-picker').selectOption('2');

  await expect(page.locator('body')).not.toHaveClass(/hide-pin-categories/);
  await page.locator('#toggle-pin-category-display').click();
  await expect(page.locator('body')).toHaveClass(/hide-pin-categories/);
  await expect(page.locator('#toggle-pin-category-display')).toContainText('Show Category Display');

  await page.locator('#toggle-pin-category-display').click();
  await expect(page.locator('body')).not.toHaveClass(/hide-pin-categories/);
  await expect(page.locator('#toggle-pin-category-display')).toContainText('Hide Category Display');
});

test('vendor list benchmark helper handles 100+ vendors', async ({ page }) => {
  const result = await page.evaluate(() => {
    if (typeof window.benchmarkVendorListUpdate !== 'function') {
      throw new Error('benchmarkVendorListUpdate is not available');
    }
    return window.benchmarkVendorListUpdate(120);
  });

  expect(result.vendorCount).toBe(120);
  expect(result.clusteredCount).toBeGreaterThan(0);
  expect(result.durationMs).toBeGreaterThanOrEqual(0);
});

test('invalid snapshot map payload is rejected without overwriting state', async ({ page }) => {
  await page.locator('#add-vendor').click();
  await expect(page.locator('.vendor-pin')).toHaveCount(1);

  const invalidSnapshot = JSON.stringify({
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    mapState: {
      vendors: 'not-array',
      vendorTemplates: [],
      vendorCategories: []
    }
  });

  await page.locator('#snapshot-import-input').setInputFiles({
    name: 'bad-snapshot.json',
    mimeType: 'application/json',
    buffer: Buffer.from(invalidSnapshot)
  });

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#snapshot-restore-btn').click();

  await expect(page.locator('#toast-container')).toContainText('format is invalid');
  await expect(page.locator('.vendor-pin')).toHaveCount(1);
});

test('background URL validation rejects unsafe schemes', async ({ page }) => {
  await page.locator('#bg-url-input').fill('javascript:alert(1)');
  await page.locator('#bg-url-btn').click();

  await expect(page.locator('#toast-container')).toContainText('valid image URL');
  const cssVar = await page.evaluate(() => {
    return getComputedStyle(document.documentElement).getPropertyValue('--bg-url');
  });
  expect(String(cssVar || '').toLowerCase()).not.toContain('javascript:');
});

test('manual self-check run reports result lines', async ({ page }) => {
  await page.locator('#self-check-run-btn').click();
  const resultRows = page.locator('#self-check-results .self-check-list li');
  await expect(resultRows).toHaveCount(5);
  await expect(resultRows).toContainText([
    'Map state serialization/normalization',
    'Library structure integrity',
    'Template-linked pin references',
    'Undo/redo stack bounds',
    'localStorage read/write access'
  ]);
  await expect(page.locator('#self-check-results')).toContainText('PASSED');
});

test('storage sync listener warns when another tab changes the map', async ({ page }) => {
  await page.evaluate(() => {
    window.__lastRemoteStorageChange = null;
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'farmersMarketVendorMapState',
      oldValue: '{}',
      newValue: '{"nextId":2}',
      url: location.href,
      storageArea: localStorage
    }));
  });

  await expect(page.locator('body')).toHaveClass(/storage-sync-stale/);
  await expect(page.locator('#toast-container')).toContainText('changed in another tab');
  const remoteChange = await page.evaluate(() => window.__lastRemoteStorageChange);
  expect(remoteChange).toMatchObject({
    key: 'farmersMarketVendorMapState',
    oldValue: '{}',
    newValue: '{"nextId":2}'
  });
});

test('sidebar keyboard flow restores focus on close', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 });
  const toggle = page.locator('.sidebar-toggle');
  const sidebar = page.locator('.sidebar');

  await toggle.click();
  await expect(sidebar).toHaveClass(/open/);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');

  await page.keyboard.press('Escape');
  await expect(sidebar).not.toHaveClass(/open/);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
});

test('snapshot archive retention caps at the configured limit', async ({ page }) => {
  await page.evaluate(() => {
    const seed = [];
    for (let index = 0; index < 120; index++) {
      seed.push({
        id: `snap-seed-${index + 1}`,
        name: `Seed Snapshot ${index + 1}`,
        createdAt: new Date(Date.UTC(2026, 3, 1, 12, 0, index % 60)).toISOString(),
        snapshot: {
          schemaVersion: 1,
          createdAt: new Date(Date.UTC(2026, 3, 1, 12, 0, index % 60)).toISOString(),
          reason: 'seed',
          mapState: {
            nextId: 1,
            vendors: [],
            vendorCategories: [],
            vendorTemplates: [],
            backgroundUrl: '',
            backgroundScale: 1,
            backgroundOpacity: 1,
            backgroundScaleLocked: false,
            mapTitleText: 'Farmers Market Vendor Map',
            pinCategoryDisplayVisible: true
          }
        },
        tags: ['seed'],
        branchFromId: ''
      });
    }
    localStorage.setItem('farmersMarketSnapshotArchiveLibrary', JSON.stringify(seed));
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    document.querySelectorAll('details.control-group').forEach((group) => {
      group.open = true;
    });
  });

  await expect(page.locator('#snapshot-archive-select option')).toHaveCount(120);

  await page.locator('#snapshot-archive-name-input').fill('Overflow Snapshot');
  await page.locator('#snapshot-archive-save-btn').click();

  await expect(page.locator('#snapshot-archive-select option')).toHaveCount(120);
  await expect(page.locator('#snapshot-archive-select')).toContainText('Overflow Snapshot');
  await expect(page.locator('#snapshot-archive-select')).not.toContainText('Seed Snapshot 120');
});

test('snapshot archive filtering rename duplicate delete and restore', async ({ page }) => {
  const title = page.locator('#mapTitle');

  await page.locator('#add-vendor').click();
  await title.evaluate((element) => {
    element.textContent = 'Archive Market';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await page.locator('#snapshot-archive-name-input').fill('Opening Snapshot');
  await page.locator('#snapshot-archive-event-tag-input').fill('Opening Day');
  await page.locator('#snapshot-archive-save-btn').click();

  await expect(page.locator('#snapshot-archive-select option')).toHaveCount(1);

  const originalId = await page.locator('#snapshot-archive-select option').first().evaluate((option) => option.value);

  await page.locator('#snapshot-archive-select').selectOption({ value: originalId });

  await page.locator('#snapshot-archive-name-input').fill('Renamed Snapshot');
  await page.locator('#snapshot-archive-rename-btn').click();
  await expect(page.locator('#snapshot-archive-select')).toContainText('Renamed Snapshot');

  await page.locator('#snapshot-archive-duplicate-btn').click();
  await expect(page.locator('#snapshot-archive-select option')).toHaveCount(2);
  await expect(page.locator('#snapshot-archive-select')).toContainText('Branch');

  const today = await page.evaluate(() => new Date().toISOString().slice(0, 10));
  const tomorrow = await page.evaluate(() => {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay.toISOString().slice(0, 10);
  });

  await page.locator('#snapshot-archive-date-from').fill(tomorrow);
  await expect(page.locator('#snapshot-archive-select')).toContainText('No snapshots match current filters');

  await page.locator('#snapshot-archive-filter-clear-btn').click();
  await page.locator('#snapshot-archive-date-from').fill(today);
  await expect(page.locator('#snapshot-archive-select option')).toHaveCount(2);

  await page.locator('#snapshot-archive-search-input').fill('branch');
  await expect(page.locator('#snapshot-archive-select option')).toHaveCount(1);
  await page.locator('#snapshot-archive-filter-clear-btn').click();

  await page.locator('#snapshot-archive-select').selectOption({ value: originalId });
  await page.locator('#snapshot-archive-delete-btn').click();
  await acceptConfirm(page);
  await expect(page.locator('#snapshot-archive-select option')).toHaveCount(1);
  await expect(page.locator('#snapshot-archive-select')).toContainText('Branch');

  await title.evaluate((element) => {
    element.textContent = 'Changed After Archive';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(title).toContainText('Changed After Archive');

  await page.locator('#snapshot-archive-restore-btn').click();
  await acceptConfirm(page);
  await expect(title).toContainText('Archive Market');
  await expect(page.locator('.vendor-pin')).toHaveCount(1);
});

test('mobile sidebar toggle updates aria state and Escape closes', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 });
  const toggle = page.locator('.sidebar-toggle');
  const sidebar = page.locator('.sidebar');

  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(sidebar).toHaveClass(/open/);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');

  await page.keyboard.press('Escape');
  await expect(sidebar).not.toHaveClass(/open/);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('touch drag works on small viewport and is undoable', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });

  await page.locator('.sidebar-toggle').click();

  await page.locator('#add-vendor').click();
  const pin = page.locator('.vendor-pin').first();
  await expect(pin).toBeVisible();

  const start = await pin.boundingBox();
  expect(start).toBeTruthy();

  await page.evaluate((coords) => {
    const pinEl = document.querySelector('.vendor-pin');
    if (!pinEl) throw new Error('Pin element not found');

    const fire = (type, x, y) => {
      pinEl.dispatchEvent(new PointerEvent(type, {
        pointerId: 7,
        pointerType: 'touch',
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y
      }));
    };

    fire('pointerdown', coords.startX, coords.startY);
    fire('pointermove', coords.endX, coords.endY);
    fire('pointerup', coords.endX, coords.endY);
  }, {
    startX: start.x + start.width / 2,
    startY: start.y + start.height / 2,
    endX: start.x + start.width / 2 + 110,
    endY: start.y + start.height / 2 + 60
  });

  const moved = await pin.boundingBox();
  expect(moved).toBeTruthy();
  expect(distance(moved, start)).toBeGreaterThan(20);

  await page.locator('#undo-btn').click();
  const undone = await pin.boundingBox();
  expect(undone).toBeTruthy();
  expect(distance(undone, start)).toBeLessThan(10);
});

test('csv import dedupes existing names and parses quoted values', async ({ page }) => {
  const csvText = 'name\nTomato Stand\n"Fresh, Farm"\nBakery\n"Fresh, Farm"\n';
  await page.locator('#csv-file-input').setInputFiles({
    name: 'vendors.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvText)
  });

  await page.locator('#csv-upload-btn').click();

  const templates = page.locator('#template-list .template-item');
  await expect(templates).toHaveCount(4);
  await expect(page.locator('#template-list')).toContainText('Fresh, Farm');
  await expect(page.locator('#toast-container .toast').last()).toContainText('duplicate or unsafe names skipped');
});

test('validate CSV content for duplicates and unsafe characters', async ({ page }) => {
  const csvText = 'name\nTomato Stand\n"Fresh, Farm"\nBakery\n"<script>"\n';
  await page.locator('#csv-file-input').setInputFiles({
    name: 'unsafe-vendors.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvText)
  });

  await page.locator('#csv-upload-btn').click();

  const templates = page.locator('#template-list .template-item');
  await expect(templates).toHaveCount(4);
  await expect(page.locator('#template-list')).toContainText('Fresh, Farm');
  await expect(page.locator('#template-list')).not.toContainText('<script>');
  await expect(page.locator('#toast-container')).toContainText('unsafe names skipped');
});

test('undo/redo guards prevent invalid operations', async ({ page }) => {
  await expect(page.locator('#undo-btn')).toBeDisabled();
  await expect(page.locator('#redo-btn')).toBeDisabled();
  await expect(page.locator('.vendor-pin')).toHaveCount(0);
});

test('template CRUD operations', async ({ page }) => {
  const templates = page.locator('#template-list .template-item');
  await expect(templates).toHaveCount(3);

  await page.locator('#add-vendor').click();
  await expect(templates).toHaveCount(4);

  await page.locator('#template-list .template-item span').first().dblclick();
  await acceptInput(page, 'Updated <Template> & Name');
  await expect(page.locator('#template-list')).toContainText('Updated Template Name');
  await expect(page.locator('#template-list')).not.toContainText('<Template>');
  await expect(page.locator('#template-list')).not.toContainText('&');

  await page.locator('#template-list .template-item .template-remove').last().click();
  await expect(templates).toHaveCount(3);
});

test('enhanced CSV import', async ({ page }) => {
  const csvText = 'name,active\nTemplate C,true\nTemplate D,false';
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#vendor-lib-import-input').setInputFiles({
    name: 'vendor-library.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvText)
  });

  await expect(page.locator('#vendor-lib-select option')).toHaveCount(1);
  await page.locator('#vendor-lib-load-mode').selectOption('replace');
  await page.locator('#vendor-lib-load-btn').click();

  await expect(page.locator('#template-list')).toContainText('Template C');
  await expect(page.locator('#template-list')).toContainText('Template D');
});

test('export buttons invoke JPG and PDF pipelines', async ({ page }) => {
  await page.evaluate(() => {
    window.__exportTestCalls = { links: [], pdfs: [] };

    window.html2canvas = async () => ({
      width: 800,
      height: 600,
      toDataURL: () => 'data:image/jpeg;base64,export-test'
    });

    window.jspdf = {
      jsPDF: class {
        constructor() {
          this.internal = {
            pageSize: {
              getWidth: () => 842,
              getHeight: () => 595
            }
          };
        }

        addImage() {
          window.__exportTestCalls.pdfs.push('addImage');
        }

        save(name) {
          window.__exportTestCalls.pdfs.push(name);
        }
      }
    };

    window.Image = class {
      constructor() {
        this.onload = null;
        this._src = '';
      }

      set src(value) {
        this._src = value;
        if (typeof this.onload === 'function') {
          setTimeout(() => this.onload(), 0);
        }
      }

      get src() {
        return this._src;
      }

      set onload(handler) {
        this._onload = handler;
        if (this._src && typeof handler === 'function') {
          setTimeout(() => handler(), 0);
        }
      }

      get onload() {
        return this._onload;
      }
    };

    HTMLAnchorElement.prototype.click = function () {
      window.__exportTestCalls.links.push({ href: this.href, download: this.download });
    };
  });
  await page.evaluate(() => {
    document.querySelectorAll('details.control-group').forEach((group) => {
      group.open = true;
    });
  });
  await page.locator('#export-jpg').click();
  await page.locator('#export-pdf').click();

  await expect.poll(async () => {
    return page.evaluate(() => window.__exportTestCalls);
  }).toMatchObject({
    links: [{ download: expect.stringMatching(/\.jpg$/i) }],
    pdfs: ['addImage', expect.stringMatching(/\.pdf$/i)]
  });
});
