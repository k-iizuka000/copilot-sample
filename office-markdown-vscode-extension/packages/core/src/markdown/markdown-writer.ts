import type { ConversionWarning, MarkdownBlock } from "../types.js";

export function renderMarkdown(blocks: MarkdownBlock[], warnings: ConversionWarning[] = []): string {
  const lines: string[] = [];
  for (const block of blocks) {
    switch (block.kind) {
      case "heading":
        lines.push(`${"#".repeat(Math.max(1, Math.min(6, block.depth)))} ${escapeInline(block.text)}`, "");
        break;
      case "paragraph":
        if (block.text.trim()) {
          lines.push(block.text.trim(), "");
        }
        break;
      case "list":
        block.items.forEach((item, index) => {
          lines.push(`${block.ordered ? `${index + 1}.` : "-"} ${item}`);
        });
        lines.push("");
        break;
      case "table":
        lines.push(...renderTable(block.rows));
        if (block.truncated) {
          lines.push("", "> Warning: Table truncated by configured row limit.");
        }
        lines.push("");
        break;
      case "image":
        lines.push(`![${escapeAlt(block.alt)}](${encodeLink(block.relativePath)})`, "");
        break;
      case "assetLink":
        lines.push(`[${escapeInline(block.label)}](${encodeLink(block.relativePath)})`, "");
        break;
      case "quote":
        lines.push(...block.text.split(/\r?\n/).map((line) => `> ${line}`), "");
        break;
      case "code":
        lines.push(`\`\`\`${block.language}`, block.text, "```", "");
        break;
      case "warning":
        lines.push(`> Warning (${block.code}): ${block.message}`, "");
        break;
      default:
        assertNever(block);
    }
  }

  if (warnings.length > 0) {
    lines.push("## Conversion Report", "");
    lines.push("### Warnings", "");
    for (const warning of warnings) {
      lines.push(`- ${warning.code}: ${warning.message}`);
    }
    lines.push("");
  }

  return trimTrailingBlankLines(lines).join("\n") + "\n";
}

export function renderTable(rows: string[][]): string[] {
  if (rows.length === 0) {
    return [];
  }
  const columnCount = Math.max(...rows.map((row) => row.length), 1);
  const normalizedRows = rows.map((row) => {
    const cells = [...row];
    while (cells.length < columnCount) {
      cells.push("");
    }
    return cells;
  });
  const [firstRow, ...restRows] = normalizedRows;
  if (!firstRow) {
    return [];
  }
  return [
    `| ${firstRow.map(escapeTableCell).join(" | ")} |`,
    `| ${Array.from({ length: columnCount }, () => "---").join(" | ")} |`,
    ...restRows.map((row) => `| ${row.map(escapeTableCell).join(" | ")} |`)
  ];
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

function escapeInline(value: string): string {
  return value.replace(/\r?\n/g, " ").trim();
}

function escapeAlt(value: string): string {
  return escapeInline(value).replace(/\]/g, "\\]");
}

function encodeLink(value: string): string {
  return value.split("/").map(encodeURIComponent).join("/");
}

function trimTrailingBlankLines(lines: string[]): string[] {
  const copy = [...lines];
  while (copy.at(-1) === "") {
    copy.pop();
  }
  return copy;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled Markdown block: ${JSON.stringify(value)}`);
}
