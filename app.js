// Curriculum Map Builder
// Build a curriculum map in a form, see it formatted as you type, save it as a
// .json file to open later, and print it to PDF with the browser's print dialog.

const STORAGE_KEY = "curriculum-map-builder:map";

// Course fields shown at the top of the form, in order.
const COURSE_FIELDS = [
  ["course", "Course", "e.g. Earth Science"],
  ["grade", "Grade", "e.g. 9th grade"],
  ["length", "Length", "e.g. Full year, 36 weeks"],
  ["standards", "Standards", "e.g. NM STEM Ready! Science Standards"],
  ["author", "Author", "Your name"],
];

// The sections of a unit, in the order they're shown. A plain entry is a list:
// [key, label, form hint]. A group is { group: "Name", items: [...lists] }.
// A { kind } entry is a section with its own layout (standards and assessment).
// Key standard: the standard the unit teaches to mastery. Standards: the others it touches.
const UNIT_LAYOUT = [
  { kind: "key_standard", label: "Key standard" },
  { kind: "standards", label: "Standards" },
  ["essential_questions", "Essential question"],
  { group: "Knowledge", items: [
    ["key_concepts", "Key concepts"],
    ["vocabulary", "Vocabulary"],
  ] },
  { group: "Skills", items: [
    ["skills_receptive", "Receptive"],
    ["skills_processing", "Processing"],
    ["skills_expressive", "Expressive"],
    ["skills_physical", "Physical"],
  ] },
  ["activities", "Learning activities"],
  { kind: "assessment", label: "Assessment" },
];

// Every list field, flattened out of the groups.
const UNIT_LISTS = UNIT_LAYOUT.flatMap((entry) => (Array.isArray(entry) ? [entry] : entry.group ? entry.items : []));

// A standard is a code plus its full text. An assessment pair is an objective plus its artifact.
const blankStandard = () => ({ code: "", text: "" });
const blankPair = () => ({ objective: "", artifact: "" });
const str = (value) => (value == null ? "" : String(value));

let map = loadSaved() || blankMap();
let fileName = "curriculum-map.json";

// ---------- Data ----------

function blankUnit() {
  const unit = { title: "", weeks: "", big_idea: "", key_standard: blankStandard(), standards: [] };
  for (const [key] of UNIT_LISTS) unit[key] = [];
  unit.formative = [];
  unit.summative = blankPair();
  return unit;
}

function blankMap() {
  const m = { description: "", units: [blankUnit()] };
  for (const [key] of COURSE_FIELDS) m[key] = "";
  return m;
}

// Fill in anything missing, so maps from older or hand-made files still work.
function normalize(input) {
  const m = blankMap();
  for (const key of Object.keys(m)) if (key !== "units" && typeof input[key] === "string") m[key] = input[key];
  const units = Array.isArray(input.units) && input.units.length ? input.units : [{}];
  m.units = units.map((u) => {
    const unit = blankUnit();
    for (const key of ["title", "weeks", "big_idea"]) if (u[key] != null) unit[key] = String(u[key]);
    for (const [key] of UNIT_LISTS) if (Array.isArray(u[key])) unit[key] = u[key].map(String);

    // Standards. Older maps stored plain strings; those are kept as codes.
    const toStandard = (s) => (s && typeof s === "object" ? { code: str(s.code), text: str(s.text) } : { code: str(s), text: "" });
    if (Array.isArray(u.standards)) unit.standards = u.standards.map(toStandard);
    if (u.key_standard && typeof u.key_standard === "object") {
      unit.key_standard = toStandard(u.key_standard);
    } else if (Array.isArray(u.key_standards) && u.key_standards.length) {
      // Older maps had a list of key standards: the first stays the key standard, any others join Standards.
      const [first, ...rest] = u.key_standards.map(toStandard);
      unit.key_standard = first;
      unit.standards = [...rest, ...unit.standards];
    }

    // Assessment pairs. Older maps had separate lists; formative ones are paired up by position,
    // and summative ones (or an even older "assessments" list) are joined into the one pair.
    const toPair = (p) => ({ objective: str(p && p.objective), artifact: str(p && p.artifact) });
    const list = (key) => (Array.isArray(u[key]) ? u[key].map(String) : []);
    if (Array.isArray(u.formative)) {
      unit.formative = u.formative.map(toPair);
    } else {
      const objectives = list("formative_objectives");
      const artifacts = list("formative_artifacts");
      for (let j = 0; j < Math.max(objectives.length, artifacts.length); j++) {
        unit.formative.push({ objective: objectives[j] || "", artifact: artifacts[j] || "" });
      }
    }
    if (u.summative && typeof u.summative === "object") {
      unit.summative = toPair(u.summative);
    } else {
      const artifacts = list("summative_artifacts").length ? list("summative_artifacts") : list("assessments");
      unit.summative = { objective: list("summative_objectives").join("\n"), artifact: artifacts.join("\n") };
    }
    return unit;
  });
  return m;
}

