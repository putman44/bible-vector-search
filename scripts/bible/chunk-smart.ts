// scripts/bible/chunk-smart.ts
/**
 * Structure-aware Bible chunking: five complete verses per chunk with one
 * overlapping verse, constrained to a single chapter and carrying reference
 * metadata. Writes one JSON chunk per line to chunks-smart.jsonl.
 */

import * as fs from "fs";
import { loadVerses, Verse } from "./parse";

type Chunk = {
  id: number;
  text: string;
  metadata: {
    book: string;
    chapter: number;
    verseStart: number;
    verseEnd: number;
    reference: string; // e.g. "Genesis 1:1-5"
  };
};

const VERSES_PER_CHUNK = 5;
const OVERLAP_VERSES = 1;

function main() {
  const verses: Verse[] = loadVerses();
  const chunks: Chunk[] = [];

  const chapters = new Map<string, Verse[]>();
  for (const verse of verses) {
    const key = `${verse.book}:${verse.chapter}`;
    const chapter = chapters.get(key);
    if (chapter) {
      chapter.push(verse);
    } else {
      chapters.set(key, [verse]);
    }
  }

  const step = VERSES_PER_CHUNK - OVERLAP_VERSES;
  for (const chapter of chapters.values()) {
    let start = 0;
    while (start < chapter.length) {
      const end = start + VERSES_PER_CHUNK;
      const passage = chapter.slice(start, end);
      const firstVerse = passage[0];
      const lastVerse = passage[passage.length - 1];

      chunks.push({
        id: chunks.length,
        text: passage.map((verse) => verse.text).join(" "),
        metadata: {
          book: firstVerse.book,
          chapter: firstVerse.chapter,
          verseStart: firstVerse.verse,
          verseEnd: lastVerse.verse,
          reference: `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}-${lastVerse.verse}`,
        },
      });

      if (end >= chapter.length) {
        break;
      }
      start += step;
    }
  }

  fs.writeFileSync(
    "data/bible/chunks-smart.jsonl",
    chunks.map((chunk) => JSON.stringify(chunk)).join("\n") + "\n",
  );

  console.log(`Loaded ${verses.length.toLocaleString()} verses`);
  console.log(`Grouped them into ${chapters.size.toLocaleString()} chapters`);
  console.log(
    `Created ${chunks.length.toLocaleString()} chunks (${VERSES_PER_CHUNK} verses, ${OVERLAP_VERSES} overlapping)`,
  );
  console.log("Wrote data/bible/chunks-smart.jsonl");
}

main();
