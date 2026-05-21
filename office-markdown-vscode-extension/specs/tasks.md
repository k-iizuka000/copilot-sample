# Office Markdown VS Code Extension Implementation Tasks

## Purpose

This task plan implements the MVP for a VS Code extension that converts `.xlsx`, `.xlsm`, `.pptx`, and `.docx` into Markdown plus assets. It deliberately avoids legacy binary Office formats, OCR, full visual rendering, and external runtime dependencies.

## MVP Scope

- Bundled desktop VS Code extension.
- TypeScript core converter independent from VS Code APIs.
- OOXML package reader with safety limits.
- Excel, PowerPoint, and Word conversion.
- Image and embedded object asset extraction.
- Manifest and warning/report output.
- Tests and manual QA sufficient to verify realistic conversion flows.

## Out Of Scope

- `.xls`, `.ppt`, `.doc`, `.xlsb`.
- OCR or LLM Vision.
- Chart screenshot rendering.
- Full SmartArt reconstruction.
- Web extension support.
- Cloud processing.

## Labels

- `DATA`: data models, fixtures, schemas, repositories, configuration.
- `LOGIC`: domain behavior, parsing, conversion, algorithms.
- `UI`: VS Code commands, settings, notifications, and user flow.
- `API`: public core APIs and extension integration boundaries.
- `TEST`: unit, integration, extension, snapshot, or contract tests.
- `QA`: manual verification and exploratory checks.
- `EVAL`: acceptance, safety, performance, or release-readiness evaluation.
- `DOC`: docs or developer instructions needed for delivery.

## 0. Implementation Preconditions

- [ ] `0.1` [DATA] Choose the project/package layout. Dependencies: none. Done: repository has a clear workspace layout for `core` and `vscode-extension`, or a documented reason for a simpler layout. Verify: tree inspection. References: `design.md` Proposed Repository Layout.
- [ ] `0.2` [DATA] Choose pure JS/TS ZIP and XML parsing dependencies. Dependencies: `0.1`. Done: dependencies are selected with license, maintenance, native-module, and bundle-size notes. Verify: dependency review. References: `requirements.md` NFR-001, NFR-007.
- [ ] `0.3` [DOC] Add developer setup commands after package scaffolding exists. Dependencies: `0.1`, `0.2`. Done: README or developer doc explains install, test, build, package extension, and fixture update commands. Verify: command documentation review. References: `requirements.md` NFR-008.

## 1. Core API And Safety Foundation

- [ ] `1.1` [TEST] Write failing tests for supported extension detection and format routing. Dependencies: `0.1`. Done: tests express `.xlsx`, `.xlsm`, `.pptx`, `.docx` acceptance and legacy-format rejection. Verify: test fails before implementation. References: `requirements.md` FR-001, FR-024.
- [ ] `1.2` [API] Implement `convertFile()` public API skeleton and format router. Dependencies: `1.1`. Done: router calls placeholder converters and returns typed results. Verify: routing tests pass. References: `design.md` Core API.
- [ ] `1.3` [TEST] Write failing tests for unsafe ZIP entry names. Dependencies: `1.2`. Done: tests cover absolute paths, `..`, backslash variants, and safe nested entries. Verify: test fails before implementation. References: `requirements.md` NFR-003, NFR-004.
- [ ] `1.4` [LOGIC] Implement path safety and normalized package entry validation. Dependencies: `1.3`. Done: unsafe entries are rejected before read/write use. Verify: path safety tests pass. References: `design.md` OOXML Package Reader.
- [ ] `1.5` [TEST] Write failing tests for package limits. Dependencies: `1.4`. Done: tests cover max entry count, max uncompressed bytes, and max extracted asset bytes. Verify: test fails before implementation. References: `requirements.md` NFR-006.
- [ ] `1.6` [LOGIC] Implement ZIP package reader with resource limits. Dependencies: `1.5`. Done: package reader lists entries, reads XML/binary safely, and enforces limits. Verify: package reader tests pass. References: `design.md` OOXML Package Reader.
- [ ] `1.7` [TEST] Write failing tests for content type and relationship resolution. Dependencies: `1.6`. Done: tests cover defaults, overrides, internal relationships, external relationship skipping, and missing targets. Verify: test fails before implementation. References: `requirements.md` NFR-003.
- [ ] `1.8` [LOGIC] Implement content type parser and relationship resolver. Dependencies: `1.7`. Done: OOXML relationship targets resolve safely and external links are never fetched. Verify: relationship tests pass. References: `design.md` OOXML Package Reader.

## 2. Output, Assets, Markdown, And Manifest

