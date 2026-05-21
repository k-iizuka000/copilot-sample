import path from "node:path";
import { promises as fs } from "node:fs";
import type {
  ConversionErrorInfo,
  ConversionManifest,
  ConversionWarning,
  ManifestItem,
  SupportedFormat
} from "./types.js";

export function createManifest(inputPath: string, sizeBytes: number, format: SupportedFormat, markdownPath: string, assetDir: string): ConversionManifest {
  return {
    schemaVersion: 1,
    tool: {
      name: "office-markdown",
      version: "0.1.0"
    },
    source: {
      fileName: path.basename(inputPath),
      format,
      sizeBytes
    },
    output: {
      markdownFile: path.basename(markdownPath),
      assetDir: path.basename(assetDir)
    },
    items: [],
    warnings: [],
    errors: []
  };
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
