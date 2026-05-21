import { asArray, getChild, isRecord } from "./xml.js";
import { normalizePackagePartName } from "./path-safety.js";

export class ContentTypes {
  private readonly defaults = new Map<string, string>();
  private readonly overrides = new Map<string, string>();

  static fromXml(parsed: unknown): ContentTypes {
    const contentTypes = new ContentTypes();
    const root = getChild(parsed, "Types");
    if (!isRecord(root)) {
      return contentTypes;
    }
    for (const item of asArray(getChild<Record<string, unknown>>(root, "Default")).filter(isRecord)) {
      const extension = stringAttr(item, "Extension").toLowerCase();
      const type = stringAttr(item, "ContentType");
      if (extension && type) {
        contentTypes.defaults.set(extension, type);
      }
    }
    for (const item of asArray(getChild<Record<string, unknown>>(root, "Override")).filter(isRecord)) {
      const partName = stringAttr(item, "PartName");
      const type = stringAttr(item, "ContentType");
      if (partName && type) {
        contentTypes.overrides.set(normalizePackagePartName(partName), type);
      }
    }
    return contentTypes;
  }

  get(partName: string): string | undefined {
    const normalized = normalizePackagePartName(partName);
    const override = this.overrides.get(normalized);
    if (override) {
      return override;
    }
    const extension = normalized.split(".").pop()?.toLowerCase();
    return extension ? this.defaults.get(extension) : undefined;
  }
}

function stringAttr(item: Record<string, unknown>, key: string): string {
  const value = item[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}
