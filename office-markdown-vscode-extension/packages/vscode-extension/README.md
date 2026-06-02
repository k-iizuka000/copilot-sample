# Office Markdown

Convert `.xlsx`, `.xlsm`, `.pptx`, `.docx`, and `.pdf` files into Markdown plus extracted assets.

## Usage

1. Right-click a supported Office or PDF file in the VS Code Explorer.
2. Run `Convert Office/PDF File to Markdown`.
3. Inspect the generated output directory, Markdown file(s), `assets/`, and `manifest.json`.

The command palette also provides `Office Markdown: Convert Active Office/PDF File to Markdown`.

## Output

For `sample.docx`, the default output is:

```text
sample/
  sample.md
  manifest.json
  assets/
    doc-image-001.png
    doc-object-001.bin
```

For `book.xlsx`, the default output is:

```text
book/
  book.md
  001-Summary.md
  002-Details.md
  manifest.json
  assets/
    sheet-001-image-001.png
```

The converter runs locally and does not require Python, Pandoc, LibreOffice, Office, OCR, or cloud services.

## Limitations

Legacy binary Office formats are not supported. Macros are never executed. Unsupported visuals such as complex charts or SmartArt are reported in the manifest instead of being silently dropped. PDF conversion extracts selectable text; scanned pages, PDF images, and vector graphics are not converted into Markdown images.
