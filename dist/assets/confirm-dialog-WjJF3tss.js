(function(){function e(){let e=document.getElementById(`confirm-dialog-root`);e||(e=document.createElement(`div`),e.id=`confirm-dialog-root`,e.className=`confirm-dialog-root`,e.setAttribute(`role`,`dialog`),e.setAttribute(`aria-hidden`,`true`),e.hidden=!0,e.innerHTML=`
        <div class="confirm-backdrop" tabindex="-1"></div>
        <div class="confirm-panel" role="document">
          <div class="confirm-body">
            <h3 class="confirm-title"></h3>
            <p class="confirm-message"></p>
            <div class="confirm-actions">
              <button class="confirm-cancel">Cancel</button>
              <button class="confirm-accept">OK</button>
            </div>
          </div>
        </div>`,document.body.appendChild(e));let t=e.querySelector(`.confirm-backdrop`),n=e.querySelector(`.confirm-title`),r=e.querySelector(`.confirm-message`),i=e.querySelector(`.confirm-accept`),a=e.querySelector(`.confirm-cancel`);function o(o){let s=o||{};return n.textContent=s.title||`Confirm`,r.textContent=s.message||``,i.textContent=s.acceptLabel||`OK`,a.textContent=s.cancelLabel||`Cancel`,e.hidden=!1,e.setAttribute(`aria-hidden`,`false`),i.focus(),new Promise(n=>{function r(){i.removeEventListener(`click`,o),a.removeEventListener(`click`,s),t.removeEventListener(`click`,s),window.removeEventListener(`keydown`,c),e.hidden=!0,e.setAttribute(`aria-hidden`,`true`)}function o(){r(),n(!0)}function s(){r(),n(!1)}function c(e){e.key===`Escape`&&s()}i.addEventListener(`click`,o),a.addEventListener(`click`,s),t.addEventListener(`click`,s),window.addEventListener(`keydown`,c)})}return{show:o}}let t=e();window.showConfirmAsync=async function(e,n){let r=Object.assign({},n||{},{message:e});return await t.show(r)}})();
//# sourceMappingURL=confirm-dialog-WjJF3tss.js.map