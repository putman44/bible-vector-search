import SearchForm from "./search-form";

export default function Home() {
  return (
    <main className="page-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">KJV · semantic passage search</p>
        <h1 id="page-title">Search by meaning, not just words.</h1>
        <p className="intro">
          Describe an idea or enter a remembered phrase. The search compares
          your query with passage embeddings stored in Qdrant.
        </p>
      </section>

      <SearchForm />

      <footer>
        Five-verse passages · one-verse overlap · OpenAI embeddings · Qdrant
      </footer>
    </main>
  );
}
