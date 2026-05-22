import path from "node:path";

import { convertMarkdownToHtml } from "./convert.js";
import {
  CANCEL_ACTION,
  OVERWRITE_ACTION,
  resolveOutputPlan,
  type OutputResolutionHost
} from "./outputPaths.js";
import { resolveSettings, type ConfigurationReader } from "./settings.js";
import { COMMANDS, type DisposableLike, type ResourceUri } from "./types.js";

export const LAST_HTML_KEY = "markdownHtml.lastHtmlPath";

export interface ProgressReporter {
  report(message: string): void;
}

export interface HtmlPreviewOptions {
  inputPath: string;
  outputHtmlPath: string;
  markdown: string;
  title: string;
  settings: ReturnType<typeof resolveSettings>;
}

export interface ExtensionHost extends OutputResolutionHost {
  registerCommand(id: string, callback: (...args: unknown[]) => unknown): DisposableLike;
  getConfiguration(section: string): ConfigurationReader;
  getActiveFileUri(): ResourceUri | undefined;
  withProgress<T>(title: string, task: (progress: ProgressReporter) => Promise<T>): Promise<T>;
  readTextFile(filePath: string): Promise<string>;
  writeTextFile(filePath: string, content: string): Promise<void>;
  openTextDocument(filePath: string): Promise<unknown>;
  showTextDocument(document: unknown): Promise<void>;
  showHtmlPreview(options: HtmlPreviewOptions): Promise<void>;
  showInformationMessage(message: string, ...items: string[]): Promise<string | undefined>;
  showErrorMessage(message: string, ...items: string[]): Promise<string | undefined>;
  updateWorkspaceState(key: string, value: string): Promise<void>;
  getWorkspaceState(key: string): string | undefined;
}

export function registerMarkdownHtmlCommands(host: ExtensionHost): DisposableLike[] {
  return [
    host.registerCommand(COMMANDS.exportResource, (resource: unknown) =>
      exportResource(host, asResourceUri(resource))
    ),
    host.registerCommand(COMMANDS.exportCurrentFile, () =>
      exportCurrentFile(host)
    ),
    host.registerCommand(COMMANDS.openLastHtml, () => openLastHtml(host))
  ];
}

export async function exportCurrentFile(host: ExtensionHost): Promise<void> {
  await exportResource(host, host.getActiveFileUri());
}

export async function exportResource(
  host: ExtensionHost,
  resource: ResourceUri | undefined
): Promise<void> {
  if (!resource) {
    await host.showErrorMessage("Open or select a Markdown file before running Markdown HTML.");
    return;
  }

  if (resource.scheme && resource.scheme !== "file") {
    await host.showErrorMessage("Markdown HTML can only export local files in this desktop extension.");
    return;
  }

  if (!isSupportedMarkdownPath(resource.fsPath)) {
    await host.showErrorMessage("This file type is not supported yet. Supported: .md, .markdown.");
    return;
  }

  const settings = resolveSettings(host.getConfiguration("markdownHtml"));
  const outputPlan = await resolveOutputPlan(resource.fsPath, settings, host);
  if (!outputPlan) {
    return;
  }

  try {
    const { result, markdown } = await host.withProgress(
      `Exporting ${path.basename(resource.fsPath)} to HTML`,
      async (progress) => {
        progress.report("Reading Markdown");
        const source = await host.readTextFile(resource.fsPath);
        progress.report("Rendering HTML");
        const converted = convertMarkdownToHtml({
          inputPath: resource.fsPath,
          outputHtmlPath: outputPlan.htmlPath,
          markdown: source,
          settings
        });
        progress.report("Writing HTML");
        await host.writeTextFile(outputPlan.htmlPath, converted.html);
        return {
          result: converted.result,
          markdown: source
        };
      }
    );

    await host.updateWorkspaceState(LAST_HTML_KEY, result.htmlPath);
    if (settings.openAfterExport) {
      await host.showHtmlPreview({
        inputPath: resource.fsPath,
        outputHtmlPath: result.htmlPath,
        markdown,
        title: result.title,
        settings
      });
    }

    const warningSuffix = result.warnings.length > 0 ? ` (${result.warnings.length} warning(s))` : "";
    await host.showInformationMessage(`Exported ${path.basename(result.htmlPath)}.${warningSuffix}`);
  } catch (error) {
    await host.showErrorMessage(`Markdown HTML export failed: ${errorMessage(error)}`);
  }
}

export async function openLastHtml(host: ExtensionHost): Promise<void> {
  const htmlPath = host.getWorkspaceState(LAST_HTML_KEY);
  if (!htmlPath) {
    await host.showInformationMessage("No Markdown HTML file has been exported in this workspace yet.");
    return;
  }

  if (!(await host.pathExists(htmlPath))) {
    await host.showErrorMessage("The last exported Markdown HTML file no longer exists.");
    return;
  }

  const document = await host.openTextDocument(htmlPath);
  await host.showTextDocument(document);
}

export function isSupportedMarkdownPath(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ext === ".md" || ext === ".markdown";
}

export { OVERWRITE_ACTION, CANCEL_ACTION };

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

