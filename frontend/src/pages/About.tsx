export default function About() {
  return (
    <div className="page-stack">
      <section className="page-heading">
        <h2>About This Project</h2>
        <p>
          This dashboard is designed for Laser Feedback Interferometry experimental data
          management. It supports dataset browsing, metadata display, and signal/result
          visualisation for a web-based research workflow.
        </p>
      </section>

      <section className="panel prose-panel">
        <h2>MVP Scope</h2>
        <p>
          The first version uses mock backend data so the frontend, API structure, and
          dashboard workflow can be tested before integrating persistent storage or real
          mushroom HDF5 files.
        </p>
        <p>
          Later stages will add PostgreSQL storage, real HDF5 import, extracted metadata,
          signal persistence, and image output display for amplitude and phase results.
        </p>
      </section>
    </div>
  );
}
