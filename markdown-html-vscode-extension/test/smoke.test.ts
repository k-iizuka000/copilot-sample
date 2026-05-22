import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { convertMarkdownToHtml } from "../src/convert.js";
import { defaultSettings } from "../src/settings.js";

describe("file export smoke", () => {
  it("writes only the selected Markdown file to HTML and leaves references as Markdown links", async () => {
      const tempDir = await mkdtemp(path.join(os.tmpdir(), "markdown-html-exporter-"));
    try {
      const skillDir = path.join(tempDir, "skill");
      const referenceDir = path.join(skillDir, "references");
      await writeFile(path.join(tempDir, ".keep"), "");
      await mkdir(referenceDir, { recursive: true });

      const inputPath = path.join(skillDir, "SKILL.md");
      const referencePath = path.join(referenceDir, "details.md");
      const outputHtmlPath = path.join(skillDir, "SKILL.html");
      await writeFile(
        inputPath,
        `---
name: sample-skill
references:
  - references/details.md
---

# Sample Skill

See [details](references/details.md).
`
      );
      await writeFile(referencePath, "# Details\n");

      const markdown = await readFile(inputPath, "utf8");
      const converted = convertMarkdownToHtml({
        inputPath,
        outputHtmlPath,
        markdown,
        settings: defaultSettings()
      });
      await writeFile(outputHtmlPath, converted.html);

      const html = await readFile(outputHtmlPath, "utf8");
      expect(html).toContain("href=\"references/details.md\"");
      expect(html).not.toContain("details.html");
      await expect(readFile(path.join(referenceDir, "details.html"), "utf8")).rejects.toThrow();
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
