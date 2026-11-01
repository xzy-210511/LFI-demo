import { useState } from 'react';
import { deleteDataset, verifyDatasetIntegrity } from '../api/datasetApi';
import type { DatasetDetail, IntegrityReport } from '../types/dataset';

interface DataIntegrityPanelProps {
  dataset: DatasetDetail;
  onDeleted: () => void;
}

const statusText: Record<IntegrityReport['status'], string> = {
  VERIFIED: 'Verified: the stored file is byte-for-byte identical to the upload.',
  MISMATCH: 'Mismatch: the stored file does not match the checksum recorded at upload.',
  BASELINE_RECORDED: 'Baseline recorded: this dataset was imported before checksums, so the stored file’s checksum was recorded now.'
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return 'Unknown';
  return `${(bytes / 1024 ** 3).toFixed(3)} GiB (${bytes.toLocaleString()} bytes)`;
}

export default function DataIntegrityPanel({ dataset, onDeleted }: DataIntegrityPanelProps) {
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const sha256 = report?.recordedSha256 ?? dataset.sha256;

  async function verify() {
    try {
      setVerifying(true);
      setError('');
      setReport(await verifyDatasetIntegrity(String(dataset.id)));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to verify this dataset.');
    } finally {
      setVerifying(false);
    }
  }

  async function remove() {
    const confirmed = window.confirm(
      `Delete "${dataset.name}"?\n\nThis permanently removes the dataset record, its metadata and the stored HDF5 file.`
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError('');
      await deleteDataset(String(dataset.id));
      onDeleted();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to delete this dataset.');
      setDeleting(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading-row">
        <div>
          <p className="section-kicker">Data management</p>
          <h2>Data Integrity</h2>
        </div>
      </div>

      {dataset.hdf5Available && (
        <dl className="info-grid">
          <div><dt>Stored file size</dt><dd>{formatBytes(dataset.fileSize)}</dd></div>
          <div className="wide"><dt>SHA-256</dt><dd className="checksum">{sha256 ?? 'Not recorded yet (imported before checksums)'}</dd></div>
        </dl>
      )}

      {report && (
        <p className={`notice ${report.status === 'MISMATCH' ? 'error' : 'success'}`}>
          {statusText[report.status]} Checked at {report.checkedAt.replace('T', ' ').slice(0, 19)}.
        </p>
      )}
      {error && <p className="notice error">{error}</p>}

      <div className="integrity-actions">
        {dataset.hdf5Available && (
          <button className="button secondary" type="button" onClick={verify} disabled={verifying || deleting}>
            {verifying ? 'Reading stored file...' : 'Verify integrity'}
          </button>
        )}
        <button className="button danger" type="button" onClick={remove} disabled={verifying || deleting}>
          {deleting ? 'Deleting...' : 'Delete dataset'}
        </button>
      </div>
    </section>
  );
}
