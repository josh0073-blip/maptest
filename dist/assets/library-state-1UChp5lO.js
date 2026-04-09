(function(){let e=`farmersMarketLibraries`,t=[`2026 Test b.jpg`,`Sunday 2026.png`],n=[{filename:`Initial Vendor List.csv`,content:`4th Level Roasters\r
Among the Oaks Herb Farm\r
ArMi Farms\r
Baby Leaf Farm\r
Bellaire Blooms\r
Bent Pine Farm\r
Best Family Farm\r
Blue Moon Farm\r
Bold Badger Sauces\r
Boone Creek Creamery\r
Bourbon County Bison\r
Briar Fox\r
Briary Creek Farms\r
CaffeMarco\r
Casa Guero\r
Crow's Bluff Farm\r
Diamond Ridge Farm\r
DreamTime Market Gardens\r
Eat Everything Bakehouse\r
Eggleston Farm Fresh Foods\r
Elmwood Stock Farm\r
England's Orchard and Nursery\r
Etter Lane Gardens\r
Fika Acres Farm\r
Flat Creek Farm\r
G.L.G. Farm\r
Garey Farms\r
Ghost Fox Winery\r
Green Acres of Paris\r
Henkle's Herbs and Heirlooms\r
Hickory Grove Farm\r
High Five Farm\r
Hillbilly Joe's All-Natural Meats\r
Hollow Oak Farm\r
Home Pickins\r
Hound and Horse Bakery\r
Jacked-Nutrition\r
Jenabelle Treats\r
Johnson Bros. Farm\r
Lazy Eight Stock Farm\r
Lexington Pasta Garage\r
Madison County Produce\r
MaMa's Sweet Preserves\r
Martin Mill Farm\r
Mazunte\r
Misty Thicket Farm\r
Mom-Mom's Lavender\r
Mountain House Mushrooms\r
Mountainside Farm\r
Noodlecraft\r
Pittman Family Farm\r
Power Puff Pastry\r
Raggard Creekside Farm\r
Red Barn Farm\r
Red Buffalo Farm\r
Sailor Smoke\r
Salad Days Farm\r
San's Healthy Choices\r
Sav's Garden\r
Spurlock Seasonings\r
Steve's Plants\r
Stone Jack Bakers\r
Stuarto's Olive Oil Company\r
Sweet 'n Simple Elderberry\r
Sweetgrass Granola\r
Sylvatica Forest Farm\r
Tara's Plants and Petals\r
The Poached Pear\r
The Void Sake Co.\r
The Wandering Collaborative/ Papa Pretzel\r
The Wild Lab\r
Three Daughters Farm\r
Thrive Brew Kombucha\r
Tyler Family Fruits\r
Vargas Farms\r
Viande&Co.\r
Viburnum Valley Farm Confections\r
West Sixth Brewing\r
Williams Valley Farm\r
Wise Bird Cider Co.\r
`}];function r(e){let t=String(e||``).replace(/\.[^/.]+$/,``).replace(/[_-]+/g,` `).trim();return t?t.replace(/\b\w/g,function(e){return e.toUpperCase()}):`Background`}function i(e){return`seed-bg-folder-`+String(e||``).toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``)}function a(e){return`seed-vl-folder-`+String(e||``).toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``)}let o=[].concat((Array.isArray(t)?t:[]).map(function(e){return{id:i(e),name:r(e),sourceType:`url`,backgroundUrl:`/bootstrap-backgrounds/`+e}})),s=[].concat((Array.isArray(n)?n:[]).map(function(e){let t=String(e&&e.filename||``).trim(),n=String(e&&e.content||``);return{id:a(t),name:r(t),csvText:n}})),c=!1;function l(){let e=Array.isArray(t)?t.length:0,r=Array.isArray(n)?n.length:0,i=[];return e===0&&i.push(`No bootstrap background images were found in public/bootstrap-backgrounds.`),r===0&&i.push(`No bootstrap vendor list CSV files were found in public/bootstrap-vendor-lists.`),{backgroundCount:e,vendorListCount:r,issues:i,healthy:i.length===0}}function u(e){let t=l();if(t.healthy||c)return t;c=!0;let n=e||window.appNotify,r=`Bootstrap assets are missing. `+t.issues.join(` `)+` Offline defaults may be incomplete.`;return n&&typeof n.warn==`function`?(n.warn(r),t):(console.warn(r),t)}function d(e){return e+`_`+Date.now()+`_`+Math.random().toString(36).slice(2,6)}function f(e,t){return(typeof e==`string`?e.trim():``)||t}function p(e,t){if(!e||typeof e!=`object`)return null;let n=f(e.backgroundUrl,``);return n?{id:f(e.id,d(`bg`+t)),name:f(e.name,`Background `+(t+1)),sourceType:e.sourceType===`fileData`?`fileData`:`url`,backgroundUrl:n,createdAt:f(e.createdAt,new Date().toISOString()),lastUsedAt:f(e.lastUsedAt,new Date().toISOString())}:null}function m(e,t){if(!e||typeof e!=`object`)return null;let n=(Array.isArray(e.items)?e.items:[]).map(function(e){let t=f(e&&e.name,``);return t?{name:t,active:!!(e&&e.active)}:null}).filter(Boolean);return{id:f(e.id,d(`vl`+t)),name:f(e.name,`Vendor List `+(t+1)),items:n,createdAt:f(e.createdAt,new Date().toISOString()),lastUsedAt:f(e.lastUsedAt,new Date().toISOString())}}function h(e){let t=e&&typeof e==`object`?e:{},n=(Array.isArray(t.backgroundLibrary)?t.backgroundLibrary:[]).map(p).filter(Boolean),r=new Map;n.forEach(function(e){r.set(e.id,e)});let i=new Set,a=[];r.forEach(function(e){i.has(e.backgroundUrl)||(i.add(e.backgroundUrl),a.push(e))});let o=(Array.isArray(t.vendorListLibrary)?t.vendorListLibrary:[]).map(m).filter(Boolean),s=new Map;return o.forEach(function(e){s.set(e.id,e)}),{schemaVersion:1,backgroundLibrary:a,vendorListLibrary:Array.from(s.values())}}function g(){let t=h(null),n=!1;function r(e){try{localStorage.setItem(`farmersMarketLibrarySeedVersion`,String(e))}catch(e){y(`Failed updating seed version in localStorage.`,e)}}function i(e){return JSON.stringify((Array.isArray(e)?e:[]).map(function(e){return String(e&&e.name||``).trim().toLowerCase()}).sort())}function a(e){return/^seed-bg-/.test(String(e||``))}function c(e){return/^seed-vl-/.test(String(e||``))}function g(e){return!e||typeof e!=`object`?[]:typeof e.csvText==`string`?I(e.csvText):Array.isArray(e.items)?e.items.map(function(e){return{name:String(e&&e.name||``).trim(),active:!!(e&&e.active)}}).filter(function(e){return!!e.name}):[]}function _(){let e=new Date().toISOString(),n=new Map(t.backgroundLibrary.map(function(e){return[e.id,e]})),l=new Set(t.backgroundLibrary.map(function(e){return e.backgroundUrl})),u=new Map(t.vendorListLibrary.map(function(e){return[e.id,e]})),d=new Set(t.vendorListLibrary.map(function(e){return i(e.items)})),f=!1,p=new Set(o.map(function(e){return e.id})),m=t.backgroundLibrary.length;t.backgroundLibrary=t.backgroundLibrary.filter(function(e){return a(e.id)?p.has(e.id):!0}),t.backgroundLibrary.length!==m&&(f=!0);let h=new Set(s.map(function(e){return e.id})),_=t.vendorListLibrary.length;return t.vendorListLibrary=t.vendorListLibrary.filter(function(e){return c(e.id)?h.has(e.id):!0}),t.vendorListLibrary.length!==_&&(f=!0),n.clear(),l.clear(),t.backgroundLibrary.forEach(function(e){n.set(e.id,e),l.add(e.backgroundUrl)}),u.clear(),d.clear(),t.vendorListLibrary.forEach(function(e){u.set(e.id,e),d.add(i(e.items))}),o.forEach(function(r){let i=n.get(r.id);if(i){let t=r.sourceType===`fileData`?`fileData`:`url`;(i.name!==r.name||i.sourceType!==t||i.backgroundUrl!==r.backgroundUrl)&&(i.name=r.name,i.sourceType=t,i.backgroundUrl=r.backgroundUrl,i.lastUsedAt=e,f=!0),l.add(r.backgroundUrl);return}if(l.has(r.backgroundUrl))return;let a={id:r.id,name:r.name,sourceType:r.sourceType,backgroundUrl:r.backgroundUrl,createdAt:e,lastUsedAt:e};t.backgroundLibrary.push(a),n.set(r.id,a),l.add(r.backgroundUrl),f=!0}),s.forEach(function(n){let r=g(n);if(!r.length)return;let a=i(r),o=u.get(n.id);if(o){let t=i(o.items);(o.name!==n.name||t!==a)&&(o.name=n.name,o.items=r,o.lastUsedAt=e,f=!0),d.add(a);return}if(d.has(a))return;let s={id:n.id,name:n.name,items:r,createdAt:e,lastUsedAt:e};t.vendorListLibrary.push(s),u.set(n.id,s),d.add(a),f=!0}),r(7),f&&b(),f}function v(e,t){let n=window.appNotify;if(n&&typeof n[e]==`function`){n[e](t);return}if(window&&window.appNotify&&typeof window.appNotify[e]==`function`){window.appNotify[e](t);return}e===`error`?console.error(t):e===`warn`?console.warn(t):console.log(t)}function y(e,t){console.error(e,t),n||=(v(`warn`,`Library storage is unavailable or full. Library changes may not persist until storage access is restored.`),!0)}function b(){try{localStorage.setItem(e,JSON.stringify(t,null,2))}catch(e){return y(`Failed persisting library state to localStorage.`,e),!1}return!0}function x(){let n=null;try{n=localStorage.getItem(e)}catch(e){return y(`Failed reading library state from localStorage.`,e),t}if(!n)return _(),b(),t;try{t=h(JSON.parse(n)),_(),b()}catch(e){console.error(`Failed to parse library storage, reinitializing.`,e),v(`error`,`Library storage was invalid and has been reset.`),t=h(null),_(),b()}return t}function S(){return t}function C(e){let n=new Date().toISOString(),r=p({id:d(`bg`),name:e&&e.name,sourceType:e&&e.sourceType,backgroundUrl:e&&e.backgroundUrl,createdAt:n,lastUsedAt:n},t.backgroundLibrary.length);return r?(t.backgroundLibrary.push(r),b(),r):null}function w(e,n){let r=t.backgroundLibrary.find(function(t){return t.id===e});return r?(r.name=f(n,r.name),b(),!0):!1}function T(e){let n=t.backgroundLibrary.length;return t.backgroundLibrary=t.backgroundLibrary.filter(function(t){return t.id!==e}),t.backgroundLibrary.length===n?!1:(b(),!0)}function E(e){let n=t.backgroundLibrary.find(function(t){return t.id===e});return n?(n.lastUsedAt=new Date().toISOString(),b(),!0):!1}function D(){let e=JSON.stringify({schemaVersion:1,backgroundLibrary:t.backgroundLibrary},null,2),n=new Blob([e],{type:`application/json`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=`background-library.json`,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(r)}function O(e){try{let n=h(JSON.parse(e)),r=new Map;t.backgroundLibrary.forEach(function(e){r.set(e.backgroundUrl,e)});let i=0;return n.backgroundLibrary.forEach(function(e){r.has(e.backgroundUrl)||(t.backgroundLibrary.push({id:d(`bg`),name:e.name,sourceType:e.sourceType,backgroundUrl:e.backgroundUrl,createdAt:e.createdAt,lastUsedAt:e.lastUsedAt}),i++)}),b(),{added:i}}catch(e){return console.error(`Failed importing background library JSON.`,e),v(`error`,`Background library import failed. The file could not be read or saved.`),{added:0}}}function k(e){let n=new Date().toISOString(),r=m({id:d(`vl`),name:e&&e.name,items:e&&e.items,createdAt:n,lastUsedAt:n},t.vendorListLibrary.length);return r?(t.vendorListLibrary.push(r),b(),r):null}function A(e,n){let r=t.vendorListLibrary.findIndex(function(t){return t.id===e});if(r<0)return null;let i=t.vendorListLibrary[r],a=m({id:i.id,name:n&&n.name!==void 0?n.name:i.name,items:n&&Array.isArray(n.items)?n.items:i.items,createdAt:i.createdAt,lastUsedAt:new Date().toISOString()},r);return a?(t.vendorListLibrary[r]=a,b(),a):null}function j(e,n){let r=t.vendorListLibrary.find(function(t){return t.id===e});return r?(r.name=f(n,r.name),r.lastUsedAt=new Date().toISOString(),b(),!0):!1}function M(e){let n=t.vendorListLibrary.length;return t.vendorListLibrary=t.vendorListLibrary.filter(function(t){return t.id!==e}),t.vendorListLibrary.length===n?!1:(b(),!0)}function N(e){let n=t.vendorListLibrary.find(function(t){return t.id===e});return n?(n.lastUsedAt=new Date().toISOString(),b(),!0):!1}function P(){let e=JSON.stringify({schemaVersion:1,vendorListLibrary:t.vendorListLibrary},null,2),n=new Blob([e],{type:`application/json`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=`vendor-list-library.json`,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(r)}function F(e){try{let n=h(JSON.parse(e)),r=new Set(t.vendorListLibrary.map(function(e){return JSON.stringify(e.items.map(function(e){return e.name.toLowerCase()}).sort())})),i=0;return n.vendorListLibrary.forEach(function(e){let n=JSON.stringify(e.items.map(function(e){return e.name.toLowerCase()}).sort());r.has(n)||(t.vendorListLibrary.push({id:d(`vl`),name:e.name,items:e.items,createdAt:e.createdAt,lastUsedAt:e.lastUsedAt}),r.add(n),i++)}),b(),{added:i}}catch(e){return console.error(`Failed importing vendor list library JSON.`,e),v(`error`,`Vendor list library import failed. The file could not be read or saved.`),{added:0}}}function I(e){let t=String(e||``).split(/\r?\n/).map(function(e){return e.trim()}).filter(Boolean);if(!t.length)return[];let n=0,r=t[0].toLowerCase();(r===`name`||r===`name,active`)&&(n=1);let i=[];for(let e=n;e<t.length;e++){let n=t[e];if(n.includes(`,`)){let e=n.split(`,`),t=(e[0]||``).replace(/^"|"$/g,``).replace(/""/g,`"`).trim(),r=(e[1]||``).replace(/^"|"$/g,``).trim().toLowerCase();if(!t)continue;i.push({name:t,active:r===`true`||r===`1`||r===`yes`});continue}i.push({name:n,active:!1})}return i}function L(e,t){try{return k({name:e,items:I(t)})}catch(e){return console.error(`Failed importing vendor list CSV.`,e),v(`error`,`Vendor list CSV import failed. The file could not be parsed or saved.`),null}}return x(),{getState:S,addBackgroundEntry:C,renameBackgroundEntry:w,deleteBackgroundEntry:T,markBackgroundUsed:E,exportBackgroundLibrary:D,importBackgroundLibraryJson:O,addVendorListEntry:k,updateVendorListEntry:A,renameVendorListEntry:j,deleteVendorListEntry:M,markVendorListUsed:N,exportVendorListLibrary:P,importVendorListLibraryJson:F,addVendorListFromCsv:L,load:x,save:b,getBootstrapDiagnostics:l,reportBootstrapDiagnostics:u}}window.createLibraryStateTools=g,window.getLibraryBootstrapDiagnostics=l,window.reportLibraryBootstrapDiagnostics=u})();
//# sourceMappingURL=library-state-1UChp5lO.js.map