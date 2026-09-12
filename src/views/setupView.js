import * as store from "../state/store.js";

// Input state (docs/plan.md §3, §5.2): attendance + game options, ending
// in the one "Assign Positions" action. No manual assignment UI.
export function renderSetupSection(container) {
  container.innerHTML = "";

  container.appendChild(renderAttendance());
  container.appendChild(renderInningsPicker());
  container.appendChild(renderAlignmentModePicker());
  container.appendChild(renderPitcherLimitToggle());

  const assignBtn = document.createElement("button");
  assignBtn.type = "button";
  assignBtn.className = "primary-action";
  assignBtn.textContent = "Assign Positions";
  assignBtn.disabled = !store.canAssign();
  assignBtn.addEventListener("click", () => store.assignPositions());
  container.appendChild(assignBtn);

  if (!store.canAssign()) {
    const hint = document.createElement("p");
    hint.className = "field-hint";
    hint.textContent = `At least 7 players must be marked present (currently ${store.presentCount()}).`;
    container.appendChild(hint);
  }
}

function renderAttendance() {
  const section = document.createElement("section");
  section.className = "setup-section";

  const header = document.createElement("div");
  header.className = "attendance-header";

  const h2 = document.createElement("h2");
  h2.textContent = `Attendance (${store.presentCount()} present)`;
  header.appendChild(h2);

  const allPresentBtn = document.createElement("button");
  allPresentBtn.type = "button";
  allPresentBtn.className = "text-action";
  allPresentBtn.textContent = "All Present";
  allPresentBtn.addEventListener("click", () => store.toggleAllAttendance());
  header.appendChild(allPresentBtn);

  section.appendChild(header);

  const list = document.createElement("div");
  list.className = "attendance-list";
  for (const player of store.players) {
    const label = document.createElement("label");
    label.className = "attendance-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = store.setup.attendance.has(player.id);
    checkbox.addEventListener("change", () => store.toggleAttendance(player.id));

    const span = document.createElement("span");
    span.textContent = player.name;

    label.appendChild(checkbox);
    label.appendChild(span);
    list.appendChild(label);
  }
  section.appendChild(list);
  return section;
}

function renderInningsPicker() {
  const section = document.createElement("section");
  section.className = "setup-section";

  const label = document.createElement("label");
  label.className = "field-label";
  label.textContent = "Number of Innings";

  const select = document.createElement("select");
  select.className = "field-select";
  for (const n of [6, 7, 8, 9]) {
    const opt = document.createElement("option");
    opt.value = n;
    opt.textContent = n;
    if (store.setup.numInnings === n) opt.selected = true;
    select.appendChild(opt);
  }
  select.addEventListener("change", (e) => store.setNumInnings(e.target.value));

  label.appendChild(select);
  section.appendChild(label);
  return section;
}

function renderAlignmentModePicker() {
  const section = document.createElement("section");
  section.className = "setup-section";

  const legend = document.createElement("h2");
  legend.textContent = "Alignment Mode";
  section.appendChild(legend);

  const options = [
    { value: 9, label: "9 positions (3 outfielders)" },
    { value: 10, label: "10 positions (4 outfielders)" },
  ];

  for (const opt of options) {
    const label = document.createElement("label");
    label.className = "radio-item";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "alignment-mode";
    radio.value = opt.value;
    radio.checked = store.setup.alignmentMode === opt.value;
    radio.addEventListener("change", () => store.setAlignmentMode(opt.value));

    const span = document.createElement("span");
    span.textContent = opt.label;

    label.appendChild(radio);
    label.appendChild(span);
    section.appendChild(label);
  }

  if (store.setup.alignmentMode === 10 && store.presentCount() <= 9 && store.presentCount() > 0) {
    const hint = document.createElement("p");
    hint.className = "field-hint";
    hint.textContent = "10-position mode needs at least 10 present players; 9-position mode will be used instead.";
    section.appendChild(hint);
  }

  return section;
}

function renderPitcherLimitToggle() {
  const section = document.createElement("section");
  section.className = "setup-section";

  const label = document.createElement("label");
  label.className = "attendance-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = store.setup.pitcherLimit === 1;
  checkbox.addEventListener("change", (e) => store.setPitcherLimit(e.target.checked ? 1 : 2));

  const span = document.createElement("span");
  span.textContent = "Limit pitchers to 1 inning (unchecked allows up to 2)";

  label.appendChild(checkbox);
  label.appendChild(span);
  section.appendChild(label);
  return section;
}
