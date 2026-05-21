# QA And Test Design

## Purpose

Define how to verify that the Office Markdown VS Code extension is safe, useful, and implementation-ready. The quality bar is not "a file was generated"; it is that text is preserved, assets are linked, unsupported content is reported, and the extension works without external installs.

## Requirement Traceability

| Requirement | Acceptance Condition | Automated Test | Manual QA | Visual/UI Check | Performance/Risk Check |
| --- | --- | --- | --- | --- | --- |
| FR-001 | Explorer context menu conversion works. | VS Code extension command test with mocked resource URI. | Right-click a supported file and convert. | Command appears only on supported files. | N/A |
| FR-002 | Active file conversion works. | Command test with active editor URI. | Open a supported file and run command palette action. | Completion notification appears. | N/A |
| FR-003 | Markdown uses relative asset links. | Snapshot test for generated Markdown. | Open Markdown preview and check assets render. | Images render in preview. | Path traversal checks. |
| FR-004 | Asset directory is deterministic. | Unit test filename policy. | Convert same file twice with overwrite settings. | Output tree is easy to inspect. | Collision handling. |
| FR-005 | Manifest is generated. | JSON schema/snapshot test. | Open manifest from notification. | N/A | Manifest contains warnings/errors. |
| FR-006 | Excel sheet order is preserved. | XLSX fixture snapshot. | Inspect converted workbook with multiple sheets. | N/A | Hidden sheets behavior. |
| FR-007 | Excel cells become Markdown tables. | XLSX cell fixture test. | Inspect generated Markdown. | Markdown table readable in preview. | Large table truncation. |
| FR-008 | Excel formula handling is configurable. | Formula mode unit/integration tests. | Toggle setting and reconvert. | N/A | No formula evaluation. |
| FR-009 | Excel images are extracted. | XLSX image fixture test. | Preview Markdown with image. | Image renders. | Asset size limit. |
| FR-010 | Excel text-bearing drawings are extracted. | Drawing XML unit test. | Convert a sheet with text box. | N/A | Unsupported drawing warnings. |
| FR-011 | Excel embedded objects are preserved. | Relationship/embedding fixture test. | Confirm asset link exists. | N/A | No object execution. |
| FR-012 | PPTX slide order is preserved. | PPTX fixture snapshot. | Inspect slide sections. | N/A | N/A |
| FR-013 | PPTX text and tables are extracted. | Slide text/table fixture test. | Inspect generated Markdown. | Markdown table readable. | N/A |
| FR-014 | PPTX images are extracted. | PPTX image fixture test. | Preview Markdown with image. | Image renders. | Asset size limit. |
| FR-015 | PPTX speaker notes are configurable. | Notes fixture test. | Toggle setting and reconvert. | N/A | N/A |
| FR-016 | PPTX embedded objects are preserved. | PPTX embedding fixture test. | Confirm asset link exists. | N/A | No object execution. |
| FR-017 | DOCX reading order is preserved. | DOCX fixture snapshot. | Inspect generated Markdown. | N/A | N/A |
| FR-018 | DOCX images are extracted. | DOCX image fixture test. | Preview Markdown with image. | Image renders. | Asset size limit. |
| FR-019 | DOCX embedded objects are preserved. | DOCX relationship fixture test. | Confirm asset link exists. | N/A | No object execution. |
| FR-020 | Unsupported content is reported. | Fixture with unsupported part. | Inspect manifest warnings. | Warning notification appears. | N/A |
| FR-021 | Repeated conversion is safe. | Asset writer overwrite test. | Reconvert with confirm/createUnique. | Output tree remains clean. | No unrelated deletes. |
| FR-022 | Progress and completion feedback work. | Extension command test for progress wrapper. | Convert a medium file. | Progress notification visible. | N/A |
| FR-023 | Settings change behavior. | Settings resolution unit test. | Toggle settings and reconvert. | N/A | N/A |
| FR-024 | Core converter is independent from VS Code. | Core package tests run without VS Code APIs. | N/A | N/A | Enables CI and CLI. |
| NFR-001 | No external installs required. | CI/test environment without external binaries. | Test on a clean machine or clean environment. | N/A | Package inspection. |
| NFR-002 | Local-only processing. | Static check for network APIs in core. | Confirm no network prompts. | N/A | Dependency review. |
| NFR-003 | Input is untrusted. | Malicious ZIP/path traversal tests. | N/A | N/A | Zip bomb and external relationship tests. |
| NFR-004 | Output paths are safe. | Filename sanitizer tests. | Convert files with unusual names. | N/A | Path traversal checks. |
| NFR-005 | Conversion is auditable. | Manifest schema test. | Inspect report and manifest. | N/A | N/A |
| NFR-006 | Large files are bounded. | Limit tests with synthetic fixtures. | Convert a large-ish workbook. | Progress remains responsive. | Memory/time observation. |
| NFR-007 | Dependencies are low risk. | Dependency/license audit task. | N/A | N/A | No native binaries. |
| NFR-008 | Tests are deterministic. | Snapshot tests in CI. | N/A | N/A | Cross-platform path normalization. |
| NFR-009 | Markdown is readable. | Markdown snapshot and lint if added. | Open preview. | Tables/images render. | N/A |
| NFR-010 | Package size is reasonable. | Package size check after VSIX build. | N/A | N/A | Avoid heavy bundled binaries. |

## Automated Test Coverage

### Core Unit Tests

Write unit tests before implementation for:

- ZIP entry path normalization:
  - rejects absolute paths.
  - rejects `..` traversal.
  - preserves safe nested paths.
- Relationship resolution:
  - resolves internal targets relative to the source part.
  - rejects external targets for extraction.
  - handles missing relationship IDs with warnings.
