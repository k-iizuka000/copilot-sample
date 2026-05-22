import type { MarkdownHtmlSettings, OutputLocation, OverwritePolicy } from "./types.js";
import { sanitizeOutputFolderName } from "./outputPaths.js";

export interface ConfigurationReader {
  get<T>(key: string, defaultValue: T): T;
}

const DEFAULT_SETTINGS: MarkdownHtmlSettings = {
  outputLocation: "nextToSource",
  outputFolderName: "html",
  overwritePolicy: "overwrite",
  openAfterExport: true,
  allowRawHtml: false,
  linkify: true,
  typographer: true
};

const OUTPUT_LOCATIONS = ["nextToSource", "htmlFolder", "askEachTime"] as const;
const OVERWRITE_POLICIES = ["overwrite", "confirm", "createUnique"] as const;

export function resolveSettings(configuration: ConfigurationReader): MarkdownHtmlSettings {
  return {
    outputLocation: enumSetting(
      configuration,
      "outputLocation",
      OUTPUT_LOCATIONS,
      DEFAULT_SETTINGS.outputLocation
    ),
    outputFolderName: folderNameSetting(
      configuration,
      "outputFolderName",
      DEFAULT_SETTINGS.outputFolderName
    ),
    overwritePolicy: enumSetting(
      configuration,
      "overwritePolicy",
      OVERWRITE_POLICIES,
      DEFAULT_SETTINGS.overwritePolicy
    ),
    openAfterExport: booleanSetting(
      configuration,
      "openAfterExport",
      DEFAULT_SETTINGS.openAfterExport
    ),
    allowRawHtml: booleanSetting(
      configuration,
      "allowRawHtml",
      DEFAULT_SETTINGS.allowRawHtml
    ),
    linkify: booleanSetting(configuration, "linkify", DEFAULT_SETTINGS.linkify),
    typographer: booleanSetting(configuration, "typographer", DEFAULT_SETTINGS.typographer)
  };
}

export function defaultSettings(): MarkdownHtmlSettings {
  return { ...DEFAULT_SETTINGS };
}

function enumSetting<T extends OutputLocation | OverwritePolicy>(
  configuration: ConfigurationReader,
  key: string,
  allowed: readonly T[],
  defaultValue: T
): T {
  const value = configuration.get<unknown>(key, defaultValue);
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : defaultValue;
}

function booleanSetting(
  configuration: ConfigurationReader,
  key: string,
  defaultValue: boolean
): boolean {
  const value = configuration.get<unknown>(key, defaultValue);
  return typeof value === "boolean" ? value : defaultValue;
}

function folderNameSetting(
  configuration: ConfigurationReader,
  key: string,
  defaultValue: string
): string {
  const value = configuration.get<unknown>(key, defaultValue);
  if (typeof value !== "string") {
    return defaultValue;
  }
  return sanitizeOutputFolderName(value, defaultValue);
}