- [ ] `2.1` [TEST] Write failing tests for asset filename policy. Dependencies: `1.8`. Done: tests cover stable names, extension preservation, collision handling, and unsafe source names. Verify: test fails before implementation. References: `requirements.md` FR-003, FR-004, NFR-004.
- [ ] `2.2` [LOGIC] Implement asset writer and filename policy. Dependencies: `2.1`. Done: assets are written only inside the intended asset directory with deterministic relative links. Verify: asset writer tests pass. References: `design.md` Output Layout.
- [ ] `2.3` [TEST] Write failing tests for Markdown writer. Dependencies: `2.2`. Done: tests cover headings, paragraphs, lists, tables, image refs, asset links, warnings, and escaping. Verify: test fails before implementation. References: `requirements.md` FR-003, NFR-009.
- [ ] `2.4` [LOGIC] Implement Markdown intermediate model and writer. Dependencies: `2.3`. Done: Markdown snapshots are stable and readable. Verify: Markdown writer tests pass. References: `design.md` Markdown Output Model.
- [ ] `2.5` [TEST] Write failing tests for manifest schema. Dependencies: `2.4`. Done: tests cover schema version, source/output metadata, items, warnings, errors, and statuses. Verify: test fails before implementation. References: `requirements.md` FR-005, NFR-005.
- [ ] `2.6` [LOGIC] Implement manifest builder and writer. Dependencies: `2.5`. Done: manifest is generated for success, partial success, and failure cases. Verify: manifest tests pass. References: `design.md` Manifest Model.

## 3. DOCX Converter

- [ ] `3.1` [TEST] Create DOCX basic fixture and failing snapshot test. Dependencies: `2.6`. Done: fixture covers headings, paragraphs, lists, table, hyperlink, and image. Verify: snapshot test fails before converter implementation. References: `requirements.md` FR-017, FR-018.
- [ ] `3.2` [LOGIC] Implement DOCX document reader for headings, paragraphs, tables, and hyperlinks. Dependencies: `3.1`. Done: basic DOCX text snapshot passes. Verify: DOCX basic test passes for text/table/link content. References: `design.md` Word Conversion Design.
- [ ] `3.3` [TEST] Add failing DOCX image extraction test. Dependencies: `3.2`. Done: test expects image asset file and Markdown reference. Verify: test fails before implementation. References: `requirements.md` FR-018.
- [ ] `3.4` [LOGIC] Implement DOCX media extraction. Dependencies: `3.3`. Done: images are extracted and linked near source location where possible. Verify: DOCX image test passes. References: `design.md` Word Conversion Design.
- [ ] `3.5` [TEST] Add failing DOCX embedded object preservation test. Dependencies: `3.4`. Done: test expects object asset link and manifest item. Verify: test fails before implementation. References: `requirements.md` FR-019.
- [ ] `3.6` [LOGIC] Implement DOCX embedded object preservation. Dependencies: `3.5`. Done: embedded relationship targets are saved as assets and recorded. Verify: DOCX embedded object test passes. References: `design.md` Asset And Object Policy.

## 4. PPTX Converter

- [ ] `4.1` [TEST] Create PPTX basic fixture and failing snapshot test. Dependencies: `2.6`. Done: fixture covers two slides, title/body text, table, and notes. Verify: snapshot test fails before converter implementation. References: `requirements.md` FR-012, FR-013, FR-015.
- [ ] `4.2` [LOGIC] Implement PPTX presentation and slide order reader. Dependencies: `4.1`. Done: slide sections appear in presentation order. Verify: PPTX slide order test passes. References: `design.md` PowerPoint Conversion Design.
- [ ] `4.3` [LOGIC] Implement PPTX text and table extraction. Dependencies: `4.2`. Done: slide text frames and tables appear in Markdown. Verify: PPTX text/table snapshot passes. References: `requirements.md` FR-013.
- [ ] `4.4` [TEST] Add failing PPTX speaker notes setting test. Dependencies: `4.3`. Done: test expects notes included/excluded based on option. Verify: test fails before implementation. References: `requirements.md` FR-015.
- [ ] `4.5` [LOGIC] Implement PPTX speaker notes extraction. Dependencies: `4.4`. Done: notes are included by default and omitted when disabled. Verify: speaker notes tests pass. References: `design.md` PowerPoint Conversion Design.
- [ ] `4.6` [TEST] Add failing PPTX image and embedded object tests. Dependencies: `4.5`. Done: tests expect asset files, Markdown refs, and manifest items. Verify: tests fail before implementation. References: `requirements.md` FR-014, FR-016.
- [ ] `4.7` [LOGIC] Implement PPTX image and embedded object extraction. Dependencies: `4.6`. Done: slide assets are extracted and linked under the correct slide. Verify: PPTX asset tests pass. References: `design.md` Asset And Object Policy.

## 5. XLSX Converter

