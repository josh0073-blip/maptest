import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { registerSW } from 'virtual:pwa-register';

window.html2canvas = html2canvas;
window.jspdf = { jsPDF };
window.jsPDF = jsPDF;
const ENABLE_SERVICE_WORKER = import.meta.env.PROD;
const STARTUP_TIMEOUT_MS = 8000;
const RUN_LEGACY_OFFLINE_CLEANUP = false;

let startupComplete = false;
let startupWatchdogId = null;

function logAppEvent(level, message, details) {
  if (typeof window.appLogEvent === 'function') {
    try {
      window.appLogEvent(level, message, details);
    } catch (error) {
      console.warn('Telemetry logging failed.', error);
    }
  }
}

function showStartupError(error) {
  const message = error && error.stack ? error.stack : String(error && error.message ? error.message : error || 'Unknown startup error');
  console.error('Startup failed.', error);
  logAppEvent('error', message, { source: 'startup', error: error || null });

  if (!document || !document.body) {
    return;
  }

  document.body.innerHTML = '';
  const overlay = document.createElement('div');
  overlay.style.minHeight = '100vh';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '24px';
  overlay.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
  overlay.style.color = '#e2e8f0';
  overlay.style.fontFamily = 'system-ui, sans-serif';

  const panel = document.createElement('pre');
  panel.style.maxWidth = '900px';
  panel.style.width = '100%';
  panel.style.whiteSpace = 'pre-wrap';
  panel.style.wordBreak = 'break-word';
  panel.style.background = 'rgba(15, 23, 42, 0.92)';
  panel.style.border = '1px solid rgba(148, 163, 184, 0.4)';
  panel.style.borderRadius = '16px';
  panel.style.padding = '24px';
  panel.style.boxShadow = '0 24px 80px rgba(15, 23, 42, 0.35)';
  panel.textContent = 'The app failed to start.\n\n' + message;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

window.addEventListener('error', (event) => {
  showStartupError(event && (event.error || event.message || event));
});

window.addEventListener('unhandledrejection', (event) => {
  showStartupError(event && event.reason ? event.reason : event);
});

startupWatchdogId = window.setTimeout(() => {
  if (!startupComplete) {
    showStartupError(new Error('Startup timed out before initialization completed.'));
  }
}, STARTUP_TIMEOUT_MS);

async function bootstrapLegacyModules() {
  await import('../export.js');
  await import('../templates.js');
  await import('../drag.js');
  await import('../confirm-dialog.js');
  await import('../input-dialog.js');
  await import('../state-validation.js');
  await import('../app-state.js');
  await import('../panzoom.js');
  await import('../selection.js');
  await import('../persistence.js');
  await import('../history-manager.js');
  await import('../state-checkpoint-manager.js');
  await import('../archive-storage.js');
  await import('../snapshot-archive-manager.js');
  await import('../vendor-list-tools.js');
  await import('../pin-style-tools.js');
  await import('../pin-manager.js');
  await import('../event-listeners.js');
  await import('../app-bootstrap.js');
  await import('../notify-tools.js');
  await import('../snapshot-tools.js');
  await import('../library-state.js');
  await import('../snapshot-archive-controller.js');
  await import('../storage-sync.js');
  await import('../script.js');
}

function notifyUpdate(message) {
  const runtimeNotify = window.appNotify;
  if (runtimeNotify && typeof runtimeNotify.info === 'function') {
    runtimeNotify.info(message);
    return;
  }
  console.info(message);
}

function reportBootstrapDiagnostics() {
  if (typeof window.reportLibraryBootstrapDiagnostics !== 'function') {
    return;
  }

  try {
    window.reportLibraryBootstrapDiagnostics(window.appNotify);
  } catch (error) {
    console.warn('Bootstrap diagnostics check failed.', error);
  }
}

async function checkStoragePressure() {
  if (typeof navigator === 'undefined' || !navigator.storage || typeof navigator.storage.estimate !== 'function') {
    return;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = Number(estimate && estimate.usage);
    const quota = Number(estimate && estimate.quota);
    if (!Number.isFinite(usage) || !Number.isFinite(quota) || quota <= 0) {
      return;
    }

    const pressure = usage / quota;
    if (pressure < 0.85) {
      return;
    }

    const usageMb = (usage / 1048576).toFixed(1);
    const quotaMb = (quota / 1048576).toFixed(1);
    const message = `Browser storage is nearing capacity (${usageMb} MB of ${quotaMb} MB used). Export a backup and clear old archives if saves start failing.`;
    const runtimeNotify = window.appNotify;
    if (runtimeNotify && typeof runtimeNotify.warn === 'function') {
      runtimeNotify.warn(message);
    } else {
      console.warn(message);
    }
    logAppEvent('warn', message, { source: 'storage-pressure', usage: usage, quota: quota });
  } catch (error) {
    console.warn('Storage pressure check failed.', error);
    logAppEvent('warn', 'Storage pressure check failed.', { source: 'storage-pressure', error: error || null });
  }
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    registerSW({
      immediate: true,
      onRegisteredSW() {
        notifyUpdate('Offline support is enabled for this app.');
      },
      onOfflineReady() {
        notifyUpdate('App shell is ready for offline use.');
      },
      onRegisterError(error) {
        console.warn('Service worker registration failed.', error);
        logAppEvent('error', 'Service worker registration failed.', { source: 'service-worker', error: error || null });
      }
    });
  } catch (error) {
    console.warn('Service worker registration failed.', error);
    logAppEvent('error', 'Service worker registration failed.', { source: 'service-worker', error: error || null });
  }
}

async function cleanupLegacyOfflineState() {
  if (!RUN_LEGACY_OFFLINE_CLEANUP) {
    return;
  }

  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(async (registration) => {
      const scriptUrl = registration && registration.active && registration.active.scriptURL
        ? registration.active.scriptURL
        : '';
      if (!scriptUrl || scriptUrl.endsWith('/sw.js')) {
        await registration.unregister();
      }
    }));
  } catch (error) {
    console.warn('Legacy service worker cleanup failed.', error);
    logAppEvent('warn', 'Legacy service worker cleanup failed.', { source: 'cleanup', error: error || null });
  }

  if (!('caches' in window)) {
    return;
  }

  try {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map(async (cacheKey) => {
      if (cacheKey.startsWith('fm-vendor-map-shell-')) {
        await caches.delete(cacheKey);
      }
    }));
  } catch (error) {
    console.warn('Legacy cache cleanup failed.', error);
    logAppEvent('warn', 'Legacy cache cleanup failed.', { source: 'cleanup', error: error || null });
  }
}

cleanupLegacyOfflineState()
  .then(() => bootstrapLegacyModules())
  .then(() => {
    reportBootstrapDiagnostics();
    void checkStoragePressure();
    if (startupWatchdogId !== null) {
      window.clearTimeout(startupWatchdogId);
      startupWatchdogId = null;
    }
    if (ENABLE_SERVICE_WORKER) {
      registerServiceWorker();
    }
    startupComplete = true;
  })
  .catch((error) => {
    showStartupError(error);
  });