function loadSaved() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalize(JSON.parse(saved)) : null;
  } catch {
    return null;
  }
}

function changed() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  renderPreview();
}

// ---------- Small helpers ----------

// Make an element with a class and text. Text is always set with textContent,
// so nothing typed into the form or loaded from a file can inject HTML.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// A labeled text input or textarea bound to obj[key].
function field(label, obj, key, { placeholder = "", multiline = false, list = false } = {}) {
  const wrap = el("label", "field");
  wrap.append(el("span", "field-label", label));
  const input = multiline || list ? el("textarea") : el("input");
  if (!multiline && !list) input.type = "text";
  if (list) {
    input.rows = 3;
    input.value = obj[key].join("\n");
    input.placeholder = placeholder || "One per line";
    input.addEventListener("input", () => {
      obj[key] = input.value.split("\n").map((s) => s.trim()).filter(Boolean);
      changed();
    });
  } else {
    if (multiline) input.rows = 2;
    input.value = obj[key];
    input.placeholder = placeholder;
    input.addEventListener("input", () => {
      obj[key] = input.value;
      changed();
    });
  }
  wrap.append(input);
  return wrap;
}

function smallButton(text, onClick, { disabled = false, danger = false } = {}) {
  const b = el("button", danger ? "btn-small danger" : "btn-small", text);
  b.type = "button";
  b.disabled = disabled;
  b.addEventListener("click", onClick);
  return b;
}

// An unlabeled input or textarea bound to obj[key], for use inside rows.
function input(obj, key, { placeholder = "", multiline = false, label = "" } = {}) {
  const node = multiline ? el("textarea") : el("input");
  if (multiline) node.rows = 2;
  else node.type = "text";
  node.value = obj[key];
  node.placeholder = placeholder;
  if (label) node.setAttribute("aria-label", label);
  node.addEventListener("input", () => {
    obj[key] = node.value;
    changed();
  });
  return node;
}

// Column headings for a set of rows. `removable` adds an empty slot over the remove buttons.
function rowHeads(className, headings, removable) {
  const head = el("div", `row-head ${className}`);
  for (const h of headings) head.append(el("span", null, h));
  if (removable) head.append(el("span"));
  return head;
}

// Rows that can be added and removed. `cells(item)` returns the inputs for one row.
function rowList(className, items, cells, blank, addText) {
  const wrap = el("div", "rows");
  items.forEach((item, i) => {
    const row = el("div", `row ${className}`);
    row.append(...cells(item));
    const remove = smallButton("×", () => {
      items.splice(i, 1);
      changed();
      renderEditor();
    }, { danger: true });
    remove.title = "Remove";
    remove.setAttribute("aria-label", "Remove");
    row.append(remove);
    wrap.append(row);
  });
  wrap.append(smallButton(addText, () => {
    items.push(blank());
    changed();
    renderEditor();
  }));
  return wrap;
}

const standardCells = (s, name) => [
  input(s, "code", { placeholder: "Code", label: `${name} code` }),
  input(s, "text", { placeholder: "Full standard text", multiline: true, label: `${name} text` }),
];

const pairCells = (p, kind) => [
  input(p, "objective", { placeholder: "Objective", multiline: true, label: `${kind} objective` }),
  input(p, "artifact", { placeholder: "Artifact", multiline: true, label: `${kind} artifact` }),
];

function editKeyStandard(unit, label) {
  const wrap = el("div", "field");
  wrap.append(el("span", "field-label", label));
  const row = el("div", "row std single");
  row.append(...standardCells(unit.key_standard, label));
  wrap.append(row);
  return wrap;
}

function editStandards(unit, label) {
  const wrap = el("div", "field");
  wrap.append(el("span", "field-label", label));
  wrap.append(rowList("std", unit.standards, (s) => standardCells(s, "Standard"), blankStandard, "+ Add standard"));
  return wrap;
}