- [ ] `5.1` [TEST] Create XLSX basic fixture and failing snapshot test. Dependencies: `2.6`. Done: fixture covers two sheets, shared strings, numeric/string/boolean cells, formula, and merged cells. Verify: snapshot test fails before implementation. References: `requirements.md` FR-006, FR-007, FR-008.
- [ ] `5.2` [LOGIC] Implement workbook, sheet, shared string, and worksheet cell readers. Dependencies: `5.1`. Done: workbook/sheets convert to Markdown tables in source order. Verify: XLSX basic snapshot passes. References: `design.md` Excel Conversion Design.
- [ ] `5.3` [TEST] Add failing XLSX formula mode tests. Dependencies: `5.2`. Done: tests cover `valuesOnly`, `valuesWithManifest`, and `inlineFormulaTable`. Verify: tests fail before implementation. References: `requirements.md` FR-008.
- [ ] `5.4` [LOGIC] Implement formula mode behavior. Dependencies: `5.3`. Done: formula behavior matches settings and manifest expectations. Verify: formula tests pass. References: `design.md` Excel Conversion Design.
- [ ] `5.5` [TEST] Add failing XLSX image extraction test. Dependencies: `5.4`. Done: test expects worksheet image asset, Markdown reference, anchor metadata, and manifest item. Verify: test fails before implementation. References: `requirements.md` FR-009.
- [ ] `5.6` [LOGIC] Implement XLSX drawing image extraction. Dependencies: `5.5`. Done: worksheet images are extracted and grouped/sorted by sheet and anchor. Verify: XLSX image test passes. References: `design.md` Excel Conversion Design.
- [ ] `5.7` [TEST] Add failing XLSX text-bearing drawing test. Dependencies: `5.6`. Done: test expects text box text in Markdown and manifest source reference. Verify: test fails before implementation. References: `requirements.md` FR-010.
- [ ] `5.8` [LOGIC] Implement simple XLSX shape/text box text extraction. Dependencies: `5.7`. Done: DrawingML text from supported shapes appears in Markdown. Verify: text-bearing drawing test passes. References: `design.md` Excel Conversion Design.
- [ ] `5.9` [TEST] Add failing XLSX embedded object preservation test. Dependencies: `5.8`. Done: test expects embedded asset link and warning when type is unknown. Verify: test fails before implementation. References: `requirements.md` FR-011.
- [ ] `5.10` [LOGIC] Implement XLSX embedded object preservation. Dependencies: `5.9`. Done: embedded targets are saved and recorded; unknown OLE content is linked with warning. Verify: XLSX embedded object test passes. References: `design.md` Asset And Object Policy.
- [ ] `5.11` [TEST] Add failing XLSX table limit/truncation tests. Dependencies: `5.10`. Done: test covers large table truncation and manifest warning. Verify: test fails before implementation. References: `requirements.md` NFR-006.
- [ ] `5.12` [LOGIC] Implement Excel table row limit and truncation reporting. Dependencies: `5.11`. Done: large sheets are bounded and warnings are visible. Verify: table limit tests pass. References: `qa-test-design.md` PERF-002.

## 6. VS Code Extension UI

- [ ] `6.1` [TEST] Write failing extension tests for command registration and supported resource handling. Dependencies: `1.2`. Done: tests expect command IDs and supported file routing. Verify: tests fail before implementation. References: `requirements.md` FR-001, FR-002.
- [ ] `6.2` [UI] Scaffold VS Code extension commands and package contribution points. Dependencies: `6.1`. Done: commands are registered and visible for supported files. Verify: extension command tests pass. References: `design.md` Extension Layer.
- [ ] `6.3` [TEST] Write failing settings resolution tests. Dependencies: `6.2`. Done: tests map VS Code settings into core `ConvertFileOptions`. Verify: tests fail before implementation. References: `requirements.md` FR-023.
- [ ] `6.4` [UI] Implement settings resolution. Dependencies: `6.3`. Done: extension reads settings and passes stable options to core. Verify: settings tests pass. References: `design.md` Settings.
- [ ] `6.5` [TEST] Write failing tests for progress and completion notification behavior. Dependencies: `6.4`. Done: tests cover success, partial success, and failure result handling. Verify: tests fail before implementation. References: `requirements.md` FR-022.
- [ ] `6.6` [UI] Implement progress, result notifications, and output opening. Dependencies: `6.5`. Done: user sees progress, can open Markdown, and can open manifest on warnings. Verify: notification tests pass and manual smoke works. References: `qa-test-design.md` Manual QA.
- [ ] `6.7` [UI] Implement overwrite policy prompts. Dependencies: `6.6`, `2.2`. Done: confirm/overwrite/createUnique behavior is respected. Verify: extension tests and manual QA. References: `requirements.md` FR-021.

## 7. Safety, Packaging, And Release Verification

