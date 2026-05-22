export const COMMANDS = {
  exportResource: "markdownHtml.exportResource",
  exportCurrentFile: "markdownHtml.exportCurrentFile",
  openLastHtml: "markdownHtml.openLastHtml"
} as const;

export type OutputLocation = "nextToSource" | "htmlFolder" | "askEachTime";

export type OverwritePolicy = "overwrite" | "confirm" | "createUnique";

export interface MarkdownHtmlSettings {
  outputLocation: OutputLocation;
  outputFolderName: string;
  overwritePolicy: OverwritePolicy;
  openAfterExport: boolean;
  allowRawHtml: boolean;
  linkify: boolean;
  typographer: boolean;
}

export interface ExportResult {
  inputPath: string;
  htmlPath: string;
  title: string;
  metadataCount: number;
  warnings: string[];
}

export interface ResourceUri {
  fsPath: string;
  scheme?: string;
}

export interface DisposableLike {
  dispose(): void;
}

