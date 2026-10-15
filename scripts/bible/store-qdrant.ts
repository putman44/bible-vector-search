/**
 * Embed the structure-aware Bible chunks and store them in local Qdrant.
 *
 * Usage:
 *   npm run bible:store -- --setup-only # create/check the collection only
 *   npm run bible:store -- --limit 10  # inexpensive smoke test
 *   npm run bible:store               # ingest every chunk
 */

import 'dotenv/config';
import * as fs from 'fs';
import { QdrantClient } from '@qdrant/js-client-rest';
import { createEmbeddings } from '../../lib/openai';

type BibleChunk = {
	id: number;
	text: string;
	metadata: {
		book: string;
		chapter: number;
		verseStart: number;
		verseEnd: number;
		reference: string;
	};
};

const COLLECTION_NAME = 'bible-kjv';
const CHUNKS_PATH = 'data/bible/chunks-smart.jsonl';
const VECTOR_SIZE = 1536;
const BATCH_SIZE = 100;

const qdrant = new QdrantClient({ url: 'http://127.0.0.1:6333' });

function readChunks(): BibleChunk[] {
	if (!fs.existsSync(CHUNKS_PATH)) {
		throw new Error(
			`Missing ${CHUNKS_PATH}. Run npm run bible:smart before storing chunks.`,
		);
	}

	return fs
		.readFileSync(CHUNKS_PATH, 'utf-8')
		.split('\n')
		.filter(Boolean)
		.map((line) => JSON.parse(line) as BibleChunk);
}

function readLimit(): number | undefined {
	const index = process.argv.indexOf('--limit');
	if (index === -1) return undefined;

	const limit = Number.parseInt(process.argv[index + 1], 10);
	if (!Number.isInteger(limit) || limit <= 0) {
		throw new Error('--limit must be a positive integer.');
	}
	return limit;
}

async function ensureCollection(): Promise<void> {
	const { exists } = await qdrant.collectionExists(COLLECTION_NAME);
	if (exists) {
		console.log(`Using existing Qdrant collection "${COLLECTION_NAME}"`);
		return;
	}

	await qdrant.createCollection(COLLECTION_NAME, {
		vectors: {
			size: VECTOR_SIZE,
			distance: 'Cosine',
		},
	});
	console.log(`Created Qdrant collection "${COLLECTION_NAME}"`);
}

async function main() {
	await ensureCollection();
	if (process.argv.includes('--setup-only')) {
		console.log('Setup complete; no embeddings were created.');
		return;
	}

	const allChunks = readChunks();
	const limit = readLimit();
	const chunks = limit ? allChunks.slice(0, limit) : allChunks;
	const pages = Math.ceil(chunks.length / BATCH_SIZE);

	console.log(
		`Embedding and storing ${chunks.length.toLocaleString()} chunks in ${pages.toLocaleString()} batches...`,
	);

	for (let start = 0; start < chunks.length; start += BATCH_SIZE) {
		const batch = chunks.slice(start, start + BATCH_SIZE);
		const embeddings = await createEmbeddings(
			batch.map((chunk) => chunk.text),
		);

		await qdrant.upsert(COLLECTION_NAME, {
			wait: true,
			points: batch.map((chunk, index) => ({
				id: chunk.id,
				vector: embeddings[index],
				payload: {
					text: chunk.text,
					...chunk.metadata,
				},
			})),
		});

		const completed = Math.min(start + batch.length, chunks.length);
		console.log(
			`  batch ${Math.floor(start / BATCH_SIZE) + 1}/${pages} - ${completed.toLocaleString()}/${chunks.length.toLocaleString()} chunks`,
		);
	}

	const { count } = await qdrant.count(COLLECTION_NAME, { exact: true });
	console.log(
		`Done. Qdrant collection "${COLLECTION_NAME}" contains ${count.toLocaleString()} points.`,
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
