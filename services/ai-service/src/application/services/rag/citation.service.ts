import type { SearchResult } from "./vector-search.service";

export interface Source {
  text: string;
  documentFilename: string;
  sourceType: string;
  score: number;
  chunkIndex: number;
}

export const FORMAT_INLINE = "inline";
export const FORMAT_FOOTNOTE = "footnote";
export const FORMAT_NUMBERED = "numbered";

export class CitationService {
  formatCitations(results: SearchResult[], format: string = FORMAT_NUMBERED): string {
    if (results.length === 0) return "";

    switch (format) {
      case FORMAT_INLINE:
        return this.formatInline(results);
      case FORMAT_FOOTNOTE:
        return this.formatFootnote(results);
      case FORMAT_NUMBERED:
      default:
        return this.formatNumbered(results);
    }
  }

  extractSources(answer: string, results: SearchResult[]): Source[] {
    const sources: Source[] = [];

    for (const result of results) {
      if (answer.includes(result.content.substring(0, 50))) {
        sources.push({
          text: result.content,
          documentFilename: result.documentFilename,
          sourceType: result.documentSourceType,
          score: result.score,
          chunkIndex: result.chunkIndex,
        });
      }
    }

    return sources;
  }

  private formatInline(results: SearchResult[]): string {
    return results
      .map((r, i) => `[${i + 1}] ${r.documentFilename} (score: ${r.score.toFixed(3)})`)
      .join("; ");
  }

  private formatFootnote(results: SearchResult[]): string {
    return results
      .map((r, i) => `^${i + 1}: ${r.documentFilename} — "${r.content.substring(0, 100)}..."`)
      .join("\n");
  }

  private formatNumbered(results: SearchResult[]): string {
    return results
      .map((r, i) => `${i + 1}. ${r.documentFilename} (relevance: ${(r.score * 100).toFixed(1)}%)`)
      .join("\n");
  }
}

export const citationService = new CitationService();
