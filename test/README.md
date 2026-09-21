# Tests

```bash
npm install
npm test
```

Runs on Node's built-in test runner (`node --test`), so there is no test
framework dependency. Node 20 or newer.

## Layout

- `unit/` — tests. Everything here runs without a browser and without Chrome
  extension APIs.
- `helpers/` — shared setup: a DOM for modules that touch `document`, and
  loaders for the real themes from `src/themes`.
- the files at the top level (`test.md`, `*.svg`, `*.png`) are sample documents
  used by hand while developing, not by the automated tests.

## What is covered

| Module | Why it was picked first |
|---|---|
| `utils/html-sanitizer.js` | Untrusted markdown becomes markup the page executes. A miss here is a script running, not a layout glitch. |
| `utils/theme-manager.js` | Unit conversions (pt to px, half-points, twips). A wrong multiplier does not throw — it silently shifts every size in the exported document. |
| `utils/theme-to-css.js` | Every preset in the registry is converted and checked for leaked selectors, `undefined` and `NaN`. |
| `exporters/theme-to-docx.js` | The output is only seen after the file is opened in Word by someone else, so it is checked by numbers here. |

Tests assert what the code does today, not what it ideally should. Where current
behaviour looks questionable it is pinned with a comment explaining why, so that
a deliberate change shows up as a failing expectation rather than a surprise.

## Why jsdom is pinned to 24

Newer jsdom pulls in `@asamuzakjp/css-color`, which requires an ES module from
CommonJS and fails to load on Node 20. Before raising the version, check that
`npm test` passes on the Node version you actually ship with.

`linkedom` is lighter but not usable here: it keeps `template.content` and
`template.innerHTML` separate, so removing a node from the content is not
visible in the serialised output and the sanitizer looks broken when it is not.
