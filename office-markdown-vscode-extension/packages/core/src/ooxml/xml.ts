import { XMLParser } from "fast-xml-parser";
import type { OrderedXmlNode } from "../types.js";

const objectParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true,
  textNodeName: "#text",
  trimValues: false,
  parseTagValue: false,
  parseAttributeValue: false
});

const orderedParser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true,
  textNodeName: "#text",
  trimValues: false,
  parseTagValue: false,
  parseAttributeValue: false
});

const unsafeXmlPattern = /<!\s*(doctype|entity)\b/iu;

export function parseXml(xml: string): unknown {
  assertSafeXmlText(xml);
  return objectParser.parse(xml);
}

export function parseXmlOrdered(xml: string): OrderedXmlNode[] {
  assertSafeXmlText(xml);
  const parsed = orderedParser.parse(xml);
  return Array.isArray(parsed) ? (parsed as OrderedXmlNode[]) : [];
}

export function assertSafeXmlText(xml: string): void {
  if (unsafeXmlPattern.test(xml)) {
    throw new Error("Unsafe XML declaration detected: DOCTYPE and ENTITY declarations are not allowed.");
  }
}

export function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export function getChild<T = unknown>(node: unknown, key: string): T | undefined {
  if (!isRecord(node)) {
    return undefined;
  }
  return node[key] as T | undefined;
}

export function getTextValue(node: unknown): string {
  if (node === undefined || node === null) {
    return "";
  }
  if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map((item) => getTextValue(item)).join("");
  }
  if (!isRecord(node)) {
    return "";
  }
  const directText = node["#text"];
  if (directText !== undefined) {
    return String(directText);
  }
  return Object.entries(node)
    .filter(([key]) => key !== ":@" && key !== "#comment")
    .map(([, value]) => getTextValue(value))
    .join("");
}

export function deepCollect(node: unknown, key: string): unknown[] {
  const results: unknown[] = [];
  visit(node, (candidateKey, value) => {
    if (candidateKey === key) {
      results.push(value);
    }
  });
  return results;
}

export function getOrderedName(node: OrderedXmlNode): string | undefined {
  return Object.keys(node).find((key) => key !== ":@" && key !== "#text" && key !== "#comment");
}

export function getOrderedChildren(node: OrderedXmlNode): OrderedXmlNode[] {
  const name = getOrderedName(node);
  if (!name) {
    return [];
  }
  const children = node[name];
  return Array.isArray(children) ? (children as OrderedXmlNode[]) : [];
}

export function getOrderedAttrs(node: OrderedXmlNode): Record<string, string> {
  const attrs = node[":@"];
  if (!isRecord(attrs)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    result[key] = String(value);
  }
  return result;
}

export function orderedText(node: unknown): string {
  if (Array.isArray(node)) {
    return node.map((child) => orderedText(child)).join("");
  }
  if (!isRecord(node)) {
    return "";
  }
  if (node["#text"] !== undefined) {
    return String(node["#text"]);
  }
  return Object.entries(node)
    .filter(([key]) => key !== ":@" && key !== "#comment")
    .map(([, value]) => orderedText(value))
    .join("");
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function visit(node: unknown, callback: (key: string, value: unknown) => void): void {
  if (Array.isArray(node)) {
    for (const item of node) {
      visit(item, callback);
    }
    return;
  }
  if (!isRecord(node)) {
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    callback(key, value);
    visit(value, callback);
  }
}
