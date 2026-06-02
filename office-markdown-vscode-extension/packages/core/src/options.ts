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
  const defaultOutputBaseName = sanitizeOutputBaseName(parsed.name);
  const legacyMarkdownPath = options.outputMarkdownPath ? path.resolve(options.outputMarkdownPath) : undefined;
  const outputDir = path.resolve(
    options.outputDir ?? (legacyMarkdownPath ? path.dirname(legacyMarkdownPath) : path.join(parsed.dir, defaultOutputBaseName))
  );
  const outputBaseName = sanitizeOutputBaseName(
    legacyMarkdownPath ? path.parse(legacyMarkdownPath).name : path.basename(outputDir)
  );
  const outputMarkdownPath = legacyMarkdownPath ?? path.join(outputDir, `${outputBaseName}.md`);
  const outputAssetDir = path.resolve(options.outputAssetDir ?? path.join(outputDir, "assets"));

  return {
    inputPath,
    outputDir,
    outputBaseName,
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
    if (await exists(options.outputDir)) {
      throw new Error("Output already exists. Confirm overwrite in the VS Code prompt or use createUnique.");
    }
    return options;
  }

  let index = 2;
  const parsedOutputDir = path.parse(options.outputDir);
  let outputDir = options.outputDir;
  while (await exists(outputDir)) {
    outputDir = path.join(parsedOutputDir.dir, `${parsedOutputDir.name}-${index}`);
    index += 1;
  }
  const outputBaseName = sanitizeOutputBaseName(path.basename(outputDir));
  return {
    ...options,
    outputDir,
    outputBaseName,
    outputMarkdownPath: path.join(outputDir, `${outputBaseName}.md`),
    outputAssetDir: path.join(outputDir, "assets")
  };
}

export async function prepareOutputDirectory(options: ResolvedConvertFileOptions): Promise<void> {
  if (options.overwritePolicy === "overwrite") {
    assertSafeOutputDirectoryForOverwrite(options.inputPath, options.outputDir);
    await fs.rm(options.outputDir, { recursive: true, force: true });
  }
  await fs.mkdir(options.outputDir, { recursive: true });
  await fs.mkdir(options.outputAssetDir, { recursive: true });
}

export function assertSafeOutputDirectoryForOverwrite(inputPath: string, outputDir: string): void {
  const resolvedInputPath = path.resolve(inputPath);
  const resolvedOutputDir = path.resolve(outputDir);
  const inputDir = path.dirname(resolvedInputPath);
  const inputParentDir = path.dirname(inputDir);
  const rootDir = path.parse(resolvedOutputDir).root;
  const forbiddenDirs = new Set([rootDir, inputDir, inputParentDir]);

  if (forbiddenDirs.has(resolvedOutputDir)) {
    throw new Error(`Refusing to overwrite unsafe output directory: ${resolvedOutputDir}`);
  }

  const relativeInput = path.relative(resolvedOutputDir, resolvedInputPath);
  if (relativeInput && !relativeInput.startsWith("..") && !path.isAbsolute(relativeInput)) {
    throw new Error(`Refusing to overwrite an output directory that contains the input file: ${resolvedOutputDir}`);
  }
}

export function sanitizeOutputBaseName(rawName: string): string {
  const safe = rawName
    .replace(/[<>:"\/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return safe.length > 0 ? safe.slice(0, 120) : "office-document";
}

async function exists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}