function editAssessment(unit, label) {
  const group = el("div", "field-group");
  group.append(el("p", "field-group-title", label));

  const formative = el("div", "field");
  formative.append(rowHeads("pair", ["Formative objectives", "Formative artifacts"], true));
  formative.append(rowList("pair", unit.formative, (p) => pairCells(p, "Formative"), blankPair, "+ Add formative pair"));
  group.append(formative);

  const summative = el("div", "field");
  summative.append(rowHeads("pair single", ["Summative objective", "Summative artifact"], false));
  const row = el("div", "row pair single");
  row.append(...pairCells(unit.summative, "Summative"));
  summative.append(row);
  group.append(summative);
  return group;
}

// ---------- Editor ----------

function renderEditor() {
  const root = document.getElementById("editor");
  root.replaceChildren();

  const course = el("fieldset", "panel");
  course.append(el("legend", null, "Course"));
  for (const [key, label, placeholder] of COURSE_FIELDS) course.append(field(label, map, key, { placeholder }));
  course.append(field("Description", map, "description", { multiline: true, placeholder: "A sentence or two about the course" }));
  root.append(course);

  map.units.forEach((unit, i) => {
    const panel = el("fieldset", "panel");
    panel.append(el("legend", null, `Unit ${i + 1}`));

    const controls = el("div", "unit-controls");
    controls.append(
      smallButton("Move up", () => moveUnit(i, -1), { disabled: i === 0 }),
      smallButton("Move down", () => moveUnit(i, 1), { disabled: i === map.units.length - 1 }),
      smallButton("Remove", () => removeUnit(i), { danger: true, disabled: map.units.length === 1 }),
    );
    panel.append(controls);

    const titleRow = el("div", "field-row");
    titleRow.append(
      field("Title", unit, "title", { placeholder: "Unit title" }),
      field("Weeks", unit, "weeks", { placeholder: "e.g. 6" }),
    );
    panel.append(titleRow);
    panel.append(field("Big idea", unit, "big_idea", { multiline: true, placeholder: "The main idea of the unit" }));

    for (const entry of UNIT_LAYOUT) {
      if (entry.kind === "key_standard") {
        panel.append(editKeyStandard(unit, entry.label));
      } else if (entry.kind === "standards") {
        panel.append(editStandards(unit, entry.label));
      } else if (entry.kind === "assessment") {
        panel.append(editAssessment(unit, entry.label));
      } else if (entry.group) {
        const group = el("div", "field-group");
        group.append(el("p", "field-group-title", entry.group));
        for (const [key, label, hint] of entry.items) group.append(field(label, unit, key, { list: true, placeholder: hint }));
        panel.append(group);
      } else {
        const [key, label, hint] = entry;
        panel.append(field(label, unit, key, { list: true, placeholder: hint }));
      }
    }
    root.append(panel);
  });

  const add = el("button", "btn btn-outline add-unit", "+ Add unit");
  add.type = "button";
  add.addEventListener("click", () => {
    map.units.push(blankUnit());
    changed();
    renderEditor();
    root.lastElementChild.previousElementSibling.scrollIntoView({ behavior: "smooth" });
  });
  root.append(add);
}

function moveUnit(i, step) {
  const j = i + step;
  [map.units[i], map.units[j]] = [map.units[j], map.units[i]];
  changed();
  renderEditor();
}

function removeUnit(i) {
  const name = map.units[i].title || `Unit ${i + 1}`;
  if (!confirm(`Remove "${name}"? This can't be undone.`)) return;
  map.units.splice(i, 1);
  changed();
  renderEditor();
}

// ---------- Preview ----------

function renderList(label, items) {
  const block = el("section", "unit-block");
  block.append(el("h4", null, label));
  if (!items.length) {
    block.append(el("p", "empty", "To be added"));
    return block;
  }
  const list = el("ul");
  for (const item of items) list.append(el("li", null, item));
  block.append(list);
  return block;
}

// Standards as a two-column table: code, then full text, so each code lines up with its text.
function renderStandards(label, standards, isKey) {
  const block = el("section", isKey ? "unit-block wide key" : "unit-block wide");
  block.append(el("h4", null, label));
  const rows = standards.filter((s) => s.code || s.text);
  if (!rows.length) {
    block.append(el("p", "empty", "To be added"));
    return block;
  }
  const table = el("table", "std-table");
  for (const s of rows) {
    const tr = el("tr");
    tr.append(el("td", "std-code", s.code), el("td", "std-text", s.text));
    table.append(tr);
  }
  block.append(table);
  return block;
}

