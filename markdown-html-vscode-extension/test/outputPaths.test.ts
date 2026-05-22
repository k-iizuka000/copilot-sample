import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CANCEL_ACTION,
  OVERWRITE_ACTION,
  defaultHtmlPath,
  resolveOutputPlan,
  sanitizeOutputBaseName,
  sanitizeOutputFolderName,
  type OutputResolutionHost,
  type SaveDialogOptions
} from "../src/outputPaths.js";
import { defaultSettings } from "../src/settings.js";
import type { ResourceUri } from "../src/types.js";

class TestOutputHost implements OutputResolutionHost {
  public saveOptions: SaveDialogOptions | undefined;
  public warningMessages: string[] = [];

  constructor(
    private readonly existingPaths: Set<string> = new Set(),
    private readonly warningChoice: string | undefined = undefined,
    private readonly saveDialogPath: string | undefined = undefined
  ) {}

  async showSaveDialog(options: SaveDialogOptions): Promise<ResourceUri | undefined> {
    this.saveOptions = options;
    return this.saveDialogPath ? { fsPath: this.saveDialogPath, scheme: "file" } : undefined;
  }

  async showWarningMessage(message: string, ..._items: string[]): Promise<string | undefined> {
    this.warningMessages.push(message);
    return this.warningChoice;
  }

  async pathExists(filePath: string): Promise<boolean> {
    return this.existingPaths.has(filePath);
  }
}

describe("output path resolution", () => {
  it("derives the default next-to-source HTML path", async () => {
    const inputPath = path.join("workspace", "Skill Notes.md");
    const plan = await resolveOutputPlan(inputPath, defaultSettings(), new TestOutputHost());

    expect(plan).toEqual({
      htmlPath: path.join("workspace", "Skill Notes.html"),
      overwritePolicy: "overwrite"
    });
  });

  it("uses the configured HTML folder location", () => {
    expect(defaultHtmlPath(path.join("workspace", "docs", "SKILL.md"), "htmlFolder", "html")).toBe(
      path.join("workspace", "docs", "html", "SKILL.html")
    );
  });

  it("keeps htmlFolder output inside the source directory for unsafe folder names", () => {
    expect(defaultHtmlPath(path.join("workspace", "docs", "SKILL.md"), "htmlFolder", "..")).toBe(
      path.join("workspace", "docs", "html", "SKILL.html")
    );
  });

  it("uses the selected HTML path for ask-each-time output", async () => {
    const selected = path.join("workspace", "exports", "notes.html");
    const settings = { ...defaultSettings(), outputLocation: "askEachTime" as const };
    const host = new TestOutputHost(new Set(), undefined, selected);
    const plan = await resolveOutputPlan(path.join("workspace", "notes.md"), settings, host);

    expect(host.saveOptions?.defaultPath).toBe(path.join("workspace", "notes.html"));
    expect(plan?.htmlPath).toBe(selected);
  });

  it("cancels confirm policy when the user declines overwrite", async () => {
    const inputPath = path.join("workspace", "guide.md");
    const existing = new Set([path.join("workspace", "guide.html")]);
    const settings = { ...defaultSettings(), overwritePolicy: "confirm" as const };
    const host = new TestOutputHost(existing, CANCEL_ACTION);
    const plan = await resolveOutputPlan(inputPath, settings, host);

    expect(plan).toBeUndefined();
    expect(host.warningMessages).toHaveLength(1);
  });

  it("continues confirm policy when the user accepts overwrite", async () => {
    const inputPath = path.join("workspace", "guide.md");
    const existing = new Set([path.join("workspace", "guide.html")]);
    const settings = { ...defaultSettings(), overwritePolicy: "confirm" as const };
    const host = new TestOutputHost(existing, OVERWRITE_ACTION);
    const plan = await resolveOutputPlan(inputPath, settings, host);

    expect(plan?.overwritePolicy).toBe("overwrite");
  });

  it("creates a non-conflicting output path for createUnique policy", async () => {
    const inputPath = path.join("workspace", "guide.md");
    const existing = new Set([
      path.join("workspace", "guide.html"),
      path.join("workspace", "guide-2.html")
    ]);
    const settings = { ...defaultSettings(), overwritePolicy: "createUnique" as const };
    const plan = await resolveOutputPlan(inputPath, settings, new TestOutputHost(existing));

    expect(plan).toEqual({
      htmlPath: path.join("workspace", "guide-3.html"),
      overwritePolicy: "createUnique"
    });
  });

  it("sanitizes generated output base names", () => {
    expect(sanitizeOutputBaseName('bad:name?*"')).toBe("bad-name---");
  });

  it("sanitizes configured output folder names", () => {
    expect(sanitizeOutputFolderName("..")).toBe("html");
    expect(sanitizeOutputFolderName(".")).toBe("html");
    expect(sanitizeOutputFolderName("../exports")).toBe("..-exports");
  });
});
