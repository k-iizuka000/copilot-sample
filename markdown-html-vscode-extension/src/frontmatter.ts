import { parseDocument } from "yaml";

export interface MetadataEntry {
  key: string;
  value: unknown;
}

export interface ParsedMarkdownDocument {
  body: string;
  metadataEntries: MetadataEntry[];
  warnings: string[];
}

export function parseMarkdownDocument(markdown: string): ParsedMarkdownDocument {
  const split = splitYamlFrontmatter(markdown);
  if (!split.rawFrontmatter) {
    return {
      body: split.body,
      metadataEntries: [],
      warnings: split.warnings
    };
  }

  const parsed = parseMetadata(split.rawFrontmatter);
  return {
    body: split.body,
    metadataEntries: parsed.entries,
    warnings: [...split.warnings, ...parsed.warnings]
  };
}

function splitYamlFrontmatter(markdown: string): {
  rawFrontmatter?: string;
  body: string;
  warnings: string[];
} {
  const source = markdown.replace(/^\uFEFF/, "");
  const firstLine = readLine(source, 0);
  if (!firstLine || !/^---[ \t]*$/.test(firstLine.text)) {
    return { body: source, warnings: [] };
  }

  let position = firstLine.nextOffset;
  while (position < source.length) {
    const line = readLine(source, position);
    if (!line) {
      break;
    }
    if (/^(---|\.\.\.)[ \t]*$/.test(line.text)) {
      return {
        rawFrontmatter: source.slice(firstLine.nextOffset, position),
        body: source.slice(line.nextOffset),
        warnings: []
      };
    }
    position = line.nextOffset;
  }

  return {
    body: source,
    warnings: ["Opening frontmatter marker was not closed, so it was rendered as Markdown."]
  };
}

function parseMetadata(rawFrontmatter: string): {
  entries: MetadataEntry[];
  warnings: string[];
} {
  const document = parseDocument(rawFrontmatter, { logLevel: "error" });
  if (document.errors.length > 0) {
    return {
      entries: [],
      warnings: document.errors.map((error) => `Frontmatter parse error: ${error.message}`)
    };
  }

  const value = document.toJS() as unknown;
  if (!isRecord(value)) {
    return {
      entries: [],
      warnings: ["Frontmatter root was not a mapping, so no metadata table was rendered."]
    };
  }

  return {
    entries: Object.entries(value).map(([key, entryValue]) => ({ key, value: entryValue })),
    warnings: []
  };
}

function readLine(source: string, offset: number): { text: string; nextOffset: number } | undefined {
  if (offset > source.length) {
    return undefined;
  }
  const newlineIndex = source.indexOf("\n", offset);
  if (newlineIndex === -1) {
    return {
      text: source.slice(offset).replace(/\r$/, ""),
      nextOffset: source.length
    };
  }
  return {
    text: source.slice(offset, newlineIndex).replace(/\r$/, ""),
    nextOffset: newlineIndex + 1
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

