import path from "node:path";

import type { OfficeMarkdownSettings, OverwritePolicy, ResourceUri } from "./types.js";

const CONVERTED_FOLDER_NAME = "converted";
const MAX_UNIQUE_ATTEMPTS = 1000;

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

export function deriveAssetDir(markdownPath: string): string {
  const parsed = path.parse(markdownPath);
  return path.join(parsed.dir, `${parsed.name}.assets`);
}

export function defaultMarkdownPath(inputPath: string, outputLocation: OfficeMarkdownSettings["outputLocation"]): string {
  const parsed = path.parse(inputPath);
  const baseName = sanitizeOutputBaseName(parsed.name);
  const outputDir =
    outputLocation === "convertedFolder" ? path.join(parsed.dir, CONVERTED_FOLDER_NAME) : parsed.dir;
  return path.join(outputDir, `${baseName}.md`);
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
  const defaultPath = defaultMarkdownPath(inputPath, settings.outputLocation);
  const markdownPath =
    settings.outputLocation === "askEachTime"
      ? await askForMarkdownPath(defaultPath, host)
      : defaultPath;

  if (!markdownPath) {
    return undefined;
  }

  return {
    markdownPath,
    assetDir: deriveAssetDir(markdownPath),
    overwritePolicyForCore: settings.overwritePolicy
  };
}

async function askForMarkdownPath(
  defaultPath: string,
  host: OutputResolutionHost
): Promise<string | undefined> {
  const selected = await host.showSaveDialog({
    defaultPath,
    filters: {
      Markdown: ["md"]
    }
  });
  return selected?.fsPath;
}

async function findUniqueOutputPlan(plan: OutputPlan, host: OutputResolutionHost): Promise<OutputPlan> {
  if (!(await hasOutputConflict(plan, host))) {
    return plan;
  }

  const parsed = path.parse(plan.markdownPath);
  for (let attempt = 2; attempt <= MAX_UNIQUE_ATTEMPTS; attempt += 1) {
    const markdownPath = path.join(parsed.dir, `${parsed.name}-${attempt}${parsed.ext || ".md"}`);
    const candidate = {
      markdownPath,
      assetDir: deriveAssetDir(markdownPath),
      overwritePolicyForCore: "createUnique" as const
    };
    if (!(await hasOutputConflict(candidate, host))) {
      return candidate;
    }
  }

  throw new Error(`Could not find a unique Office Markdown output path for ${path.basename(plan.markdownPath)}.`);
}

async function hasOutputConflict(plan: OutputPlan, host: OutputResolutionHost): Promise<boolean> {
  return (await host.pathExists(plan.markdownPath)) || (await host.pathExists(plan.assetDir));
}
