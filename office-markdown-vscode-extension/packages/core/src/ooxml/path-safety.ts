import path from "node:path";

export function normalizeZipEntryName(entryName: string): string {
  if (!entryName || entryName.includes("\\")) {
    throw new Error(`Unsafe ZIP entry name: ${entryName}`);
  }
  if (entryName.startsWith("/") || /^[A-Za-z]:/.test(entryName)) {
    throw new Error(`Unsafe ZIP entry name: ${entryName}`);
  }
  const normalized = path.posix.normalize(entryName);
  if (normalized === "." || normalized.startsWith("../") || normalized === ".." || normalized.includes("/../")) {
    throw new Error(`Unsafe ZIP entry name: ${entryName}`);
  }
  return normalized;
}

export function normalizePackagePartName(partName: string): string {
  const normalizedInput = partName.startsWith("/") ? partName.slice(1) : partName;
  return normalizeZipEntryName(normalizedInput);
}

export function relationshipPartFor(sourcePart: string): string {
  const normalized = normalizePackagePartName(sourcePart);
  const dir = path.posix.dirname(normalized);
  const file = path.posix.basename(normalized);
  if (dir === ".") {
    return `_rels/${file}.rels`;
  }
  return `${dir}/_rels/${file}.rels`;
}

export function resolveRelationshipTarget(sourcePart: string, target: string): string {
  if (!target || target.includes("\\")) {
    throw new Error(`Unsafe relationship target: ${target}`);
  }
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(target) || target.startsWith("//")) {
    throw new Error(`External relationship target must not be resolved as package content: ${target}`);
  }

  const targetWithoutFragment = target.split("#", 1)[0] ?? "";
  if (!targetWithoutFragment) {
    throw new Error("Relationship target does not point to a package part.");
  }
  const base = targetWithoutFragment.startsWith("/") ? "" : path.posix.dirname(normalizePackagePartName(sourcePart));
  const candidate = targetWithoutFragment.startsWith("/")
    ? targetWithoutFragment.slice(1)
    : path.posix.join(base === "." ? "" : base, targetWithoutFragment);
  return normalizePackagePartName(candidate);
}

export function toPosixRelativePath(fromDir: string, toPath: string): string {
  return path.relative(fromDir, toPath).split(path.sep).join("/");
}
