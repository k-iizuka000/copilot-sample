# Office Markdown VS Code Extension Spec-Driven Design Set

## Purpose

This document set prepares implementation of a VS Code extension that converts Office files into an output directory containing Markdown, extracted assets, and a manifest. The target user should only need to install the VS Code extension. They should not need to install Python, Pandoc, LibreOffice, MarkItDown, or any other command line tool.

The core product idea is:

- Convert Excel, PowerPoint, and Word files into readable Markdown.
- Preserve non-text content by extracting images and embedded objects into an adjacent `assets` directory.
- Prefer text extraction when text exists, while keeping original assets whenever information could otherwise be lost.
- Make unsupported or partially supported content explicit in a conversion manifest and report.

## Context Gathered

- The repository is a public documentation/sample repository. Generated specs must avoid user-specific absolute paths and personal information.
- The current repository is lightweight and does not yet define an implementation stack for this tool.
- The user wants a VS Code extension rather than a standalone script.
- The user wants existing-tool convenience, but prefers not to depend on a personal open source repository.
- Prior investigation found:
  - Microsoft MarkItDown is useful as a reference, but its standard Excel conversion is table-oriented and does not fully satisfy asset-preserving Excel conversion.
  - Existing tools can cover parts of the problem, but Excel images, drawings, and embedded objects need stronger preservation semantics.
  - Office `.xlsx`, `.pptx`, and `.docx` files are ZIP packages containing XML parts, relationships, and media/object files, so a bundled TypeScript implementation is realistic.

## Scope Summary

MVP:

- Desktop VS Code extension.
- File conversion for `.xlsx`, `.xlsm`, `.pptx`, and `.docx`.
- Markdown output next to the source file or in a configured output directory.
- Asset extraction into a deterministic `assets/` directory inside each output directory.
- Conversion manifest with extracted, skipped, and unsupported items.
- No external runtime installation.
- No macro execution, no external link fetching, and no network calls.

Out of scope for MVP:

- Legacy binary Office files: `.xls`, `.ppt`, `.doc`.
- Pixel-perfect visual rendering.
- OCR or LLM Vision extraction.
- Full SmartArt reconstruction.
- Full chart image rendering.
- VS Code Web extension support.
- Cloud processing or remote conversion.

## Design Decisions Summary

- Use a TypeScript core library that reads Office files as OOXML ZIP packages. This avoids Python/Pandoc/LibreOffice runtime requirements.
- Keep conversion logic independent from VS Code APIs. The VS Code extension should be a thin UI wrapper around the core library.
- Preserve assets by default. If an object can also produce text, output both the text and a link to the preserved source asset where possible.
- Produce a manifest for auditability. A successful conversion can still contain warnings about unsupported objects.
- Treat malformed or suspicious Office packages as untrusted input. Enforce zip size limits, path normalization, no macro execution, and safe output filenames.

## Documents

1. [Requirements](./requirements.md)
2. [Design](./design.md)
3. [QA/Test Design](./qa-test-design.md)
4. [Implementation Tasks](./tasks.md)
5. [Consistency Review](./consistency-review.md)

## MVP Completion Definition

MVP is complete only when all of the following are true:

- `.xlsx`, `.xlsm`, `.pptx`, and `.docx` conversions work from the VS Code context menu and command palette.
- Generated Markdown references extracted images and preserved embedded objects using relative paths.
- Text-bearing objects are represented in Markdown when their text can be extracted.
- Unsupported or partially extracted content is visible in `manifest.json` and in a human-readable conversion report.
- Unit and integration tests cover the OOXML package reader, asset writer, manifest generation, and at least one fixture per supported format.
- Manual QA verifies right-click conversion, output preview, repeated conversion overwrite behavior, and failure messaging.
- The packaged extension runs without requiring separate installation of Python, Pandoc, LibreOffice, MarkItDown, or external binaries.

## Before Implementation

- Confirm the extension name and command labels.
- Confirm the default output layout:
  - Recommended: `source-name/source-name.md`, `source-name/assets/`, and `source-name/manifest.json`.
- Confirm whether `.xlsm` should be accepted in MVP with macro parts ignored and preserved only as warning metadata.
- Confirm whether the initial public release should include telemetry. Current spec assumes no telemetry.
