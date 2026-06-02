import path from "node:path";
import type { ConversionContext, MarkdownBlock, SourceRef } from "../../types.js";
import {
  anchorFromDrawingNode,
  collectOrderedElements,
  collectRelationshipIds,
  extractRelationshipAsset,
  humanIndex,
  pushWarning,
  recordItem,
  relationshipById,
  relationshipByTypeSuffix,
  textFromTextBodies
} from "../common.js";
import { asArray, getChild, getOrderedChildren, getOrderedName, getTextValue, isRecord } from "../../ooxml/xml.js";

const workbookPart = "xl/workbook.xml";

interface WorkbookSheet {
  name: string;
  relationshipId: string;
  state?: string;
  index: number;
}

interface CellValue {
  ref: string;
  column: number;
  row: number;
  value: string;
  formula?: string;
}

export async function convertXlsx(context: ConversionContext): Promise<void> {
  context.markdownBlocks.push({ kind: "heading", depth: 1, text: `Workbook: ${context.sourceFileName}` });
  if (context.format === "xlsm" && context.pkg.hasPart("xl/vbaProject.bin")) {
    pushWarning(context, {
      code: "macro-ignored",
      message: "Macro project parts are ignored and never executed.",
      source: { container: "workbook", part: "xl/vbaProject.bin" }
    });
  }

  const workbook = await context.pkg.readXml(workbookPart);
  const workbookRelationships = await context.pkg.getRelationships(workbookPart);
  const sharedStrings = await readSharedStrings(context);
  const sheets = workbookSheets(workbook);
  const sheetRows = [["Sheet", "Status", "Markdown"]];

  for (const sheet of sheets) {
    const sheetSource = { container: "sheet" as const, name: sheet.name, index: sheet.index };
    if (sheet.state && sheet.state !== "visible" && !context.options.excel.includeHiddenSheets) {
      recordItem(context, {
        id: "",
        kind: "hiddenSheet",
        source: sheetSource,
        status: "skipped",
        message: `Hidden sheet "${sheet.name}" was skipped by configuration.`
      });
      sheetRows.push([`Sheet ${sheet.index}: ${sheet.name}`, "Skipped", ""]);
      continue;
    }

    const relationship = relationshipById(workbookRelationships, sheet.relationshipId);
    if (!relationship?.resolvedTarget) {
      pushWarning(context, {
        code: "worksheet-relationship-missing",
        message: `Worksheet relationship for "${sheet.name}" could not be resolved.`,
        source: { ...sheetSource, relationshipId: sheet.relationshipId }
      });
      sheetRows.push([`Sheet ${sheet.index}: ${sheet.name}`, "Warning", ""]);
      continue;
    }

    const sheetFileName = sheetMarkdownFileName(sheet);
    const sheetMarkdownPath = path.join(context.options.outputDir, sheetFileName);
    const sheetBlocks: MarkdownBlock[] = [];
    context.markdownDocuments.push({
      markdownPath: sheetMarkdownPath,
      relativePath: sheetFileName,
      blocks: sheetBlocks
    });
    await convertWorksheet(
      {
        ...context,
        markdownPath: sheetMarkdownPath,
        markdownBlocks: sheetBlocks
      },
      relationship.resolvedTarget,
      sheet,
      sharedStrings
    );
    sheetRows.push([`Sheet ${sheet.index}: ${sheet.name}`, "Converted", markdownLink(sheetFileName)]);
  }

  context.markdownBlocks.push({ kind: "heading", depth: 2, text: "Sheets" });
  context.markdownBlocks.push({ kind: "table", rows: sheetRows });
}

