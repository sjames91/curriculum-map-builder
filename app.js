// Curriculum Map Builder
// Loads a curriculum map (a JSON file), shows it as a formatted page, and lets the
// user save the map file or print it to PDF with the browser's print dialog.

const SAMPLE_MAP = "maps/earth-science.json";

// Each unit field that holds a list, in the order it's shown, with its label.
const UNIT_LISTS = [
  ["essential_questions", "Essential questions"],
  ["standards", "Standards"],
  ["key_concepts", "Key concepts"],
  ["vocabulary", "Vocabulary"],
  ["activities", "Labs and activities"],
  ["assessments", "Assessments"],
];

let currentMap = null;
let currentFileName = "curriculum-map.json";

// Make an element with a class and text. Text is always set with textContent,
// so nothing in a map file can inject HTML into the page.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderList(label, items) {
  const block = el("section", "unit-block");
  block.append(el("h4", null, label));
  if (!items || items.length === 0) {
    block.append(el("p", "empty", "To be added"));
    return block;
  }
  const list = el("ul");
  for (const item of items) list.append(el("li", null, item));
  block.append(list);
  return block;
}

function renderUnit(unit, index) {
  const card = el("section", "unit");

  const head = el("header", "unit-head");
  head.append(el("p", "unit-number", `Unit ${index + 1}`));
  head.append(el("h3", null, unit.title || "Untitled unit"));
  if (unit.weeks) head.append(el("p", "unit-weeks", `${unit.weeks} weeks`));
  card.append(head);

  if (unit.big_idea) card.append(el("p", "big-idea", unit.big_idea));

  const grid = el("div", "unit-grid");
  for (const [key, label] of UNIT_LISTS) grid.append(renderList(label, unit[key]));
  card.append(grid);

  return card;
}

function renderMap(map) {
  const root = document.getElementById("map");
  root.replaceChildren();

  const head = el("header", "map-head");
  head.append(el("h2", null, map.course || "Untitled course"));

  const facts = [
    ["Grade", map.grade],
    ["Length", map.length],
    ["Standards", map.standards],
    ["Author", map.author],
  ].filter(([, value]) => value);
  if (facts.length) {
    const dl = el("dl", "map-facts");
    for (const [label, value] of facts) {
      const pair = el("div");
      pair.append(el("dt", null, label), el("dd", null, value));
      dl.append(pair);
    }
    head.append(dl);
  }
  if (map.description) head.append(el("p", "map-description", map.description));
  root.append(head);

  const units = Array.isArray(map.units) ? map.units : [];
  units.forEach((unit, i) => root.append(renderUnit(unit, i)));

  root.append(el("footer", "map-footer", "Made with the Curriculum Map Builder · waterdog.institute"));
  document.title = `${map.course || "Curriculum Map"} | Curriculum Map Builder`;
}

function showMap(map, fileName) {
  currentMap = map;
  if (fileName) currentFileName = fileName;
  renderMap(map);
}

function showError(message) {
  const root = document.getElementById("map");
  root.replaceChildren(el("p", "error", message));
}

async function loadSample() {
  try {
    const response = await fetch(SAMPLE_MAP);
    if (!response.ok) throw new Error(response.statusText);
    showMap(await response.json(), "earth-science.json");
  } catch {
    showError("Couldn't load the sample map. Use Open map to load a map file.");
  }
}

document.getElementById("open-file").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      showMap(JSON.parse(reader.result), file.name);
    } catch {
      showError(`"${file.name}" isn't a valid map file.`);
    }
  };
  reader.readAsText(file);
  event.target.value = ""; // so opening the same file again still triggers a change
});

document.getElementById("save-file").addEventListener("click", () => {
  if (!currentMap) return;
  const blob = new Blob([JSON.stringify(currentMap, null, 2)], { type: "application/json" });
  const link = el("a");
  link.href = URL.createObjectURL(blob);
  link.download = currentFileName;
  link.click();
  URL.revokeObjectURL(link.href);
});

document.getElementById("download-pdf").addEventListener("click", () => window.print());

loadSample();
