# Bible Vector Search

A proof of concept that downloads the public-domain King James Bible, splits it
into passage-sized chunks, stores OpenAI embeddings in a locally hosted Qdrant
vector database, and exposes a semantic-search endpoint.

## Chunking strategy

Each chunk contains up to five complete verses from one chapter. Consecutive
chunks overlap by one verse, so a boundary such as verses `1-5` is followed by
`5-9`. This preserves readable context without splitting verses or combining
different chapters. Each chunk includes its book, chapter, starting verse,
ending verse, and a human-readable reference.

Sentence overlap applies the same idea at sentence boundaries: repeat the last
sentence or sentences of one chunk at the start of the next. This project uses
verse overlap because verses are the corpus's natural structural unit.

## Prerequisites

- Node.js
- Docker
- An OpenAI API key

## Setup

Install dependencies:

```bash
npm install
```

Create your local environment file and add your OpenAI API key:

```bash
cp .env.example .env
```

Download the KJV text and create the chunks:

```bash
npm run bible:fetch
npm run bible:smart
npm run bible:audit -- data/bible/chunks-smart.jsonl
```

Start Qdrant locally:

```bash
docker run -d --name bible-qdrant -p 127.0.0.1:6333:6333 -p 127.0.0.1:6334:6334 -v bible_qdrant_storage:/qdrant/storage qdrant/qdrant
```

Embed and store every chunk:

```bash
npm run bible:store
```

Start the API:

```bash
npm run dev
```

## Search

`POST /search` accepts a non-empty query and an optional `k` from 1 to 20.

```bash
curl -X POST http://localhost:3000/search -H 'Content-Type: application/json' -d '{"query":"charity suffereth long","k":5}'
```

Each result contains the passage's `reference`, `text`, and similarity `score`.

## Implementation notes

- Both passages and queries use OpenAI `text-embedding-3-small` embeddings with
  1,536 dimensions.
- Qdrant uses cosine distance in the `bible-kjv` collection.
- Generated Bible files, local Qdrant storage, dependencies, and environment
  files are excluded from Git.
