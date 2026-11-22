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

// Each unit field that holds a list, in the order it's shown: key, label, form hint.
// Key standards are the few the unit teaches to mastery; Standards are the others it touches.
const UNIT_LISTS = [
  ["key_standards", "Key standards", "The standards this unit teaches to mastery, one per line"],
  ["standards", "Standards", "Other standards this unit touches, one per line"],
  ["essential_questions", "Essential questions"],
  ["key_concepts", "Key concepts"],
  ["vocabulary", "Vocabulary"],
  ["activities", "Labs and activities"],
  ["assessments", "Assessments"],
];

let map = loadSaved() || blankMap();
let fileName = "curriculum-map.json";

// ---------- Data ----------

function blankUnit() {
  const unit = { title: "", weeks: "", big_idea: "" };
  for (const [key] of UNIT_LISTS) unit[key] = [];
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

    panel.append(field("Title", unit, "title", { placeholder: "Unit title" }));
    panel.append(field("Weeks", unit, "weeks", { placeholder: "e.g. 6" }));
    panel.append(field("Big idea", unit, "big_idea", { multiline: true, placeholder: "The main idea of the unit" }));
    for (const [key, label, hint] of UNIT_LISTS) panel.append(field(label, unit, key, { list: true, placeholder: hint }));
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

function renderList(key, label, items) {
  const block = el("section", key === "key_standards" ? "unit-block key" : "unit-block");
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
    for (const [key, label] of UNIT_LISTS) grid.append(renderList(key, label, unit[key]));
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

renderEditor();
renderPreview();
