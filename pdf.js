// PDF download, built with pdfmake (vendor/pdfmake, MIT license).
// The PDF is made from the map data, not from a picture of the page, so its text
// is real text: sharp, searchable and copyable. Uses the light viridian colors.
// Relies on `map`, `COURSE_FIELDS`, `UNIT_LAYOUT` and `str` from app.js.

const PDF_COLORS = {
  text: "#1d2925",
  muted: "#586a64",
  faint: "#98a8a2",
  primary: "#2c6b5a",
  accent: "#40826d",
  highlight: "#e1f0ea",
  line: "#d3e0db",
  lineSoft: "#e6eeeb",
};

// pdfmake is large (about 2 MB), so it's only loaded the first time someone downloads a PDF.
let pdfmakeLoading = null;
function loadPdfmake() {
  if (pdfmakeLoading) return pdfmakeLoading;
  const load = (src) => new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Couldn't load ${src}`));
    document.head.append(script);
  });
  pdfmakeLoading = load("vendor/pdfmake/pdfmake.min.js")
    .then(() => load("vendor/pdfmake/vfs_fonts.js"))
    .catch((error) => {
      pdfmakeLoading = null;
      throw error;
    });
  return pdfmakeLoading;
}

// ---------- Building blocks ----------

const toBeAdded = () => ({ text: "To be added", style: "empty" });

const heading = (text) => ({ text, style: "blockHeading" });

// A labeled bullet list, or "To be added" when empty.
function listBlock(label, items) {
  return {
    stack: [heading(label), items.length ? { ul: items, style: "list" } : toBeAdded()],
    margin: [0, 0, 0, 8],
    unbreakable: true, // keep the heading with its list
  };
}

// Two blocks side by side, like the two-column grid on the page.
const twoColumns = (left, right) => ({ columns: [left, right || { text: "" }], columnGap: 20 });

function inTwoColumns(blocks) {
  const rows = [];
  for (let i = 0; i < blocks.length; i += 2) rows.push(twoColumns(blocks[i], blocks[i + 1]));
  return rows;
}

// A small uppercase title over a group (Knowledge, Skills, Assessment), with a dashed rule above it.
function group(title, body) {
  return {
    stack: [
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 526, y2: 0, lineWidth: 0.75, lineColor: PDF_COLORS.line, dash: { length: 3 } }], margin: [0, 2, 0, 6] },
      { text: title.toUpperCase(), style: "groupTitle" },
      ...body,
    ],
  };
}

// Rows separated by thin lines, with no outer border.
const rowLines = {
  hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0 : 0.5),
  vLineWidth: () => 0,
  hLineColor: () => PDF_COLORS.lineSoft,
  paddingLeft: () => 0,
  paddingRight: () => 10,
  paddingTop: () => 3,
  paddingBottom: () => 3,
};

// Standards as code | text rows, so each code lines up with its text. The heading is the
// table's header row, so it stays with at least the first standard and repeats on a new page.
function standardsBlock(label, standards) {
  const rows = standards.filter((s) => s.code || s.text);
  if (!rows.length) return { stack: [heading(label), toBeAdded()], margin: [0, 0, 0, 8], unbreakable: true };
  return {
    table: {
      widths: [72, "*"],
      headerRows: 1,
      keepWithHeaderRows: 1,
      dontBreakRows: true,
      body: [
        [{ ...heading(label), colSpan: 2 }, {}],
        ...rows.map((s) => [{ text: s.code, bold: true }, { text: s.text }]),
      ],
    },
    layout: { ...rowLines, hLineWidth: (i, node) => (i <= 1 || i === node.table.body.length ? 0 : 0.5) },
    margin: [0, 0, 0, 8],
  };
}

// The key standard in a tinted box with a viridian bar on the left.
function keyStandardBlock(label, s) {
  const filled = s.code || s.text;
  const inner = filled
    ? { columns: [{ text: s.code, bold: true, width: 72 }, { text: s.text, width: "*" }], columnGap: 10 }
    : toBeAdded();
  return {
    table: { widths: ["*"], body: [[{ stack: [{ text: label, style: "keyHeading" }, inner] }]] },
    layout: {
      fillColor: () => PDF_COLORS.highlight,
      hLineWidth: () => 0,
      vLineWidth: (i) => (i === 0 ? 3 : 0),
      vLineColor: () => PDF_COLORS.accent,
      paddingLeft: () => 10,
      paddingRight: () => 10,
      paddingTop: () => 6,
      paddingBottom: () => 6,
    },
    margin: [0, 0, 0, 10],
  };
}

