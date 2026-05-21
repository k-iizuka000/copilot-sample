import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const ignoredDirs = new Set([".git", "node_modules", "out", ".vscode-test"]);
const riskyPatterns = [
  /\/Users\/kei\b/g,
  /ghq\/github\.com\/k-iizuka000/g,
  /AIza[0-9A-Za-z_-]{20,}/g,
  /sk-[0-9A-Za-z_-]{20,}/g,
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g
];

function scanText(label, text) {
  for (const pattern of riskyPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      console.error(`Potential public-repo safety issue in ${label}: ${pattern}`);
      process.exitCode = 1;
    }
  }
}

async function scanZip(rel, fullPath) {
  const zip = await JSZip.loadAsync(fs.readFileSync(fullPath));
  const entries = Object.values(zip.files);
  for (const entry of entries) {
    if (entry.dir || /\.(png|jpe?g|gif|pdf)$/i.test(entry.name)) {
      continue;
    }
    scanText(`${rel}!${entry.name}`, await entry.async("string"));
  }
}

async function scanFile(rel, fullPath) {
  if (/\.(zip|vsix|xlsx|xlsm|pptx|docx)$/i.test(fullPath)) {
    await scanZip(rel, fullPath);
    return;
  }
  if (/\.(png|jpe?g|gif|pdf)$/i.test(fullPath)) {
    return;
  }
  scanText(rel, fs.readFileSync(fullPath, "utf8"));
}

async function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        await walk(fullPath);
      }
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const rel = path.relative(root, fullPath);
    await scanFile(rel, fullPath);
  }
}

await walk(root);
