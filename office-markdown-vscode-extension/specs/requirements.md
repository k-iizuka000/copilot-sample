# Requirements

## Purpose

Define the product and quality requirements for a VS Code extension that converts Office documents into Markdown plus extracted assets.

## User Value

The user can convert Office files into Markdown that is useful for reading, AI context, documentation, and source-controlled review. Images and embedded objects should not disappear silently. The extension should feel safe and simple: install it, right-click an Office file, convert, then inspect the Markdown and assets.

## MVP Scope

- Desktop VS Code extension for modern Office OOXML files.
- Supported input extensions:
  - Excel: `.xlsx`, `.xlsm`
  - PowerPoint: `.pptx`
  - Word: `.docx`
- Output:
  - One output directory per input file.
  - Excel/XLSM: one workbook index Markdown file plus one Markdown file per included sheet.
  - Word/PowerPoint/PDF: one Markdown file per input file inside the output directory.
  - One `assets/` directory per output directory.
  - One manifest file per conversion.
  - Optional human-readable report section in the primary Markdown file.
- Runtime:
  - Bundled TypeScript/JavaScript dependencies only.
  - No required external binaries or language runtimes.

## Out Of Scope

- `.xls`, `.xlsb`, `.ppt`, `.doc`, and other legacy binary formats.
- Executing macros or extracting macro behavior.
- Visual rendering of Office pages/slides/sheets as screenshots.
- OCR, LLM Vision, or image captioning.
- Full SmartArt, WordArt, and complex chart reconstruction.
- Password-protected Office files.
- Cloud conversion.
- Web extension support for vscode.dev/github.dev.

## Functional Requirements

| ID | Requirement | Acceptance Criteria | Priority |
| --- | --- | --- | --- |
| FR-001 | The extension can convert a supported Office file from the VS Code Explorer context menu. | Right-clicking `.xlsx`, `.xlsm`, `.pptx`, or `.docx` shows a conversion command and produces Markdown plus assets. | MVP |
| FR-002 | The extension can convert the active editor file from the command palette. | Running the command on an active supported file produces the same output as the context menu. | MVP |
| FR-003 | The converter writes Markdown with relative asset links. | Markdown references generated assets using paths relative to the Markdown file, such as `![image](assets/sheet-001-image-001.png)`. | MVP |
| FR-004 | The converter creates a deterministic output directory. | For `sample.xlsx`, the default output is `sample/sample.md`, sheet Markdown files, `sample/assets/`, and `sample/manifest.json`, unless the user chooses another output root. | MVP |
| FR-005 | The converter produces a machine-readable manifest. | Each conversion writes `sample/manifest.json` with source metadata, output paths, extracted assets, warnings, skipped items, and errors. | MVP |
| FR-006 | Excel conversion preserves workbook and sheet order. | The workbook index lists included sheets in order, and each included sheet has a Markdown file labeled with its source sheet name. | MVP |
| FR-007 | Excel conversion outputs cell content as Markdown tables or structured ranges. | Non-empty used ranges are represented in Markdown with values. Large ranges are chunked or summarized according to configured limits. | MVP |
| FR-008 | Excel conversion preserves formulas where configured. | Default mode shows displayed values and records formulas in manifest; formula-inclusive mode shows formulas beside values or in a dedicated formula table. | MVP |
| FR-009 | Excel images are extracted as assets and referenced from Markdown. | Images referenced through worksheet drawing relationships are saved to assets and inserted near their anchor location or in an asset section for the sheet. | MVP |
| FR-010 | Excel text-bearing drawings are converted to Markdown text when possible. | Text boxes and simple shape text found in drawing XML are emitted as quote blocks or object sections. | MVP |
| FR-011 | Excel embedded objects are preserved as assets when possible. | Files under OOXML embedding relationships are saved to assets and linked from Markdown, with type and source location recorded in manifest. | MVP |
| FR-012 | PowerPoint conversion preserves slide order. | Markdown contains one section per slide in deck order. | MVP |
| FR-013 | PowerPoint text is extracted from text frames and tables. | Slide titles, body text, table cells, and simple shape text appear in Markdown. | MVP |
| FR-014 | PowerPoint images are extracted as assets and referenced from Markdown. | Slide image relationships are saved to assets and linked in the relevant slide section. | MVP |
| FR-015 | PowerPoint speaker notes are included when configured. | Default mode includes speaker notes under each slide when notes exist, unless disabled by setting. | MVP |
| FR-016 | PowerPoint embedded objects are preserved as assets when possible. | Embedded package or OLE relationship targets are saved and linked in the relevant slide section. | MVP |
| FR-017 | Word conversion preserves document reading order. | Headings, paragraphs, lists, tables, hyperlinks, footnotes/endnotes where feasible, and images appear in Markdown in document order. | MVP |
| FR-018 | Word images are extracted as assets and referenced from Markdown. | Image relationships from the document are saved and linked near their source paragraph/run when possible. | MVP |
| FR-019 | Word embedded objects are preserved as assets when possible. | Embedded objects are saved and linked from the nearest document location that references them. | MVP |
| FR-020 | Unsupported content is reported, not silently dropped. | Unsupported SmartArt, complex charts, unknown OLE payloads, password-protected files, and parse failures produce manifest warnings or errors. | MVP |
| FR-021 | The converter supports repeated conversion safely. | Re-running conversion can overwrite generated files after confirmation or use a configured overwrite policy. It must not delete unrelated files. | MVP |
| FR-022 | The extension provides progress and completion feedback. | Long-running conversions show VS Code progress; completion offers to open the Markdown file. | MVP |
| FR-023 | The extension exposes basic settings. | Users can configure output location, overwrite behavior, hidden Excel sheets, speaker notes, formula output, max table size, and report inclusion. | MVP |
| FR-024 | The core converter can be invoked outside VS Code by tests or a CLI wrapper. | Core conversion is available through a TypeScript API independent of VS Code APIs. | MVP |
| FR-025 | The converter can process folders in batch. | A folder command converts supported files inside the selected folder, with a summary report. | Post-MVP |
| FR-026 | The converter can optionally OCR images. | OCR/captioning can enrich Markdown without replacing source assets. | Post-MVP |
| FR-027 | The converter can render chart images. | Chart visuals can be exported as image assets in addition to textual chart metadata. | Post-MVP |

