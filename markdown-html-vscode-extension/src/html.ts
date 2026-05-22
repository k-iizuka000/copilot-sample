import path from "node:path";

import MarkdownIt from "markdown-it";

import { parseMarkdownDocument, type MetadataEntry } from "./frontmatter.js";
import type { MarkdownHtmlSettings } from "./types.js";

export type UrlMode =
  | { kind: "file" }
  | { kind: "webview"; toWebviewUri: (absolutePath: string) => string };

export interface RenderMarkdownHtmlOptions {
  markdown: string;
  inputPath: string;
  outputHtmlPath: string;
  settings: Pick<MarkdownHtmlSettings, "allowRawHtml" | "linkify" | "typographer">;
  urlMode?: UrlMode;
}

export interface RenderMarkdownHtmlResult {
  html: string;
  title: string;
  metadataCount: number;
  warnings: string[];
}

export function renderMarkdownHtml(options: RenderMarkdownHtmlOptions): RenderMarkdownHtmlResult {
  const parsed = parseMarkdownDocument(options.markdown);
  const firstHeading = extractFirstHeading(parsed.body);
  const title = resolveTitle(parsed.metadataEntries, firstHeading?.text, options.inputPath);
  const bodyMarkdown = firstHeading?.startsAtTop ? removeFirstHeading(parsed.body) : parsed.body;
  const markdownRenderer = createMarkdownRenderer(options);
  const bodyHtml = markdownRenderer.render(bodyMarkdown);

  return {
    html: buildHtmlPage({
      title,
      sourceName: path.basename(options.inputPath),
      bodyHtml,
      metadataEntries: parsed.metadataEntries,
      warnings: parsed.warnings,
      linkContext: options
    }),
    title,
    metadataCount: parsed.metadataEntries.length,
    warnings: parsed.warnings
  };
}

export function rewriteLocalUrl(
  rawUrl: string,
  inputPath: string,
  outputHtmlPath: string,
  mode: UrlMode = { kind: "file" }
): string {
  if (shouldLeaveUrl(rawUrl)) {
    return rawUrl;
  }

  const { pathPart, suffix } = splitUrlSuffix(rawUrl);
  if (!pathPart || shouldLeaveUrl(pathPart)) {
    return rawUrl;
  }

  const decodedPath = safeDecodeUri(pathPart).replace(/\\/g, "/");
  const absoluteTarget = path.isAbsolute(decodedPath)
    ? decodedPath
    : path.resolve(path.dirname(inputPath), decodedPath);

  if (mode.kind === "webview") {
    return `${mode.toWebviewUri(absoluteTarget)}${suffix}`;
  }

  const relativePath = path.relative(path.dirname(outputHtmlPath), absoluteTarget);
  const normalized = normalizeWebPath(relativePath || path.basename(absoluteTarget));
  return `${encodeURI(normalized)}${suffix}`;
}

function createMarkdownRenderer(options: RenderMarkdownHtmlOptions): MarkdownIt {
  const renderer = new MarkdownIt({
    html: options.settings.allowRawHtml,
    linkify: options.settings.linkify,
    typographer: options.settings.typographer,
    langPrefix: "language-"
  });

  const defaultImageRenderer =
    renderer.renderer.rules.image ??
    ((tokens: any[], idx: number, renderOptions: any, env: any, self: any) =>
      self.renderToken(tokens, idx, renderOptions));
  renderer.renderer.rules.image = (tokens: any[], idx: number, renderOptions: any, env: any, self: any) => {
    const token = tokens[idx];
    const source = token.attrGet("src");
    if (typeof source === "string") {
      token.attrSet(
        "src",
        rewriteLocalUrl(source, options.inputPath, options.outputHtmlPath, options.urlMode)
      );
    }
    return defaultImageRenderer(tokens, idx, renderOptions, env, self);
  };

  const defaultLinkRenderer =
    renderer.renderer.rules.link_open ??
    ((tokens: any[], idx: number, renderOptions: any, env: any, self: any) =>
      self.renderToken(tokens, idx, renderOptions));
  renderer.renderer.rules.link_open = (tokens: any[], idx: number, renderOptions: any, env: any, self: any) => {
    const token = tokens[idx];
    const href = token.attrGet("href");
    if (typeof href === "string") {
      token.attrSet(
        "href",
        rewriteLocalUrl(href, options.inputPath, options.outputHtmlPath, options.urlMode)
      );
    }
    return defaultLinkRenderer(tokens, idx, renderOptions, env, self);
  };

  return renderer;
}

