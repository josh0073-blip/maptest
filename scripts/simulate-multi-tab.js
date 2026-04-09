const fs = require('fs');
const vm = require('vm');

// This script simulates two browser tabs sharing localStorage and firing
// 'storage' events to other contexts. It loads the real storage-sync.js into
// each simulated tab to exercise the storage listener registration and
// onRemoteChange callback behavior.

const storageSyncSrc = fs.readFileSync('storage-sync.js', 'utf8');

function makeTab(id, broadcast) {
  const logs = [];
  const ctxObj = {
    console: {
      log: (...args) => { logs.push(args); process.stdout.write(`[Tab ${id}] ` + args.map(String).join(' ') + '\n'); },
      error: (...args) => { logs.push(['ERROR', ...args]); process.stderr.write(`[Tab ${id}] ERROR ` + args.map(String).join(' ') + '\n'); }
    },
    location: { href: `http://localhost/tab${id}` },
    // storage listeners registry will be stored on window
    window: {}
  };

  // simple storage shim that delegates to host broadcast
  const localStorageShim = {
    getItem(key) {
      return broadcast('get', id, key);
    },
    setItem(key, value) {
      return broadcast('set', id, key, value);
    },
    removeItem(key) {
      return broadcast('remove', id, key);
    }
  };

  ctxObj.window.localStorage = localStorageShim;
  ctxObj.window.addEventListener = function (name, fn) {
    if (name !== 'storage') return;
    this._storageListeners = this._storageListeners || [];
    this._storageListeners.push(fn);
  };
  ctxObj.window.removeEventListener = function (name, fn) {
    if (name !== 'storage') return;
    this._storageListeners = this._storageListeners || [];
    const i = this._storageListeners.indexOf(fn);
    if (i >= 0) this._storageListeners.splice(i, 1);
  };

  const context = vm.createContext(ctxObj);

  // run the storage-sync code to register createStorageSyncTools on window
  vm.runInContext(storageSyncSrc, context, { filename: 'storage-sync.js' });

  return { id, context, logs };
}

function runSimulation() {
  const shared = { data: {} };

  // broadcast handler used by tabs' localStorage shim
  function broadcast(action, originId, key, value) {
    if (action === 'get') {
      return shared.data.hasOwnProperty(key) ? shared.data[key] : null;
    }
    const oldValue = shared.data.hasOwnProperty(key) ? shared.data[key] : null;
    if (action === 'remove') {
      delete shared.data[key];
    } else if (action === 'set') {
      shared.data[key] = value;
    }

    // emit storage event to all other tabs
    for (const t of tabs) {
      if (t.id === originId) continue;
      const win = t.context.window;
      const listeners = win._storageListeners || [];
      const ev = { key, oldValue, newValue: action === 'set' ? value : null, url: win.location && win.location.href };
      listeners.forEach((fn) => {
        try {
          // Call the listener inside its VM context
          vm.runInContext(`(${fn.toString()})(\n  ${JSON.stringify(ev)}\n)`, t.context);
        } catch (err) {
          // If direct run fails, try calling via host-bound function
          try { fn.call(null, ev); } catch (e) { /* ignore */ }
        }
      });
    }

    return true;
  }

  // create two tabs
  global.tabs = [];
  const tabsLocal = [];
  const t1 = makeTab(1, broadcast);
  const t2 = makeTab(2, broadcast);
  tabsLocal.push(t1, t2);

  // expose tabs so broadcast can iterate
  tabs = tabsLocal;

  // In each context, create storageSyncTools with a visible onRemoteChange
  vm.runInContext(`window.storageSyncTools = window.createStorageSyncTools({ storageKey: 'farmersMarketVendorMapState', notify: { warn: function(m){ console.log('[notify.warn]', m); }, info: function(m){ console.log('[notify.info]', m); } }, onRemoteChange: function(details){ console.log('onRemoteChange', JSON.stringify(details)); } });`, t1.context);
  vm.runInContext(`window.storageSyncTools = window.createStorageSyncTools({ storageKey: 'farmersMarketVendorMapState', notify: { warn: function(m){ console.log('[notify.warn]', m); }, info: function(m){ console.log('[notify.info]', m); } }, onRemoteChange: function(details){ console.log('onRemoteChange', JSON.stringify(details)); } });`, t2.context);

  // bind listeners
  vm.runInContext(`window.storageSyncTools.bindStorageSyncListener();`, t1.context);
  vm.runInContext(`window.storageSyncTools.bindStorageSyncListener();`, t2.context);

  console.log('\n--- Initial shared storage state ---');
  console.log(JSON.stringify(shared.data, null, 2));

  // Simulate Tab 1 updating the stored map state
  console.log('\n[Action] Tab 1 setItem');
  vm.runInContext(`window.localStorage.setItem('farmersMarketVendorMapState', JSON.stringify({ nextId: 2, vendors: [{ id: 1, name: 'Vendor A' }] }));`, t1.context);

  // Small delay to allow listeners to run
  setTimeout(() => {
    console.log('\n--- Shared storage after Tab1 change ---');
    console.log(JSON.stringify(shared.data, null, 2));

    // Simulate Tab 2 making a change
    console.log('\n[Action] Tab 2 setItem');
    vm.runInContext(`window.localStorage.setItem('farmersMarketVendorMapState', JSON.stringify({ nextId: 3, vendors: [{ id: 2, name: 'Vendor B' }] }));`, t2.context);

    setTimeout(() => {
      console.log('\n--- Shared storage after Tab2 change ---');
      console.log(JSON.stringify(shared.data, null, 2));
      console.log('\nSimulation complete.');
      process.exit(0);
    }, 200);
  }, 200);
}

runSimulation();
