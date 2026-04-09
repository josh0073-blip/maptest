(function(){function e(){let e=document.getElementById(`input-dialog-root`);e||(e=document.createElement(`div`),e.id=`input-dialog-root`,e.className=`input-dialog-root`,e.setAttribute(`role`,`dialog`),e.setAttribute(`aria-hidden`,`true`),e.hidden=!0,e.innerHTML=`
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
        </div>`,document.body.appendChild(e));let t=e.querySelector(`.input-backdrop`),n=e.querySelector(`.input-title`),r=e.querySelector(`.input-message`),i=e.querySelector(`.input-field`),a=e.querySelector(`.input-accept`),o=e.querySelector(`.input-cancel`);function s(s,c){let l=c||{};return n.textContent=l.title||`Input`,r.textContent=s||``,i.value=l.defaultValue||``,i.placeholder=l.placeholder||``,l.maxLength&&Number.isFinite(Number(l.maxLength))&&(i.maxLength=Number(l.maxLength)),e.hidden=!1,e.setAttribute(`aria-hidden`,`false`),i.focus(),new Promise(n=>{function r(){a.removeEventListener(`click`,d),o.removeEventListener(`click`,f),t.removeEventListener(`click`,f),window.removeEventListener(`keydown`,p),e.hidden=!0,e.setAttribute(`aria-hidden`,`true`)}let s=e.querySelector(`.input-error`),c=!1;async function u(){if(!l.validator){s.textContent=``,a.disabled=!1;return}let e=i.value;try{c=!0;let t=await Promise.resolve(l.validator(e)),n=!0,r=``;t===!1?n=!1:t===!0?n=!0:t&&typeof t==`object`&&(n=!!t.valid,r=t.message||``),s.textContent=n?``:r||`Invalid value.`,a.disabled=!n}catch{s.textContent=`Validation error`,a.disabled=!0}finally{c=!1}}function d(){let e=i.value;r(),n(String(e))}function f(){r(),n(null)}function p(e){e.key===`Escape`?f():e.key===`Enter`&&(a.disabled||d())}a.addEventListener(`click`,d),o.addEventListener(`click`,f),t.addEventListener(`click`,f),window.addEventListener(`keydown`,p),i.addEventListener(`input`,()=>{c||u()}),u()})}return{show:s}}let t=e();window.showInputAsync=async function(e,n){return await t.show(e,n||{})}})();
//# sourceMappingURL=input-dialog-CX4luVGX.js.map