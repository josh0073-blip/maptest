(function () {
  function ensureAppTelemetry() {
    try {
      const container = (window.appTelemetry && typeof window.appTelemetry === 'object') ? window.appTelemetry : {};
      if (!Array.isArray(container.events)) container.events = [];
      if (!Number.isFinite(container.limit) || container.limit <= 0) container.limit = 100;
      if (typeof container.record !== 'function') {
        container.record = function (level, message, details) {
          const evt = {
            timestamp: new Date().toISOString(),
            level: String(level || 'info'),
            message: String(message || ''),
            details: details || null
          };
          this.events.push(evt);
          const excess = this.events.length - this.limit;
          if (excess > 0) this.events.splice(0, excess);
          return evt;
        };
      }
      if (typeof container.last !== 'function') {
        container.last = function () {
          return this.events.length ? this.events[this.events.length - 1] : null;
        };
      }
      window.appTelemetry = container;
      return container;
    } catch (e) {
      return null;
    }
  }

  function appLogEvent(level, message, details) {
    try {
      const t = ensureAppTelemetry();
      if (t && typeof t.record === 'function') return t.record(level, message, details);
    } catch (e) {}
    return null;
  }

  function createNotifyTools(options) {
    const settings = options || {};
    const toastContainer = settings.toastContainer;

    function showToast(message, variant, timeout) {
      const text = String(message || '').trim();
      if (!text) return;

      appLogEvent(variant, text, { toast: !!toastContainer });

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

    function showConfirmAsync(message, opts) {
      const options = opts && typeof opts === 'object' ? opts : {};
      const title = String(options.title || '').trim();
      const acceptLabel = String(options.acceptLabel || 'OK');
      const cancelLabel = String(options.cancelLabel || 'Cancel');
      const timeout = Number(options.timeout) || 0;

      if (!toastContainer) {
        try {
          return Promise.resolve(Boolean(window.confirm(String(message || ''))));
        } catch (e) {
          return Promise.resolve(false);
        }
      }

      return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'toast-overlay';
        overlay.setAttribute('role', 'dialog');

        const box = document.createElement('div');
        box.className = 'toast toast-action';

        if (title) {
          const h = document.createElement('div');
          h.className = 'toast-title';
          h.textContent = title;
          box.appendChild(h);
        }

        const msg = document.createElement('div');
        msg.className = 'toast-message';
        msg.textContent = String(message || '');
        box.appendChild(msg);

        const actions = document.createElement('div');
        actions.className = 'toast-actions';

        const acceptBtn = document.createElement('button');
        acceptBtn.type = 'button';
        acceptBtn.className = 'toast-btn toast-btn-primary';
        acceptBtn.textContent = acceptLabel;

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'toast-btn';
        cancelBtn.textContent = cancelLabel;

        actions.appendChild(acceptBtn);
        actions.appendChild(cancelBtn);
        box.appendChild(actions);
        overlay.appendChild(box);
        toastContainer.appendChild(overlay);

        const prevActive = document.activeElement;
        acceptBtn.focus();

        function cleanup(result) {
          try { overlay.remove(); } catch (e) {}
          try { if (prevActive && typeof prevActive.focus === 'function') prevActive.focus(); } catch (e) {}
          resolve(result);
        }

        acceptBtn.addEventListener('click', function () { cleanup(true); });
        cancelBtn.addEventListener('click', function () { cleanup(false); });

        if (timeout > 0) {
          window.setTimeout(() => cleanup(false), timeout);
        }
      });
    }

    function notifyFromError(err, fallbackMessage) {
      const msg = (err && (err.message || err.toString())) ? (err.message || String(err)) : (fallbackMessage || 'An error occurred');
      appLogEvent('error', msg, { error: err || null, fallback: fallbackMessage || null });
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
      notify: notify,
      notifyFromError: notifyFromError,
      showConfirmAsync: showConfirmAsync
    };
  }

  const existingGlobalShowConfirmAsync = typeof window.showConfirmAsync === 'function'
    ? window.showConfirmAsync
    : null;

  window.createNotifyTools = createNotifyTools;
  // Expose a small global helper for modules that may run before notify is wired up.
  window.notifyFromError = function (err, fallback) {
    const msg = (err && (err.message || err.toString())) ? (err.message || String(err)) : (fallback || 'An error occurred');
    appLogEvent('error', msg, { error: err || null, fallback: fallback || null });
    if (window && window.createNotifyTools) {
      try {
        // Try to use the app-level notify if available
        const runtime = (window.appNotify && window.appNotify.error) ? window.appNotify : null;
        if (runtime && typeof runtime.error === 'function') {
          runtime.error(msg);
          return;
        }
      } catch (e) {
        // fall through
      }
    }
    try { console.error(msg); } catch (e) { /* noop */ }
  };

  // Global async confirm helper for code that runs before the app notify is wired.
  window.showConfirmAsync = function (message, options) {
    if (typeof existingGlobalShowConfirmAsync === 'function') {
      return existingGlobalShowConfirmAsync(message, options);
    }
    try {
      return Promise.resolve(Boolean(window.confirm(String(message || ''))));
    } catch (e) {
      return Promise.resolve(false);
    }
  };
})();
