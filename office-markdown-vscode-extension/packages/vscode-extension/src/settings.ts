import type {
  ExcelFormulaMode,
  OfficeMarkdownSettings,
  OutputLocation,
  OverwritePolicy
} from "./types.js";

export interface ConfigurationReader {
  get<T>(key: string, defaultValue: T): T;
}

const DEFAULT_SETTINGS: OfficeMarkdownSettings = {
  outputLocation: "nextToSource",
  overwritePolicy: "confirm",
  includeExcelHiddenSheets: false,
  excelFormulaMode: "valuesWithManifest",
  includePowerPointNotes: true,
  includeConversionReport: true,
  maxTableRows: 1000,
  maxExtractedAssetBytes: 50000000,
  maxPackageUncompressedBytes: 300000000,
  maxEntryCount: 10000
};

const OUTPUT_LOCATIONS = ["nextToSource", "convertedFolder", "askEachTime"] as const;
const OVERWRITE_POLICIES = ["confirm", "overwrite", "createUnique"] as const;
const EXCEL_FORMULA_MODES = ["valuesOnly", "valuesWithManifest", "inlineFormulaTable"] as const;

export function resolveSettings(configuration: ConfigurationReader): OfficeMarkdownSettings {
  return {
    outputLocation: enumSetting(
      configuration,
      "outputLocation",
      OUTPUT_LOCATIONS,
      DEFAULT_SETTINGS.outputLocation
    ),
    overwritePolicy: enumSetting(
      configuration,
      "overwritePolicy",
      OVERWRITE_POLICIES,
      DEFAULT_SETTINGS.overwritePolicy
    ),
    includeExcelHiddenSheets: booleanSetting(
      configuration,
      "includeExcelHiddenSheets",
      DEFAULT_SETTINGS.includeExcelHiddenSheets
    ),
    excelFormulaMode: enumSetting(
      configuration,
      "excelFormulaMode",
      EXCEL_FORMULA_MODES,
      DEFAULT_SETTINGS.excelFormulaMode
    ),
    includePowerPointNotes: booleanSetting(
      configuration,
      "includePowerPointNotes",
      DEFAULT_SETTINGS.includePowerPointNotes
    ),
    includeConversionReport: booleanSetting(
      configuration,
      "includeConversionReport",
      DEFAULT_SETTINGS.includeConversionReport
    ),
    maxTableRows: positiveIntegerSetting(configuration, "maxTableRows", DEFAULT_SETTINGS.maxTableRows),
    maxExtractedAssetBytes: positiveIntegerSetting(
      configuration,
      "maxExtractedAssetBytes",
      DEFAULT_SETTINGS.maxExtractedAssetBytes
    ),
    maxPackageUncompressedBytes: positiveIntegerSetting(
      configuration,
      "maxPackageUncompressedBytes",
      DEFAULT_SETTINGS.maxPackageUncompressedBytes
    ),
    maxEntryCount: positiveIntegerSetting(configuration, "maxEntryCount", DEFAULT_SETTINGS.maxEntryCount)
  };
}

export function defaultSettings(): OfficeMarkdownSettings {
  return { ...DEFAULT_SETTINGS };
}

function enumSetting<T extends OutputLocation | OverwritePolicy | ExcelFormulaMode>(
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

function positiveIntegerSetting(
  configuration: ConfigurationReader,
  key: string,
  defaultValue: number
): number {
  const value = configuration.get<unknown>(key, defaultValue);
  return typeof value === "number" && Number.isFinite(value) && value >= 1
    ? Math.floor(value)
    : defaultValue;
}
