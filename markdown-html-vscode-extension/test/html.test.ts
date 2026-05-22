import path from "node:path";

import { describe, expect, it } from "vitest";

import { renderMarkdownHtml, rewriteLocalUrl } from "../src/html.js";
import { defaultSettings } from "../src/settings.js";

describe("Markdown HTML rendering", () => {
  it("renders frontmatter metadata dynamically and removes the first top-level heading from the body", () => {
    const result = renderMarkdownHtml({
      markdown: `---
name: source-first-env-reconstruction
description: Build setup from source manifests.
tools: ["read", "search", "execute"]
references:
  - references/setup.md
customValue: 42
---

# Source First

| A | B |
| --- | --- |
| one | two |
`,
      inputPath: path.join("workspace", "skills", "SKILL.md"),
      outputHtmlPath: path.join("workspace", "skills", "SKILL.html"),
      settings: defaultSettings()
    });

    expect(result.title).toBe("Source First");
    expect(result.metadataCount).toBe(5);
    expect(result.html).toContain("<dt>customValue</dt>");
    expect(result.html).toContain("references/setup.md");
    expect(result.html).toContain("<table>");
    expect(result.html).not.toContain("<h1>Source First</h1>\n\n<table>");
  });

  it("omits the metadata section when a Markdown note has no frontmatter", () => {
    const result = renderMarkdownHtml({
      markdown: "# Memo\n\nToday I learned something.",
      inputPath: path.join("workspace", "memo.md"),
      outputHtmlPath: path.join("workspace", "memo.html"),
      settings: defaultSettings()
    });

    expect(result.html).not.toContain("class=\"metadata\"");
    expect(result.html).toContain("Today I learned something.");
  });

  it("escapes raw HTML by default", () => {
    const result = renderMarkdownHtml({
      markdown: "# Unsafe\n\n<script>alert('x')</script>",
      inputPath: path.join("workspace", "unsafe.md"),
      outputHtmlPath: path.join("workspace", "unsafe.html"),
      settings: defaultSettings()
    });

    expect(result.html).toContain("&lt;script&gt;");
    expect(result.html).not.toContain("<script>alert");
  });

  it("keeps Markdown references as source file references instead of converting them to HTML", () => {
    const result = renderMarkdownHtml({
      markdown: "# Skill\n\nSee [details](references/details.md) and ![image](<assets/hero image.png>).",
      inputPath: path.join("workspace", "skills", "SKILL.md"),
      outputHtmlPath: path.join("workspace", "exports", "SKILL.html"),
      settings: defaultSettings()
    });

    expect(result.html).toContain("href=\"../skills/references/details.md\"");
    expect(result.html).not.toContain("details.html");
    expect(result.html).toContain("src=\"../skills/assets/hero%20image.png\"");
  });

  it("can rewrite local preview references through a webview URI mapper", () => {
    const result = rewriteLocalUrl(
      "references/details.md#install",
      path.join("workspace", "skills", "SKILL.md"),
      path.join("workspace", "exports", "SKILL.html"),
      {
        kind: "webview",
        toWebviewUri: (absolutePath) => `vscode-resource:${absolutePath.split(path.sep).join("/")}`
      }
    );

    expect(result).toContain("vscode-resource:");
    expect(result).toContain("references/details.md#install");
  });
});
