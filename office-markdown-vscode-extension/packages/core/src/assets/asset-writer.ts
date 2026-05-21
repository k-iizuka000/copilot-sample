import path from "node:path";
import { promises as fs } from "node:fs";
import type { ManifestItem, SourceRef } from "../types.js";
import { toPosixRelativePath } from "../ooxml/path-safety.js";
import { assetFileName } from "./filename-policy.js";

export interface AssetWriteRequest {
  kind: "image" | "embeddedObject";
  prefix: string;
  sourcePath: string;
  contentType?: string;
  bytes: Uint8Array;
  source: SourceRef;
  label: string;
  markdownPath: string;
  assetDir: string;
}

export interface AssetWriteResult {
  fileName: string;
  absolutePath: string;
  relativePath: string;
  markdownRef: string;
  item: ManifestItem;
}

export async function writeAsset(request: AssetWriteRequest): Promise<AssetWriteResult> {
  await fs.mkdir(request.assetDir, { recursive: true });
  const fileName = assetFileName(request.prefix, request.sourcePath, request.contentType);
  const absolutePath = path.join(request.assetDir, fileName);
  const relativePath = toPosixRelativePath(path.dirname(request.markdownPath), absolutePath);
  await fs.writeFile(absolutePath, request.bytes);

  const markdownRef =
    request.kind === "image"
      ? `![${request.label}](${relativePath})`
      : `[${request.label}](${relativePath})`;
  const item: ManifestItem = {
    id: "",
    kind: request.kind,
    source: request.source,
    output: {
      path: relativePath,
      markdownRef
    },
    status: "extracted"
  };
  if (request.contentType) {
    item.contentType = request.contentType;
  }
  return {
    fileName,
    absolutePath,
    relativePath,
    markdownRef,
    item
  };
}
