# Farmers Market Vendor Map (SPA)

Static background map + editable text vendor pins.

Status
------

- CI: Playwright smoke tests run on push/PR via GitHub Actions (.github/workflows/ci.yml)
- License: MIT (LICENSE)

## Run
- Open `index.html` in browser.
- Click "Add Vendor Pin" to add a pin.
- Drag pins and edit names inline.
- Save state to localStorage and load later.

Multi-tab merge behavior
------------------------

This repo includes a conservative multi-tab merge helper in `storage-sync.js`.
When a `storage` event is received, the helper will attempt a safe merge if the
vendor id sets are disjoint. If a safe merge is available, the `onRemoteChange`
callback receives a `mergedValue` (JSON string). The application prompts the
user to accept the merge; if accepted the merged state is applied; if
declined, the merged payload is saved to localStorage for inspection.

To simulate multi-tab behavior locally there's a Node script:

```bash
node scripts/simulate-multi-tab.js
```

This runs a VM-based two-tab simulation and prints `onRemoteChange` events and notifications.

## Customize background
- Edit `styles.css` `--bg-url` to your own map image.

## Current architecture
- `script.js`: app bootstrap, wiring, and high-level feature orchestration.
- `app-state.js`: lightweight state store.
- `state-validation.js`: normalization and validation for loaded state.
- `persistence.js`: localStorage save/load helpers.
- `panzoom.js`: zoom and map panning behavior.
- `drag.js`: pin drag behavior.
- `selection.js`: pin selection, keyboard nudging, and picker integration.
- `pin-style-tools.js`: pin position/transform/animation helpers.
- `templates.js`: vendor template and CSV template workflows.
- `vendor-list-tools.js`: cluster detection and vendor list rendering.
- `export.js`: JPG/PDF export pipeline.

## Regression checklist
- Add pin, drag/release pin, and reload.
- Rotate/resize/height controls update visuals correctly.
- Status and custom color updates apply and persist.
- Template add/toggle/remove/clear-all flows work.
- CSV upload adds templates and pins can be toggled from templates.
- Zoom, pan, and reset map behavior remain correct.
- Save map (download), load map, and reset map behavior are stable.
- JPG/PDF export matches on-screen layout and pin colors.

## In-app health check
- Open the `Self Check` panel in the sidebar.
- Click `Run Health Check`.
- The panel validates state serialization, library structure, template-pin references, undo stack bounds, and localStorage access.

## Playwright smoke tests
1. Install dependencies:
	- `npm install`
2. Install browser binaries (first time only):
	- `npx playwright install`
3. Run smoke tests:
	- `npm run test:smoke`
4. Optional headed run:
	- `npm run test:smoke:headed`
5. Open the latest HTML report:
	- `npm run test:smoke:report`
6. Run tests and open report in one command:
	- `npm run test:smoke:run-and-report`

### Benchmarking vendor clustering

Run a Node-only benchmark (no browser deps required) to exercise the vendor clustering implementation:

- Run directly with Node (no npm deps required):

```bash
node scripts/run-benchmark-node.js
```

- Or via npm script (after installing deps):

```bash
npm run benchmark:node
```

CI: a GitHub Actions workflow `.github/workflows/benchmark.yml` runs the node benchmark on push/PR and uploads the JSON result as an artifact.

## Deployment and rollback

Deployment to GitHub Pages is handled by `.github/workflows/deploy.yml` on push to `master`.

Rollback uses the same workflow with the `rollback_sha` input:

1. Open the repository's GitHub Actions tab.
2. Select `Deploy to GitHub Pages`.
3. Choose `Run workflow`.
4. Paste the known-good commit SHA into `rollback_sha`.
5. Run the workflow and wait for the Pages deployment to finish.
6. Verify the live site reflects the target commit and that the browser loads the expected build assets.

If you prefer the GitHub CLI, the same rollback deploy can be started with:

```bash
gh workflow run "Deploy to GitHub Pages" --ref master -f rollback_sha=<known-good-sha>
```

After the deployment completes, confirm the site loads the expected build bundle and that the service worker has picked up the new artifact set.

Local verification before a deploy or rollback drill:

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173 --strictPort
```

If the live site looks stale after a rollback deploy, clear the site data for the Pages origin so the service worker can pick up the new artifact bundle.


## Roadmap
- Persistent and editable phase plan: `ROADMAP.md`
