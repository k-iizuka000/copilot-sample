import path from "node:path";
import { promises as fs } from "node:fs";
import type {
  ConversionErrorInfo,
  ConversionManifest,
  ConversionWarning,
  ManifestItem,
  SupportedFormat
} from "./types.js";
import { toPosixRelativePath } from "./ooxml/path-safety.js";

export function createManifest(
  inputPath: string,
  sizeBytes: number,
  format: SupportedFormat,
  outputDir: string,
  markdownPath: string,
  assetDir: string
): ConversionManifest {
  return {
    schemaVersion: 2,
    tool: {
      name: "office-markdown",
      version: "0.1.1"
    },
    source: {
      fileName: path.basename(inputPath),
      format,
      sizeBytes
    },
    output: {
      primaryMarkdownFile: toPosixRelativePath(outputDir, markdownPath),
      markdownFiles: [toPosixRelativePath(outputDir, markdownPath)],
      assetDir: toPosixRelativePath(outputDir, assetDir)
    },
    items: [],
    warnings: [],
    errors: []
  };
}

export function setManifestMarkdownFiles(
  manifest: ConversionManifest,
  outputDir: string,
  primaryMarkdownPath: string,
  markdownPaths: string[]
): void {
  manifest.output.primaryMarkdownFile = toPosixRelativePath(outputDir, primaryMarkdownPath);
  manifest.output.markdownFiles = markdownPaths.map((markdownPath) => toPosixRelativePath(outputDir, markdownPath));
}

export function addManifestItem(manifest: ConversionManifest, item: ManifestItem): ManifestItem {
  const numbered: ManifestItem = {
    ...item,
    id: item.id || `item-${String(manifest.items.length + 1).padStart(3, "0")}`
  };
  manifest.items.push(numbered);
  return numbered;
}

export function addWarning(manifest: ConversionManifest, warning: ConversionWarning): void {
  manifest.warnings.push(warning);
}

export function addError(manifest: ConversionManifest, error: ConversionErrorInfo): void {
  manifest.errors.push(error);
}

export async function writeManifest(manifestPath: string, manifest: ConversionManifest): Promise<void> {
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}
