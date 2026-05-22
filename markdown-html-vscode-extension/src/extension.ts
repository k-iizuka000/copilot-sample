import path from "node:path";

import * as vscode from "vscode";

import { renderMarkdownHtml } from "./html.js";
import { registerMarkdownHtmlCommands, type ExtensionHost, type HtmlPreviewOptions } from "./commands.js";

const decoder = new TextDecoder("utf-8");
const encoder = new TextEncoder();

export function activate(context: vscode.ExtensionContext): void {
  const host = createVscodeHost(context);
  context.subscriptions.push(...registerMarkdownHtmlCommands(host));
}

export function deactivate(): void {
  // No extension-level resources are held outside VS Code disposables.
}

function createVscodeHost(context: vscode.ExtensionContext): ExtensionHost {
  const previewPanels = new Map<string, vscode.WebviewPanel>();

  return {
    registerCommand: (id, callback) =>
      vscode.commands.registerCommand(id, (...args: unknown[]) => callback(...args)),
    getConfiguration: (section) => vscode.workspace.getConfiguration(section),
    getActiveFileUri: () => vscode.window.activeTextEditor?.document.uri,
    withProgress: (title, task) =>
      Promise.resolve(vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title,
          cancellable: false
        },
        (progress) =>
          task({
            report: (message) => progress.report({ message })
          })
      )),
    readTextFile: async (filePath) => {
      const bytes = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
      return decoder.decode(bytes);
    },
    writeTextFile: async (filePath, content) => {
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(filePath)));
      await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), encoder.encode(content));
    },
    showInformationMessage: (message, ...items) =>
      Promise.resolve(vscode.window.showInformationMessage(message, ...items)),
    showWarningMessage: (message, ...items) =>
      Promise.resolve(vscode.window.showWarningMessage(message, ...items)),
    showErrorMessage: (message, ...items) =>
      Promise.resolve(vscode.window.showErrorMessage(message, ...items)),
    showSaveDialog: (options) => {
      const dialogOptions: vscode.SaveDialogOptions = {
        defaultUri: vscode.Uri.file(options.defaultPath)
      };
      if (options.filters) {
        dialogOptions.filters = options.filters;
      }
      return Promise.resolve(vscode.window.showSaveDialog(dialogOptions));
    },
    pathExists: async (filePath) => {
      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
        return true;
      } catch {
        return false;
      }
    },
    openTextDocument: (filePath) =>
      Promise.resolve(vscode.workspace.openTextDocument(vscode.Uri.file(filePath))),
    showTextDocument: async (document) => {
      await vscode.window.showTextDocument(document as vscode.TextDocument, { preview: false });
    },
    showHtmlPreview: async (options) => {
      const panel = getOrCreatePreviewPanel(context, previewPanels, options);
      const rendered = renderMarkdownHtml({
        markdown: options.markdown,
        inputPath: options.inputPath,
        outputHtmlPath: options.outputHtmlPath,
        settings: options.settings,
        urlMode: {
          kind: "webview",
          toWebviewUri: (absolutePath) =>
            panel.webview.asWebviewUri(vscode.Uri.file(absolutePath)).toString()
        }
      });
      panel.title = `Preview: ${path.basename(options.outputHtmlPath)}`;
      panel.webview.html = rendered.html;
    },
    updateWorkspaceState: (key, value) => Promise.resolve(context.workspaceState.update(key, value)),
    getWorkspaceState: (key) => context.workspaceState.get<string>(key)
  };
}

function getOrCreatePreviewPanel(
  context: vscode.ExtensionContext,
  previewPanels: Map<string, vscode.WebviewPanel>,
  options: HtmlPreviewOptions
): vscode.WebviewPanel {
  const existing = previewPanels.get(options.outputHtmlPath);
  if (existing) {
    existing.reveal(vscode.ViewColumn.Beside);
    return existing;
  }

  const panel = vscode.window.createWebviewPanel(
    "markdownHtmlPreview",
    `Preview: ${path.basename(options.outputHtmlPath)}`,
    vscode.ViewColumn.Beside,
    {
      enableScripts: false,
      retainContextWhenHidden: true,
      localResourceRoots: localResourceRoots(options)
    }
  );
  previewPanels.set(options.outputHtmlPath, panel);
  panel.onDidDispose(() => previewPanels.delete(options.outputHtmlPath), undefined, context.subscriptions);
  return panel;
}

function localResourceRoots(options: HtmlPreviewOptions): vscode.Uri[] {
  const roots = new Map<string, vscode.Uri>();
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    roots.set(folder.uri.fsPath, folder.uri);
  }
  for (const filePath of [options.inputPath, options.outputHtmlPath]) {
    const directory = path.dirname(filePath);
    roots.set(directory, vscode.Uri.file(directory));
  }
  return [...roots.values()];
}