function buildHtmlPage(input: {
  title: string;
  sourceName: string;
  bodyHtml: string;
  metadataEntries: MetadataEntry[];
  warnings: string[];
  linkContext: RenderMarkdownHtmlOptions;
}): string {
  const metadataHtml =
    input.metadataEntries.length > 0
      ? `<section class="metadata" aria-label="Metadata">
        <h2>Metadata</h2>
        <dl>${input.metadataEntries.map((entry) => renderMetadataEntry(entry, input.linkContext)).join("")}</dl>
      </section>`
      : "";
  const warningsHtml =
    input.warnings.length > 0
      ? `<section class="warnings" aria-label="Conversion warnings">
        <h2>Warnings</h2>
        <ul>${input.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>
      </section>`
      : "";
  const sidebarHtml =
    metadataHtml || warningsHtml
      ? `<aside class="document-sidebar">
      ${metadataHtml}
      ${warningsHtml}
    </aside>`
      : "";
  const layoutClass = sidebarHtml ? "document-layout" : "document-layout document-layout--single";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(input.title)}</title>
  <style>
${pageCss()}
  </style>
</head>
<body>
  <main class="page-shell">
    <header class="document-header">
      <div class="source-label">${escapeHtml(input.sourceName)}</div>
      <h1>${escapeHtml(input.title)}</h1>
    </header>
    <section class="${layoutClass}">
    ${sidebarHtml}
    <article class="markdown-body">
${input.bodyHtml.trim() || "<p class=\"empty-document\">No Markdown body content.</p>"}
    </article>
    </section>
  </main>
