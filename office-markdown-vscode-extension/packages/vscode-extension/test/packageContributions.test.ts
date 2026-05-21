import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { COMMANDS } from "../src/types.js";

type PackageJson = {
  main: string;
  contributes: {
    commands: Array<{ command: string; title: string }>;
    menus: {
      "explorer/context": Array<{ command: string; when: string }>;
    };
    configuration: {
      properties: Record<string, { default: unknown; enum?: string[] }>;
    };
  };
};

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
) as PackageJson;

describe("VS Code package contributions", () => {
  it("points VS Code at the bundled extension entrypoint", () => {
    expect(packageJson.main).toBe("./dist/extension.cjs");
  });

  it("contributes the Office Markdown commands", () => {
    expect(packageJson.contributes.commands.map((command) => command.command)).toEqual([
      COMMANDS.convertResource,
      COMMANDS.convertCurrentFile,
      COMMANDS.openLastManifest
    ]);
  });

  it("shows Explorer conversion only for supported local Office files", () => {
    const menu = packageJson.contributes.menus["explorer/context"][0];
    expect(menu?.command).toBe(COMMANDS.convertResource);
    expect(menu?.when).toContain("resourceScheme == file");
    expect(menu?.when).toContain("resourceExtname == .xlsx");
    expect(menu?.when).toContain("resourceExtname == .xlsm");
    expect(menu?.when).toContain("resourceExtname == .pptx");
    expect(menu?.when).toContain("resourceExtname == .docx");
  });

  it("contributes settings with documented defaults", () => {
    const properties = packageJson.contributes.configuration.properties;
    expect(properties["officeMarkdown.outputLocation"]?.default).toBe("nextToSource");
    expect(properties["officeMarkdown.overwritePolicy"]?.enum).toEqual([
      "confirm",
      "overwrite",
      "createUnique"
    ]);
    expect(properties["officeMarkdown.excelFormulaMode"]?.default).toBe("valuesWithManifest");
    expect(properties["officeMarkdown.includePowerPointNotes"]?.default).toBe(true);
    expect(properties["officeMarkdown.maxTableRows"]?.default).toBe(1000);
    expect(properties["officeMarkdown.maxEntryCount"]?.default).toBe(10000);
  });
});
