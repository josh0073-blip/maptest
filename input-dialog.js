(function () {
  // Accessible input dialog helper. Usage: const value = await window.showInputAsync(message, { title, defaultValue, placeholder });
  function createInputDialog() {
    let root = document.getElementById('input-dialog-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'input-dialog-root';
      root.className = 'input-dialog-root';
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-hidden', 'true');
      root.hidden = true;
      root.innerHTML = `
        <div class="input-backdrop" tabindex="-1"></div>
        <div class="input-panel" role="document">
          <div class="input-body">
            <h3 class="input-title"></h3>
            <p class="input-message"></p>
            <input class="input-field" type="text" />
            <div class="input-error" aria-live="polite"></div>
            <div class="input-actions">
              <button class="input-cancel">Cancel</button>
              <button class="input-accept">OK</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(root);
    }

    const backdrop = root.querySelector('.input-backdrop');
    const titleEl = root.querySelector('.input-title');
    const messageEl = root.querySelector('.input-message');
    const inputField = root.querySelector('.input-field');
    const acceptBtn = root.querySelector('.input-accept');
    const cancelBtn = root.querySelector('.input-cancel');

    function show(message, opts) {
      const options = opts || {};
      titleEl.textContent = options.title || 'Input';
      messageEl.textContent = message || '';
      inputField.value = options.defaultValue || '';
      inputField.placeholder = options.placeholder || '';
      if (options.maxLength && Number.isFinite(Number(options.maxLength))) inputField.maxLength = Number(options.maxLength);

      root.hidden = false;
      root.setAttribute('aria-hidden', 'false');
      inputField.focus();

      return new Promise((resolve) => {
        function cleanup() {
          acceptBtn.removeEventListener('click', onAccept);
          cancelBtn.removeEventListener('click', onCancel);
          backdrop.removeEventListener('click', onCancel);
          window.removeEventListener('keydown', onKey);
          root.hidden = true;
          root.setAttribute('aria-hidden', 'true');
        }

        const errorEl = root.querySelector('.input-error');
        let runningValidation = false;
        async function runValidate() {
          if (!options.validator) {
            errorEl.textContent = '';
            acceptBtn.disabled = false;
            return;
          }
          const value = inputField.value;
          try {
            runningValidation = true;
            const result = await Promise.resolve(options.validator(value));
            let ok = true;
            let msg = '';
            if (result === false) { ok = false; }
            else if (result === true) { ok = true; }
            else if (result && typeof result === 'object') { ok = !!result.valid; msg = result.message || ''; }
            errorEl.textContent = ok ? '' : msg || 'Invalid value.';
            acceptBtn.disabled = !ok;
          } catch (err) {
            errorEl.textContent = 'Validation error';
            acceptBtn.disabled = true;
          } finally {
            runningValidation = false;
          }
        }

        function onAccept() {
          const v = inputField.value;
          cleanup();
          resolve(String(v));
        }

        function onCancel() {
          cleanup();
          resolve(null);
        }

        function onKey(e) {
          if (e.key === 'Escape') {
            onCancel();
          } else if (e.key === 'Enter') {
            if (!acceptBtn.disabled) onAccept();
          }
        }

        acceptBtn.addEventListener('click', onAccept);
        cancelBtn.addEventListener('click', onCancel);
        backdrop.addEventListener('click', onCancel);
        window.addEventListener('keydown', onKey);
        inputField.addEventListener('input', () => {
          if (runningValidation) return;
          runValidate();
        });

        // run initial validation
        runValidate();
      });
    }

    return { show };
  }

  const dialog = createInputDialog();
  window.showInputAsync = async function (message, opts) {
    return await dialog.show(message, opts || {});
  };
})();
