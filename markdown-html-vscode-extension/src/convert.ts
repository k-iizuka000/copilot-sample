import { renderMarkdownHtml } from "./html.js";
import type { ExportResult, MarkdownHtmlSettings } from "./types.js";

export interface ConvertMarkdownToHtmlOptions {
  inputPath: string;
  outputHtmlPath: string;
  markdown: string;
  settings: MarkdownHtmlSettings;
}

export function convertMarkdownToHtml(options: ConvertMarkdownToHtmlOptions): {
  html: string;
  result: ExportResult;
} {
  const rendered = renderMarkdownHtml({
    markdown: options.markdown,
    inputPath: options.inputPath,
    outputHtmlPath: options.outputHtmlPath,
    settings: options.settings,
    urlMode: { kind: "file" }
  });

  return {
    html: rendered.html,
    result: {
      inputPath: options.inputPath,
      htmlPath: options.outputHtmlPath,
      title: rendered.title,
      metadataCount: rendered.metadataCount,
      warnings: rendered.warnings
    }
  };
}

