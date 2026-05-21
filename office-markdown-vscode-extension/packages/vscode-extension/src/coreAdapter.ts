import { convertFile as convertOfficeFile } from "@office-markdown/core";
import type { ConvertFileOptions, ConversionResult, OfficeMarkdownConverter } from "./types.js";

export function createCoreConverter(): OfficeMarkdownConverter {
  return {
    async convertFile(options: ConvertFileOptions): Promise<ConversionResult> {
      return convertOfficeFile(options);
    }
  };
}
