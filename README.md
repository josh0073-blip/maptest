# Farmers Market Vendor Map (SPA)

Static background map + editable text vendor pins.

## Run
- Open `index.html` in browser.
- Click "Add Vendor Pin" to add a pin.
- Drag pins and edit names inline.
- Save state to localStorage and load later.

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

## Roadmap
- Persistent and editable phase plan: `ROADMAP.md`
