import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { convertFile } from "../src/index.js";
import { ensurePdfJsWorkerHandler } from "../src/converters/pdf/pdf-converter.js";
import { openOoxmlPackage } from "../src/ooxml/package-reader.js";
import { normalizeZipEntryName, resolveRelationshipTarget } from "../src/ooxml/path-safety.js";

const pngBytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const objectBytes = Uint8Array.from([79, 66, 74, 1, 2, 3]);

describe("Office Markdown core conversion", () => {
  it("converts DOCX text, tables, hyperlinks, images, embedded objects, and manifest", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-md-docx-"));
    const inputPath = path.join(tempDir, "sample.docx");
    await writeZip(inputPath, docxFixture());

    const result = await convertFile({ inputPath, overwritePolicy: "overwrite" });
    const markdown = await fs.readFile(result.markdownPath, "utf8");
    const manifest = JSON.parse(await fs.readFile(result.manifestPath, "utf8")) as {
      items: Array<{ kind: string; status: string }>;
    };

    expect(result.status).toBe("success");
    expect(markdown).toContain("# Document: sample.docx");
    expect(markdown).toContain("# Project Overview");
    expect(markdown).toContain("Paragraph with [Example](https://example.com).");
    expect(markdown).toContain("| Key | Value |");
    expect(markdown).toContain("![Document image 1](sample.assets/doc-image-001.png)");
    expect(markdown).toContain("[Embedded object 1](sample.assets/doc-object-001.bin)");
    expect(await exists(path.join(result.assetDir, "doc-image-001.png"))).toBe(true);
    expect(await exists(path.join(result.assetDir, "doc-object-001.bin"))).toBe(true);
    expect(manifest.items.map((item) => item.kind)).toEqual(
      expect.arrayContaining(["image", "embeddedObject", "hyperlink"])
    );
  });

  it("converts PPTX slides, text, tables, images, speaker notes, and embedded objects", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-md-pptx-"));
    const inputPath = path.join(tempDir, "deck.pptx");
    await writeZip(inputPath, pptxFixture());

    const result = await convertFile({ inputPath, overwritePolicy: "overwrite" });
    const markdown = await fs.readFile(result.markdownPath, "utf8");
    const manifest = JSON.parse(await fs.readFile(result.manifestPath, "utf8")) as {
      items: Array<{ kind: string; status: string }>;
    };

    expect(result.status).toBe("success");
    expect(markdown).toContain("# Presentation: deck.pptx");
    expect(markdown).toContain("## Slide 1");
    expect(markdown).toContain("Quarterly Review");
    expect(markdown).toContain("| Metric | Result |");
    expect(markdown).toContain("### Speaker Notes");
    expect(markdown).toContain("Mention retention risk.");
    expect(markdown).toContain("![Slide 1 image 1](deck.assets/slide-001-image-001.png)");
    expect(markdown).toContain("[Slide 1 embedded object 1](deck.assets/slide-001-object-001.bin)");
    expect(await exists(path.join(result.assetDir, "slide-001-image-001.png"))).toBe(true);
    expect(await exists(path.join(result.assetDir, "slide-001-object-001.bin"))).toBe(true);
    expect(manifest.items.map((item) => item.kind)).toEqual(expect.arrayContaining(["image", "embeddedObject"]));
  });

  it("converts XLSX sheets, formulas, drawings, images, embedded objects, and warnings", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-md-xlsx-"));
    const inputPath = path.join(tempDir, "book.xlsx");
    await writeZip(inputPath, xlsxFixture(false));

    const result = await convertFile({
      inputPath,
      overwritePolicy: "overwrite",
      excel: { formulaMode: "inlineFormulaTable", maxTableRows: 10 }
    });
    const markdown = await fs.readFile(result.markdownPath, "utf8");
    const manifest = JSON.parse(await fs.readFile(result.manifestPath, "utf8")) as {
      items: Array<{ kind: string; status: string; message?: string }>;
      warnings: Array<{ code: string }>;
    };

    expect(result.status).toBe("partial");
    expect(markdown).toContain("# Workbook: book.xlsx");
    expect(markdown).toContain("## Sheet 1: Summary");
    expect(markdown).toContain("| Row | A | B |");
    expect(markdown).toContain("| 1 | Revenue | 42 |");
    expect(markdown).toContain("| A2 | SUM(B1:B1) | 42 |");
    expect(markdown).toContain("> Important textbox");
    expect(markdown).toContain("![Summary image 1](book.assets/sheet-001-image-001.png)");
    expect(markdown).toContain("[Summary embedded object 1](book.assets/sheet-001-object-001.bin)");
    expect(await exists(path.join(result.assetDir, "sheet-001-image-001.png"))).toBe(true);
    expect(await exists(path.join(result.assetDir, "sheet-001-object-001.bin"))).toBe(true);
    expect(manifest.items.map((item) => item.kind)).toEqual(
      expect.arrayContaining(["formula", "image", "textBox", "embeddedObject", "hiddenSheet", "chart"])
    );
    expect(manifest.warnings.map((warning) => warning.code)).toContain("chart-visual-unsupported");
  });

  it("reports XLSM macro parts without executing or extracting them as usable output", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-md-xlsm-"));
    const inputPath = path.join(tempDir, "macro.xlsm");
    await writeZip(inputPath, xlsxFixture(true));

    const result = await convertFile({ inputPath, overwritePolicy: "overwrite" });
    const manifest = JSON.parse(await fs.readFile(result.manifestPath, "utf8")) as {
      warnings: Array<{ code: string }>;
    };

    expect(result.status).toBe("partial");
    expect(manifest.warnings.map((warning) => warning.code)).toContain("macro-ignored");
    expect(await exists(path.join(result.assetDir, "vbaProject.bin"))).toBe(false);
  });

  it("converts PDF text into Markdown and manifest output", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-md-pdf-"));
    const inputPath = path.join(tempDir, "paper.pdf");
    await writePdf(inputPath, "Hello PDF");

    const result = await convertFile({ inputPath, overwritePolicy: "overwrite" });
    const markdown = await fs.readFile(result.markdownPath, "utf8");
    const manifest = JSON.parse(await fs.readFile(result.manifestPath, "utf8")) as {
      source: { format: string };
      warnings: Array<{ code: string }>;
    };

    expect(result.status).toBe("success");
    expect(result.format).toBe("pdf");
    expect(markdown).toContain("# PDF: paper.pdf");
    expect(markdown).toContain("## Page 1");
    expect(markdown).toContain("Hello PDF");
    expect(manifest.source.format).toBe("pdf");
    expect(manifest.warnings).toEqual([]);
  });

  it("installs the bundled PDF.js worker handler for extension hosts", () => {
    const pdfGlobal = globalThis as typeof globalThis & {
      pdfjsWorker?: { WorkerMessageHandler?: unknown };
    };
    const previousWorker = pdfGlobal.pdfjsWorker;

    try {
      Reflect.deleteProperty(pdfGlobal, "pdfjsWorker");
      ensurePdfJsWorkerHandler();

      expect(pdfGlobal.pdfjsWorker?.WorkerMessageHandler).toEqual(expect.any(Function));
    } finally {
      if (previousWorker) {
        pdfGlobal.pdfjsWorker = previousWorker;
      } else {
        Reflect.deleteProperty(pdfGlobal, "pdfjsWorker");
      }
    }
  });

  it("limits PDF page and Markdown output size with warnings", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-md-pdf-limits-"));
    const inputPath = path.join(tempDir, "long.pdf");
    await writePdf(inputPath, ["First page has enough text", "Second page should be skipped"]);

    const result = await convertFile({
      inputPath,
      overwritePolicy: "overwrite",
      pdf: { maxPages: 1, maxMarkdownChars: 10 }
    });
    const markdown = await fs.readFile(result.markdownPath, "utf8");
    const manifest = JSON.parse(await fs.readFile(result.manifestPath, "utf8")) as {
      warnings: Array<{ code: string }>;
    };

    expect(result.status).toBe("partial");
    expect(markdown).toContain("## Page 1");
    expect(markdown).not.toContain("## Page 2");
    expect(markdown).toContain("First page");
    expect(markdown).not.toContain("enough text");
    expect(manifest.warnings.map((warning) => warning.code)).toEqual(
      expect.arrayContaining(["pdf-page-limit-exceeded", "pdf-markdown-size-limit-exceeded"])
    );
  });
});