- [ ] `7.1` [TEST] Add malicious ZIP/path traversal fixtures. Dependencies: `1.6`, `2.2`. Done: tests prove unsafe entries cannot write outside output directory. Verify: safety tests pass. References: `qa-test-design.md` SEC-001.
- [ ] `7.2` [TEST] Add external relationship fixture tests. Dependencies: `1.8`. Done: tests prove external targets are not fetched. Verify: safety tests pass. References: `qa-test-design.md` SEC-002.
- [ ] `7.3` [TEST] Add `.xlsm` macro safety fixture test. Dependencies: `5.2`. Done: tests prove macro parts are not executed and are reported. Verify: safety tests pass. References: `qa-test-design.md` SEC-003.
- [ ] `7.4` [EVAL] Run full automated test suite. Dependencies: all MVP implementation tasks. Done: unit, integration, snapshot, and extension tests pass. Verify: test commands. References: `qa-test-design.md` MVP Completion Judgment.
- [ ] `7.5` [QA] Run manual QA for install and convert flow. Dependencies: `7.4`. Done: `.xlsx`, `.pptx`, and `.docx` convert from VS Code UI and Markdown preview renders asset links. Verify: QA-001 checklist. References: `qa-test-design.md` QA-001.
- [ ] `7.6` [QA] Run settings and repeated conversion QA. Dependencies: `7.5`. Done: settings change output and repeated conversion is safe. Verify: QA-002, QA-003, QA-004 checklists. References: `qa-test-design.md` QA-002, QA-003, QA-004.
- [ ] `7.7` [QA] Run unsupported content visibility QA. Dependencies: `7.5`. Done: unsupported content appears in notification/report/manifest. Verify: QA-005 checklist. References: `qa-test-design.md` QA-005.
- [ ] `7.8` [EVAL] Build packaged extension and verify no external runtime dependency. Dependencies: `7.4`. Done: packaged VSIX runs in clean VS Code Desktop environment without Python/Pandoc/LibreOffice/Office. Verify: clean-environment smoke test. References: `requirements.md` AC-004, NFR-001.
- [ ] `7.9` [EVAL] Review dependency, license, and package size. Dependencies: `7.8`. Done: dependencies are acceptable, pure JS/TS, and package size is reasonable. Verify: dependency/package report. References: `requirements.md` NFR-007, NFR-010.

## MVP Completion

- [ ] `8.1` [EVAL] Verify MVP acceptance criteria. Dependencies: `7.4`, `7.5`, `7.6`, `7.7`, `7.8`, `7.9`. Done: AC-001 through AC-005 are satisfied with evidence; requirements, design, QA, and tasks agree. Verify: acceptance review against `requirements.md` and `qa-test-design.md`. References: `requirements.md`, `design.md`, `qa-test-design.md`.
- [ ] `8.2` [DOC] Update user-facing README for installation and use. Dependencies: `8.1`. Done: README explains supported formats, conversion command, output layout, settings, limitations, and privacy/safety behavior. Verify: docs review. References: `requirements.md` FR-001, FR-023, NFR-002.

## Post-MVP Tasks

- [ ] `P1` [LOGIC] Add batch folder conversion. Dependencies: MVP complete. Done: folder command converts supported files and emits summary. Verify: folder fixture test and manual QA. References: `requirements.md` FR-025.
- [ ] `P2` [LOGIC] Add recursive conversion for embedded OOXML objects. Dependencies: MVP complete. Done: embedded `.docx`, `.pptx`, or `.xlsx` assets can optionally produce nested Markdown. Verify: embedded OOXML fixture tests. References: `design.md` Embedded Objects.
- [ ] `P3` [LOGIC] Add chart data extraction improvements. Dependencies: MVP complete. Done: chart titles, series, categories, and values are represented as Markdown tables where possible. Verify: chart fixture tests. References: `requirements.md` FR-027.
- [ ] `P4` [LOGIC] Add chart image rendering if a safe pure JS approach is selected. Dependencies: `P3`. Done: chart images are saved as assets without external binaries. Verify: chart rendering tests and visual QA. References: `design.md` Charts.
- [ ] `P5` [LOGIC] Add OCR/caption plugin point. Dependencies: MVP complete. Done: optional provider interface can add image text without replacing source assets. Verify: mocked provider tests. References: `requirements.md` FR-026.
- [ ] `P6` [UI] Add conversion report webview. Dependencies: MVP complete. Done: users can inspect extracted/skipped/unsupported items in a friendly UI. Verify: webview tests/manual QA. References: `requirements.md` FR-020.
- [ ] `P7` [API] Add standalone CLI wrapper. Dependencies: MVP complete. Done: core can be run from CLI using the same conversion engine. Verify: CLI integration tests. References: `requirements.md` FR-024.
