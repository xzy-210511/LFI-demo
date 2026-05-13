import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import StatusCard from '../components/StatusCard';
import { getDatasets, getHealth } from '../api/datasetApi';
import type { DatasetSummary, HealthStatus } from '../types/dataset';

export default function DashboardHome() {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [healthResponse, datasetResponse] = await Promise.all([getHealth(), getDatasets()]);
        setHealth(healthResponse);
        setDatasets(datasetResponse);
        setError('');
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const importedCount = datasets.filter((dataset) => dataset.status === 'IMPORTED').length;
  const processedCount = datasets.filter((dataset) => dataset.status === 'PROCESSED').length;
  const latestDatasets = [...datasets].sort((a, b) => b.importedAt.localeCompare(a.importedAt)).slice(0, 3);

  return (
    <div className="page-stack">
      <section className="dashboard-hero">
        <div className="hero-copy">
          <p className="section-kicker">Research data workspace</p>
          <h2>Manage LFI experiment files, outputs, and review-ready results.</h2>
          <p>
            A prototype dashboard for browsing Laser Feedback Interferometry datasets,
            checking metadata, and previewing signal or image outputs.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/datasets">Browse datasets</Link>
            <Link className="button secondary" to="/import">Import HDF5 file</Link>
          </div>
        </div>
        <div className="scan-preview" aria-label="Mock scan preview">
          <div className="scan-header">
            <span>Amplitude preview</span>
            <strong>Mushroom LFI</strong>
          </div>
          <div className="scan-grid" aria-hidden="true">
            {Array.from({ length: 48 }).map((_, index) => (
              <span key={index} style={{ '--level': `${28 + ((index * 17) % 65)}%` } as CSSProperties} />
            ))}
          </div>
        </div>
      </section>

      {loading && <p className="notice">Loading dashboard data...</p>}
      {error && <p className="notice error">Backend request failed: {error}</p>}

      <div className="status-grid">
        <StatusCard label="Total Datasets" value={datasets.length} helper="Open the full dataset catalogue" to="/datasets" accent="blue" />
        <StatusCard label="Imported Files" value={importedCount} helper="Show imported datasets only" to="/datasets?status=IMPORTED" accent="green" />
        <StatusCard label="Processed Datasets" value={processedCount} helper="Show processed datasets only" to="/datasets?status=PROCESSED" accent="amber" />
        <StatusCard label="Backend Status" value={health?.status ?? 'Unavailable'} helper={health?.service ?? 'Start the backend on port 8080'} to="/about" accent="slate" />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading-row">
            <div>
              <p className="section-kicker">Recent activity</p>
              <h2>Latest Datasets</h2>
            </div>
            <Link className="text-link" to="/datasets">View all</Link>
          </div>
          <div className="compact-list">
            {latestDatasets.map((dataset) => (
              <Link className="dataset-list-item" key={dataset.id} to={`/datasets/${dataset.id}`}>
                <span>
                  <strong>{dataset.name}</strong>
                  <small>{dataset.sourceFile}</small>
                </span>
                <span className={`status-pill ${dataset.status.toLowerCase()}`}>{dataset.status}</span>
              </Link>
            ))}
            {!loading && latestDatasets.length === 0 && <p className="empty-state inline">No datasets available yet.</p>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading-row">
            <div>
              <p className="section-kicker">MVP workflow</p>
              <h2>Data Flow</h2>
            </div>
          </div>
          <ol className="workflow-list">
            <li><span>1</span>Import `.h5` or `.hdf5` files</li>
            <li><span>2</span>Browse dataset summaries</li>
            <li><span>3</span>Inspect metadata and signals</li>
            <li><span>4</span>Preview amplitude and phase outputs later</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