</body>
</html>
`;
}

function renderMetadataEntry(
  entry: MetadataEntry,
  context: RenderMarkdownHtmlOptions
): string {
  return `<div class="metadata-row">
    <dt>${escapeHtml(entry.key)}</dt>
    <dd>${renderMetadataValue(entry.key, entry.value, context)}</dd>
  </div>`;
}

function renderMetadataValue(
  key: string,
  value: unknown,
  context: RenderMarkdownHtmlOptions
): string {
  if (value === null || value === undefined) {
    return `<span class="muted">empty</span>`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `<span class="muted">none</span>`;
    }
    if (value.every(isScalar)) {
      return `<ul class="pill-list">${value
        .map((item) => `<li>${renderScalarMetadataValue(key, item, context)}</li>`)
        .join("")}</ul>`;
    }
    return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
  }

  if (isScalar(value)) {
    return renderScalarMetadataValue(key, value, context);
  }

  return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
}

function renderScalarMetadataValue(
  key: string,
  value: string | number | boolean,
  context: RenderMarkdownHtmlOptions
): string {
  const text = String(value);
  if (isReferenceKey(key) && looksLikeLocalFileReference(text)) {
    const href = rewriteLocalUrl(text, context.inputPath, context.outputHtmlPath, context.urlMode);
    return `<a class="file-reference" href="${escapeAttribute(href)}">${escapeHtml(text)}</a>`;
  }
  return `<span class="metadata-value">${escapeHtml(text)}</span>`;
}

function resolveTitle(
  metadataEntries: MetadataEntry[],
  firstHeading: string | undefined,
  inputPath: string
): string {
  const titleEntry = metadataEntries.find((entry) => entry.key.toLowerCase() === "title");
  if (typeof titleEntry?.value === "string" && titleEntry.value.trim().length > 0) {
    return titleEntry.value.trim();
  }

  if (firstHeading && firstHeading.trim().length > 0) {
    return firstHeading.trim();
  }

  const nameEntry = metadataEntries.find((entry) => entry.key.toLowerCase() === "name");
  if (typeof nameEntry?.value === "string" && nameEntry.value.trim().length > 0) {
    return nameEntry.value.trim();
  }

  return path.parse(inputPath).name || "Markdown Document";
}

function extractFirstHeading(markdown: string): { text: string; startsAtTop: boolean } | undefined {
  const topHeading = markdown.match(/^\s*#\s+(.+?)[ \t]*(?:\r?\n|$)/);
  if (topHeading?.[1]) {
    return {
      text: stripInlineMarkdown(topHeading[1]),
      startsAtTop: true
    };
  }

  const anyHeading = markdown.match(/(?:^|\r?\n)#\s+(.+?)[ \t]*(?:\r?\n|$)/);
  if (anyHeading?.[1]) {
    return {
      text: stripInlineMarkdown(anyHeading[1]),
      startsAtTop: false
    };
  }

  return undefined;
}

function removeFirstHeading(markdown: string): string {
  return markdown.replace(/^\s*#\s+.+?[ \t]*(?:\r?\n|$)/, "");
}

function stripInlineMarkdown(value: string): string {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~]/g, "")
    .trim();
}

function shouldLeaveUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  return (
    trimmed.length === 0 ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("//") ||
    /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
  );
}

function splitUrlSuffix(rawUrl: string): { pathPart: string; suffix: string } {
  const markerIndex = rawUrl.search(/[?#]/);
  if (markerIndex === -1) {
    return { pathPart: rawUrl, suffix: "" };
  }
  return {
    pathPart: rawUrl.slice(0, markerIndex),
    suffix: rawUrl.slice(markerIndex)
  };
}

function normalizeWebPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function safeDecodeUri(value: string): string {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}

function isScalar(value: unknown): value is string | number | boolean {
  return ["string", "number", "boolean"].includes(typeof value);
}

function isReferenceKey(key: string): boolean {
  return /references?|files?|include|path/i.test(key);
}

function looksLikeLocalFileReference(value: string): boolean {
  return (
    !shouldLeaveUrl(value) &&
    /(^|[/\\])[^/\\]+\.[a-z0-9]{1,12}(?:[?#].*)?$/i.test(value)
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function pageCss(): string {
  return `
    :root {
      color-scheme: light dark;
      --page-bg: #f7f8f5;
      --surface: #ffffff;
      --surface-soft: #eef5f3;
      --surface-raised: #fbfcfb;
      --text: #202528;
      --muted: #66716f;
      --line: #d9dfdc;
      --line-strong: #b9c4c0;
      --accent: #14766f;
      --accent-strong: #0f5c57;
      --accent-soft: #dff0ed;
      --accent-warm: #a5542a;
      --warning: #8a4b10;
      --warning-bg: #fff4df;
      --code-bg: #17202a;
      --code-text: #f3f7f7;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --page-bg: #141817;
        --surface: #1d2321;
        --surface-soft: #23302d;
        --surface-raised: #202725;
        --text: #eef3f1;
        --muted: #aab7b4;
        --line: #394744;
        --line-strong: #50605c;
        --accent: #75d0c5;
        --accent-strong: #9ce3dc;
        --accent-soft: #163b37;
        --accent-warm: #f0a36e;
        --warning: #ffd18b;
        --warning-bg: #3a2c18;
        --code-bg: #0b1117;
        --code-text: #f2f7f6;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--page-bg);
      color: var(--text);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.65;
    }

    .page-shell {
      width: min(1120px, calc(100% - 36px));
      margin: 0 auto;
      padding: 44px 0 68px;
    }

    .document-header {
      position: relative;
      padding: 28px 0 30px;
      margin-bottom: 28px;
      border-bottom: 1px solid var(--line-strong);
    }

    .source-label {
      display: inline-flex;
      max-width: 100%;
      margin-bottom: 12px;
      padding: 4px 10px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--surface);
      color: var(--accent-strong);
      font-size: 0.82rem;
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    h1, h2, h3, h4, h5, h6 {
      line-height: 1.25;
      letter-spacing: 0;
    }

    .document-header h1 {
      margin: 0;
      max-width: 820px;
      font-size: 2.55rem;
      font-weight: 760;
      overflow-wrap: anywhere;
    }

    .document-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(230px, 300px);
      gap: 34px;
      align-items: start;
    }

    .document-layout--single {
      grid-template-columns: minmax(0, 780px);
      justify-content: center;
    }

    .document-sidebar {
      display: grid;
      gap: 18px;
      order: 2;
      position: sticky;
      top: 22px;
      min-width: 0;
    }

    .metadata,
    .warnings {
      min-width: 0;
      margin: 0;
      padding: 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      box-shadow: 0 10px 26px rgb(31 41 55 / 0.05);
    }

    .metadata h2,
    .warnings h2 {
      margin: 0 0 14px;
      font-size: 0.78rem;
      color: var(--accent-strong);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .metadata dl {
      display: block;
      margin: 0;
    }

    .metadata-row {
      padding: 12px 0;
      border-top: 1px solid var(--line);
    }

    .metadata-row:first-child {
      padding-top: 0;
      border-top: 0;
    }

    .metadata dt {
      margin-bottom: 4px;
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 650;
      overflow-wrap: anywhere;
    }

    .metadata dd {
      margin: 0;
      min-width: 0;
      max-width: 100%;
      overflow-wrap: anywhere;
      font-size: 0.95rem;
    }

    .pill-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 0;
      margin: 0;
      list-style: none;
    }

    .pill-list li,
    .metadata-value {
      display: inline-block;
      min-width: 0;
      max-width: 100%;
      padding: 3px 9px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--surface-soft);
      overflow-wrap: anywhere;
      white-space: normal;
    }

    .file-reference {
      display: inline-block;
      max-width: 100%;
      color: var(--accent);
      font-weight: 650;
      text-decoration: none;
      border-bottom: 1px solid currentColor;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .warnings {
      color: var(--warning);
      background: var(--warning-bg);
      box-shadow: none;
    }

    .warnings ul {
      margin: 0;
      padding-left: 1.2rem;
    }

    .muted,
    .empty-document {
      color: var(--muted);
    }

    .markdown-body {
      min-width: 0;
      max-width: 780px;
      font-size: 1.03rem;
      overflow-wrap: break-word;
    }

    .markdown-body h1 {
      font-size: 2.05rem;
      margin-top: 0;
    }

    .markdown-body h2 {
      margin-top: 2.7rem;
      padding-top: 0.75rem;
      border-top: 2px solid var(--line-strong);
      font-size: 1.42rem;
    }

    .markdown-body h3 {
      margin-top: 1.9rem;
      color: var(--accent-strong);
      font-size: 1.12rem;
    }

    .markdown-body p,
    .markdown-body ul,
    .markdown-body ol,
    .markdown-body blockquote,
    .markdown-body table,
    .markdown-body pre {
      margin-top: 0;
      margin-bottom: 1rem;
    }

    .markdown-body p,
    .markdown-body li {
      max-width: 72ch;
    }

    .markdown-body a {
      color: var(--accent);
      text-decoration-thickness: 0.08em;
      text-underline-offset: 0.16em;
    }

    .markdown-body blockquote {
      margin-left: 0;
      padding: 0.85rem 1rem;
      border-left: 4px solid var(--accent-warm);
      border-radius: 0 8px 8px 0;
      background: var(--surface);
      color: var(--text);
    }

    .markdown-body table {
      display: block;
      width: 100%;
      max-width: 100%;
      overflow-x: auto;
      border-collapse: collapse;
      border-top: 3px solid var(--accent);
      background: var(--surface);
    }

    .markdown-body th,
    .markdown-body td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
    }

    .markdown-body th {
      background: var(--surface-raised);
      text-align: left;
      color: var(--muted);
      font-size: 0.86rem;
      text-transform: uppercase;
    }

    .markdown-body code {
      padding: 0.1rem 0.28rem;
      border-radius: 4px;
      background: var(--surface-soft);
      font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
      font-size: 0.92em;
    }

    .markdown-body pre {
      overflow-x: auto;
      padding: 16px 18px;
      border-radius: 8px;
      background: var(--code-bg);
      color: var(--code-text);
    }

    .markdown-body pre code {
      padding: 0;
      background: transparent;
      color: inherit;
    }

    .markdown-body img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      border: 1px solid var(--line);
    }

    @media (max-width: 680px) {
      .page-shell {
        width: min(100%, calc(100% - 22px));
        padding: 18px 0 40px;
      }

      .document-layout {
        grid-template-columns: minmax(0, 1fr);
      }

      .document-sidebar {
        position: static;
        order: 0;
      }

      .pill-list {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
      }

      .pill-list li,
      .metadata-value {
        width: 100%;
      }

      .file-reference {
        word-break: break-all;
      }

      .document-header h1 {
        font-size: 1.8rem;
        word-break: break-word;
      }
    }

    @media print {
      body {
        background: #fff;
      }

      .page-shell {
        width: 100%;
        margin: 0;
        padding: 0;
        border: 0;
        box-shadow: none;
      }
    }
`;
}
