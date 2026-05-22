import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  LAST_HTML_KEY,
  registerMarkdownHtmlCommands,
  type ExtensionHost,
  type HtmlPreviewOptions,
  type ProgressReporter
} from "../src/commands.js";
import { type ConfigurationReader } from "../src/settings.js";
import { COMMANDS, type ResourceUri } from "../src/types.js";

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
  public readonly writtenFiles = new Map<string, string>();
  public readonly previews: HtmlPreviewOptions[] = [];
  public activeFileUri: ResourceUri | undefined;
  public configuration: ConfigurationReader = new TestConfiguration();
  public existingPaths = new Set<string>();
  public workspaceState = new Map<string, string>();
  public sourceFiles = new Map<string, string>();

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

  async readTextFile(filePath: string): Promise<string> {
    const content = this.sourceFiles.get(filePath);
    if (content === undefined) {
      throw new Error(`Missing source file: ${filePath}`);
    }
    return content;
  }

  async writeTextFile(filePath: string, content: string): Promise<void> {
    this.writtenFiles.set(filePath, content);
    this.existingPaths.add(filePath);
  }

  async showHtmlPreview(options: HtmlPreviewOptions): Promise<void> {
    this.previews.push(options);
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

describe("Markdown HTML commands", () => {
  it("registers contributed command IDs", () => {
    const host = new TestHost();
    registerMarkdownHtmlCommands(host);

    expect([...host.commands.keys()]).toEqual([
      COMMANDS.exportResource,
      COMMANDS.exportCurrentFile,
      COMMANDS.openLastHtml
    ]);
  });

  it("exports a supported Explorer resource to same-name HTML and opens a preview", async () => {
    const host = new TestHost();
    registerMarkdownHtmlCommands(host);

    const inputPath = path.join("workspace", "guide.md");
    const htmlPath = path.join("workspace", "guide.html");
    host.sourceFiles.set(inputPath, "# Guide\n\nHello.");

    await host.commands.get(COMMANDS.exportResource)?.({ fsPath: inputPath, scheme: "file" });

    expect(host.writtenFiles.get(htmlPath)).toContain("Hello.");
    expect(host.progressTitles[0]).toContain("guide.md");
    expect(host.progressMessages).toEqual(["Reading Markdown", "Rendering HTML", "Writing HTML"]);
    expect(host.workspaceState.get(LAST_HTML_KEY)).toBe(htmlPath);
    expect(host.previews).toHaveLength(1);
    expect(host.informationMessages[0]).toBe("Exported guide.html.");
  });

  it("uses the active editor resource from the command palette command", async () => {
    const host = new TestHost();
    const inputPath = path.join("workspace", "active.markdown");
    host.activeFileUri = { fsPath: inputPath, scheme: "file" };
    host.sourceFiles.set(inputPath, "# Active");
    registerMarkdownHtmlCommands(host);

    await host.commands.get(COMMANDS.exportCurrentFile)?.();

    expect(host.writtenFiles.has(path.join("workspace", "active.html"))).toBe(true);
  });

  it("keeps configured HTML folder exports inside the source directory", async () => {
    const host = new TestHost();
    const inputPath = path.join("workspace", "docs", "guide.md");
    host.sourceFiles.set(inputPath, "# Guide");
    host.configuration = new TestConfiguration({
      outputLocation: "htmlFolder",
      outputFolderName: ".."
    });
    registerMarkdownHtmlCommands(host);

    await host.commands.get(COMMANDS.exportResource)?.({ fsPath: inputPath, scheme: "file" });

    expect(host.writtenFiles.has(path.join("workspace", "docs", "html", "guide.html"))).toBe(true);
    expect(host.writtenFiles.has(path.join("workspace", "guide.html"))).toBe(false);
  });

  it("rejects unsupported resources before reading files", async () => {
    const host = new TestHost();
    registerMarkdownHtmlCommands(host);

    await host.commands.get(COMMANDS.exportResource)?.({
      fsPath: path.join("workspace", "notes.txt"),
      scheme: "file"
    });

    expect(host.writtenFiles.size).toBe(0);
    expect(host.errorMessages[0]).toContain(".md, .markdown");
  });

  it("opens the last exported HTML when workspace state points to an existing file", async () => {
    const host = new TestHost();
    const htmlPath = path.join("workspace", "guide.html");
    host.workspaceState.set(LAST_HTML_KEY, htmlPath);
    host.existingPaths.add(htmlPath);
    registerMarkdownHtmlCommands(host);

    await host.commands.get(COMMANDS.openLastHtml)?.();

    expect(host.openedDocuments).toEqual([htmlPath]);
  });
});
