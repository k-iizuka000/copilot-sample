import type { Relationship } from "../types.js";
import { asArray, getChild, isRecord } from "./xml.js";
import { relationshipPartFor, resolveRelationshipTarget } from "./path-safety.js";

export function parseRelationships(parsed: unknown, sourcePart: string): Relationship[] {
  const root = getChild(parsed, "Relationships");
  if (!isRecord(root)) {
    return [];
  }
  const relationships: Relationship[] = [];
  for (const item of asArray(getChild<Record<string, unknown>>(root, "Relationship")).filter(isRecord)) {
    const id = stringAttr(item, "Id");
    const type = stringAttr(item, "Type");
    const target = stringAttr(item, "Target");
    const targetMode = stringAttr(item, "TargetMode") === "External" ? "External" : "Internal";
    if (!id || !type || !target) {
      continue;
    }
    if (targetMode === "External") {
      relationships.push({ id, type, target, targetMode });
      continue;
    }
    try {
      relationships.push({
        id,
        type,
        target,
        targetMode,
        resolvedTarget: resolveRelationshipTarget(sourcePart, target)
      });
    } catch {
      relationships.push({ id, type, target, targetMode });
    }
  }
  return relationships;
}

export function relationshipPartNameFor(sourcePart: string): string {
  return relationshipPartFor(sourcePart);
}

export function findRelationship(relationships: Relationship[], id: string | undefined): Relationship | undefined {
  if (!id) {
    return undefined;
  }
  return relationships.find((relationship) => relationship.id === id);
}

export function isRelationshipType(relationship: Relationship, suffix: string): boolean {
  return relationship.type.toLowerCase().endsWith(suffix.toLowerCase());
}

function stringAttr(item: Record<string, unknown>, key: string): string {
  const value = item[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}
