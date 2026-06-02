import * as vscode from "vscode";

import { registerOfficeMarkdownCommands, type ExtensionHost } from "./commands.js";
import { createCoreConverter } from "./coreAdapter.js";

export function activate(context: vscode.ExtensionContext): void {
  const host = createVscodeHost(context);
  const disposables = registerOfficeMarkdownCommands(host, createCoreConverter());
  context.subscriptions.push(...disposables);
}

export function deactivate(): void {
  // No extension-level resources are held outside VS Code disposables.
}

function createVscodeHost(context: vscode.ExtensionContext): ExtensionHost {
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
    showInformationMessage: (message, ...items) =>
      Promise.resolve(vscode.window.showInformationMessage(message, ...items)),
    showWarningMessage: (message, ...items) =>
      Promise.resolve(vscode.window.showWarningMessage(message, ...items)),
    showErrorMessage: (message, ...items) =>
      Promise.resolve(vscode.window.showErrorMessage(message, ...items)),
    showOpenDialog: (options) => {
      const dialogOptions: vscode.OpenDialogOptions = {
        canSelectFiles: options.canSelectFiles,
        canSelectFolders: options.canSelectFolders,
        canSelectMany: options.canSelectMany,
        defaultUri: vscode.Uri.file(options.defaultPath)
      };
      if (options.openLabel) {
        dialogOptions.openLabel = options.openLabel;
      }
      return Promise.resolve(vscode.window.showOpenDialog(dialogOptions));
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
    updateWorkspaceState: (key, value) => Promise.resolve(context.workspaceState.update(key, value)),
    getWorkspaceState: (key) => context.workspaceState.get<string>(key)
  };
}
