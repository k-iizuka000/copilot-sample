import { promises as fs } from "node:fs";
import JSZip from "jszip";
import type { OoxmlPackage, PackageEntry, Relationship, SafetyOptions } from "../types.js";
import { ContentTypes } from "./content-types.js";
import { normalizePackagePartName, normalizeZipEntryName } from "./path-safety.js";
import { parseRelationships, relationshipPartNameFor } from "./relationships.js";
import { parseXml, parseXmlOrdered } from "./xml.js";

export async function openOoxmlPackage(inputPath: string, safety: SafetyOptions): Promise<OoxmlPackage> {
  const data = await fs.readFile(inputPath);
  const zip = await JSZip.loadAsync(data);
  const entries = new Map<string, JSZip.JSZipObject>();
  const entryMetadata: PackageEntry[] = [];
  let totalUncompressed = 0;

  for (const rawEntry of Object.values(zip.files)) {
    if (rawEntry.dir) {
      continue;
    }
    const safeName = normalizeZipEntryName(rawEntry.name);
    entries.set(safeName, rawEntry);
    const size = getUncompressedSize(rawEntry);
    totalUncompressed += size;
    entryMetadata.push({ name: safeName, uncompressedSize: size });
    if (entryMetadata.length > safety.maxEntryCount) {
      throw new Error(`OOXML package entry count exceeds limit: ${safety.maxEntryCount}`);
    }
    if (totalUncompressed > safety.maxPackageUncompressedBytes) {
      throw new Error(`OOXML package uncompressed size exceeds limit: ${safety.maxPackageUncompressedBytes}`);
    }
  }

  let contentTypes = new ContentTypes();
  const contentTypesEntry = entries.get("[Content_Types].xml");
  if (contentTypesEntry) {
    contentTypes = ContentTypes.fromXml(parseXml(await contentTypesEntry.async("text")));
  }

  const relationshipCache = new Map<string, Relationship[]>();

  const readText = async (partName: string): Promise<string> => getEntry(entries, partName).async("text");

  return {
    listEntries() {
      return [...entryMetadata].sort((a, b) => a.name.localeCompare(b.name));
    },
    hasPart(partName: string) {
      return entries.has(normalizePackagePartName(partName));
    },
    async readXml(partName: string) {
      return parseXml(await readText(partName));
    },
    async readXmlOrdered(partName: string) {
      return parseXmlOrdered(await readText(partName));
    },
    async readText(partName: string) {
      return readText(partName);
    },
    async readBinary(partName: string) {
      const binary = await getEntry(entries, partName).async("uint8array");
      if (binary.byteLength > safety.maxExtractedAssetBytes) {
        throw new Error(`Package part exceeds per-asset size limit: ${partName}`);
      }
      return binary;
    },
    async getRelationships(partName: string) {
      const normalized = normalizePackagePartName(partName);
      const relPart = relationshipPartNameFor(normalized);
      const cached = relationshipCache.get(relPart);
      if (cached) {
        return cached;
      }
      const entry = entries.get(relPart);
      if (!entry) {
        relationshipCache.set(relPart, []);
        return [];
      }
      const relationships = parseRelationships(parseXml(await entry.async("text")), normalized);
      relationshipCache.set(relPart, relationships);
      return relationships;
    },
    getContentType(partName: string) {
      return contentTypes.get(partName);
    }
  };
}

function getEntry(entries: Map<string, JSZip.JSZipObject>, partName: string): JSZip.JSZipObject {
  const normalized = normalizePackagePartName(partName);
  const entry = entries.get(normalized);
  if (!entry) {
    throw new Error(`OOXML package part not found: ${normalized}`);
  }
  return entry;
}

function getUncompressedSize(entry: JSZip.JSZipObject): number {
  const metadata = entry as JSZip.JSZipObject & { _data?: { uncompressedSize?: number } };
  return metadata._data?.uncompressedSize ?? 0;
}
