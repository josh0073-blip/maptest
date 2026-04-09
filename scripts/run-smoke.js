const fs = require('fs');
const vm = require('vm');

const filesToLoad = [
  'pin-style-tools.js',
  'pin-manager.js',
  'drag.js',
  'vendor-list-tools.js'
];

function read(src) {
  return fs.readFileSync(src, 'utf8');
}

function makeContext() {
  const elements = new Map();
  function createElement(tag) {
    const el = {
      tagName: (tag || 'div').toUpperCase(),
      className: '',
      classList: {
        _set: new Set(),
        add(name) { this._set.add(name); },
        remove(name) { this._set.delete(name); },
        toggle(name, force) { if (force === undefined) { if (this._set.has(name)) this._set.delete(name); else this._set.add(name); } else if (force) this._set.add(name); else this._set.delete(name); },
        contains(name) { return this._set.has(name); }
      },
      setAttribute(name, value) {
        if (String(name).indexOf('data-') === 0) {
          this.dataset[name.slice(5)] = String(value);
        } else {
          this[name] = value;
        }
      },
      getAttribute(name) {
        if (String(name).indexOf('data-') === 0) return this.dataset[name.slice(5)];
        return this[name];
      },
      removeAttribute(name) {
        if (String(name).indexOf('data-') === 0) delete this.dataset[name.slice(5)];
        else delete this[name];
      },
      dataset: {},
      children: [],
      style: {
        setProperty(name, value) { this[name] = value; },
        removeProperty(name) { delete this[name]; }
      },
      textContent: '',
      value: '',
      offsetWidth: 100,
      offsetHeight: 30,
      appendChild(child) { this.children.push(child); },
      append() { for (let i = 0; i < arguments.length; i++) this.appendChild(arguments[i]); },
      remove() { /* noop */ },
      addEventListener(name, fn) { this['on' + name] = fn; },
      querySelector(selector) { return this.children.find(c => c.className === selector.replace('.', '')) || null; },
      querySelectorAll() { return Array.from(this.children); },
      focus() { /* noop */ },
      setPointerCapture() { /* noop */ }
    };
    return el;
  }

  const pinsContainer = createElement('div');
  pinsContainer.id = 'pinsContainer';
  elements.set('pinsContainer', pinsContainer);

  const mapArea = createElement('main');
  mapArea.id = 'mapArea';
  mapArea.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });
  elements.set('mapArea', mapArea);

  const mapContent = createElement('div');
  mapContent.id = 'mapContent';
  mapContent.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1600, height: 1200 });
  mapContent.offsetWidth = 1600;
  mapContent.offsetHeight = 1200;
  elements.set('mapContent', mapContent);

  const toastContainer = createElement('div');
  toastContainer.id = 'toast-container';
  elements.set('toast-container', toastContainer);

  const doc = {
    createElement,
    getElementById(id) { return elements.get(id) || null; },
    documentElement: { style: { setProperty() {} } }
  };

  const ctx = {
    console: console,
    window: {},
    document: doc,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };

  return { ctx, elements };
}

function run() {
  const { ctx, elements } = makeContext();
  const context = vm.createContext(ctx);

  // Load files into the VM
  for (const f of filesToLoad) {
    const src = read(f);
    vm.runInContext(src, context, { filename: f });
  }

  // Create tools
  vm.runInContext(`
    const pinStyleTools = window.createPinStyleTools({ getBackgroundScale: () => 1 });
    const applyPinPosition = pinStyleTools.applyPinPosition;
    const applyPinTransform = pinStyleTools.applyPinTransform;
    const animatePin = pinStyleTools.animatePin;

    const dragTools = window.createPinDragTools({ mapContent: document.getElementById('mapContent'), getZoomLevel: () => 1, getBackgroundScale: () => 1, applyPinPosition: applyPinPosition, updateVendorList: function(){}, persistState: function(){}, animatePin: animatePin });

    const vendorListTools = window.createVendorListTools({ pinsContainer: document.getElementById('pinsContainer'), getVendors: () => [], getBackgroundScale: () => 1 });

    // Minimal actions stub
    const actions = {
      addVendorRecord(initial) { return Object.assign({ id: 1 }, initial); },
      removeVendorById() { return null; }
    };

    const appStateStub = {
      vendors: [],
      vendorTemplates: [],
      vendorCategories: []
    };

    const pinManager = window.createPinManager({ pinsContainer: document.getElementById('pinsContainer'), appState: appStateStub, actions: actions, applyPinPosition: applyPinPosition, applyPinTransform: applyPinTransform, updateVendorList: function(){}, persistState: function(){}, startDrag: dragTools.startDrag, updateClusters: vendorListTools.updateClusters, onTemplateLinked: function(){}, onTemplateUpdated: function(){}, onTemplateUnlinked: function(){} , animatePin: animatePin });

    // create a vendor and pin
    const vendor = pinManager.addVendor({ name: 'Smoke Vendor' });
    const pins = document.getElementById('pinsContainer').children;
    if (!pins || !pins.length) throw new Error('No pins appended');
    console.log('Smoke: pin created, vendor id=' + (vendor && vendor.id));
  `, context, { filename: 'smoke-run' });

  console.log('Smoke run completed successfully');
}

try {
  run();
} catch (err) {
  console.error('Smoke run failed:', err);
  process.exit(2);
}
