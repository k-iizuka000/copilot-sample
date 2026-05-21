import path from "node:path";

import { getSupportedFormat, supportedFormatsMessage } from "./formats.js";
import { openDocument, showConversionResult, type NotificationHost } from "./notifications.js";
import {
  resolveOutputPlan,
  type OutputPlan,
  type OutputResolutionHost
} from "./outputPaths.js";
import { resolveSettings, type ConfigurationReader } from "./settings.js";
import type {
  ConvertFileOptions,
  DisposableLike,
  OfficeMarkdownConverter,
  OfficeMarkdownSettings,
  ResourceUri,
  SupportedFormat
} from "./types.js";
import { COMMANDS as COMMAND_IDS } from "./types.js";

export const LAST_MANIFEST_KEY = "officeMarkdown.lastManifestPath";

export interface ProgressReporter {
  report(message: string): void;
}

export interface ExtensionHost extends OutputResolutionHost, NotificationHost {
  registerCommand(id: string, callback: (...args: unknown[]) => unknown): DisposableLike;
  getConfiguration(section: string): ConfigurationReader;
  getActiveFileUri(): ResourceUri | undefined;
  withProgress<T>(title: string, task: (progress: ProgressReporter) => Promise<T>): Promise<T>;
  updateWorkspaceState(key: string, value: string): Promise<void>;
  getWorkspaceState(key: string): string | undefined;
}

export function registerOfficeMarkdownCommands(
  host: ExtensionHost,
  converter: OfficeMarkdownConverter
): DisposableLike[] {
  return [
    host.registerCommand(COMMAND_IDS.convertResource, (resource: unknown) =>
      convertResource(host, converter, asResourceUri(resource))
    ),
    host.registerCommand(COMMAND_IDS.convertCurrentFile, () =>
      convertCurrentFile(host, converter)
    ),
    host.registerCommand(COMMAND_IDS.openLastManifest, () => openLastManifest(host))
  ];
}

export async function convertCurrentFile(
  host: ExtensionHost,
  converter: OfficeMarkdownConverter
): Promise<void> {
  await convertResource(host, converter, host.getActiveFileUri());
}

export async function convertResource(
  host: ExtensionHost,
  converter: OfficeMarkdownConverter,
  resource: ResourceUri | undefined
): Promise<void> {
  if (!resource) {
    await host.showErrorMessage("Open or select a supported Office file before running Office Markdown.");
    return;
  }

  if (resource.scheme && resource.scheme !== "file") {
    await host.showErrorMessage("Office Markdown can only convert local files in this desktop extension.");
    return;
  }

  const format = getSupportedFormat(resource.fsPath);
  if (!format) {
    await host.showErrorMessage(
      `This file type is not supported yet. Supported: ${supportedFormatsMessage()}.`
    );
    return;
  }

  const settings = resolveSettings(host.getConfiguration("officeMarkdown"));
  const outputPlan = await resolveOutputPlan(resource.fsPath, settings, host);
  if (!outputPlan) {
    return;
  }

  const options = buildConvertFileOptions(resource.fsPath, format, settings, outputPlan);

  try {
    const result = await host.withProgress(
      `Converting ${path.basename(resource.fsPath)} to Markdown`,
      async (progress) => {
        progress.report("Preparing output");
        progress.report("Converting Office package");
        return converter.convertFile(options);
      }
    );
    await host.updateWorkspaceState(LAST_MANIFEST_KEY, result.manifestPath);
    await showConversionResult(host, result);
  } catch (error) {
    await host.showErrorMessage(`Office Markdown conversion failed: ${errorMessage(error)}`);
  }
}

export async function openLastManifest(host: ExtensionHost): Promise<void> {
  const manifestPath = host.getWorkspaceState(LAST_MANIFEST_KEY);
  if (!manifestPath) {
    await host.showInformationMessage("No Office Markdown manifest has been generated in this workspace yet.");
    return;
  }

  if (!(await host.pathExists(manifestPath))) {
    await host.showErrorMessage("The last Office Markdown manifest no longer exists.");
    return;
  }

  await openDocument(host, manifestPath);
}

export function buildConvertFileOptions(
  inputPath: string,
  _format: SupportedFormat,
  settings: OfficeMarkdownSettings,
  outputPlan: OutputPlan
): ConvertFileOptions {
  return {
    inputPath,
    outputMarkdownPath: outputPlan.markdownPath,
    outputAssetDir: outputPlan.assetDir,
    overwritePolicy: outputPlan.overwritePolicyForCore,
    includeConversionReport: settings.includeConversionReport,
    excel: {
      includeHiddenSheets: settings.includeExcelHiddenSheets,
      formulaMode: settings.excelFormulaMode,
      maxTableRows: settings.maxTableRows
    },
    pptx: {
      includeSpeakerNotes: settings.includePowerPointNotes
    },
    safety: {
      maxPackageUncompressedBytes: settings.maxPackageUncompressedBytes,
      maxExtractedAssetBytes: settings.maxExtractedAssetBytes,
      maxEntryCount: settings.maxEntryCount
    }
  };
}

function asResourceUri(value: unknown): ResourceUri | undefined {
  if (typeof value !== "object" || value === null || !("fsPath" in value)) {
    return undefined;
  }

  const candidate = value as { fsPath: unknown; scheme?: unknown };
  if (typeof candidate.fsPath !== "string") {
    return undefined;
  }

  return typeof candidate.scheme === "string"
    ? { fsPath: candidate.fsPath, scheme: candidate.scheme }
    : { fsPath: candidate.fsPath };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
