#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createRequire } = require("node:module");

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key.startsWith("--") || !value || value.startsWith("--")) {
      throw new Error(`Expected --key value argument, got ${key}`);
    }
    args[key.slice(2)] = value;
    index += 1;
  }
  return args;
}

function runtimeRequire() {
  const nodeModules =
    process.env.CODEX_NODE_MODULES ||
    path.join(
      os.homedir(),
      ".cache",
      "codex-runtimes",
      "codex-primary-runtime",
      "dependencies",
      "node",
      "node_modules"
    );
  return createRequire(path.join(nodeModules, "_runtime.js"));
}

function repoRequire() {
  return createRequire(path.join(__dirname, "..", "package.json"));
}

function addXmlDefault(contentTypesXml, extension, contentType) {
  if (contentTypesXml.includes(`Extension="${extension}"`)) {
    return contentTypesXml;
  }
  return contentTypesXml.replace(
    "</Types>",
    `<Default Extension="${extension}" ContentType="${contentType}"/></Types>`
  );
}

function addRelationship(relsXml, id, type, target) {
  if (relsXml.includes(`Id="${id}"`)) {
    return relsXml;
  }
  return relsXml.replace(
    "</Relationships>",
    `<Relationship Id="${id}" Type="${type}" Target="${target}"/></Relationships>`
  );
}

async function replaceZipText(zip, entryPath, replacer) {
  const entry = zip.file(entryPath);
  if (!entry) {
    return;
  }
  zip.file(entryPath, replacer(await entry.async("string")));
}

