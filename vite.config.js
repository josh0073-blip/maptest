import path from 'node:path';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const depsRoot = process.env.VITE_DEPS_ROOT;
const workspaceRoot = process.cwd();
const require = createRequire(import.meta.url);
const { VitePWA } = require(
  depsRoot
    ? path.resolve(depsRoot, 'node_modules/vite-plugin-pwa')
    : 'vite-plugin-pwa'
);

const resolveAlias = depsRoot
  ? {
      html2canvas: path.resolve(depsRoot, 'node_modules/html2canvas/dist/html2canvas.esm.js'),
      jspdf: path.resolve(depsRoot, 'node_modules/jspdf/dist/jspdf.es.min.js'),
      'workbox-window': path.resolve(depsRoot, 'node_modules/workbox-window/index.mjs')
    }
  : undefined;

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
        this.emitFile({
          type: 'asset',
          fileName: `bootstrap-backgrounds/${fileName}`,
          source: fs.readFileSync(absolutePath)
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
  plugins: [
    bootstrapBackgroundFileListPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      includeAssets: ['pwa-icon.svg', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'Farmers Market Vendor Map',
        short_name: 'Vendor Map',
        description: 'Plan vendor pins, background maps, and market layouts.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
          {
            src: '/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      injectManifest: {
        injectionPoint: undefined
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  resolve: resolveAlias ? { alias: resolveAlias } : undefined,
  cacheDir: depsRoot ? path.resolve(depsRoot, '.vite-cache') : undefined,
  build: {
    copyPublicDir: false,
    outDir: 'dist',
    manifest: true,
    sourcemap: true,
    rollupOptions: {
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
