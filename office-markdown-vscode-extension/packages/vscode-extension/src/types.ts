export const COMMANDS = {
  convertResource: "officeMarkdown.convertResource",
  convertCurrentFile: "officeMarkdown.convertCurrentFile",
  openLastManifest: "officeMarkdown.openLastManifest"
} as const;

export type SupportedFormat = "xlsx" | "xlsm" | "pptx" | "docx" | "pdf";

export type OutputLocation = "nextToSource" | "convertedFolder" | "askEachTime";

export type OverwritePolicy = "confirm" | "overwrite" | "createUnique";

export type ExcelFormulaMode = "valuesOnly" | "valuesWithManifest" | "inlineFormulaTable";

export interface OfficeMarkdownSettings {
  outputLocation: OutputLocation;
  overwritePolicy: OverwritePolicy;
  includeExcelHiddenSheets: boolean;
  excelFormulaMode: ExcelFormulaMode;
  includePowerPointNotes: boolean;
  includeConversionReport: boolean;
  maxTableRows: number;
  maxPdfPages: number;
  maxPdfTextItemsPerPage: number;
  maxPdfMarkdownChars: number;
  maxExtractedAssetBytes: number;
  maxPackageUncompressedBytes: number;
  maxEntryCount: number;
}

export interface ConvertFileOptions {
  inputPath: string;
  outputDir?: string;
  outputMarkdownPath?: string;
  outputAssetDir?: string;
  overwritePolicy: OverwritePolicy;
  includeConversionReport: boolean;
  excel: {
    includeHiddenSheets: boolean;
    formulaMode: ExcelFormulaMode;
    maxTableRows: number;
  };
  pptx: {
    includeSpeakerNotes: boolean;
  };
  pdf: {
    maxPages: number;
    maxTextItemsPerPage: number;
    maxMarkdownChars: number;
  };
  safety: {
    maxPackageUncompressedBytes: number;
    maxExtractedAssetBytes: number;
    maxEntryCount: number;
  };
}

export interface ConversionWarning {
  code: string;
  message: string;
}

export interface ConversionErrorInfo {
  code: string;
  message: string;
}

export interface ConversionResult {
  inputPath: string;
  outputDir: string;
  markdownPath: string;
  markdownPaths: string[];
  assetDir: string;
  manifestPath: string;
  format: SupportedFormat;
  status: "success" | "partial" | "failed";
  warnings: ConversionWarning[];
  errors: ConversionErrorInfo[];
}

export interface OfficeMarkdownConverter {
  convertFile(options: ConvertFileOptions): Promise<ConversionResult>;
}

export interface ResourceUri {
  fsPath: string;
  scheme?: string;
}

export interface DisposableLike {
  dispose(): void;
}
