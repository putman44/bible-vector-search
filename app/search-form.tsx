"use client";

import { FormEvent, useState } from "react";

type SearchResult = {
  reference: string;
  text: string;
  score: number;
};

type SearchResponse = {
  results?: SearchResult[];
  error?: string;
};

const examples = [
  "charity suffereth long",
  "comfort in times of fear",
  "wisdom and understanding",
];

export default function SearchForm() {
  const [query, setQuery] = useState("");
  const [k, setK] = useState(5);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");

  async function search(searchQuery: string) {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery || loading) return;

    setLoading(true);
    setError("");
    setSearchedQuery(trimmedQuery);

    try {
      const response = await fetch("/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmedQuery, k }),
      });
      const data = (await response.json()) as SearchResponse;

      if (!response.ok) {
        throw new Error(data.error || "The search request failed.");
      }

      setResults(data.results ?? []);
    } catch (searchError) {
      setResults([]);
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Something went wrong while searching.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void search(query);
  }

  return (
    <section className="search-panel" aria-label="Bible passage search">
      <form onSubmit={handleSubmit}>
        <label htmlFor="query">What would you like to find?</label>
        <div className="search-row">
          <input
            id="query"
            name="query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try: love is patient"
            autoComplete="off"
            required
          />
          <div className="result-count">
            <label htmlFor="result-count">Results</label>
            <select
              id="result-count"
              value={k}
              onChange={(event) => setK(Number(event.target.value))}
            >
              {[3, 5, 10].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading || !query.trim()}>
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
      </form>

      <div className="examples" aria-label="Example searches">
        <span>Try an example:</span>
        {examples.map((example) => (
          <button
            type="button"
            key={example}
            onClick={() => {
              setQuery(example);
              void search(example);
            }}
            disabled={loading}
          >
            {example}
          </button>
        ))}
      </div>

      <div className="results" aria-live="polite" aria-busy={loading}>
        {error && <p className="error">{error}</p>}

        {!loading && !error && searchedQuery && (
          <div className="results-heading">
            <h2>Closest passages</h2>
            <p>
              {results.length} results for “{searchedQuery}”
            </p>
          </div>
        )}

        {results.map((result, index) => (
          <article className="result-card" key={`${result.reference}-${index}`}>
            <div className="result-meta">
              <h3>{result.reference}</h3>
              <span title="Cosine similarity score">
                {result.score.toFixed(3)}
              </span>
            </div>
            <p>{result.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
