import type {
  ConversionContext,
  ConversionWarning,
  ManifestItem,
  OrderedXmlNode,
  Relationship,
  SourceRef
} from "../types.js";
import { addManifestItem, addWarning } from "../manifest.js";
import { writeAsset } from "../assets/asset-writer.js";
import { getOrderedAttrs, getOrderedChildren, getOrderedName, orderedText } from "../ooxml/xml.js";
import { isRelationshipType } from "../ooxml/relationships.js";

export function pushWarning(context: ConversionContext, warning: ConversionWarning): void {
  context.warnings.push(warning);
  addWarning(context.manifest, warning);
  const block = {
    kind: "warning",
    code: warning.code,
    message: warning.message
  } as const;
  context.markdownBlocks.push(warning.source ? { ...block, sourceRef: warning.source } : block);
}

export function recordItem(context: ConversionContext, item: ManifestItem): ManifestItem {
  return addManifestItem(context.manifest, item);
}

export async function extractRelationshipAsset(
  context: ConversionContext,
  relationship: Relationship,
  request: {
    kind: "image" | "embeddedObject";
    prefix: string;
    label: string;
    source: SourceRef;
  }
): Promise<string | undefined> {
  if (relationship.targetMode === "External") {
    pushWarning(context, {
      code: "external-relationship-skipped",
      message: `External relationship ${relationship.id} was not fetched.`,
      source: request.source
    });
    return undefined;
  }
  if (!relationship.resolvedTarget) {
    pushWarning(context, {
      code: "relationship-target-unresolved",
      message: `Relationship ${relationship.id} could not be resolved.`,
      source: request.source
    });
    return undefined;
  }

  try {
    const bytes = await context.pkg.readBinary(relationship.resolvedTarget);
    const contentType = context.pkg.getContentType(relationship.resolvedTarget);
    const assetRequest = {
      kind: request.kind,
      prefix: request.prefix,
      sourcePath: relationship.resolvedTarget,
      bytes,
      source: request.source,
      label: request.label,
      markdownPath: context.markdownPath,
      assetDir: context.options.outputAssetDir
    };
    const result = await writeAsset(contentType ? { ...assetRequest, contentType } : assetRequest);
    recordItem(context, result.item);
    return result.relativePath;
  } catch (error) {
    pushWarning(context, {
      code: "asset-extraction-failed",
      message: `${request.label} could not be extracted: ${errorMessage(error)}`,
      source: request.source
    });
    return undefined;
  }
}

export function relationshipById(relationships: Relationship[], id: string | undefined): Relationship | undefined {
  if (!id) {
    return undefined;
  }
  return relationships.find((relationship) => relationship.id === id);
}

export function relationshipByTypeSuffix(relationships: Relationship[], suffix: string): Relationship[] {
  return relationships.filter((relationship) => isRelationshipType(relationship, suffix));
}

export function collectOrderedElements(nodes: OrderedXmlNode[] | OrderedXmlNode, name: string): OrderedXmlNode[] {
  const roots = Array.isArray(nodes) ? nodes : [nodes];
  const results: OrderedXmlNode[] = [];
  for (const node of roots) {
    const nodeName = getOrderedName(node);
    if (nodeName === name) {
      results.push(node);
    }
    results.push(...collectOrderedElements(getOrderedChildren(node), name));
  }
  return results;
}

export function extractParagraphText(paragraph: OrderedXmlNode, relationships: Relationship[] = []): string {
  return extractInlineText(getOrderedChildren(paragraph), relationships).replace(/\s+\n/g, "\n").trim();
}

export function extractInlineText(nodes: OrderedXmlNode[], relationships: Relationship[] = []): string {
  const parts: string[] = [];
  for (const node of nodes) {
    const name = getOrderedName(node);
    if (!name) {
      if (typeof node["#text"] === "string") {
        parts.push(node["#text"] as string);
      }
      continue;
    }
    if (name === "tab") {
      parts.push("\t");
      continue;
    }
    if (name === "br") {
      parts.push("\n");
      continue;
    }
    if (name === "hyperlink") {
      const attrs = getOrderedAttrs(node);
      const text = extractInlineText(getOrderedChildren(node), relationships);
      const relationship = relationshipById(relationships, attrs.id);
      if (text && relationship?.target) {
        parts.push(`[${text}](${relationship.target})`);
      } else {
        parts.push(text);
      }
      continue;
    }
    if (name === "t" || name === "instrText") {
      parts.push(orderedText(node));
      continue;
    }
    parts.push(extractInlineText(getOrderedChildren(node), relationships));
  }
  return parts.join("");
}

export function extractTables(nodes: OrderedXmlNode[], relationships: Relationship[] = []): string[][][] {
  return collectOrderedElements(nodes, "tbl").map((table) => {
    return collectOrderedElements(getOrderedChildren(table), "tr").map((row) => {
      return collectOrderedElements(getOrderedChildren(row), "tc").map((cell) => {
        const paragraphs = collectOrderedElements(getOrderedChildren(cell), "p")
          .map((paragraph) => extractParagraphText(paragraph, relationships))
          .filter(Boolean);
        return paragraphs.join("\n");
      });
    });
  });
}

export function collectRelationshipIds(nodes: OrderedXmlNode[], elementName: string, attrNames: string[]): string[] {
  const ids: string[] = [];
  for (const element of collectOrderedElements(nodes, elementName)) {
    const attrs = getOrderedAttrs(element);
    for (const attrName of attrNames) {
      const value = attrs[attrName];
      if (value) {
        ids.push(value);
      }
    }
  }
  return ids;
}

export function textFromTextBodies(nodes: OrderedXmlNode[]): string[] {
  return collectOrderedElements(nodes, "txBody")
    .map((body) => orderedText(body).replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function humanIndex(index: number): string {
  return String(index).padStart(3, "0");
}

export function anchorFromDrawingNode(anchor: OrderedXmlNode): string | undefined {
  const from = collectOrderedElements(getOrderedChildren(anchor), "from")[0];
  if (!from) {
    return undefined;
  }
  const col = Number(orderedText(collectOrderedElements(getOrderedChildren(from), "col")[0] ?? {}));
  const row = Number(orderedText(collectOrderedElements(getOrderedChildren(from), "row")[0] ?? {}));
  if (!Number.isFinite(col) || !Number.isFinite(row)) {
    return undefined;
  }
  return `${columnName(col + 1)}${row + 1}`;
}

export function columnName(index: number): string {
  let value = index;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result || "A";
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
