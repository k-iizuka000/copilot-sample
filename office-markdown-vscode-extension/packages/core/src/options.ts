import path from "node:path";
import { promises as fs } from "node:fs";
import type { ConvertFileOptions, ResolvedConvertFileOptions, SupportedFormat } from "./types.js";

const supportedExtensions = new Set([".xlsx", ".xlsm", ".pptx", ".docx", ".pdf"]);

export function getSupportedFormat(inputPath: string): SupportedFormat {
  const extension = path.extname(inputPath).toLowerCase();
  if (!supportedExtensions.has(extension)) {
    throw new Error("This file type is not supported yet. Supported: .xlsx, .xlsm, .pptx, .docx, .pdf.");
  }
  return extension.slice(1) as SupportedFormat;
}

export function isSupportedOfficePath(inputPath: string): boolean {
  return supportedExtensions.has(path.extname(inputPath).toLowerCase());
}

export async function resolveOptions(options: ConvertFileOptions): Promise<ResolvedConvertFileOptions> {
  const inputPath = path.resolve(options.inputPath);
  const parsed = path.parse(inputPath);
  const outputMarkdownPath = path.resolve(options.outputMarkdownPath ?? path.join(parsed.dir, `${parsed.name}.md`));
  const outputAssetDir = path.resolve(options.outputAssetDir ?? path.join(parsed.dir, `${parsed.name}.assets`));

  return {
    inputPath,
    outputMarkdownPath,
    outputAssetDir,
    overwritePolicy: options.overwritePolicy ?? "confirm",
    includeConversionReport: options.includeConversionReport ?? true,
    excel: {
      includeHiddenSheets: options.excel?.includeHiddenSheets ?? false,
      formulaMode: options.excel?.formulaMode ?? "valuesWithManifest",
      maxTableRows: options.excel?.maxTableRows ?? 1000
    },
    pptx: {
      includeSpeakerNotes: options.pptx?.includeSpeakerNotes ?? true
    },
    pdf: {
      maxPages: options.pdf?.maxPages ?? 500,
      maxTextItemsPerPage: options.pdf?.maxTextItemsPerPage ?? 20000,
      maxMarkdownChars: options.pdf?.maxMarkdownChars ?? 5000000
    },
    safety: {
      maxPackageUncompressedBytes: options.safety?.maxPackageUncompressedBytes ?? 300_000_000,
      maxExtractedAssetBytes: options.safety?.maxExtractedAssetBytes ?? 50_000_000,
      maxEntryCount: options.safety?.maxEntryCount ?? 10_000
    }
  };
}

export async function resolveWritableOutputPaths(options: ResolvedConvertFileOptions): Promise<ResolvedConvertFileOptions> {
  if (options.overwritePolicy === "overwrite") {
    return options;
  }

  if (options.overwritePolicy === "confirm") {
    const markdownExists = await exists(options.outputMarkdownPath);
    const assetDirExists = await exists(options.outputAssetDir);
    if (markdownExists || assetDirExists) {
      throw new Error("Output already exists. Confirm overwrite in the VS Code prompt or use createUnique.");
    }
    return options;
  }

  let index = 2;
  let markdownPath = options.outputMarkdownPath;
  let assetDir = options.outputAssetDir;
  while (await exists(markdownPath) || await exists(assetDir)) {
    const parsedMarkdown = path.parse(options.outputMarkdownPath);
    const parsedAsset = path.parse(options.outputAssetDir);
    markdownPath = path.join(parsedMarkdown.dir, `${parsedMarkdown.name}-${index}${parsedMarkdown.ext}`);
    assetDir = path.join(parsedAsset.dir, `${parsedAsset.name}-${index}`);
    index += 1;
  }
  return {
    ...options,
    outputMarkdownPath: markdownPath,
    outputAssetDir: assetDir
  };
}

async function exists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}
