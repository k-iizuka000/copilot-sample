import path from "node:path";

import type { OfficeMarkdownSettings, OverwritePolicy, ResourceUri } from "./types.js";

const CONVERTED_FOLDER_NAME = "converted";
const MAX_UNIQUE_ATTEMPTS = 1000;

export interface OpenDialogOptions {
  defaultPath: string;
  canSelectFiles: boolean;
  canSelectFolders: boolean;
  canSelectMany: boolean;
  openLabel?: string;
}

export interface OutputResolutionHost {
  showOpenDialog(options: OpenDialogOptions): Promise<ResourceUri[] | undefined>;
  showWarningMessage(message: string, ...items: string[]): Promise<string | undefined>;
  pathExists(filePath: string): Promise<boolean>;
}

export interface OutputPlan {
  outputDir: string;
  markdownPath: string;
  assetDir: string;
  overwritePolicyForCore: OverwritePolicy;
}

export const OVERWRITE_ACTION = "Overwrite";
export const CANCEL_ACTION = "Cancel";

export async function resolveOutputPlan(
  inputPath: string,
  settings: OfficeMarkdownSettings,
  host: OutputResolutionHost
): Promise<OutputPlan | undefined> {
  const initial = await initialOutputPlan(inputPath, settings, host);
  if (!initial) {
    return undefined;
  }

  if (settings.overwritePolicy === "createUnique") {
    return findUniqueOutputPlan(initial, host);
  }

  if (settings.overwritePolicy === "confirm" && (await hasOutputConflict(initial, host))) {
    const choice = await host.showWarningMessage(
      `Office Markdown output already exists for ${path.basename(inputPath)}.`,
      OVERWRITE_ACTION,
      CANCEL_ACTION
    );
    if (choice !== OVERWRITE_ACTION) {
      return undefined;
    }
  }

  return {
    ...initial,
    overwritePolicyForCore: "overwrite"
  };
}

export function deriveAssetDir(outputDir: string): string {
  return path.join(outputDir, "assets");
}

export function derivePrimaryMarkdownPath(outputDir: string): string {
  return path.join(outputDir, `${sanitizeOutputBaseName(path.basename(outputDir))}.md`);
}

export function defaultOutputDir(inputPath: string, outputLocation: OfficeMarkdownSettings["outputLocation"]): string {
  const parsed = path.parse(inputPath);
  const baseName = sanitizeOutputBaseName(parsed.name);
  const outputDir =
    outputLocation === "convertedFolder" ? path.join(parsed.dir, CONVERTED_FOLDER_NAME, baseName) : path.join(parsed.dir, baseName);
  return outputDir;
}

export function sanitizeOutputBaseName(rawName: string): string {
  const safe = rawName
    .replace(/[<>:"\/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return safe.length > 0 ? safe.slice(0, 120) : "office-document";
}

async function initialOutputPlan(
  inputPath: string,
  settings: OfficeMarkdownSettings,
  host: OutputResolutionHost
): Promise<OutputPlan | undefined> {
  const defaultPath = defaultOutputDir(inputPath, settings.outputLocation);
  const outputDir =
    settings.outputLocation === "askEachTime"
      ? await askForOutputDir(defaultPath, host)
      : defaultPath;

  if (!outputDir) {
    return undefined;
  }

  return {
    outputDir,
    markdownPath: derivePrimaryMarkdownPath(outputDir),
    assetDir: deriveAssetDir(outputDir),
    overwritePolicyForCore: settings.overwritePolicy
  };
}

async function askForOutputDir(
  defaultPath: string,
  host: OutputResolutionHost
): Promise<string | undefined> {
  const selected = await host.showOpenDialog({
    defaultPath,
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: "Select Output Folder"
  });
  return selected?.[0]?.fsPath;
}

async function findUniqueOutputPlan(plan: OutputPlan, host: OutputResolutionHost): Promise<OutputPlan> {
  if (!(await hasOutputConflict(plan, host))) {
    return plan;
  }

  const parsed = path.parse(plan.outputDir);
  for (let attempt = 2; attempt <= MAX_UNIQUE_ATTEMPTS; attempt += 1) {
    const outputDir = path.join(parsed.dir, `${parsed.name}-${attempt}`);
    const candidate = {
      outputDir,
      markdownPath: derivePrimaryMarkdownPath(outputDir),
      assetDir: deriveAssetDir(outputDir),
      overwritePolicyForCore: "createUnique" as const
    };
    if (!(await hasOutputConflict(candidate, host))) {
      return candidate;
    }
  }

  throw new Error(`Could not find a unique Office Markdown output directory for ${path.basename(plan.outputDir)}.`);
}

async function hasOutputConflict(plan: OutputPlan, host: OutputResolutionHost): Promise<boolean> {
  return host.pathExists(plan.outputDir);
}
