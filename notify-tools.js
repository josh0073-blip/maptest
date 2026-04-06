(function () {
  function createNotifyTools(options) {
    const settings = options || {};
    const toastContainer = settings.toastContainer;

    function showToast(message, variant, timeout) {
      const text = String(message || '').trim();
      if (!text) return;

      if (!toastContainer) {
        if (variant === 'error') console.error(text);
        else if (variant === 'warning') console.warn(text);
        else console.info(text);
        return;
      }

      const toast = document.createElement('div');
      toast.className = `toast toast-${variant}`;
      toast.setAttribute('role', 'status');
      toast.textContent = text;
      toastContainer.appendChild(toast);

      window.setTimeout(() => {
        toast.remove();
      }, Math.max(1200, timeout));
    }

    const notify = {
      success(message) {
        showToast(message, 'success', 2600);
      },
      info(message) {
        showToast(message, 'info', 2600);
      },
      warn(message) {
        showToast(message, 'warning', 3200);
      },
      error(message) {
        showToast(message, 'error', 3600);
      }
    };

    function notifyFromError(err, fallbackMessage) {
      const msg = (err && (err.message || err.toString())) ? (err.message || String(err)) : (fallbackMessage || 'An error occurred');
      if (notify && typeof notify.error === 'function') {
        notify.error(msg);
        return;
      }
      if (window && window.appNotify && typeof window.appNotify.error === 'function') {
        window.appNotify.error(msg);
        return;
      }
      console.error(msg);
    }

    return {
      showToast: showToast,
      notify: notify
      , notifyFromError: notifyFromError
    };
  }

  window.createNotifyTools = createNotifyTools;
  // Expose a small global helper for modules that may run before notify is wired up.
  window.notifyFromError = function (err, fallback) {
    if (window && window.createNotifyTools) {
      try {
        // Try to use the app-level notify if available
        const runtime = (window.appNotify && window.appNotify.error) ? window.appNotify : null;
        if (runtime && typeof runtime.error === 'function') {
          const msg = (err && (err.message || err.toString())) ? (err.message || String(err)) : (fallback || 'An error occurred');
          runtime.error(msg);
          return;
        }
      } catch (e) {
        // fall through
      }
    }
    try { console.error(err && (err.message || err.toString()) || fallback || 'An error occurred'); } catch (e) { /* noop */ }
  };
})();
