import path from 'node:path';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const depsRoot = process.env.VITE_DEPS_ROOT;
const workspaceRoot = process.cwd();
const require = createRequire(import.meta.url);

const resolveAlias = depsRoot
  ? {
      html2canvas: path.resolve(depsRoot, 'node_modules/html2canvas/dist/html2canvas.esm.js'),
      jspdf: path.resolve(depsRoot, 'node_modules/jspdf/dist/jspdf.es.min.js'),
      'workbox-window': path.resolve(depsRoot, 'node_modules/workbox-window/index.mjs')
    }
  : undefined;
const pkg = require('./package.json');
const appManifestPath = path.resolve(workspaceRoot, 'public', 'manifest.webmanifest');
let appVersion = pkg.version || '1.0.0';
try {
  const manifestRaw = fs.readFileSync(appManifestPath, 'utf8');
  const manifestJson = JSON.parse(manifestRaw);
  if (manifestJson && typeof manifestJson.version === 'string' && manifestJson.version.trim()) {
    appVersion = manifestJson.version.trim();
  }
} catch (error) {
  // Fall back to package.json version when manifest metadata is unavailable.
}
let appLastUpdated = '';
try {
  const gitDate = execSync('git log -1 --format=%cd --date=short', { cwd: workspaceRoot, stdio: 'pipe' }).toString('utf8').trim();
  const [year, month, day] = gitDate.split('-');
  appLastUpdated = `${month}/${day}/${year.slice(-2)}`;
} catch (error) {
  const fallback = new Date().toISOString().slice(0, 10).split('-');
  appLastUpdated = `${fallback[1]}/${fallback[2]}/${fallback[0].slice(-2)}`;
}
function bootstrapBackgroundFileListPlugin() {
  const bootstrapBackgroundDir = path.resolve(workspaceRoot, 'public/bootstrap-backgrounds');
  const bootstrapVendorListDir = path.resolve(workspaceRoot, 'public/bootstrap-vendor-lists');

  function getBootstrapImageFiles() {
    try {
      return fs.readdirSync(bootstrapBackgroundDir)
        .filter((fileName) => /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName))
        .sort((a, b) => a.localeCompare(b));
    } catch (error) {
      return [];
    }
  }

  function getBootstrapVendorListFiles() {
    try {
      return fs.readdirSync(bootstrapVendorListDir)
        .filter((fileName) => /\.csv$/i.test(fileName))
        .sort((a, b) => a.localeCompare(b));
    } catch (error) {
      return [];
    }
  }

  function getBootstrapVendorListPayloads() {
    return getBootstrapVendorListFiles().map((fileName) => {
      const absolutePath = path.resolve(bootstrapVendorListDir, fileName);
      let content = '';
      try {
        content = fs.readFileSync(absolutePath, 'utf8');
      } catch (error) {
        content = '';
      }
      return {
        filename: fileName,
        content
      };
    });
  }

  function createBootstrapManifestSource(files, vendorListPayloads) {
    return `// Runtime bootstrap seed fallback for environments where Vite source transforms are not applied.
var __BOOTSTRAP_BACKGROUND_FILES__ = ${JSON.stringify(files, null, 2)};

var __BOOTSTRAP_VENDOR_LIST_FILES__ = ${JSON.stringify(vendorListPayloads, null, 2)};
`;
  }

  return {
    name: 'bootstrap-background-file-list',
    transform(code, id) {
      const normalizedId = id.split('?')[0];
      if (!normalizedId.endsWith('/library-state.js')) {
        return null;
      }

      const files = getBootstrapImageFiles();
      const vendorListPayloads = getBootstrapVendorListPayloads();
      const codeWithBackgroundFiles = code.replaceAll('__BOOTSTRAP_BACKGROUND_FILES__', JSON.stringify(files));
      const codeWithVendorListFiles = codeWithBackgroundFiles.replaceAll('__BOOTSTRAP_VENDOR_LIST_FILES__', JSON.stringify(vendorListPayloads));
      return {
        code: codeWithVendorListFiles,
        map: null
      };
    },
    generateBundle() {
      const files = getBootstrapImageFiles();
      files.forEach((fileName) => {
        const absolutePath = path.resolve(bootstrapBackgroundDir, fileName);
        if (!fs.existsSync(absolutePath)) {
          return;
        }
        const source = fs.readFileSync(absolutePath);
        this.emitFile({
          type: 'asset',
          fileName: `bootstrap-backgrounds/${fileName}`,
          source
        });
        this.emitFile({
          type: 'asset',
          fileName: `public/bootstrap-backgrounds/${fileName}`,
          source
        });
      });

      const vendorListFiles = getBootstrapVendorListFiles();
      vendorListFiles.forEach((fileName) => {
        const absolutePath = path.resolve(bootstrapVendorListDir, fileName);
        if (!fs.existsSync(absolutePath)) {
          return;
        }
        this.emitFile({
          type: 'asset',
          fileName: `bootstrap-vendor-lists/${fileName}`,
          source: fs.readFileSync(absolutePath)
        });
      });

      const manifestSource = createBootstrapManifestSource(files, getBootstrapVendorListPayloads());
      this.emitFile({
        type: 'asset',
        fileName: 'bootstrap-manifest.js',
        source: manifestSource
      });

      const bootstrapManifestPath = path.resolve(workspaceRoot, 'bootstrap-manifest.js');
      try {
        fs.writeFileSync(bootstrapManifestPath, manifestSource + '\n', 'utf8');
      } catch (error) {
        // Best-effort sync of the source manifest file for source deployments.
      }

      const staticPwaAssets = ['pwa-icon.svg', 'pwa-192.png', 'pwa-512.png'];
      staticPwaAssets.forEach((fileName) => {
        const absolutePath = path.resolve(workspaceRoot, 'public', fileName);
        if (!fs.existsSync(absolutePath)) {
          return;
        }
        this.emitFile({
          type: 'asset',
          fileName,
          source: fs.readFileSync(absolutePath)
        });
      });
    }
  };
}

export default defineConfig({
  base: '/maptest/', // Set base path for GitHub Pages
  resolve: {
    alias: resolveAlias
  },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_LAST_UPDATED__: JSON.stringify(appLastUpdated)
  },
  plugins: [
    VitePWA(),
    bootstrapBackgroundFileListPlugin()
  ],
  cacheDir: depsRoot ? path.resolve(depsRoot, '.vite-cache') : undefined,
  build: {
    copyPublicDir: false,
    outDir: 'dist',
    manifest: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html',
      },
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('/html2canvas/')) {
            return 'html2canvas';
          }

          if (id.includes('/jspdf/')) {
            return 'jspdf';
          }

          if (id.includes('/canvg/')) {
            return 'canvg';
          }

          if (id.includes('/dompurify/')) {
            return 'dompurify';
          }

          return 'vendor';
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: false
  },
  preview: {
    port: 4173,
    strictPort: false
  }
});
