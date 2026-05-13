const resultCards = ['Amplitude Image', 'Phase Image', 'Reconstructed Image'];

export default function ResultPanel() {
  return (
    <section className="panel">
      <h2>Result Outputs</h2>
      <div className="result-grid">
        {resultCards.map((title) => (
          <article className="result-card" key={title}>
            <h3>{title}</h3>
            <p>Coming soon</p>
          </article>
        ))}
      </div>
    </section>
  );
}