describe("OOXML package safety", () => {
  it("rejects unsafe ZIP entry names and relationship traversal", async () => {
    expect(() => normalizeZipEntryName("../evil.xml")).toThrow(/Unsafe ZIP entry/);
    expect(() => normalizeZipEntryName("xl\\evil.xml")).toThrow(/Unsafe ZIP entry/);
    expect(() => resolveRelationshipTarget("xl/worksheets/sheet1.xml", "../../../evil.bin")).toThrow(
      /Unsafe ZIP entry/
    );
  });

  it("does not resolve external relationships as package parts", async () => {
    expect(() => resolveRelationshipTarget("word/document.xml", "https://example.com/image.png")).toThrow(
      /External relationship/
    );
  });

  it("enforces package resource limits before exposing package content", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-md-limits-"));
    const inputPath = path.join(tempDir, "too-many.docx");
    const zip = basePackage();
    zip.file("word/document.xml", "<document/>");
    await writeZip(inputPath, zip);

    await expect(
      openOoxmlPackage(inputPath, {
        maxEntryCount: 1,
        maxExtractedAssetBytes: 1000,
        maxPackageUncompressedBytes: 1000
      })
    ).rejects.toThrow(/entry count exceeds limit/);
  });
});

function docxFixture(): JSZip {
  const zip = basePackage();
  zip.file(
    "word/document.xml",
    xml`<w:document xmlns:w="w" xmlns:r="r" xmlns:a="a" xmlns:wp="wp">
      <w:body>
        <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Project Overview</w:t></w:r></w:p>
        <w:p><w:r><w:t>Paragraph with </w:t></w:r><w:hyperlink r:id="rIdLink"><w:r><w:t>Example</w:t></w:r></w:hyperlink><w:r><w:t>.</w:t></w:r></w:p>
        <w:tbl>
          <w:tr><w:tc><w:p><w:r><w:t>Key</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Value</w:t></w:r></w:p></w:tc></w:tr>
          <w:tr><w:tc><w:p><w:r><w:t>Status</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Green</w:t></w:r></w:p></w:tc></w:tr>
        </w:tbl>
        <w:p><w:r><w:drawing><wp:inline><a:graphic><a:graphicData><a:blip r:embed="rIdImage"/></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>
      </w:body>
    </w:document>`
  );
  zip.file(
    "word/_rels/document.xml.rels",
    relationships([
      rel("rIdImage", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", "media/image1.png"),
      rel("rIdLink", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", "https://example.com", "External"),
      rel("rIdObject", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject", "embeddings/object1.bin")
    ])
  );
  zip.file("word/media/image1.png", pngBytes);
  zip.file("word/embeddings/object1.bin", objectBytes);
  return zip;
}

function pptxFixture(): JSZip {
  const zip = basePackage();
  zip.file("ppt/presentation.xml", xml`<p:presentation xmlns:p="p" xmlns:r="r"><p:sldIdLst><p:sldId r:id="rId1"/><p:sldId r:id="rId2"/></p:sldIdLst></p:presentation>`);
  zip.file(
    "ppt/_rels/presentation.xml.rels",
    relationships([
      rel("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide", "slides/slide1.xml"),
      rel("rId2", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide", "slides/slide2.xml")
    ])
  );
  zip.file(
    "ppt/slides/slide1.xml",
    xml`<p:sld xmlns:p="p" xmlns:a="a" xmlns:r="r">
      <p:cSld><p:spTree>
        <p:sp><p:txBody><a:p><a:r><a:t>Quarterly Review</a:t></a:r></a:p></p:txBody></p:sp>
        <p:graphicFrame><a:tbl>
          <a:tr><a:tc><a:txBody><a:p><a:r><a:t>Metric</a:t></a:r></a:p></a:txBody></a:tc><a:tc><a:txBody><a:p><a:r><a:t>Result</a:t></a:r></a:p></a:txBody></a:tc></a:tr>
          <a:tr><a:tc><a:txBody><a:p><a:r><a:t>ARR</a:t></a:r></a:p></a:txBody></a:tc><a:tc><a:txBody><a:p><a:r><a:t>Up</a:t></a:r></a:p></a:txBody></a:tc></a:tr>
        </a:tbl></p:graphicFrame>
        <p:pic><p:blipFill><a:blip r:embed="rIdImage"/></p:blipFill></p:pic>
      </p:spTree></p:cSld>
    </p:sld>`
  );
  zip.file("ppt/slides/slide2.xml", xml`<p:sld xmlns:p="p" xmlns:a="a"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Next Steps</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`);
  zip.file(
    "ppt/slides/_rels/slide1.xml.rels",
    relationships([
      rel("rIdImage", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", "../media/image1.png"),
      rel("rIdNotes", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide", "../notesSlides/notesSlide1.xml"),
      rel("rIdObject", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject", "../embeddings/object1.bin")
    ])
  );
  zip.file("ppt/notesSlides/notesSlide1.xml", xml`<p:notes xmlns:p="p" xmlns:a="a"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Mention retention risk.</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:notes>`);
  zip.file("ppt/media/image1.png", pngBytes);
  zip.file("ppt/embeddings/object1.bin", objectBytes);
  return zip;
}

function xlsxFixture(includeMacro: boolean): JSZip {
  const zip = basePackage();
  zip.file(
    "xl/workbook.xml",
    xml`<workbook xmlns:r="r"><sheets><sheet name="Summary" r:id="rId1"/><sheet name="Hidden" state="hidden" r:id="rId2"/></sheets></workbook>`
  );
  zip.file(
    "xl/_rels/workbook.xml.rels",
    relationships([
      rel("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet", "worksheets/sheet1.xml"),
      rel("rId2", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet", "worksheets/sheet2.xml")
    ])
  );
  zip.file("xl/sharedStrings.xml", xml`<sst><si><t>Revenue</t></si></sst>`);
  zip.file(
    "xl/worksheets/sheet1.xml",
    xml`<worksheet xmlns:r="r"><sheetData>
      <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>42</v></c></row>
      <row r="2"><c r="A2"><f>SUM(B1:B1)</f><v>42</v></c></row>
    </sheetData><drawing r:id="rIdDrawing"/></worksheet>`
  );
  zip.file("xl/worksheets/sheet2.xml", xml`<worksheet><sheetData><row r="1"><c r="A1"><v>Hidden</v></c></row></sheetData></worksheet>`);
  zip.file(
    "xl/worksheets/_rels/sheet1.xml.rels",
    relationships([
      rel("rIdDrawing", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing", "../drawings/drawing1.xml"),
      rel("rIdObject", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject", "../embeddings/object1.bin")
    ])
  );
  zip.file(
    "xl/drawings/drawing1.xml",
    xml`<xdr:wsDr xmlns:xdr="xdr" xmlns:a="a" xmlns:r="r">
      <xdr:twoCellAnchor>
        <xdr:from><xdr:col>1</xdr:col><xdr:row>3</xdr:row></xdr:from>
        <xdr:pic><xdr:blipFill><a:blip r:embed="rIdImage"/></xdr:blipFill></xdr:pic>
        <xdr:sp><xdr:txBody><a:p><a:r><a:t>Important textbox</a:t></a:r></a:p></xdr:txBody></xdr:sp>
      </xdr:twoCellAnchor>
    </xdr:wsDr>`
  );
  zip.file(
    "xl/drawings/_rels/drawing1.xml.rels",
    relationships([
      rel("rIdImage", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", "../media/image1.png"),
      rel("rIdChart", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart", "../charts/chart1.xml")
    ])
  );
  zip.file("xl/media/image1.png", pngBytes);
  zip.file("xl/embeddings/object1.bin", objectBytes);
  zip.file("xl/charts/chart1.xml", xml`<chartSpace><chart><title><tx><rich><p><r><t>Revenue Chart</t></r></p></rich></tx></title></chart></chartSpace>`);
  if (includeMacro) {
    zip.file("xl/vbaProject.bin", Uint8Array.from([1, 2, 3]));
  }
  return zip;
}

function basePackage(): JSZip {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    xml`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="xml" ContentType="application/xml"/>
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Default Extension="png" ContentType="image/png"/>
      <Default Extension="bin" ContentType="application/octet-stream"/>
    </Types>`
  );
  return zip;
}

function relationships(items: string[]): string {
  return xml`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${items.join("")}</Relationships>`;
}

function rel(id: string, type: string, target: string, targetMode?: "External"): string {
  const mode = targetMode ? ` TargetMode="${targetMode}"` : "";
  return `<Relationship Id="${id}" Type="${type}" Target="${target}"${mode}/>`;
}

async function writeZip(filePath: string, zip: JSZip): Promise<void> {
  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  await fs.writeFile(filePath, buffer);
}

async function writePdf(filePath: string, text: string | string[]): Promise<void> {
  const pages = Array.isArray(text) ? text : [text];
  const pageRefs = pages.map((_, index) => `${4 + index * 2} 0 R`).join(" ");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    `2 0 obj\n<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>\nendobj\n`,
    "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
  ];
  for (const [index, pageText] of pages.entries()) {
    const pageObjectNumber = 4 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const textBytes = `BT /F1 24 Tf 100 700 Td (${escapePdfString(pageText)}) Tj ET\n`;
    objects.push(
      `${pageObjectNumber} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>\nendobj\n`,
      `${contentObjectNumber} 0 obj\n<< /Length ${Buffer.byteLength(textBytes)} >>\nstream\n${textBytes}endstream\nendobj\n`
    );
  }
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += object;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  await fs.writeFile(filePath, pdf, "binary");
}

function escapePdfString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function xml(strings: TemplateStringsArray, ...values: string[]): string {
  return strings.reduce((acc, chunk, index) => `${acc}${chunk}${values[index] ?? ""}`, "").replace(/>\s+</g, "><").trim();
}
