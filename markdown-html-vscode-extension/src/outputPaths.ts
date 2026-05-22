import path from "node:path";

import type { MarkdownHtmlSettings, OverwritePolicy, ResourceUri } from "./types.js";

const MAX_UNIQUE_ATTEMPTS = 1000;
const DEFAULT_OUTPUT_FOLDER_NAME = "html";

export interface SaveDialogOptions {
  defaultPath: string;
  filters?: Record<string, string[]>;
}

export interface OutputResolutionHost {
  showSaveDialog(options: SaveDialogOptions): Promise<ResourceUri | undefined>;
  showWarningMessage(message: string, ...items: string[]): Promise<string | undefined>;
  pathExists(filePath: string): Promise<boolean>;
}

export interface OutputPlan {
  htmlPath: string;
  overwritePolicy: OverwritePolicy;
}

export const OVERWRITE_ACTION = "Overwrite";
export const CANCEL_ACTION = "Cancel";

export async function resolveOutputPlan(
  inputPath: string,
  settings: MarkdownHtmlSettings,
  host: OutputResolutionHost
): Promise<OutputPlan | undefined> {
  const initial = await initialOutputPlan(inputPath, settings, host);
  if (!initial) {
    return undefined;
  }

  if (settings.overwritePolicy === "createUnique") {
    return findUniqueOutputPlan(initial, host);
  }

  if (settings.overwritePolicy === "confirm" && (await host.pathExists(initial.htmlPath))) {
    const choice = await host.showWarningMessage(
      `HTML output already exists for ${path.basename(inputPath)}.`,
      OVERWRITE_ACTION,
      CANCEL_ACTION
    );
    if (choice !== OVERWRITE_ACTION) {
      return undefined;
    }
  }

  return {
    ...initial,
    overwritePolicy: "overwrite"
  };
}

export function defaultHtmlPath(
  inputPath: string,
  outputLocation: MarkdownHtmlSettings["outputLocation"],
  outputFolderName: string
): string {
  const parsed = path.parse(inputPath);
  const baseName = sanitizeOutputBaseName(parsed.name);
  const outputDir =
    outputLocation === "htmlFolder" ? safeHtmlOutputDir(parsed.dir, outputFolderName) : parsed.dir;
  return path.join(outputDir, `${baseName}.html`);
}

export function sanitizeOutputBaseName(rawName: string): string {
  const safe = rawName
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return safe.length > 0 ? safe.slice(0, 120) : "markdown-document";
}

export function sanitizeOutputFolderName(
  rawName: string,
  fallback = DEFAULT_OUTPUT_FOLDER_NAME
): string {
  const safe = rawName
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return safe.length > 0 && safe !== "." && safe !== ".." ? safe : fallback;
}

function safeHtmlOutputDir(inputDir: string, outputFolderName: string): string {
  const safeFolderName = sanitizeOutputFolderName(outputFolderName);
  const outputDir = path.join(inputDir, safeFolderName);
  const relativeToInputDir = path.relative(path.resolve(inputDir || "."), path.resolve(outputDir));
  if (
    relativeToInputDir.length > 0 &&
    !relativeToInputDir.startsWith("..") &&
    !path.isAbsolute(relativeToInputDir)
  ) {
    return outputDir;
  }
  return path.join(inputDir, DEFAULT_OUTPUT_FOLDER_NAME);
}

async function initialOutputPlan(
  inputPath: string,
  settings: MarkdownHtmlSettings,
  host: OutputResolutionHost
): Promise<OutputPlan | undefined> {
  const defaultPath = defaultHtmlPath(inputPath, settings.outputLocation, settings.outputFolderName);
  const htmlPath =
    settings.outputLocation === "askEachTime"
      ? await askForHtmlPath(defaultPath, host)
      : defaultPath;

  if (!htmlPath) {
    return undefined;
  }

  return {
    htmlPath,
    overwritePolicy: settings.overwritePolicy
  };
}

async function askForHtmlPath(
  defaultPath: string,
  host: OutputResolutionHost
): Promise<string | undefined> {
  const selected = await host.showSaveDialog({
    defaultPath,
    filters: {
      HTML: ["html", "htm"]
    }
  });
  return selected?.fsPath;
}

async function findUniqueOutputPlan(plan: OutputPlan, host: OutputResolutionHost): Promise<OutputPlan> {
  if (!(await host.pathExists(plan.htmlPath))) {
    return plan;
  }

  const parsed = path.parse(plan.htmlPath);
  for (let attempt = 2; attempt <= MAX_UNIQUE_ATTEMPTS; attempt += 1) {
    const htmlPath = path.join(parsed.dir, `${parsed.name}-${attempt}${parsed.ext || ".html"}`);
    if (!(await host.pathExists(htmlPath))) {
      return {
        htmlPath,
        overwritePolicy: "createUnique"
      };
    }
  }

  throw new Error(`Could not find a unique HTML output path for ${path.basename(plan.htmlPath)}.`);
}