- Content type lookup:
  - resolves default extension content types.
  - resolves override content types.
- Asset filename policy:
  - creates stable names.
  - preserves safe extensions.
  - handles collisions.
- Markdown writer:
  - escapes table pipes.
  - handles empty cells.
  - writes image references with relative paths.
- Manifest writer:
  - writes schema version.
  - records extracted/partial/skipped/error states.

### Converter Integration Tests

Use fixture files or minimal OOXML packages for:

- XLSX basic workbook:
  - two sheets.
  - shared strings.
  - number/string/boolean/error cells.
  - formula with cached value.
  - merged cells.
- XLSX assets:
  - one image anchored in a sheet.
  - one text box.
  - one embedded object relationship.
  - one unsupported drawing item.
- PPTX basic deck:
  - two slides.
  - title and body text.
  - table.
  - speaker notes.
- PPTX assets:
  - image.
  - embedded object relationship.
  - unsupported complex shape.
- DOCX basic document:
  - headings.
  - paragraphs.
  - unordered and ordered lists.
  - table.
  - hyperlink.
  - image.
- DOCX embedded object:
  - embedding relationship saved as asset.

Expected outputs:

- Markdown snapshot.
- Manifest snapshot.
- Asset file presence and byte equality where fixture asset is known.

### VS Code Extension Tests

Use VS Code extension test tooling to verify:

- Commands are registered.
- Unsupported files show a clear error.
- Supported resource URI invokes core conversion with resolved options.
- Progress wrapper is used.
- Completion notification offers to open Markdown and manifest.
- Settings map correctly to core options.

## TDD Candidates

Strict test-first work should be used for:

- OOXML package safety.
- Relationship resolution.
- Asset extraction and filename policy.
- Manifest schema.
- Markdown table escaping.
- Format routing.
- Excel shared string and cell parsing.
- Word numbering/list mapping where implemented.

For each TDD candidate:

1. Write failing tests for the smallest behavior.
2. Implement only enough to pass.
3. Add boundary tests.
4. Refactor behind passing tests.

## Manual QA

### QA-001: Install And Convert

Steps:

1. Build/package the extension.
2. Install it into VS Code Desktop.
3. Open a workspace containing sample `.xlsx`, `.pptx`, and `.docx` files.
4. Right-click each file and run conversion.
5. Confirm Markdown and asset directories are generated.
6. Open Markdown preview.

Expected:

- Conversion command appears for supported files.
- Markdown opens after conversion.
- Images render from relative paths.
- Manifest exists.
- No external runtime prompt appears.

### QA-002: Settings Behavior

Steps:

1. Toggle speaker notes off.
2. Convert a PPTX with notes.
3. Toggle speaker notes on.
4. Reconvert.
5. Compare outputs.

Expected:

- Notes are omitted when disabled and present when enabled.
- Manifest records whether notes were included or skipped.

### QA-003: Excel Formula Mode

Steps:

1. Convert formula workbook with default setting.
2. Change formula mode to `inlineFormulaTable`.
3. Reconvert.

Expected:

- Default Markdown shows values and manifest records formulas.
- Inline mode includes formula information in Markdown.

### QA-004: Repeated Conversion

Steps:

1. Convert a file.
2. Convert it again with overwrite policy `confirm`.
3. Cancel overwrite.
4. Convert with create-unique policy.

Expected:

- Cancel leaves prior output unchanged.
- Create-unique generates a non-conflicting output.
- No unrelated files are deleted.

### QA-005: Unsupported Content Visibility

Steps:

1. Convert a fixture with unsupported SmartArt or complex chart.
2. Inspect notification, Markdown report, and manifest.

Expected:

- Conversion succeeds partially if possible.
- Unsupported content is visible as a warning.
- The warning identifies source slide/sheet/document section when possible.

## Visual And Usability Checks

Target UI surfaces:

- Explorer context menu.
- Command palette.
- Progress notification.
- Completion notification.
- Markdown preview.

Checks:

- Command names are understandable.
- Error messages include supported extensions.
- Completion clearly distinguishes success from partial success.
- Markdown preview renders image references correctly.
- The manifest can be opened without hunting through folders.

## Performance And Reliability Checks

### PERF-001: Medium Files

Use a medium workbook/deck/document with multiple images.

Expected:

- Conversion finishes without VS Code becoming unresponsive.
- Progress is visible.
- Memory use does not grow without bound across repeated conversions.

### PERF-002: Large Table Limit

Use a synthetic workbook with more rows than `maxTableRows`.

Expected:

- Markdown table is truncated or chunked according to the setting.
- Manifest records truncation.
- Conversion completes.

### SEC-001: Path Traversal ZIP

Use a malicious fixture containing entries such as `../evil.txt` or absolute paths.

Expected:

- Conversion rejects the package or skips unsafe entries.
- No files are written outside the intended output directory.

### SEC-002: External Relationships

Use a fixture with external relationships.

Expected:

- The converter does not fetch external resources.
- Manifest records skipped external relationship.

### SEC-003: Macro Safety

Use `.xlsm` fixture with macro parts.

Expected:

- Macros are not executed.
- Macro parts are not converted.
- Manifest records that macro content was ignored or preserved according to final product decision.

## MVP Completion Judgment

Do not call MVP complete merely because conversions produce Markdown. MVP completion requires:

- Passing core unit tests.
- Passing converter fixture integration tests.
- Passing VS Code extension command tests.
- Passing manual QA for `.xlsx`, `.pptx`, and `.docx`.
- Passing safety tests for path traversal, external relationships, and package limits.
- A packaged extension verified to run without external runtimes.
- Manifest and report behavior verified for partial extraction.
