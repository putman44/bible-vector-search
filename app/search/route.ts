import { QdrantClient } from '@qdrant/js-client-rest';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createEmbedding } from '@/lib/openai';

const COLLECTION_NAME = 'bible-kjv';
const qdrant = new QdrantClient({ url: 'http://127.0.0.1:6333' });

const SearchRequestSchema = z.object({
	query: z.string().trim().min(1),
	k: z.number().int().min(1).max(20).default(5),
});

export async function POST(request: Request) {
	try {
		const { query, k } = SearchRequestSchema.parse(await request.json());
		const queryVector = await createEmbedding(query);
		const response = await qdrant.query(COLLECTION_NAME, {
			query: queryVector,
			limit: k,
			with_payload: true,
			with_vector: false,
		});

		const results = response.points.map((point) => ({
			reference: String(point.payload?.reference ?? ''),
			text: String(point.payload?.text ?? ''),
			score: point.score,
		}));

		return NextResponse.json({ results });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}

		console.error('Bible search error:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Internal server error' },
			{ status: 500 },
		);
	}
}
