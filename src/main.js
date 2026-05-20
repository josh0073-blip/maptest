import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { registerSW } from 'virtual:pwa-register';

window.html2canvas = html2canvas;
window.jspdf = { jsPDF };
window.jsPDF = jsPDF;
// FAILURE POINT: If ENABLE_SERVICE_WORKER is true and the SW registration fails,
// app still loads normally — check DevTools > Application > Service Workers.
// If STARTUP_TIMEOUT_MS elapses before all modules load, showStartupError fires.
// Increase this value only as a last resort; a long timeout hides slow module loads.
const ENABLE_SERVICE_WORKER = import.meta.env.PROD;
const STARTUP_TIMEOUT_MS = 8000;

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
  // BATCH 1 — Independent utilities and dialog primitives.
  // These modules expose window globals (window.normalizeMapState,
  // window.sanitizeEditableText, window.createAppStateStore, etc.) that Batch 2
  // modules consume. No inter-batch dependency within this group.
  //
  // FAILURE POINT: If a batch throws, the error propagates to the .catch() at the
  // bottom of this file and showStartupError is called with a full stack trace.
  // A "window.createXxx is not a function" error means a module that sets that global
  // is being consumed by a module in an earlier batch — move the producer to an earlier batch.
  await Promise.all([
    import('../export.js'),
    import('../templates.js'),
    import('../drag.js'),
    import('../confirm-dialog.js'),
    import('../input-dialog.js'),
    import('../state-validation.js'),
    import('../app-state.js'),
    import('../panzoom.js'),
    import('../selection.js'),
  ]);

  // BATCH 2 — Core state infrastructure.
  // Each module here depends on window globals set by Batch 1.
  // Safe to load in parallel within this batch.
  await Promise.all([
    import('../persistence.js'),
    import('../history-manager.js'),
    import('../state-checkpoint-manager.js'),
    import('../archive-storage.js'),
    import('../snapshot-archive-manager.js'),
    import('../vendor-list-tools.js'),
    import('../pin-style-tools.js'),
    import('../pin-manager.js'),
    import('../notify-tools.js'),
    import('../snapshot-tools.js'),
    import('../library-state.js'),
  ]);

  // BATCH 3 — Controllers and event wiring.
  // These consume the complete state infrastructure from Batch 2.
  // event-listeners.js and app-bootstrap.js must complete before script.js runs.
  await Promise.all([
    import('../event-listeners.js'),
    import('../app-bootstrap.js'),
    import('../snapshot-archive-controller.js'),
    import('../storage-sync.js'),
  ]);

  // BATCH 4 — Main script.
  // script.js references every window global set by Batches 1–3.
  // It must execute after all other modules are fully evaluated.
  // Do NOT move this into a Promise.all — order is required.
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

bootstrapLegacyModules()
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