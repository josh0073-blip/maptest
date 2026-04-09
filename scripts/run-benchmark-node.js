// Minimal runner to exercise vendor-list-tools benchmark without browser or npm deps
global.window = global.window || {};
const { performance } = require('perf_hooks');
global.performance = global.performance || performance;

global.document = global.document || (function () {
  function createElement(tag) {
    const el = {
      tagName: String(tag).toUpperCase(),
      className: '',
      dataset: {},
      children: [],
      offsetWidth: 0,
      offsetHeight: 0,
      appendChild(child) { this.children.push(child); },
      querySelectorAll(selector) {
        if (!selector) return [];
        if (selector[0] === '.') {
          const cls = selector.slice(1);
          return this.children.filter(c => {
            return typeof c.className === 'string' && c.className.split(/\s+/).includes(cls);
          });
        }
        return [];
      },
      querySelector(selector) {
        const list = this.querySelectorAll(selector);
        return list.length ? list[0] : null;
      },
      setAttribute(name, val) { this[name] = String(val); },
      removeAttribute(name) { delete this[name]; },
      classList: {
        _map: new Map(),
        toggle(cls, force) {
          const has = this._map.has(cls);
          if (typeof force === 'boolean') {
            if (force) this._map.set(cls, true);
            else this._map.delete(cls);
            return force;
          }
          if (has) { this._map.delete(cls); return false; }
          this._map.set(cls, true); return true;
        },
        add(cls) { this._map.set(cls, true); },
        remove(cls) { this._map.delete(cls); },
        contains(cls) { return this._map.has(cls); }
      }
    };
    return el;
  }

  return { createElement };
})();

// Load the vendor tools which attaches to window.createVendorListTools
require('../vendor-list-tools.js');

const tools = window.createVendorListTools({
  vendorList: document.createElement('div'),
  getVendors: function () { return []; }
});

const result = tools.benchmarkVendorListUpdate(500);
console.log(JSON.stringify(result, null, 2));
