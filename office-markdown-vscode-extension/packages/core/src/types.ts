export type SupportedFormat = "xlsx" | "xlsm" | "pptx" | "docx";

export type ConversionStatus = "success" | "partial" | "failed";

export type OverwritePolicy = "confirm" | "overwrite" | "createUnique";

export type ExcelFormulaMode = "valuesOnly" | "valuesWithManifest" | "inlineFormulaTable";

export interface SourceRef {
  container: "workbook" | "sheet" | "slide" | "document" | "package";
  name?: string;
  index?: number;
  part?: string;
  anchor?: string;
  relationshipId?: string;
}

export interface ConversionWarning {
  code: string;
  message: string;
  source?: SourceRef;
}

export interface ConversionErrorInfo {
  code: string;
  message: string;
  source?: SourceRef;
}

export interface ExcelOptions {
  includeHiddenSheets: boolean;
  formulaMode: ExcelFormulaMode;
  maxTableRows: number;
}

export interface PowerPointOptions {
  includeSpeakerNotes: boolean;
}

export interface SafetyOptions {
  maxPackageUncompressedBytes: number;
  maxExtractedAssetBytes: number;
  maxEntryCount: number;
}

export interface ConvertFileOptions {
  inputPath: string;
  outputMarkdownPath?: string;
  outputAssetDir?: string;
  overwritePolicy?: OverwritePolicy;
  includeConversionReport?: boolean;
  excel?: Partial<ExcelOptions>;
  pptx?: Partial<PowerPointOptions>;
  safety?: Partial<SafetyOptions>;
}

export interface ResolvedConvertFileOptions {
  inputPath: string;
  outputMarkdownPath: string;
  outputAssetDir: string;
  overwritePolicy: OverwritePolicy;
  includeConversionReport: boolean;
  excel: ExcelOptions;
  pptx: PowerPointOptions;
  safety: SafetyOptions;
}

export interface ConversionResult {
  inputPath: string;
  markdownPath: string;
  assetDir: string;
  manifestPath: string;
  format: SupportedFormat;
  status: ConversionStatus;
  warnings: ConversionWarning[];
  errors: ConversionErrorInfo[];
}

export interface ManifestSource {
  fileName: string;
  format: SupportedFormat;
  sizeBytes: number;
}

export interface ManifestOutput {
  markdownFile: string;
  assetDir: string;
}

export interface ManifestItem {
  id: string;
  kind:
    | "image"
    | "embeddedObject"
    | "textBox"
    | "formula"
    | "hiddenSheet"
    | "hyperlink"
    | "chart"
    | "unsupported";
  source: SourceRef;
  output?: {
    path?: string;
    markdownRef?: string;
  };
  contentType?: string;
  status: "extracted" | "recorded" | "skipped" | "warning" | "error";
  message?: string;
}

export interface ConversionManifest {
  schemaVersion: 1;
  tool: {
    name: "office-markdown";
    version: string;
  };
  source: ManifestSource;
  output: ManifestOutput;
  items: ManifestItem[];
  warnings: ConversionWarning[];
  errors: ConversionErrorInfo[];
}

export type MarkdownBlock =
  | { kind: "heading"; depth: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "table"; rows: string[][]; caption?: string; truncated?: boolean }
  | { kind: "image"; alt: string; relativePath: string; sourceRef: SourceRef }
  | { kind: "assetLink"; label: string; relativePath: string; sourceRef: SourceRef }
  | { kind: "quote"; text: string; sourceRef?: SourceRef }
  | { kind: "code"; language: string; text: string }
  | { kind: "warning"; code: string; message: string; sourceRef?: SourceRef };

export interface Relationship {
  id: string;
  type: string;
  target: string;
  targetMode: "External" | "Internal";
  resolvedTarget?: string;
}

export interface PackageEntry {
  name: string;
  uncompressedSize: number;
}

export interface OoxmlPackage {
  listEntries(): PackageEntry[];
  hasPart(partName: string): boolean;
  readXml(partName: string): Promise<unknown>;
  readXmlOrdered(partName: string): Promise<OrderedXmlNode[]>;
  readText(partName: string): Promise<string>;
  readBinary(partName: string): Promise<Uint8Array>;
  getRelationships(partName: string): Promise<Relationship[]>;
  getContentType(partName: string): string | undefined;
}

export type OrderedXmlNode = Record<string, unknown>;

export interface ConversionContext {
  format: SupportedFormat;
  sourceFileName: string;
  options: ResolvedConvertFileOptions;
  pkg: OoxmlPackage;
  manifest: ConversionManifest;
  markdownBlocks: MarkdownBlock[];
  warnings: ConversionWarning[];
  errors: ConversionErrorInfo[];
}
