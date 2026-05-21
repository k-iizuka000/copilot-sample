import { describe, expect, it } from "vitest";

import { defaultSettings, type ConfigurationReader, resolveSettings } from "../src/settings.js";

class TestConfiguration implements ConfigurationReader {
  constructor(private readonly values: Record<string, unknown> = {}) {}

  get<T>(key: string, defaultValue: T): T {
    return Object.hasOwn(this.values, key) ? (this.values[key] as T) : defaultValue;
  }
}

describe("resolveSettings", () => {
  it("returns documented defaults", () => {
    expect(resolveSettings(new TestConfiguration())).toEqual(defaultSettings());
  });

  it("maps VS Code settings into converter options", () => {
    const settings = resolveSettings(
      new TestConfiguration({
        outputLocation: "convertedFolder",
        overwritePolicy: "createUnique",
        includeExcelHiddenSheets: true,
        excelFormulaMode: "inlineFormulaTable",
        includePowerPointNotes: false,
        includeConversionReport: false,
        maxTableRows: 25,
        maxExtractedAssetBytes: 1024,
        maxPackageUncompressedBytes: 2048,
        maxEntryCount: 50
      })
    );

    expect(settings).toEqual({
      outputLocation: "convertedFolder",
      overwritePolicy: "createUnique",
      includeExcelHiddenSheets: true,
      excelFormulaMode: "inlineFormulaTable",
      includePowerPointNotes: false,
      includeConversionReport: false,
      maxTableRows: 25,
      maxExtractedAssetBytes: 1024,
      maxPackageUncompressedBytes: 2048,
      maxEntryCount: 50
    });
  });

  it("falls back when settings are invalid", () => {
    expect(
      resolveSettings(
        new TestConfiguration({
          outputLocation: "elsewhere",
          overwritePolicy: "deleteFirst",
          excelFormulaMode: "evaluate",
          includePowerPointNotes: "yes",
          maxTableRows: 0
        })
      )
    ).toEqual(defaultSettings());
  });
});
