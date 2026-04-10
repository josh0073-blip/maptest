(function () {
  // Simple accessible confirm dialog helper. Usage: await window.showConfirmAsync(message, { title, acceptLabel, cancelLabel })
  function createConfirmDialog() {
    let container = document.getElementById('confirm-dialog-root');
    if (!container) {
      container = document.createElement('div');
      container.id = 'confirm-dialog-root';
      container.className = 'confirm-dialog-root';
      container.setAttribute('role', 'dialog');
      container.setAttribute('aria-hidden', 'true');
      container.hidden = true;
      container.style.zIndex = '30000';

      container.innerHTML = `
        <div class="confirm-backdrop" tabindex="-1"></div>
        <div class="confirm-panel" role="document" style="z-index:30001;">
          <div class="confirm-body">
            <h3 class="confirm-title"></h3>
            <p class="confirm-message"></p>
            <div class="confirm-actions">
              <button class="confirm-cancel">Cancel</button>
              <button class="confirm-accept">OK</button>
            </div>
          </div>
        </div>`;

      document.body.appendChild(container);
    }

    const backdrop = container.querySelector('.confirm-backdrop');
    const titleEl = container.querySelector('.confirm-title');
    const messageEl = container.querySelector('.confirm-message');
    const acceptBtn = container.querySelector('.confirm-accept');
    const cancelBtn = container.querySelector('.confirm-cancel');

    function show(options) {
      const opts = options || {};
      titleEl.textContent = opts.title || 'Confirm';
      messageEl.textContent = opts.message || '';
      acceptBtn.textContent = opts.acceptLabel || 'OK';
      cancelBtn.textContent = opts.cancelLabel || 'Cancel';

      container.hidden = false;
      container.setAttribute('aria-hidden', 'false');
      // trap focus simply
      acceptBtn.focus();

      return new Promise((resolve) => {
        function cleanup() {
          acceptBtn.removeEventListener('click', onAccept);
          cancelBtn.removeEventListener('click', onCancel);
          backdrop.removeEventListener('click', onCancel);
          window.removeEventListener('keydown', onKey);
          container.hidden = true;
          container.setAttribute('aria-hidden', 'true');
        }

        function onAccept() {
          cleanup();
          resolve(true);
        }

        function onCancel() {
          cleanup();
          resolve(false);
        }

        function onKey(e) {
          if (e.key === 'Escape') {
            onCancel();
          }
        }

        acceptBtn.addEventListener('click', onAccept);
        cancelBtn.addEventListener('click', onCancel);
        backdrop.addEventListener('click', onCancel);
        window.addEventListener('keydown', onKey);
      });
    }

    return { show };
  }

  const dialog = createConfirmDialog();
  window.showConfirmAsync = async function (message, opts) {
    const options = Object.assign({}, opts || {}, { message: message });
    return await dialog.show(options);
  };
})();
