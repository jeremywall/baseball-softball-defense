# baseball-softball-defense

A static, client-side-only web app for building a Little League defensive
alignment across a game's innings. See `docs/plan.md` for the full design
plan, including the tracked list of hard rules.

## Running locally

This is plain HTML/CSS/ES modules with no build step, but browsers block
`type="module"` scripts from loading over the bare `file://` protocol, so
serve the folder over HTTP rather than double-clicking `index.html`. Any
static file server works, for example:

```
npx serve .
```

or

```
python -m http.server
```

Then open the printed `localhost` URL.

## Tests

Rules-engine and model unit tests run under Node's built-in test runner:

```
npm test
```