async function patchEmbeddedObject(outPath, jszip) {
  const zip = await jszip.loadAsync(fs.readFileSync(outPath));
  zip.file(
    "ppt/embeddings/sample-object.bin",
    Buffer.from("Synthetic embedded object payload for Office Markdown PPTX fixture.\n", "utf8")
  );

  const relPath = "ppt/slides/_rels/slide1.xml.rels";
  const relsXml = await zip.file(relPath).async("string");
  zip.file(
    relPath,
    addRelationship(
      relsXml,
      "rIdOfficeObject1",
      "http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject",
      "../embeddings/sample-object.bin"
    )
  );

  const typesXml = await zip.file("[Content_Types].xml").async("string");
  zip.file("[Content_Types].xml", addXmlDefault(typesXml, "bin", "application/octet-stream"));

  await replaceZipText(zip, "ppt/slides/slide1.xml", (slideXml) =>
    slideXml.replace(
      /descr="[^"]*(?:\/|\\)office-markdown-sample-visual\.png"/g,
      'descr="office-markdown-sample-visual.png"'
    )
  );
  await replaceZipText(zip, "docProps/app.xml", (appXml) =>
    appXml.replace(/<Company>[^<]*<\/Company>/g, "<Company>Office Markdown</Company>")
  );

  fs.writeFileSync(
    outPath,
    await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE"
    })
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outPath = path.resolve(args.out);
  const imagePath = path.resolve(args.image);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const req = runtimeRequire();
  const pptxgen = req("pptxgenjs");
  let JSZip;
  try {
    JSZip = req("jszip");
  } catch {
    JSZip = repoRequire()("jszip");
  }

  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Office Markdown sample generator";
  pptx.company = "Office Markdown";
  pptx.subject = "OOXML fixture with images, shapes, charts, notes, and embedded objects";
  pptx.title = "Office Markdown PowerPoint Fixture";
  pptx.lang = "en-US";
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos",
    lang: "en-US"
  };

  const dark = "1F2937";
  const ink = "111827";
  const muted = "64748B";
  const blue = "2563EB";
  const teal = "0F766E";
  const amber = "B45309";
  const pale = "F8FAFC";

  const slide1 = pptx.addSlide();
  slide1.background = { color: "FFFFFF" };
  slide1.addText("Office Markdown fixture", {
    x: 0.55,
    y: 0.35,
    w: 5.6,
    h: 0.35,
    fontFace: "Aptos Display",
    fontSize: 26,
    bold: true,
    color: dark,
    margin: 0
  });
  slide1.addText("PowerPoint sample with text, table, image, shapes, chart, notes, and an embedded object relationship.", {
    x: 0.58,
    y: 0.82,
    w: 8.8,
    h: 0.28,
    fontSize: 10.5,
    color: muted,
    margin: 0
  });
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0.55,
    y: 1.35,
    w: 4.95,
    h: 2.75,
    fill: { color: pale },
    line: { color: "CBD5E1", width: 1 }
  });
  slide1.addImage({ path: imagePath, x: 0.77, y: 1.55, w: 4.5, h: 2.25 });
  slide1.addText("Visible image asset", {
    x: 0.77,
    y: 3.82,
    w: 2.5,
    h: 0.2,
    fontSize: 8.5,
    color: muted,
    margin: 0
  });
  slide1.addTable(
    [
      ["Element", "Expected extension signal"],
      ["Image", "slide-001-image-001.png"],
      ["Table", "Markdown table rows"],
      ["Embedded object", "slide-001-object-001.bin"],
      ["Speaker notes", "Notes section in Markdown"]
    ],
    {
      x: 5.85,
      y: 1.35,
      w: 6.85,
      h: 1.8,
      margin: 0.06,
      fontFace: "Aptos",
      fontSize: 9.4,
      color: ink,
      border: { type: "solid", color: "CBD5E1", pt: 0.75 },
      fill: { color: "FFFFFF" },
      valign: "mid",
      autoFit: false,
      colW: [2.0, 4.85],
      rowH: 0.36
    }
  );
  slide1.addText("Object placeholder", {
    x: 5.85,
    y: 3.55,
    w: 3.05,
    h: 0.64,
    fontSize: 15,
    bold: true,
    color: "FFFFFF",
    align: "center",
    valign: "mid",
    fill: { color: teal },
    line: { color: teal },
    radius: 0.08,
    margin: 0.08
  });
  slide1.addShape(pptx.ShapeType.rightArrow, {
    x: 9.15,
    y: 3.58,
    w: 1.05,
    h: 0.56,
    fill: { color: blue },
    line: { color: blue }
  });
  slide1.addText("Relationship patched after export", {
    x: 10.35,
    y: 3.57,
    w: 2.35,
    h: 0.55,
    fontSize: 9.5,
    color: ink,
    margin: 0.04,
    valign: "mid"
  });
  slide1.addNotes("Speaker note: confirm Markdown extraction includes this note and the embedded object asset.");

  const slide2 = pptx.addSlide();
  slide2.background = { color: "FFFFFF" };
  slide2.addText("Chart and shape coverage", {
    x: 0.55,
    y: 0.35,
    w: 6.2,
    h: 0.4,
    fontFace: "Aptos Display",
    fontSize: 24,
    bold: true,
    color: dark,
    margin: 0
  });
  slide2.addText("Native chart plus editable shape callouts exercise common PowerPoint drawing paths.", {
    x: 0.58,
    y: 0.8,
    w: 8.4,
    h: 0.25,
    fontSize: 10.5,
    color: muted,
    margin: 0
  });
  slide2.addChart(
    pptx.ChartType.bar,
    [
      {
        name: "Fixture count",
        labels: ["Text", "Images", "Tables", "Objects"],
        values: [8, 1, 1, 1]
      }
    ],
    {
      x: 0.75,
      y: 1.35,
      w: 5.5,
      h: 3.6,
      showTitle: true,
      title: "Fixture coverage",
      showLegend: false,
      catAxisLabelFontFace: "Aptos",
      catAxisLabelFontSize: 9,
      valAxisLabelFontFace: "Aptos",
      valAxisLabelFontSize: 8,
      valAxisMajorUnit: 2,
      showValue: true,
      chartColors: [blue]
    }
  );
  [
    { label: "Picture", x: 7.05, y: 1.5, color: blue },
    { label: "Shape", x: 8.75, y: 2.45, color: teal },
    { label: "Embedded part", x: 10.45, y: 3.4, color: amber }
  ].forEach((node, index) => {
    slide2.addShape(pptx.ShapeType.hexagon, {
      x: node.x,
      y: node.y,
      w: 1.2,
      h: 0.8,
      fill: { color: node.color },
      line: { color: node.color }
    });
    slide2.addText(node.label, {
      x: node.x - 0.05,
      y: node.y + 0.25,
      w: 1.3,
      h: 0.22,
      fontSize: 9,
      bold: true,
      color: "FFFFFF",
      align: "center",
      margin: 0
    });
    if (index < 2) {
      slide2.addShape(pptx.ShapeType.rightArrow, {
        x: node.x + 1.25,
        y: node.y + 0.22,
        w: 0.85,
        h: 0.35,
        fill: { color: "94A3B8" },
        line: { color: "94A3B8" }
      });
    }
  });
  slide2.addNotes("Speaker note: chart relationships are expected to be recorded as unsupported chart visuals.");

  await pptx.writeFile({ fileName: outPath });
  await patchEmbeddedObject(outPath, JSZip);
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
