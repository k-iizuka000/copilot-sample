import { promises as fs } from "node:fs";

import { getDocument, VerbosityLevel } from "pdfjs-dist/legacy/build/pdf.mjs";
import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";

import { addWarning } from "../../manifest.js";
import type {
  ConversionManifest,
  ConversionWarning,
  MarkdownBlock,
  ResolvedConvertFileOptions,
  SourceRef
} from "../../types.js";

interface PdfConversionContext {
  sourceFileName: string;
  options: ResolvedConvertFileOptions;
  manifest: ConversionManifest;
  markdownBlocks: MarkdownBlock[];
}

interface PdfTextItem {
  str: string;
  hasEOL?: boolean;
}

interface PdfJsWorkerGlobal {
  pdfjsWorker?: {
    WorkerMessageHandler?: unknown;
  };
}

export async function convertPdf(context: PdfConversionContext): Promise<void> {
  const data = await fs.readFile(context.options.inputPath);
  if (data.byteLength > context.options.safety.maxPackageUncompressedBytes) {
    throw new Error(
      `PDF size ${data.byteLength} bytes exceeds configured limit ${context.options.safety.maxPackageUncompressedBytes} bytes.`
    );
  }

  ensurePdfJsWorkerHandler();

  const loadingTask = getDocument({
    data: new Uint8Array(data),
    verbosity: VerbosityLevel.ERRORS,
    useSystemFonts: true
  });
  const pdf = await loadingTask.promise;

  try {
    context.markdownBlocks.push({ kind: "heading", depth: 1, text: `PDF: ${context.sourceFileName}` });

    let extractedPageCount = 0;
    let emittedMarkdownChars = 0;
    const pageLimit = Math.min(pdf.numPages, context.options.pdf.maxPages);
    if (pdf.numPages > context.options.pdf.maxPages) {
      recordPdfWarning(context, {
        code: "pdf-page-limit-exceeded",
        message: `PDF has ${pdf.numPages} pages; only the first ${context.options.pdf.maxPages} page(s) were converted.`,
        source: { container: "pdf" }
      });
    }

    for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const sourceRef: SourceRef = { container: "pdf", index: pageNumber, name: `Page ${pageNumber}` };
      const textItems = limitTextItems(context, textContent.items, sourceRef);
      const lines = extractTextLines(textItems);
      const pageText = limitMarkdownChars(context, normalizeLines(lines).join("\n"), emittedMarkdownChars, sourceRef);

      context.markdownBlocks.push({ kind: "heading", depth: 2, text: `Page ${pageNumber}` });
      if (pageText) {
        extractedPageCount += 1;
        emittedMarkdownChars += pageText.length;
        context.markdownBlocks.push({ kind: "paragraph", text: pageText });
        if (emittedMarkdownChars >= context.options.pdf.maxMarkdownChars) {
          break;
        }
      } else {
        recordPdfWarning(context, {
          code: "pdf-page-no-extractable-text",
          message: `Page ${pageNumber} has no extractable text. Scanned pages require OCR, which is not supported.`,
          source: sourceRef
        });
        context.markdownBlocks.push({
          kind: "warning",
          code: "pdf-page-no-extractable-text",
          message: "No extractable text found on this page.",
          sourceRef
        });
      }
    }

    if (pdf.numPages === 0 || extractedPageCount === 0) {
      recordPdfWarning(context, {
        code: "pdf-no-extractable-text",
        message: "The PDF did not contain extractable text. Scanned PDFs require OCR, which is not supported.",
        source: { container: "pdf" }
      });
    }
  } finally {
    await pdf.destroy();
  }
}

function appendTextItem(lines: string[], item: PdfTextItem): string[] {
  const text = item.str.replace(/\u0000/g, "");
  if (lines.length === 0) {
    lines.push("");
  }

  const lastIndex = lines.length - 1;
  lines[lastIndex] = `${lines[lastIndex] ?? ""}${text}`;
  if (item.hasEOL) {
    lines.push("");
  }
  return lines;
}

function extractTextLines(items: readonly unknown[]): string[] {
  return items.reduce<string[]>((accumulator, item) => {
    if (!isPdfTextItem(item)) {
      return accumulator;
    }
    return appendTextItem(accumulator, item);
  }, []);
}

function normalizeLines(lines: string[]): string[] {
  return lines.map((line) => line.replace(/[ \t]+/g, " ").trim()).filter(Boolean);
}

function limitTextItems(
  context: PdfConversionContext,
  items: readonly unknown[],
  sourceRef: SourceRef
): readonly unknown[] {
  if (items.length <= context.options.pdf.maxTextItemsPerPage) {
    return items;
  }
  recordPdfWarning(context, {
    code: "pdf-text-item-limit-exceeded",
    message: `Page ${sourceRef.index ?? ""} has ${items.length} text item(s); only the first ${context.options.pdf.maxTextItemsPerPage} were converted.`,
    source: sourceRef
  });
  return items.slice(0, context.options.pdf.maxTextItemsPerPage);
}

function limitMarkdownChars(
  context: PdfConversionContext,
  text: string,
  emittedMarkdownChars: number,
  sourceRef: SourceRef
): string {
  const remainingChars = context.options.pdf.maxMarkdownChars - emittedMarkdownChars;
  if (remainingChars <= 0) {
    return "";
  }
  if (text.length <= remainingChars) {
    return text;
  }
  recordPdfWarning(context, {
    code: "pdf-markdown-size-limit-exceeded",
    message: `PDF text output exceeded ${context.options.pdf.maxMarkdownChars} character(s); remaining text was truncated.`,
    source: sourceRef
  });
  return text.slice(0, remainingChars).trimEnd();
}

function isPdfTextItem(item: unknown): item is PdfTextItem {
  return typeof item === "object" && item !== null && "str" in item && typeof item.str === "string";
}

function recordPdfWarning(context: PdfConversionContext, warning: ConversionWarning): void {
  addWarning(context.manifest, warning);
}

export function ensurePdfJsWorkerHandler(): void {
  const pdfGlobal = globalThis as typeof globalThis & PdfJsWorkerGlobal;
  if (pdfGlobal.pdfjsWorker?.WorkerMessageHandler) {
    return;
  }
  pdfGlobal.pdfjsWorker = pdfjsWorker;
}