// Objective / artifact pairs as a table, so each objective sits in the same row as its artifact.
function renderPairs(headings, pairs) {
  const table = el("table", "pair-table");
  const head = el("tr");
  for (const h of headings) head.append(el("th", null, h));
  table.append(el("thead"));
  table.tHead.append(head);
  const body = el("tbody");
  const rows = pairs.filter((p) => p.objective || p.artifact);
  if (!rows.length) {
    const td = el("td", "empty", "To be added");
    td.colSpan = 2;
    body.append(el("tr"));
    body.lastChild.append(td);
  }
  for (const p of rows) {
    const tr = el("tr");
    tr.append(el("td", null, p.objective), el("td", null, p.artifact));
    body.append(tr);
  }
  table.append(body);
  return table;
}

function renderPreview() {
  const root = document.getElementById("map");
  root.replaceChildren();

  const head = el("header", "map-head");
  head.append(el("h2", null, map.course || "Untitled course"));
  const facts = COURSE_FIELDS.slice(1).filter(([key]) => map[key]);
  if (facts.length) {
    const dl = el("dl", "map-facts");
    for (const [key, label] of facts) {
      const pair = el("div");
      pair.append(el("dt", null, label), el("dd", null, map[key]));
      dl.append(pair);
    }
    head.append(dl);
  }
  if (map.description) head.append(el("p", "map-description", map.description));
  root.append(head);

  map.units.forEach((unit, i) => {
    const card = el("section", "unit");
    const unitHead = el("header", "unit-head");
    unitHead.append(el("p", "unit-number", `Unit ${i + 1}`));
    unitHead.append(el("h3", null, unit.title || "Untitled unit"));
    if (unit.weeks) unitHead.append(el("p", "unit-weeks", `${unit.weeks} weeks`));
    card.append(unitHead);
    if (unit.big_idea) card.append(el("p", "big-idea", unit.big_idea));
    const grid = el("div", "unit-grid");
    for (const entry of UNIT_LAYOUT) {
      if (entry.kind === "key_standard") {
        grid.append(renderStandards(entry.label, [unit.key_standard], true));
      } else if (entry.kind === "standards") {
        grid.append(renderStandards(entry.label, unit.standards, false));
      } else if (entry.kind === "assessment") {
        const group = el("section", "unit-group");
        group.append(el("h4", "unit-group-title", entry.label));
        group.append(renderPairs(["Formative objectives", "Formative artifacts"], unit.formative));
        group.append(renderPairs(["Summative objective", "Summative artifact"], [unit.summative]));
        grid.append(group);
      } else if (entry.group) {
        // A group spans the full width, with its own heading and sub-sections.
        const group = el("section", "unit-group");
        group.append(el("h4", "unit-group-title", entry.group));
        const inner = el("div", "unit-grid");
        for (const [key, label] of entry.items) inner.append(renderList(label, unit[key]));
        group.append(inner);
        grid.append(group);
      } else {
        const [key, label] = entry;
        grid.append(renderList(label, unit[key]));
      }
    }
    card.append(grid);
    root.append(card);
  });

  root.append(el("footer", "map-footer", "Made with the Curriculum Map Builder · waterdog.institute"));
  document.title = `${map.course || "Curriculum Map"} | Curriculum Map Builder`;
}

// ---------- Toolbar ----------

document.getElementById("new-map").addEventListener("click", () => {
  if (!confirm("Start a new, blank map? Save your current map first if you want to keep it.")) return;
  map = blankMap();
  fileName = "curriculum-map.json";
  changed();
  renderEditor();
});

document.getElementById("open-file").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      map = normalize(JSON.parse(reader.result));
      fileName = file.name;
      changed();
      renderEditor();
    } catch {
      alert(`"${file.name}" isn't a valid map file.`);
    }
  };
  reader.readAsText(file);
  event.target.value = ""; // so opening the same file again still triggers a change
});

document.getElementById("save-file").addEventListener("click", () => {
  if (map.course) fileName = map.course.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".json";
  const blob = new Blob([JSON.stringify(map, null, 2)], { type: "application/json" });
  const link = el("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
});

document.getElementById("download-pdf").addEventListener("click", () => window.print());

// Light/dark theme. The starting theme is set in index.html before the page draws.
const THEME_KEY = "curriculum-map-builder:theme";
const themeButton = document.getElementById("theme-toggle");
function showThemeButton() {
  const dark = document.documentElement.dataset.theme === "dark";
  themeButton.textContent = dark ? "Light mode" : "Dark mode";
  themeButton.setAttribute("aria-pressed", String(dark));
}
themeButton.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
  showThemeButton();
});
showThemeButton();

renderEditor();
renderPreview();
