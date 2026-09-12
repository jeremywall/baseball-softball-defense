import * as store from "./state/store.js";
import { renderSetupSection } from "./views/setupView.js";
import { renderResultsSection } from "./views/resultsView.js";
import { renderBuildInfo } from "./buildInfo.js";

const app = document.getElementById("app");
const pageTitle = document.getElementById("page-title");

// One screen, two states (docs/plan.md §3): the input state (attendance +
// options) until "Assign Positions" is tapped, then the result state (the
// two tables). No router, no manual-assignment state in between. The page
// title lives in the persistent header (index.html), not inside either
// view, so it can sit on the same row as the build-info footer (§10).
function render() {
  pageTitle.textContent = store.getGame() ? "Alignment" : "Game Setup";
  app.innerHTML = "";
  const el = document.createElement("div");
  if (store.getGame()) {
    renderResultsSection(el);
  } else {
    renderSetupSection(el);
  }
  app.appendChild(el);
}

store.subscribe(render);
render();

const buildInfoEl = document.getElementById("build-info");
if (buildInfoEl) renderBuildInfo(buildInfoEl);
