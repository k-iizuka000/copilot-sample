import path from "node:path";
import { promises as fs } from "node:fs";
import type { ConversionContext, ConversionResult, ConvertFileOptions, MarkdownBlock, SupportedFormat } from "./types.js";
import { getSupportedFormat, resolveOptions, resolveWritableOutputPaths } from "./options.js";
import { openOoxmlPackage } from "./ooxml/package-reader.js";
import { createManifest, addError, writeManifest } from "./manifest.js";
import { renderMarkdown } from "./markdown/markdown-writer.js";
import { convertDocx } from "./converters/docx/docx-converter.js";
import { convertPdf } from "./converters/pdf/pdf-converter.js";
import { convertPptx } from "./converters/pptx/pptx-converter.js";
import { convertXlsx } from "./converters/xlsx/xlsx-converter.js";
import { errorMessage } from "./converters/common.js";

type OoxmlFormat = Exclude<SupportedFormat, "pdf">;

export async function convertFile(options: ConvertFileOptions): Promise<ConversionResult> {
  const format = getSupportedFormat(options.inputPath);
  const resolvedBase = await resolveOptions(options);
  const resolved = await resolveWritableOutputPaths(resolvedBase);
  const sourceStat = await fs.stat(resolved.inputPath);
  const manifestPath = path.join(resolved.outputAssetDir, "manifest.json");
  const manifest = createManifest(resolved.inputPath, sourceStat.size, format, resolved.outputMarkdownPath, resolved.outputAssetDir);

  await fs.mkdir(resolved.outputAssetDir, { recursive: true });

  const warnings = manifest.warnings;
  const errors = manifest.errors;
  const markdownBlocks: MarkdownBlock[] = [];

  try {
    if (format === "pdf") {
      await convertPdf({
        sourceFileName: path.basename(resolved.inputPath),
        options: resolved,
        manifest,
        markdownBlocks
      });
    } else {
      const pkg = await openOoxmlPackage(resolved.inputPath, resolved.safety);
      const context: ConversionContext = {
        format,
        sourceFileName: path.basename(resolved.inputPath),
        options: resolved,
        pkg,
        manifest,
        markdownBlocks,
        warnings,
        errors
      };
      await runConverter(format, context);
    }
  } catch (error) {
    addError(manifest, {
      code: "conversion-failed",
      message: errorMessage(error),
      source: { container: "package" }
    });
  }

  const status = manifest.errors.length > 0 ? "failed" : manifest.warnings.length > 0 ? "partial" : "success";
  const markdown = renderMarkdown(
    markdownBlocks.length > 0 ? markdownBlocks : [{ kind: "heading", depth: 1, text: `Conversion failed: ${path.basename(resolved.inputPath)}` }],
    resolved.includeConversionReport ? manifest.warnings : []
  );
  await fs.writeFile(resolved.outputMarkdownPath, markdown, "utf8");
  await writeManifest(manifestPath, manifest);

  return {
    inputPath: resolved.inputPath,
    markdownPath: resolved.outputMarkdownPath,
    assetDir: resolved.outputAssetDir,
    manifestPath,
    format,
    status,
    warnings: manifest.warnings,
    errors: manifest.errors
  };
}

async function runConverter(format: OoxmlFormat, context: ConversionContext): Promise<void> {
  switch (format) {
    case "docx":
      await convertDocx(context);
      break;
    case "pptx":
      await convertPptx(context);
      break;
    case "xlsx":
    case "xlsm":
      await convertXlsx(context);
      break;
    default:
      assertNever(format);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unsupported format: ${value}`);
}
