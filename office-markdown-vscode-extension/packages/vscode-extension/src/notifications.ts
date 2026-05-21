import path from "node:path";

import type { ConversionResult } from "./types.js";

export const OPEN_MARKDOWN_ACTION = "Open Markdown";
export const OPEN_MANIFEST_ACTION = "Open Manifest";

export interface NotificationHost {
  showInformationMessage(message: string, ...items: string[]): Promise<string | undefined>;
  showWarningMessage(message: string, ...items: string[]): Promise<string | undefined>;
  showErrorMessage(message: string, ...items: string[]): Promise<string | undefined>;
  openTextDocument(filePath: string): Promise<unknown>;
  showTextDocument(document: unknown): Promise<void>;
}

export async function showConversionResult(
  host: NotificationHost,
  result: ConversionResult
): Promise<void> {
  const warningCount = result.warnings.length;
  const errorCount = result.errors.length;
  const outputName = path.basename(result.markdownPath);
  const actions = [OPEN_MARKDOWN_ACTION, OPEN_MANIFEST_ACTION];

  if (result.status === "failed") {
    const selected = await host.showErrorMessage(
      `Office Markdown conversion failed for ${path.basename(result.inputPath)}.`,
      OPEN_MANIFEST_ACTION
    );
    if (selected === OPEN_MANIFEST_ACTION) {
      await openDocument(host, result.manifestPath);
    }
    return;
  }

  const selected =
    result.status === "partial" || warningCount > 0 || errorCount > 0
      ? await host.showWarningMessage(
          `Converted ${outputName} with ${warningCount} warning(s) and ${errorCount} error(s).`,
          ...actions
        )
      : await host.showInformationMessage(`Converted ${outputName}.`, ...actions);

  if (selected === OPEN_MARKDOWN_ACTION) {
    await openDocument(host, result.markdownPath);
  } else if (selected === OPEN_MANIFEST_ACTION) {
    await openDocument(host, result.manifestPath);
  }
}

export async function openDocument(host: NotificationHost, filePath: string): Promise<void> {
  const document = await host.openTextDocument(filePath);
  await host.showTextDocument(document);
}
