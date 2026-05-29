#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirs = new Set([
  ".git",
  "node_modules",
  "bin",
  "obj",
  "coverage",
  ".vscode-test"
]);

const forbiddenBasenames = new Set([
  ".DS_Store",
  ".env",
  ".env.local",
  "id_rsa",
  "id_ed25519"
]);

const forbiddenExtensions = new Set([
  ".key",
  ".mobileprovision",
  ".p12",
  ".pem",
  ".pfx"
]);

const textExtensions = new Set([
  ".bat",
  ".cmd",
  ".cjs",
  ".cs",
  ".csproj",
  ".css",
  ".gitignore",
  ".html",
  ".ini",
  ".js",
  ".json",
  ".jsonc",
  ".jsx",
  ".lock",
  ".md",
  ".mjs",
  ".npmignore",
  ".props",
  ".ps1",
  ".scss",
  ".sh",
  ".sln",
  ".targets",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".vscodeignore",
  ".xml",
  ".yaml",
  ".yml"
]);

const archiveExtensions = new Set([".docx", ".pptx", ".vsix", ".xlsx", ".xlsm", ".zip"]);

const riskyPatterns = [
  { name: "macOS local user path", pattern: /\/Users\/[A-Za-z0-9._-]+\b/g },
  { name: "Windows local user path", pattern: /[A-Za-z]:\\Users\\[A-Za-z0-9._-]+\b/g },
  { name: "repo-local absolute path", pattern: /ghq\/github\.com\/k-iizuka000/g },
  { name: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g },
  { name: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/g },
  { name: "GitHub classic token", pattern: /ghp_[A-Za-z0-9_]{36}/g },
  { name: "GitHub fine-grained token", pattern: /github_pat_[A-Za-z0-9_]{22,}_[A-Za-z0-9_]{59,}/g },
  { name: "OpenAI-style API key", pattern: /(?:sk-(?:admin|proj|svcacct)-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{48})/g },
  { name: "Google API key", pattern: /AIza[0-9A-Za-z_-]{35}/g },
  { name: "Slack token", pattern: /xox[baprs]-[A-Za-z0-9-]{20,}/g }
];

const findings = [];

function relativeLabel(fullPath) {
  return path.relative(root, fullPath).split(path.sep).join("/");
}

function scanText(label, text) {
  for (const { name, pattern } of riskyPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      findings.push(`${label}: ${name}`);
    }
  }
}

function isTextFile(filePath) {
  const basename = path.basename(filePath);
  return textExtensions.has(path.extname(filePath).toLowerCase()) || textExtensions.has(basename);
}

function isArchive(filePath) {
  return archiveExtensions.has(path.extname(filePath).toLowerCase());
}

function isForbiddenPublicFileName(filePath) {
  const basename = path.basename(filePath);
  if (basename.endsWith(".example")) {
    return false;
  }
  return forbiddenBasenames.has(basename) || forbiddenExtensions.has(path.extname(basename).toLowerCase());
}

function archiveEntries(filePath) {
  try {
    return execFileSync("unzip", ["-Z1", filePath], { encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    return [];
  }
}

function scanArchive(fullPath) {
  const rel = relativeLabel(fullPath);
  for (const entry of archiveEntries(fullPath)) {
    if (isForbiddenPublicFileName(entry)) {
      findings.push(`${rel}!${entry}: forbidden public file`);
    }
    try {
      const content = execFileSync("unzip", ["-p", fullPath, archiveEntryPattern(entry)], {
        maxBuffer: 100 * 1024 * 1024
      });
      scanText(`${rel}!${entry}`, content.toString(isTextFile(entry) ? "utf8" : "latin1"));
    } catch {
      // Platform-specific archive entries are best-effort in this scanner.
    }
  }
}

function archiveEntryPattern(entry) {
  return entry.replaceAll("[", "[[]").replaceAll("*", "[*]").replaceAll("?", "[?]");
}

function scanFile(fullPath) {
  const rel = relativeLabel(fullPath);
  if (isForbiddenPublicFileName(fullPath)) {
    findings.push(`${rel}: forbidden public file`);
  }
  if (isArchive(fullPath)) {
    scanArchive(fullPath);
    return;
  }
  const content = fs.readFileSync(fullPath);
  scanText(rel, content.toString(isTextFile(fullPath) ? "utf8" : "latin1"));
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        walk(fullPath);
      }
      continue;
    }
    if (entry.isFile()) {
      scanFile(fullPath);
    }
  }
}

function scanGitPublicFiles() {
  try {
    return execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
      cwd: root
    })
      .toString("utf8")
      .split("\0")
      .filter(Boolean);
  } catch {
    return undefined;
  }
}

const publicFiles = scanGitPublicFiles();
if (publicFiles) {
  for (const rel of publicFiles) {
    scanFile(path.join(root, rel));
  }
} else {
  walk(root);
}

if (findings.length > 0) {
  console.error("Potential public-repo safety issues found:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log("Public safety scan passed.");
