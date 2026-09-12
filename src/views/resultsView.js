import * as store from "../state/store.js";
import { labelFor } from "../models/positions.js";
import { nameOf } from "../models/game.js";
import { countCategories } from "../models/stats.js";
import { validateAll, validateSoft } from "../rules/index.js";

// Result state (docs/plan.md §3, §5.4-5.6): the two output tables, a
// non-blocking rule check, and Regenerate/Start Over. No manual editing.
export function renderResultsSection(container) {
  const game = store.getGame();
  if (!game) return;
  container.innerHTML = "";

  const heading = document.createElement("h1");
  heading.className = "view-title";
  heading.textContent = "Alignment";
  container.appendChild(heading);

  container.appendChild(renderActions());
  container.appendChild(renderAssignmentGrid(game));
  container.appendChild(renderPlayerSummary(game));
  container.appendChild(renderRuleCheck(game));
  container.appendChild(renderSoftNotices(game));
}

function renderActions() {
  const actions = document.createElement("div");
  actions.className = "align-actions no-print";

  const regenBtn = document.createElement("button");
  regenBtn.type = "button";
  regenBtn.className = "primary-action";
  regenBtn.textContent = "Regenerate";
  regenBtn.addEventListener("click", () => store.regenerate());
  actions.appendChild(regenBtn);

  const printBtn = document.createElement("button");
  printBtn.type = "button";
  printBtn.className = "secondary-action";
  printBtn.textContent = "Print";
  printBtn.addEventListener("click", () => window.print());
  actions.appendChild(printBtn);

  const startOverBtn = document.createElement("button");
  startOverBtn.type = "button";
  startOverBtn.className = "text-action";
  startOverBtn.textContent = "Start Over";
  startOverBtn.addEventListener("click", () => {
    if (confirm("Discard this alignment and re-check attendance?")) store.startOver();
  });
  actions.appendChild(startOverBtn);

  return actions;
}

function renderAssignmentGrid(game) {
  const wrap = document.createElement("div");
  wrap.className = "grid-scroll";

  const table = document.createElement("table");
  table.className = "review-grid";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  headRow.appendChild(document.createElement("th"));
  for (const inning of game.innings) {
    const th = document.createElement("th");
    th.textContent = `Inn ${inning.number}`;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const pos of game.positions) {
    const row = document.createElement("tr");
    const rowHead = document.createElement("th");
    rowHead.scope = "row";
    rowHead.textContent = labelFor(game.alignmentMode, pos.id);
    row.appendChild(rowHead);
    for (const inning of game.innings) {
      const td = document.createElement("td");
      const pid = inning.assignments[pos.id];
      td.textContent = pid ? nameOf(game, pid) : "—";
      row.appendChild(td);
    }
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

function renderPlayerSummary(game) {
  const wrap = document.createElement("div");
  wrap.className = "grid-scroll";

  const table = document.createElement("table");
  table.className = "review-grid";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of ["Player", "Pitcher", "Catcher", "Infield", "Outfield", "Bench"]) {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const pid of game.presentPlayerIds) {
    const { infield, outfield, bench, pitch, catcher } = countCategories(game, pid);
    // The rules' "infield" category (§4) folds pitcher/catcher in for
    // HR-2/HR-5/HR-6 purposes; this table breaks them out as their own
    // columns, so the displayed "Infield" here is the dirt positions only.
    const dirtInfield = infield - pitch - catcher;
    const row = document.createElement("tr");
    const nameCell = document.createElement("th");
    nameCell.scope = "row";
    nameCell.textContent = nameOf(game, pid);
    row.appendChild(nameCell);
    for (const val of [pitch, catcher, dirtInfield, outfield, bench]) {
      const td = document.createElement("td");
      td.textContent = val;
      row.appendChild(td);
    }
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

function renderRuleCheck(game) {
  const section = document.createElement("section");
  section.className = "validation-panel";
  const heading = document.createElement("h2");
  heading.textContent = "Rule Check";
  section.appendChild(heading);

  const violations = validateAll(game);
  if (violations.length === 0) {
    const ok = document.createElement("p");
    ok.className = "validation-ok";
    ok.textContent = "No hard-rule violations.";
    section.appendChild(ok);
    return section;
  }

  const hint = document.createElement("p");
  hint.className = "field-hint no-print";
  hint.textContent = "Tap Regenerate for a different alignment.";
  section.appendChild(hint);

  const list = document.createElement("ul");
  list.className = "violation-list";
  for (const v of violations) {
    const li = document.createElement("li");
    li.textContent = `[${v.ruleId}] ${v.message}`;
    list.appendChild(li);
  }
  section.appendChild(list);
  return section;
}

// Soft preferences (docs/plan.md §6.2) — never blocking, just informational.
function renderSoftNotices(game) {
  const notices = validateSoft(game);
  if (notices.length === 0) return document.createDocumentFragment();

  const section = document.createElement("section");
  section.className = "validation-panel soft-panel no-print";
  const heading = document.createElement("h2");
  heading.textContent = "Position Variety (optional)";
  section.appendChild(heading);

  const list = document.createElement("ul");
  list.className = "notice-list";
  for (const n of notices) {
    const li = document.createElement("li");
    li.textContent = n.message;
    list.appendChild(li);
  }
  section.appendChild(list);
  return section;
}
