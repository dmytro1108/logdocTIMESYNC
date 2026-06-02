# ⚡️ Quick Command Cheatsheet

The most frequently used Tesseract CLI commands for daily OCR tasks.

---

### Basic Text Extraction

Extract text from an image to a plain `.txt` file.

`tesseract image.png output`

### Output as PDF

Generate a searchable PDF with invisible, selectable text.

`tesseract image.png output pdf`

### List Available Languages

Show all downloaded language models available on your system.

`tesseract --list-langs`

### Specify Language

Use the `-l` flag for a specific language (e.g., German).

`tesseract image.png output -l deu`

### Extract Bounding Boxes (hOCR)

Get exact coordinates of every recognized word in an HTML structure.

`tesseract image.png output hocr`

### Extract to TSV (Spreadsheet)

Export detailed word-by-word data and confidence scores.

`tesseract image.png output tsv`

### Multiple Languages

Combine languages with a `+` sign for mixed-language documents.

`tesseract image.png output -l eng+deu`

### Custom Layout Analysis

Assume a single uniform block of text using `--psm 6`.

`tesseract image.png output --psm 6`