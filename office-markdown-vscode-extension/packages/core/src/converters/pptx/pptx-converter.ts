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
import { asArray, getChild, isRecord } from "../../ooxml/xml.js";

const presentationPart = "ppt/presentation.xml";

export async function convertPptx(context: ConversionContext): Promise<void> {
  context.markdownBlocks.push({ kind: "heading", depth: 1, text: `Presentation: ${context.sourceFileName}` });
  const presentation = await context.pkg.readXml(presentationPart);
  const presentationRelationships = await context.pkg.getRelationships(presentationPart);
  const slideRefs = getSlideRelationshipIds(presentation);

  let slideNumber = 1;
  for (const relationshipId of slideRefs) {
    const slideRelationship = relationshipById(presentationRelationships, relationshipId);
    if (!slideRelationship?.resolvedTarget) {
      pushWarning(context, {
        code: "slide-relationship-missing",
        message: `Slide relationship ${relationshipId} could not be resolved.`,
        source: { container: "slide", index: slideNumber, part: presentationPart, relationshipId }
      });
      slideNumber += 1;
      continue;
    }
    await convertSlide(context, slideRelationship.resolvedTarget, slideNumber);
    slideNumber += 1;
  }
}

async function convertSlide(context: ConversionContext, slidePart: string, slideNumber: number): Promise<void> {
  const source = { container: "slide" as const, index: slideNumber, part: slidePart };
  context.markdownBlocks.push({ kind: "heading", depth: 2, text: `Slide ${slideNumber}` });
  const relationships = await context.pkg.getRelationships(slidePart);
  const slideNodes = await context.pkg.readXmlOrdered(slidePart);
  const paragraphs = collectOrderedElements(slideNodes, "p")
    .map((paragraph) => extractParagraphText(paragraph, relationships))
    .filter(Boolean);
  for (const paragraph of uniqueSequential(paragraphs)) {
    context.markdownBlocks.push({ kind: "paragraph", text: paragraph });
  }

  for (const table of extractTables(slideNodes, relationships)) {
    context.markdownBlocks.push({ kind: "table", rows: table });
  }

  const imageIds = collectRelationshipIds(slideNodes, "blip", ["embed"]);
  let imageIndex = 1;
  for (const relationshipId of uniqueSequential(imageIds)) {
    const relationship = relationshipById(relationships, relationshipId);
    if (!relationship) {
      continue;
    }
    const imageSource = { ...source, relationshipId };
    const relativePath = await extractRelationshipAsset(context, relationship, {
      kind: "image",
      prefix: `slide-${humanIndex(slideNumber)}-image-${humanIndex(imageIndex)}`,
      label: `Slide ${slideNumber} image ${imageIndex}`,
      source: imageSource
    });
    if (relativePath) {
      context.markdownBlocks.push({
        kind: "image",
        alt: `Slide ${slideNumber} image ${imageIndex}`,
        relativePath,
        sourceRef: imageSource
      });
      imageIndex += 1;
    }
  }

  let objectIndex = 1;
  const embeddedRelationships = relationshipByTypeSuffix(relationships, "/oleObject").concat(
    relationshipByTypeSuffix(relationships, "/package")
  );
  for (const relationship of embeddedRelationships) {
    const objectSource = { ...source, relationshipId: relationship.id };
    const relativePath = await extractRelationshipAsset(context, relationship, {
      kind: "embeddedObject",
      prefix: `slide-${humanIndex(slideNumber)}-object-${humanIndex(objectIndex)}`,
      label: `Slide ${slideNumber} embedded object ${objectIndex}`,
      source: objectSource
    });
    if (relativePath) {
      context.markdownBlocks.push({
        kind: "assetLink",
        label: `Slide ${slideNumber} embedded object ${objectIndex}`,
        relativePath,
        sourceRef: objectSource
      });
      objectIndex += 1;
    }
  }

  for (const relationship of relationshipByTypeSuffix(relationships, "/chart")) {
    recordItem(context, {
      id: "",
      kind: "chart",
      source: { ...source, relationshipId: relationship.id },
      status: "warning",
      message: "Chart visual rendering is not supported in MVP."
    });
    pushWarning(context, {
      code: "chart-visual-unsupported",
      message: `Slide ${slideNumber} contains a chart; chart visual rendering is not supported in MVP.`,
      source: { ...source, relationshipId: relationship.id }
    });
  }

  if (context.options.pptx.includeSpeakerNotes) {
    await appendSpeakerNotes(context, relationships, slideNumber, source);
  }
}

async function appendSpeakerNotes(
  context: ConversionContext,
  relationships: Relationship[],
  slideNumber: number,
  source: { container: "slide"; index: number; part: string }
): Promise<void> {
  const notesRelationship = relationshipByTypeSuffix(relationships, "/notesSlide")[0];
  if (!notesRelationship) {
    return;
  }
  if (!notesRelationship.resolvedTarget) {
    pushWarning(context, {
      code: "notes-relationship-unresolved",
      message: `Speaker notes for slide ${slideNumber} could not be resolved.`,
      source: { ...source, relationshipId: notesRelationship.id }
    });
    return;
  }
  const notesNodes = await context.pkg.readXmlOrdered(notesRelationship.resolvedTarget);
  const notesText = collectOrderedElements(notesNodes, "p")
    .map((paragraph) => extractParagraphText(paragraph, []))
    .filter(Boolean)
    .join("\n\n");
  if (notesText.trim()) {
    context.markdownBlocks.push({ kind: "heading", depth: 3, text: "Speaker Notes" });
    context.markdownBlocks.push({ kind: "paragraph", text: notesText });
  }
}

function getSlideRelationshipIds(presentation: unknown): string[] {
  const root = getChild(presentation, "presentation");
  if (!isRecord(root)) {
    return [];
  }
  const sldIdLst = getChild(root, "sldIdLst");
  if (!isRecord(sldIdLst)) {
    return [];
  }
  return asArray(getChild<Record<string, unknown>>(sldIdLst, "sldId")).filter(isRecord)
    .map((item) => item.id)
    .filter((id): id is string => typeof id === "string");
}

function uniqueSequential(values: string[]): string[] {
  const result: string[] = [];
  for (const value of values) {
    if (result.at(-1) !== value) {
      result.push(value);
    }
  }
  return result;
}
