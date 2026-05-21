import type { ConversionContext, OrderedXmlNode, Relationship } from "../../types.js";
import {
  collectOrderedElements,
  collectRelationshipIds,
  extractParagraphText,
  extractRelationshipAsset,
  extractTables,
  humanIndex,
  pushWarning,
  recordItem,
  relationshipById,
  relationshipByTypeSuffix
} from "../common.js";
import { getOrderedAttrs, getOrderedChildren, getOrderedName } from "../../ooxml/xml.js";

const documentPart = "word/document.xml";

export async function convertDocx(context: ConversionContext): Promise<void> {
  context.markdownBlocks.push({ kind: "heading", depth: 1, text: `Document: ${context.sourceFileName}` });
  const relationships = await context.pkg.getRelationships(documentPart);
  const documentNodes = await context.pkg.readXmlOrdered(documentPart);
  const body = collectOrderedElements(documentNodes, "body")[0];
  const bodyChildren = body ? getOrderedChildren(body) : documentNodes;
  let imageIndex = 1;

  for (const child of bodyChildren) {
    const name = getOrderedName(child);
    if (name === "p") {
      const text = extractParagraphText(child, relationships);
      const headingDepth = headingDepthForParagraph(child);
      if (text && headingDepth) {
        context.markdownBlocks.push({ kind: "heading", depth: headingDepth, text });
      } else if (text) {
        context.markdownBlocks.push({ kind: "paragraph", text });
      }

      const imageIds = collectRelationshipIds(getOrderedChildren(child), "blip", ["embed"]);
      for (const relationshipId of imageIds) {
        const relationship = relationshipById(relationships, relationshipId);
        if (relationship) {
          const source = {
            container: "document" as const,
            part: documentPart,
            relationshipId
          };
          const relativePath = await extractRelationshipAsset(context, relationship, {
            kind: "image",
            prefix: `doc-image-${humanIndex(imageIndex)}`,
            label: `Document image ${imageIndex}`,
            source
          });
          if (relativePath) {
            context.markdownBlocks.push({
              kind: "image",
              alt: `Document image ${imageIndex}`,
              relativePath,
              sourceRef: source
            });
            imageIndex += 1;
          }
        }
      }
    }

    if (name === "tbl") {
      for (const table of extractTables([child], relationships)) {
        context.markdownBlocks.push({ kind: "table", rows: ensureHeader(table) });
      }
    }
  }

  const embeddedRelationships = relationshipByTypeSuffix(relationships, "/oleObject").concat(
    relationshipByTypeSuffix(relationships, "/package")
  );
  let objectIndex = 1;
  for (const relationship of embeddedRelationships) {
    const source = {
      container: "document" as const,
      part: documentPart,
      relationshipId: relationship.id
    };
    const relativePath = await extractRelationshipAsset(context, relationship, {
      kind: "embeddedObject",
      prefix: `doc-object-${humanIndex(objectIndex)}`,
      label: `Embedded object ${objectIndex}`,
      source
    });
    if (relativePath) {
      context.markdownBlocks.push({
        kind: "assetLink",
        label: `Embedded object ${objectIndex}`,
        relativePath,
        sourceRef: source
      });
      objectIndex += 1;
    }
  }

  recordExternalHyperlinks(context, relationships);
}

function headingDepthForParagraph(paragraph: OrderedXmlNode): number | undefined {
  const pPr = collectOrderedElements(getOrderedChildren(paragraph), "pPr")[0];
  const pStyle = pPr ? collectOrderedElements(getOrderedChildren(pPr), "pStyle")[0] : undefined;
  const style = pStyle ? getOrderedAttrs(pStyle).val : undefined;
  const match = style?.match(/^Heading([1-6])$/i);
  return match ? Number(match[1]) : undefined;
}

function ensureHeader(rows: string[][]): string[][] {
  if (rows.length === 0) {
    return [];
  }
  return rows;
}

function recordExternalHyperlinks(context: ConversionContext, relationships: Relationship[]): void {
  for (const relationship of relationships) {
    if (!relationship.type.endsWith("/hyperlink")) {
      continue;
    }
    recordItem(context, {
      id: "",
      kind: "hyperlink",
      source: {
        container: "document",
        part: documentPart,
        relationshipId: relationship.id
      },
      status: "recorded",
      message: relationship.target
    });
    if (relationship.targetMode === "External") {
      continue;
    }
    pushWarning(context, {
      code: "internal-hyperlink-unresolved",
      message: `Internal hyperlink ${relationship.id} was recorded but not resolved in Markdown.`,
      source: {
        container: "document",
        part: documentPart,
        relationshipId: relationship.id
      }
    });
  }
}
