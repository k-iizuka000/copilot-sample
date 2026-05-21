# Windows Office fixture samples

These files are sample inputs for manually testing the VS Code extension on Windows:

- `word-image-object-sample.docx`
- `excel-image-object-sample.xlsx`
- `powerpoint-image-object-sample.pptx`

Coverage:

- Word: headings, paragraphs, hyperlink, table, inline PNG image, and a synthetic embedded object relationship.
- Excel: visible data table, formulas with cached values, hidden sheet, PNG image, chart, drawing textbox, and a synthetic embedded object relationship.
- PowerPoint: two slides, text boxes, table, PNG image, editable shapes, native chart, speaker notes, and a synthetic embedded object relationship.

The embedded object payloads are small synthetic `.bin` parts intended to exercise extraction. They are not real editable Office OLE documents.

Regenerate the samples from the repo root with:

```bash
python3 office-markdown-vscode-extension/scripts/create-office-samples.py
```