// Objective | artifact pairs under two headings, so each objective sits in the same row as its artifact.
function pairTable(headings, pairs) {
  const rows = pairs.filter((p) => p.objective || p.artifact);
  const body = [headings.map((h) => ({ text: h, style: "blockHeading" }))];
  if (rows.length) for (const p of rows) body.push([{ text: p.objective }, { text: p.artifact }]);
  else body.push([{ ...toBeAdded(), colSpan: 2 }, {}]);
  return {
    // keepWithHeaderRows: the headings never sit alone at the bottom of a page.
    table: { widths: ["*", "*"], headerRows: 1, keepWithHeaderRows: 1, dontBreakRows: true, body },
    layout: rowLines,
    margin: [0, 0, 0, 8],
  };
}

// ---------- The document ----------

function unitContent(unit, index) {
  const top = [
    { canvas: [{ type: "line", x1: 0, y1: 0, x2: 526, y2: 0, lineWidth: 3, lineColor: PDF_COLORS.accent }], margin: [0, 14, 0, 8] },
    {
      text: [
        { text: `UNIT ${index + 1}   `, style: "unitNumber" },
        { text: unit.title || "Untitled unit", style: "unitTitle" },
        unit.weeks ? { text: `   ${unit.weeks} weeks`, style: "unitWeeks" } : "",
      ],
      margin: [0, 0, 0, 4],
    },
  ];
  if (unit.big_idea) top.push({ text: unit.big_idea, italics: true, margin: [0, 0, 0, 8] });

  const body = [];
  for (const entry of UNIT_LAYOUT) {
    if (entry.kind === "key_standard") {
      top.push(keyStandardBlock(entry.label, unit.key_standard));
    } else if (entry.kind === "standards") {
      body.push(standardsBlock(entry.label, unit.standards));
    } else if (entry.kind === "assessment") {
      body.push(group(entry.label, [
        pairTable(["Formative objectives", "Formative artifacts"], unit.formative),
        pairTable(["Summative objective", "Summative artifact"], [unit.summative]),
      ]));
    } else if (entry.group) {
      body.push(group(entry.group, inTwoColumns(entry.items.map(([key, label]) => listBlock(label, unit[key])))));
    } else {
      const [key, label] = entry;
      body.push(listBlock(label, unit[key]));
    }
  }
  // Keep the unit's heading, big idea and key standard together on one page.
  return [{ stack: top, unbreakable: true }, ...body];
}

function pdfDocument() {
  const facts = COURSE_FIELDS.slice(1).filter(([key]) => map[key]);
  const content = [{ text: map.course || "Untitled course", style: "courseTitle" }];
  if (facts.length) {
    content.push({
      text: facts.flatMap(([key, label], i) => [
        { text: `${i ? "      " : ""}${label}: `, bold: true },
        { text: str(map[key]) },
      ]),
      margin: [0, 0, 0, 6],
    });
  }
  if (map.description) content.push({ text: map.description, margin: [0, 0, 0, 4] });
  map.units.forEach((unit, i) => content.push(...unitContent(unit, i)));

  return {
    pageSize: "LETTER",
    pageMargins: [43, 43, 43, 50],
    info: { title: map.course || "Curriculum Map", author: map.author || undefined, creator: "Curriculum Map Builder" },
    defaultStyle: { font: "Roboto", fontSize: 9.5, lineHeight: 1.25, color: PDF_COLORS.text },
    styles: {
      courseTitle: { fontSize: 22, bold: true, color: PDF_COLORS.primary, margin: [0, 0, 0, 6] },
      unitNumber: { fontSize: 8.5, bold: true, color: PDF_COLORS.accent, characterSpacing: 1 },
      unitTitle: { fontSize: 14, bold: true },
      unitWeeks: { fontSize: 9, color: PDF_COLORS.muted },
      blockHeading: { fontSize: 10, bold: true, color: PDF_COLORS.primary, margin: [0, 0, 0, 2] },
      keyHeading: { fontSize: 10, bold: true, color: PDF_COLORS.accent, margin: [0, 0, 0, 3] },
      groupTitle: { fontSize: 8, bold: true, color: PDF_COLORS.muted, characterSpacing: 1.2, margin: [0, 0, 0, 4] },
      list: { margin: [0, 0, 0, 0] },
      empty: { italics: true, color: PDF_COLORS.faint },
    },
    content,
    footer: (page, pages) => ({
      columns: [
        { text: "Made with the Curriculum Map Builder · waterdog.institute", alignment: "left" },
        { text: `Page ${page} of ${pages}`, alignment: "right" },
      ],
      fontSize: 7.5,
      color: PDF_COLORS.muted,
      margin: [43, 16, 43, 0],
    }),
  };
}

function pdfFileName() {
  const slug = (map.course || "curriculum-map").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug || "curriculum-map"}.pdf`;
}

async function downloadPdf(button) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = "Making PDF…";
  try {
    await loadPdfmake();
    pdfMake.createPdf(pdfDocument()).download(pdfFileName());
  } catch (error) {
    console.error(error);
    alert("Sorry, the PDF couldn't be made. You can use Print and choose Save as PDF instead.");
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}
