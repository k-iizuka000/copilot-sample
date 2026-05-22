import path from "node:path";

import type { SupportedFormat } from "./types.js";

const SUPPORTED_BY_EXTENSION = new Map<string, SupportedFormat>([
  [".xlsx", "xlsx"],
  [".xlsm", "xlsm"],
  [".pptx", "pptx"],
  [".docx", "docx"],
  [".pdf", "pdf"]
]);

export const SUPPORTED_EXTENSION_LIST = [".xlsx", ".xlsm", ".pptx", ".docx", ".pdf"] as const;

export function getSupportedFormat(filePath: string): SupportedFormat | undefined {
  return SUPPORTED_BY_EXTENSION.get(path.extname(filePath).toLowerCase());
}

export function isSupportedOfficeFile(filePath: string): boolean {
  return getSupportedFormat(filePath) !== undefined;
}

export function supportedFormatsMessage(): string {
  return SUPPORTED_EXTENSION_LIST.join(", ");
}