async function convertWorksheet(
  context: ConversionContext,
  sheetPart: string,
  sheet: WorkbookSheet,
  sharedStrings: string[]
): Promise<void> {
  const sheetSource = { container: "sheet" as const, name: sheet.name, index: sheet.index, part: sheetPart };
  context.markdownBlocks.push({ kind: "heading", depth: 1, text: `Sheet ${sheet.index}: ${sheet.name}` });

  const worksheet = await context.pkg.readXml(sheetPart);
  const cells = readCells(worksheet, sharedStrings);
  if (cells.length > 0) {
    const maxRow = Math.min(Math.max(...cells.map((cell) => cell.row)), context.options.excel.maxTableRows);
    const maxCol = Math.max(...cells.map((cell) => cell.column));
    const rows = [["Row", ...Array.from({ length: maxCol }, (_, index) => columnLabel(index + 1))]];
    for (let row = 1; row <= maxRow; row += 1) {
      rows.push([
        String(row),
        ...Array.from({ length: maxCol }, (_, index) => cells.find((cell) => cell.row === row && cell.column === index + 1)?.value ?? "")
      ]);
    }
    const truncated = Math.max(...cells.map((cell) => cell.row)) > context.options.excel.maxTableRows;
    context.markdownBlocks.push({ kind: "table", rows, truncated });
    if (truncated) {
      pushWarning(context, {
        code: "excel-table-truncated",
        message: `Sheet "${sheet.name}" was truncated at ${context.options.excel.maxTableRows} rows.`,
        source: sheetSource
      });
    }
  }

  const formulaCells = cells.filter((cell) => cell.formula);
  for (const cell of formulaCells) {
    recordItem(context, {
      id: "",
      kind: "formula",
      source: { ...sheetSource, anchor: cell.ref },
      status: context.options.excel.formulaMode === "valuesOnly" ? "skipped" : "recorded",
      message: `${cell.ref}: ${cell.formula ?? ""} => ${cell.value}`
    });
  }
  if (context.options.excel.formulaMode === "inlineFormulaTable" && formulaCells.length > 0) {
    context.markdownBlocks.push({
      kind: "table",
      rows: [["Cell", "Formula", "Cached value"], ...formulaCells.map((cell) => [cell.ref, cell.formula ?? "", cell.value])]
    });
  }

  await appendWorksheetRelationships(context, sheetPart, sheetSource);
}

async function appendWorksheetRelationships(context: ConversionContext, sheetPart: string, sheetSource: SourceRef): Promise<void> {
  const relationships = await context.pkg.getRelationships(sheetPart);
  for (const relationship of relationshipByTypeSuffix(relationships, "/drawing")) {
    if (relationship.resolvedTarget) {
      await appendDrawing(context, relationship.resolvedTarget, sheetSource);
    }
  }

  let objectIndex = 1;
  const embedded = relationshipByTypeSuffix(relationships, "/oleObject").concat(relationshipByTypeSuffix(relationships, "/package"));
  for (const relationship of embedded) {
    const source = { ...sheetSource, relationshipId: relationship.id };
    const relativePath = await extractRelationshipAsset(context, relationship, {
      kind: "embeddedObject",
      prefix: `sheet-${humanIndex(sheetSource.index ?? 0)}-object-${humanIndex(objectIndex)}`,
      label: `${sheetSource.name ?? "Sheet"} embedded object ${objectIndex}`,
      source
    });
    if (relativePath) {
      context.markdownBlocks.push({
        kind: "assetLink",
        label: `${sheetSource.name ?? "Sheet"} embedded object ${objectIndex}`,
        relativePath,
        sourceRef: source
      });
      objectIndex += 1;
    }
  }
}

async function appendDrawing(context: ConversionContext, drawingPart: string, sheetSource: SourceRef): Promise<void> {
  const drawingRelationships = await context.pkg.getRelationships(drawingPart);
  const drawingNodes = await context.pkg.readXmlOrdered(drawingPart);
  const anchorNodes = collectOrderedElements(drawingNodes, "twoCellAnchor")
    .concat(collectOrderedElements(drawingNodes, "oneCellAnchor"))
    .concat(collectOrderedElements(drawingNodes, "absoluteAnchor"));
  const scopedNodes = anchorNodes.length > 0 ? anchorNodes : drawingNodes;
  let imageIndex = 1;
  let textIndex = 1;

  for (const anchor of scopedNodes) {
    const anchorRef = getOrderedName(anchor) ? anchorFromDrawingNode(anchor) : undefined;
    const children = getOrderedName(anchor) ? getOrderedChildren(anchor) : drawingNodes;
    const imageIds = collectRelationshipIds(children, "blip", ["embed"]);
    for (const relationshipId of imageIds) {
      const relationship = relationshipById(drawingRelationships, relationshipId);
      if (!relationship) {
        continue;
      }
      const source: SourceRef = { ...sheetSource, part: drawingPart, relationshipId };
      if (anchorRef) {
        source.anchor = anchorRef;
      }
      const relativePath = await extractRelationshipAsset(context, relationship, {
        kind: "image",
        prefix: `sheet-${humanIndex(sheetSource.index ?? 0)}-image-${humanIndex(imageIndex)}`,
        label: `${sheetSource.name ?? "Sheet"} image ${imageIndex}`,
        source
      });
      if (relativePath) {
        context.markdownBlocks.push({
          kind: "image",
          alt: `${sheetSource.name ?? "Sheet"} image ${imageIndex}`,
          relativePath,
          sourceRef: source
        });
        imageIndex += 1;
      }
    }

    for (const text of textFromTextBodies(children)) {
      const source: SourceRef = { ...sheetSource, part: drawingPart };
      if (anchorRef) {
        source.anchor = anchorRef;
      }
      context.markdownBlocks.push({ kind: "heading", depth: 3, text: `Text Box ${textIndex}` });
      context.markdownBlocks.push({ kind: "quote", text, sourceRef: source });
      recordItem(context, {
        id: "",
        kind: "textBox",
        source,
        status: "recorded",
        message: text
      });
      textIndex += 1;
    }
  }

  for (const relationship of relationshipByTypeSuffix(drawingRelationships, "/chart")) {
    recordItem(context, {
      id: "",
      kind: "chart",
      source: { ...sheetSource, part: drawingPart, relationshipId: relationship.id },
      status: "warning",
      message: "Chart visual rendering is not supported in MVP."
    });
    pushWarning(context, {
      code: "chart-visual-unsupported",
      message: `Sheet "${sheetSource.name ?? ""}" contains a chart; chart visual rendering is not supported in MVP.`,
      source: { ...sheetSource, part: drawingPart, relationshipId: relationship.id }
    });
  }
}

