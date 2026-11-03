import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type RagChunk = {
  id: string;
  source: string;
  title: string;
  text: string;
};

const RAG_DIR = path.join(process.cwd(), "content", "rag");
const TOP_K = 3;
const MAX_CHUNK_CHARS = 900;

let cachedChunks: RagChunk[] | null = null;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function splitMarkdown(source: string, raw: string): RagChunk[] {
  const sections = raw.split(/\n(?=##\s+)/);
  const chunks: RagChunk[] = [];

  sections.forEach((section, index) => {
    const trimmed = section.trim();
    if (!trimmed) {
      return;
    }

    const titleMatch = trimmed.match(/^#+\s+(.+)$/m);
    const title = titleMatch?.[1]?.trim() || path.basename(source, ".md");

    if (trimmed.length <= MAX_CHUNK_CHARS) {
      chunks.push({
        id: `${source}:${index}`,
        source,
        title,
        text: trimmed,
      });
      return;
    }

    const paragraphs = trimmed.split(/\n{2,}/);
    let buffer = "";
    let part = 0;

    for (const paragraph of paragraphs) {
      const next = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
      if (next.length > MAX_CHUNK_CHARS && buffer) {
        chunks.push({
          id: `${source}:${index}.${part}`,
          source,
          title,
          text: buffer.trim(),
        });
        part += 1;
        buffer = paragraph;
      } else {
        buffer = next;
      }
    }

    if (buffer.trim()) {
      chunks.push({
        id: `${source}:${index}.${part}`,
        source,
        title,
        text: buffer.trim(),
      });
    }
  });

  return chunks;
}

async function loadChunks(): Promise<RagChunk[]> {
  if (cachedChunks) {
    return cachedChunks;
  }

  try {
    const entries = await readdir(RAG_DIR);
    const markdownFiles = entries.filter((name) => name.endsWith(".md")).sort();
    const chunks: RagChunk[] = [];

    for (const file of markdownFiles) {
      const raw = await readFile(path.join(RAG_DIR, file), "utf8");
      chunks.push(...splitMarkdown(file, raw));
    }

    cachedChunks = chunks;
    return chunks;
  } catch (error) {
    console.error("Failed to load RAG files", error);
    cachedChunks = [];
    return [];
  }
}

function scoreChunk(queryTokens: string[], chunk: RagChunk): number {
  if (queryTokens.length === 0) {
    return 0;
  }

  const haystack = tokenize(`${chunk.title} ${chunk.text}`);
  if (haystack.length === 0) {
    return 0;
  }

  const counts = new Map<string, number>();
  for (const token of haystack) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  let score = 0;
  for (const token of queryTokens) {
    const hits = counts.get(token) ?? 0;
    if (hits > 0) {
      score += 1 + Math.min(hits, 3) * 0.15;
      if (tokenize(chunk.title).includes(token)) {
        score += 0.5;
      }
    }
  }

  return score;
}

/** Retrieve top overlapping knowledge snippets for a user query. */
export async function getRagContext(query: string): Promise<string> {
  const chunks = await loadChunks();
  if (chunks.length === 0) {
    return "";
  }

  const queryTokens = tokenize(query);
  const ranked = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(queryTokens, chunk) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  if (ranked.length === 0) {
    // Soft fallback: first chunks from each file so the model still has store basics.
    return chunks
      .slice(0, TOP_K)
      .map(
        (chunk, index) =>
          `[${index + 1}] (${chunk.source} — ${chunk.title})\n${chunk.text}`,
      )
      .join("\n\n");
  }

  return ranked
    .map(
      ({ chunk }, index) =>
        `[${index + 1}] (${chunk.source} — ${chunk.title})\n${chunk.text}`,
    )
    .join("\n\n");
}

/** Test helper / future admin swap — clears the in-memory chunk cache. */
export function clearRagCache() {
  cachedChunks = null;
}
