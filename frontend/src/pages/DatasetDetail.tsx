import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MetadataPanel from '../components/MetadataPanel';
import ResultPanel from '../components/ResultPanel';
import SignalChart from '../components/SignalChart';
import { getDatasetDetail, getDatasetMetadata, getDatasetSignals } from '../api/datasetApi';
import type { DatasetDetail as DatasetDetailType, MetadataItem, SignalPoint } from '../types/dataset';

export default function DatasetDetail() {
  const { id } = useParams();
  const [dataset, setDataset] = useState<DatasetDetailType | null>(null);
  const [metadata, setMetadata] = useState<MetadataItem[]>([]);
  const [signals, setSignals] = useState<SignalPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDatasetDetail(datasetId: string) {
      try {
        setLoading(true);
        const [detailResponse, metadataResponse, signalResponse] = await Promise.all([
          getDatasetDetail(datasetId),
          getDatasetMetadata(datasetId),
          getDatasetSignals(datasetId)
        ]);
        setDataset(detailResponse);
        setMetadata(metadataResponse);
        setSignals(signalResponse);
        setError('');
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load dataset detail.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadDatasetDetail(id);
    }
  }, [id]);

  if (loading) {
    return <p className="notice">Loading dataset detail...</p>;
  }

  if (error) {
    return (
      <div className="page-stack">
        <p className="notice error">Unable to load dataset detail: {error}</p>
        <Link className="button secondary" to="/datasets">Back to datasets</Link>
      </div>
    );
  }

  if (!dataset) {
    return <p className="notice error">Dataset not found.</p>;
  }

  return (
    <div className="page-stack">
      <section className="page-heading with-action">
        <div>
          <h2>{dataset.name}</h2>
          <p>{dataset.description}</p>
        </div>
        <Link className="button secondary" to="/datasets">Back to datasets</Link>
      </section>

      <section className="panel">
        <h2>Basic Information</h2>
        <dl className="info-grid">
          <div>
            <dt>Dataset ID</dt>
            <dd>{dataset.id}</dd>
          </div>
          <div>
            <dt>Source file</dt>
            <dd>{dataset.sourceFile}</dd>
          </div>
          <div>
            <dt>Experiment date</dt>
            <dd>{dataset.experimentDate}</dd>
          </div>
          <div>
            <dt>Target</dt>
            <dd>{dataset.target}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd><span className={`status-pill ${dataset.status.toLowerCase()}`}>{dataset.status}</span></dd>
          </div>
          <div>
            <dt>Imported at</dt>
            <dd>{dataset.importedAt.replace('T', ' ')}</dd>
          </div>
        </dl>
      </section>

      <MetadataPanel metadata={metadata} />
      <SignalChart data={signals} />
      <ResultPanel />
    </div>
  );
}