async function readSharedStrings(context: ConversionContext): Promise<string[]> {
  if (!context.pkg.hasPart("xl/sharedStrings.xml")) {
    return [];
  }
  const sharedStringsXml = await context.pkg.readXml("xl/sharedStrings.xml");
  const sst = getChild(sharedStringsXml, "sst");
  if (!isRecord(sst)) {
    return [];
  }
  return asArray(getChild(sst, "si")).map((item) => getTextValue(item));
}

function workbookSheets(workbook: unknown): WorkbookSheet[] {
  const root = getChild(workbook, "workbook");
  if (!isRecord(root)) {
    return [];
  }
  const sheets = getChild(root, "sheets");
  if (!isRecord(sheets)) {
    return [];
  }
  return asArray(getChild<Record<string, unknown>>(sheets, "sheet"))
    .filter(isRecord)
    .map((sheet, index) => ({
      name: String(sheet.name ?? `Sheet${index + 1}`),
      relationshipId: String(sheet.id ?? ""),
      ...(typeof sheet.state === "string" ? { state: sheet.state } : {}),
      index: index + 1
    }))
    .filter((sheet) => sheet.relationshipId);
}

function readCells(worksheet: unknown, sharedStrings: string[]): CellValue[] {
  const root = getChild(worksheet, "worksheet");
  if (!isRecord(root)) {
    return [];
  }
  const sheetData = getChild(root, "sheetData");
  if (!isRecord(sheetData)) {
    return [];
  }
  const cells: CellValue[] = [];
  for (const row of asArray(getChild<Record<string, unknown>>(sheetData, "row")).filter(isRecord)) {
    for (const cell of asArray(getChild<Record<string, unknown>>(row, "c")).filter(isRecord)) {
      const ref = String(cell.r ?? "");
      const parsedRef = parseCellRef(ref);
      const rawValue = getTextValue(cell.v);
      let value = rawValue;
      if (cell.t === "s") {
        value = sharedStrings[Number(rawValue)] ?? "";
      } else if (cell.t === "b") {
        value = rawValue === "1" ? "TRUE" : "FALSE";
      } else if (cell.t === "inlineStr") {
        value = getTextValue(cell.is);
      }
      const formula = getTextValue(cell.f);
      if (value || formula) {
        cells.push({
          ref,
          column: parsedRef.column,
          row: parsedRef.row,
          value,
          ...(formula ? { formula } : {})
        });
      }
    }
  }
  return cells;
}

function parseCellRef(ref: string): { column: number; row: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) {
    return { column: 1, row: 1 };
  }
  return { column: columnIndex(match[1] ?? "A"), row: Number(match[2] ?? "1") };
}

function columnIndex(label: string): number {
  return label.toUpperCase().split("").reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0);
}

function columnLabel(index: number): string {
  let value = index;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

function sheetMarkdownFileName(sheet: WorkbookSheet): string {
  return `${humanIndex(sheet.index)}-${sanitizeSheetFileName(sheet.name)}.md`;
}

function sanitizeSheetFileName(rawName: string): string {
  const safe = rawName
    .replace(/[<>:"\/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return (safe.length > 0 ? safe : "Sheet").slice(0, 80);
}

function markdownLink(fileName: string): string {
  return `[${fileName}](${fileName.split("/").map(encodeURIComponent).join("/")})`;
}
