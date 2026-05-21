const safeExtensionPattern = /^\.[a-z0-9]{1,12}$/i;

export function assetExtension(sourcePath: string, contentType?: string): string {
  const sourceExtension = sourcePath.match(/\.([A-Za-z0-9]{1,12})$/)?.[0].toLowerCase();
  if (sourceExtension && safeExtensionPattern.test(sourceExtension)) {
    return sourceExtension;
  }
  switch (contentType?.toLowerCase()) {
    case "image/png":
      return ".png";
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/gif":
      return ".gif";
    case "image/webp":
      return ".webp";
    default:
      return ".bin";
  }
}

export function assetFileName(prefix: string, sourcePath: string, contentType?: string): string {
  return `${sanitizePrefix(prefix)}${assetExtension(sourcePath, contentType)}`;
}

function sanitizePrefix(prefix: string): string {
  const sanitized = prefix.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  return sanitized || "asset";
}
