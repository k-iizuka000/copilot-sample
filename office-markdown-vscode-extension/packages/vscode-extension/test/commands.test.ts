import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  LAST_MANIFEST_KEY,
  registerOfficeMarkdownCommands,
  type ExtensionHost,
  type ProgressReporter
} from "../src/commands.js";
import { type ConfigurationReader } from "../src/settings.js";
import { COMMANDS, type ConvertFileOptions, type ConversionResult, type OfficeMarkdownConverter, type ResourceUri } from "../src/types.js";

class TestConfiguration implements ConfigurationReader {
  constructor(private readonly values: Record<string, unknown> = {}) {}

  get<T>(key: string, defaultValue: T): T {
    return Object.hasOwn(this.values, key) ? (this.values[key] as T) : defaultValue;
  }
}

class TestHost implements ExtensionHost {
  public readonly commands = new Map<string, (...args: unknown[]) => unknown>();
  public readonly progressTitles: string[] = [];
  public readonly progressMessages: string[] = [];
  public readonly informationMessages: string[] = [];
  public readonly warningMessages: string[] = [];
  public readonly errorMessages: string[] = [];
  public readonly openedDocuments: string[] = [];
  public activeFileUri: ResourceUri | undefined;
  public configuration: ConfigurationReader = new TestConfiguration();
  public existingPaths = new Set<string>();
  public workspaceState = new Map<string, string>();

  registerCommand(id: string, callback: (...args: unknown[]) => unknown) {
    this.commands.set(id, callback);
    return {
      dispose: () => this.commands.delete(id)
    };
  }

  getConfiguration(_section: string): ConfigurationReader {
    return this.configuration;
  }

  getActiveFileUri(): ResourceUri | undefined {
    return this.activeFileUri;
  }

  async withProgress<T>(title: string, task: (progress: ProgressReporter) => Promise<T>): Promise<T> {
    this.progressTitles.push(title);
    return task({
      report: (message) => this.progressMessages.push(message)
    });
  }

  async showInformationMessage(message: string, ..._items: string[]): Promise<string | undefined> {
    this.informationMessages.push(message);
    return undefined;
  }

  async showWarningMessage(message: string, ..._items: string[]): Promise<string | undefined> {
    this.warningMessages.push(message);
    return undefined;
  }

  async showErrorMessage(message: string, ..._items: string[]): Promise<string | undefined> {
    this.errorMessages.push(message);
    return undefined;
  }

  async showSaveDialog(): Promise<ResourceUri | undefined> {
    return undefined;
  }

  async pathExists(filePath: string): Promise<boolean> {
    return this.existingPaths.has(filePath);
  }

  async openTextDocument(filePath: string): Promise<unknown> {
    this.openedDocuments.push(filePath);
    return { filePath };
  }

  async showTextDocument(_document: unknown): Promise<void> {}

  async updateWorkspaceState(key: string, value: string): Promise<void> {
    this.workspaceState.set(key, value);
  }

  getWorkspaceState(key: string): string | undefined {
    return this.workspaceState.get(key);
  }
}

class TestConverter implements OfficeMarkdownConverter {
  public readonly calls: ConvertFileOptions[] = [];

  async convertFile(options: ConvertFileOptions): Promise<ConversionResult> {
    this.calls.push(options);
    const markdownPath = options.outputMarkdownPath ?? path.join("workspace", "output.md");
    const assetDir = options.outputAssetDir ?? path.join("workspace", "output.assets");
    return {
      inputPath: options.inputPath,
      markdownPath,
      assetDir,
      manifestPath: path.join(assetDir, "manifest.json"),
      format: "xlsx",
      status: "success",
      warnings: [],
      errors: []
    };
  }
}

describe("Office Markdown commands", () => {
  it("registers contributed command IDs", () => {
    const host = new TestHost();
    const converter = new TestConverter();
    registerOfficeMarkdownCommands(host, converter);

    expect([...host.commands.keys()]).toEqual([
      COMMANDS.convertResource,
      COMMANDS.convertCurrentFile,
      COMMANDS.openLastManifest
    ]);
  });

  it("converts a supported Explorer resource with resolved options and progress", async () => {
    const host = new TestHost();
    const converter = new TestConverter();
    registerOfficeMarkdownCommands(host, converter);

    const inputPath = path.join("workspace", "book.xlsx");
    await host.commands.get(COMMANDS.convertResource)?.({ fsPath: inputPath, scheme: "file" });

    expect(converter.calls).toHaveLength(1);
    expect(converter.calls[0]).toMatchObject({
      inputPath,
      outputMarkdownPath: path.join("workspace", "book.md"),
      outputAssetDir: path.join("workspace", "book.assets"),
      overwritePolicy: "overwrite",
      includeConversionReport: true,
      excel: {
        includeHiddenSheets: false,
        formulaMode: "valuesWithManifest",
        maxTableRows: 1000
      },
      pptx: {
        includeSpeakerNotes: true
      },
      pdf: {
        maxPages: 500,
        maxTextItemsPerPage: 20000,
        maxMarkdownChars: 5000000
      }
    });
    expect(host.progressTitles[0]).toContain("book.xlsx");
    expect(host.progressMessages).toEqual(["Preparing output", "Converting source file"]);
    expect(host.workspaceState.get(LAST_MANIFEST_KEY)).toBe(
      path.join("workspace", "book.assets", "manifest.json")
    );
    expect(host.informationMessages[0]).toBe("Converted book.md.");
  });

  it("uses the active editor resource from the command palette command", async () => {
    const host = new TestHost();
    const converter = new TestConverter();
    host.activeFileUri = { fsPath: path.join("workspace", "deck.pptx"), scheme: "file" };
    registerOfficeMarkdownCommands(host, converter);

    await host.commands.get(COMMANDS.convertCurrentFile)?.();

    expect(converter.calls[0]?.inputPath).toBe(path.join("workspace", "deck.pptx"));
    expect(converter.calls[0]?.outputMarkdownPath).toBe(path.join("workspace", "deck.md"));
  });

  it("accepts PDF resources from Explorer", async () => {
    const host = new TestHost();
    const converter = new TestConverter();
    registerOfficeMarkdownCommands(host, converter);

    const inputPath = path.join("workspace", "paper.pdf");
    await host.commands.get(COMMANDS.convertResource)?.({ fsPath: inputPath, scheme: "file" });

    expect(converter.calls).toHaveLength(1);
    expect(converter.calls[0]?.inputPath).toBe(inputPath);
    expect(converter.calls[0]?.outputMarkdownPath).toBe(path.join("workspace", "paper.md"));
  });

  it("rejects unsupported resources before invoking the converter", async () => {
    const host = new TestHost();
    const converter = new TestConverter();
    registerOfficeMarkdownCommands(host, converter);

    await host.commands.get(COMMANDS.convertResource)?.({
      fsPath: path.join("workspace", "legacy.xls"),
      scheme: "file"
    });

    expect(converter.calls).toHaveLength(0);
    expect(host.errorMessages[0]).toContain(".xlsx, .xlsm, .pptx, .docx, .pdf");
  });

  it("opens the last manifest when workspace state points to an existing manifest", async () => {
    const host = new TestHost();
    const converter = new TestConverter();
    const manifestPath = path.join("workspace", "book.assets", "manifest.json");
    host.workspaceState.set(LAST_MANIFEST_KEY, manifestPath);
    host.existingPaths.add(manifestPath);
    registerOfficeMarkdownCommands(host, converter);

    await host.commands.get(COMMANDS.openLastManifest)?.();

    expect(host.openedDocuments).toEqual([manifestPath]);
  });
});
