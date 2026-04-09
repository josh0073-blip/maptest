const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const command = process.argv[2] || 'dev';
const commandArgs = process.argv.slice(3);
const projectRoot = path.resolve(__dirname, '..');
const localViteBin = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const fallbackRoot = path.join(os.tmpdir(), 'farmers-market-vendor-map-vite-deps');
const fallbackBin = path.join(fallbackRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const fallbackDeps = [
  'vite@5.4.11',
  'vite-plugin-pwa@0.20.5',
  'workbox-window@7.1.0',
  'html2canvas@1.4.1',
  'jspdf@2.5.1'
];

function run(commandPath, args, env) {
  const result = spawnSync(process.execPath, [commandPath].concat(args), {
    cwd: projectRoot,
    stdio: 'inherit',
    env: Object.assign({}, process.env, env || {})
  });
  if (result.error) throw result.error;
  process.exit(result.status === null ? 1 : result.status);
}

if (fs.existsSync(localViteBin)) {
  run(localViteBin, [command].concat(commandArgs));
}

if (!fs.existsSync(fallbackBin)) {
  const installResult = spawnSync('npm', ['install', '--prefix', fallbackRoot].concat(fallbackDeps), {
    cwd: projectRoot,
    stdio: 'inherit'
  });
  if (installResult.error) throw installResult.error;
  if (installResult.status !== 0) {
    process.exit(installResult.status === null ? 1 : installResult.status);
  }
}

run(fallbackBin, [command].concat(commandArgs), {
  VITE_DEPS_ROOT: fallbackRoot
});