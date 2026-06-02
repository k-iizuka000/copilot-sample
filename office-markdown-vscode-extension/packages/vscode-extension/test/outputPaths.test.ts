import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CANCEL_ACTION,
  OVERWRITE_ACTION,
  defaultOutputDir,
  deriveAssetDir,
  derivePrimaryMarkdownPath,
  resolveOutputPlan,
  sanitizeOutputBaseName,
  type OpenDialogOptions,
  type OutputResolutionHost,
} from "../src/outputPaths.js";
import { defaultSettings } from "../src/settings.js";
import type { ResourceUri } from "../src/types.js";

class TestOutputHost implements OutputResolutionHost {
  public openOptions: OpenDialogOptions | undefined;
  public warningMessages: string[] = [];

  constructor(
    private readonly existingPaths: Set<string> = new Set(),
    private readonly warningChoice: string | undefined = undefined,
    private readonly openDialogPath: string | undefined = undefined
  ) {}

  async showOpenDialog(options: OpenDialogOptions): Promise<ResourceUri[] | undefined> {
    this.openOptions = options;
    return this.openDialogPath ? [{ fsPath: this.openDialogPath, scheme: "file" }] : undefined;
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
  it("derives the default next-to-source layout", async () => {
    const inputPath = path.join("workspace", "Quarterly Report.xlsx");
    const plan = await resolveOutputPlan(inputPath, defaultSettings(), new TestOutputHost());

    expect(plan).toEqual({
      outputDir: path.join("workspace", "Quarterly Report"),
      markdownPath: path.join("workspace", "Quarterly Report", "Quarterly Report.md"),
      assetDir: path.join("workspace", "Quarterly Report", "assets"),
      overwritePolicyForCore: "overwrite"
    });
  });

  it("uses the converted folder location when configured", () => {
    expect(defaultOutputDir(path.join("workspace", "deck.pptx"), "convertedFolder")).toBe(
      path.join("workspace", "converted", "deck")
    );
  });

  it("uses the selected directory for ask-each-time output", async () => {
    const selected = path.join("workspace", "exports", "notes");
    const settings = { ...defaultSettings(), outputLocation: "askEachTime" as const };
    const host = new TestOutputHost(new Set(), undefined, selected);
    const plan = await resolveOutputPlan(path.join("workspace", "notes.docx"), settings, host);

    expect(host.openOptions?.defaultPath).toBe(path.join("workspace", "notes"));
    expect(host.openOptions?.canSelectFolders).toBe(true);
    expect(plan?.outputDir).toBe(selected);
    expect(plan?.markdownPath).toBe(path.join(selected, "notes.md"));
    expect(plan?.assetDir).toBe(path.join(selected, "assets"));
  });

  it("cancels confirm policy when the user declines overwrite", async () => {
    const inputPath = path.join("workspace", "book.xlsx");
    const existing = new Set([path.join("workspace", "book")]);
    const host = new TestOutputHost(existing, CANCEL_ACTION);
    const plan = await resolveOutputPlan(inputPath, defaultSettings(), host);

    expect(plan).toBeUndefined();
    expect(host.warningMessages).toHaveLength(1);
  });

  it("continues confirm policy when the user accepts overwrite", async () => {
    const inputPath = path.join("workspace", "book.xlsx");
    const existing = new Set([path.join("workspace", "book")]);
    const host = new TestOutputHost(existing, OVERWRITE_ACTION);
    const plan = await resolveOutputPlan(inputPath, defaultSettings(), host);

    expect(plan?.overwritePolicyForCore).toBe("overwrite");
  });

  it("creates a non-conflicting output pair for createUnique policy", async () => {
    const inputPath = path.join("workspace", "book.xlsx");
    const existing = new Set([
      path.join("workspace", "book"),
      path.join("workspace", "book-2")
    ]);
    const settings = { ...defaultSettings(), overwritePolicy: "createUnique" as const };
    const plan = await resolveOutputPlan(inputPath, settings, new TestOutputHost(existing));

    expect(plan).toEqual({
      outputDir: path.join("workspace", "book-3"),
      markdownPath: path.join("workspace", "book-3", "book-3.md"),
      assetDir: path.join("workspace", "book-3", "assets"),
      overwritePolicyForCore: "createUnique"
    });
  });

  it("sanitizes generated output base names", () => {
    expect(sanitizeOutputBaseName('bad:name?*"')).toBe("bad-name---");
    expect(derivePrimaryMarkdownPath(path.join("workspace", "safe"))).toBe(path.join("workspace", "safe", "safe.md"));
    expect(deriveAssetDir(path.join("workspace", "safe"))).toBe(path.join("workspace", "safe", "assets"));
  });
});
