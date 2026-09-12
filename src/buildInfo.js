// Shows which commit is actually deployed, so a coach who just saw a fix
// pushed can tell whether their browser is serving it or a cached copy
// (see docs/plan.md §10). version.json is generated fresh by the GitHub
// Actions Pages workflow (.github/workflows/deploy-pages.yml) at deploy
// time, keyed to the exact commit that triggered the deploy — it doesn't
// exist for a local/dev checkout. The fetch itself deliberately bypasses
// the cache, so this always reflects the true current deployment even if
// the rest of the page (app.js, css) is stale in the browser's cache.
export function renderBuildInfo(container) {
  fetch("./version.json", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((info) => {
      container.textContent = info
        ? `Build ${info.shortSha} · deployed ${info.builtAt}`
        : "Local build (no version.json)";
    })
    .catch(() => {
      container.textContent = "Local build (no version.json)";
    });
}
