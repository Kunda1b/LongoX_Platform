export interface Chunk {
  content: string;
  tokens: number;
  index: number;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitByParagraphs(text: string, chunkSize: number, overlap: number): Chunk[] {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const chunks: Chunk[] = [];
  let current = "";
  let idx = 0;

  for (const para of paragraphs) {
    const candidate = current ? current + "\n\n" + para : para;
    if (estimateTokens(candidate) > chunkSize && current) {
      chunks.push({ content: current.trim(), tokens: estimateTokens(current), index: idx++ });
      current = para;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) {
    chunks.push({ content: current.trim(), tokens: estimateTokens(current), index: idx++ });
  }

  if (overlap > 0 && chunks.length > 1) {
    const overlapped: Chunk[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (i > 0 && overlap > 0) {
        const prevContent = chunks[i - 1].content;
        const words = prevContent.split(/\s+/);
        const overlapWords = words.slice(Math.max(0, words.length - Math.floor(overlap / 4)));
        chunk.content = [...overlapWords, chunk.content].join(" ");
      }
      overlapped.push({ ...chunk, tokens: estimateTokens(chunk.content) });
    }
    return overlapped;
  }

  return chunks;
}

function splitByFixed(text: string, chunkSize: number, overlap: number): Chunk[] {
  const chunks: Chunk[] = [];
  const avgCharsPerToken = 4;
  const charWindow = chunkSize * avgCharsPerToken;
  const overlapChars = overlap * avgCharsPerToken;
  let start = 0;
  let idx = 0;

  while (start < text.length) {
    const end = Math.min(start + charWindow + overlapChars, text.length);
    const content = text.slice(start, end);
    if (content.trim()) {
      chunks.push({ content: content.trim(), tokens: estimateTokens(content), index: idx++ });
    }
    start += charWindow;
  }

  return chunks;
}

function splitBySemantic(text: string, chunkSize: number, overlap: number): Chunk[] {
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (sentences.length === 0) {
    return [{ content: text.trim(), tokens: estimateTokens(text), index: 0 }];
  }

  const chunks: Chunk[] = [];
  let current: string[] = [];
  let currentTokens = 0;
  let idx = 0;

  for (const sentence of sentences) {
    const sentTokens = estimateTokens(sentence);
    if (currentTokens + sentTokens > chunkSize && current.length > 0) {
      const content = current.join(" ");
      if (content.trim()) {
        chunks.push({ content: content.trim(), tokens: estimateTokens(content), index: idx++ });
      }
      if (overlap > 0 && current.length > 0) {
        const overlapSents = [];
        let overlapTokens = 0;
        for (let i = current.length - 1; i >= 0; i--) {
          const st = current[i];
          const stTok = estimateTokens(st);
          if (overlapTokens + stTok > overlap) break;
          overlapSents.unshift(st);
          overlapTokens += stTok;
        }
        current = overlapSents;
        currentTokens = overlapTokens;
      } else {
        current = [];
        currentTokens = 0;
      }
    }
    current.push(sentence);
    currentTokens += sentTokens;
  }

  if (current.length > 0) {
    const content = current.join(" ");
    if (content.trim()) {
      chunks.push({ content: content.trim(), tokens: estimateTokens(content), index: idx++ });
    }
  }

  return chunks;
}

export class ChunkingService {
  async chunkDocument(
    content: string,
    strategy: string = "recursive",
    chunkSize: number = 512,
    chunkOverlap: number = 64,
  ): Promise<Chunk[]> {
    if (!content || content.trim().length === 0) {
      return [];
    }

    switch (strategy) {
      case "fixed":
        return splitByFixed(content, chunkSize, chunkOverlap);
      case "semantic":
        return splitBySemantic(content, chunkSize, chunkOverlap);
      case "recursive":
      default:
        return splitByParagraphs(content, chunkSize, chunkOverlap);
    }
  }
}

export const chunkingService = new ChunkingService();
