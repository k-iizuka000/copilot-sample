import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { COMMANDS } from "../src/types.js";

type PackageJson = {
  main: string;
  contributes: {
    commands: Array<{ command: string; title: string }>;
    menus: {
      "explorer/context": Array<{ command: string; when: string }>;
      "editor/context": Array<{ command: string; when: string }>;
      "editor/title/context": Array<{ command: string; when: string }>;
      commandPalette: Array<{ command: string; when: string }>;
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

  it("contributes the Markdown HTML commands", () => {
    expect(packageJson.contributes.commands.map((command) => command.command)).toEqual([
      COMMANDS.exportResource,
      COMMANDS.exportCurrentFile,
      COMMANDS.openLastHtml
    ]);
  });

  it("shows Explorer export only for local Markdown files", () => {
    const menu = packageJson.contributes.menus["explorer/context"][0];
    expect(menu?.command).toBe(COMMANDS.exportResource);
    expect(menu?.when).toContain("resourceScheme == file");
    expect(menu?.when).toContain("resourceExtname == .md");
    expect(menu?.when).toContain("resourceExtname == .markdown");
  });

  it("shows active-editor export from editor and tab context menus for Markdown files", () => {
    for (const menuKey of ["editor/context", "editor/title/context"] as const) {
      const menu = packageJson.contributes.menus[menuKey][0];
      expect(menu?.command).toBe(COMMANDS.exportCurrentFile);
      expect(menu?.when).toContain("resourceScheme == file");
      expect(menu?.when).toContain("editorLangId == markdown");
      expect(menu?.when).toContain("resourceExtname == .md");
    }
  });

  it("scopes the active-file command palette entry to Markdown editors", () => {
    const menu = packageJson.contributes.menus.commandPalette[0];
    expect(menu).toEqual({
      command: COMMANDS.exportCurrentFile,
      when: "editorLangId == markdown"
    });
  });

  it("contributes settings with documented defaults", () => {
    const properties = packageJson.contributes.configuration.properties;
    expect(properties["markdownHtml.outputLocation"]?.default).toBe("nextToSource");
    expect(properties["markdownHtml.outputFolderName"]?.default).toBe("html");
    expect(properties["markdownHtml.overwritePolicy"]?.default).toBe("overwrite");
    expect(properties["markdownHtml.openAfterExport"]?.default).toBe(true);
    expect(properties["markdownHtml.allowRawHtml"]?.default).toBe(false);
  });
});