## Non-Functional Requirements

| ID | Requirement | Acceptance Criteria | Priority |
| --- | --- | --- | --- |
| NFR-001 | No separate installation is required. | A packaged extension works on a clean VS Code Desktop install without Python, Pandoc, LibreOffice, MarkItDown, or native Office. | MVP |
| NFR-002 | Processing is local-only. | The extension does not send document contents, assets, filenames, or telemetry to external services. | MVP |
| NFR-003 | Office input is treated as untrusted. | The parser never executes macros, never follows external links, validates ZIP entries, and blocks path traversal. | MVP |
| NFR-004 | Output paths are safe and deterministic. | Generated filenames are sanitized, stable, relative, and collision-resistant. | MVP |
| NFR-005 | Conversion is auditable. | Manifest records enough source references to understand where Markdown sections and assets came from. | MVP |
| NFR-006 | Conversion handles large files predictably. | Configured limits prevent excessive memory use; when limits are hit, conversion reports partial output rather than crashing silently. | MVP |
| NFR-007 | Dependency risk is minimized. | Only maintained, pure JavaScript/TypeScript libraries are used. No native modules are required for MVP. | MVP |
| NFR-008 | Tests are deterministic. | Fixtures and expected Markdown snapshots are stable across macOS, Windows, and Linux. | MVP |
| NFR-009 | Markdown is readable in VS Code preview and source view. | Generated Markdown uses standard GitHub Flavored Markdown where possible and avoids HTML unless needed for table fidelity. | MVP |
| NFR-010 | The extension package size remains reasonable. | MVP package avoids bundling external binaries and large ML/OCR assets. | MVP |

## Acceptance Criteria

### AC-001: Excel Happy Path

Given an `.xlsx` file with two sheets, normal cells, a formula, one image, one text box, and one embedded object reference, when the user converts it, then:

- The output directory has a workbook index Markdown file and one Markdown file per included sheet.
- Cell content is present in readable tables.
- The formula is represented according to the configured formula mode.
- The image is saved to `assets/` and referenced with `![](...)`.
- The text box text appears in Markdown.
- The embedded object is saved or reported with a warning if it cannot be decoded.
- `manifest.json` records extracted assets and warnings.

### AC-002: PowerPoint Happy Path

Given a `.pptx` file with slide titles, body text, a table, an image, and speaker notes, when the user converts it, then:

- The output Markdown has slide sections in order.
- Text and table content are present.
- The image is saved and referenced from the slide section.
- Speaker notes appear under the slide when the setting is enabled.
- Manifest entries identify slide number and asset relationship.

### AC-003: Word Happy Path

Given a `.docx` file with headings, paragraphs, a list, a table, hyperlinks, and an image, when the user converts it, then:

- The Markdown preserves reading order.
- Headings, paragraphs, list items, tables, and hyperlinks are represented in Markdown.
- The image is saved and referenced near its source location.
- Manifest entries identify extracted assets and warnings.

### AC-004: No External Runtime

Given a clean VS Code Desktop environment with no Python, Pandoc, LibreOffice, or Office installed, when the extension is installed, then supported conversions still work.

### AC-005: Failure Visibility

Given an unsupported or malformed input file, when conversion fails or partially succeeds, then the user sees a clear VS Code error or warning and the manifest/report records what happened.

## Unknowns

- Exact extension name and marketplace identity.
- Whether `.xlsm` should preserve macro files as assets or only ignore/report macro parts. The recommended MVP behavior is ignore macro execution, do not extract macros as usable assets, and record a warning.
- Whether default Excel formula output should show formulas inline or only in manifest.
- Whether hidden sheets should be included by default. Recommended default is exclude hidden sheets but record their existence in manifest.
- Whether generated Markdown should include a conversion report section by default. Recommended default is include a short report unless disabled.

## Assumptions

- MVP targets VS Code Desktop, not web-based VS Code.
- The converter will be implemented in TypeScript and bundled into the extension.
- The implementation may use pure JavaScript dependencies for ZIP and XML parsing, provided they are bundled into the extension package.
- The extension will not use external network calls.
- The extension will not execute Office macros or evaluate formulas.
- The extension will support modern OOXML files first because they are ZIP/XML based and practical to parse locally.
