# Office Markdown

Convert `.xlsx`, `.xlsm`, `.pptx`, and `.docx` files into Markdown plus extracted assets.

## Usage

1. Right-click a supported Office file in the VS Code Explorer.
2. Run `Convert Office File to Markdown`.
3. Inspect the generated `.md` file and sibling `.assets/manifest.json`.

The command palette also provides `Office Markdown: Convert Active Office File to Markdown`.

## Output

For `sample.docx`, the default output is:

```text
sample.md
sample.assets/
  manifest.json
  doc-image-001.png
  doc-object-001.bin
```

The converter runs locally and does not require Python, Pandoc, LibreOffice, Office, OCR, or cloud services.

## Limitations

Legacy binary Office formats are not supported. Macros are never executed. Unsupported visuals such as complex charts or SmartArt are reported in the manifest instead of being silently dropped.
