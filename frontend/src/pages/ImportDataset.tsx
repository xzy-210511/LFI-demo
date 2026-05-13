import { useState } from 'react';
import { importDataset } from '../api/datasetApi';
import type { ImportResult } from '../types/dataset';

export default function ImportDataset() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  async function handleUpload() {
    if (!selectedFile) {
      setError('Please choose a .h5 or .hdf5 file before uploading.');
      setResult(null);
      return;
    }

    try {
      setUploading(true);
      const response = await importDataset(selectedFile);
      setResult(response);
      setError('');
    } catch (caughtError) {
      setResult(null);
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to upload dataset.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <h2>Import Dataset</h2>
        <p>This MVP only validates and uploads the file. Real HDF5 parsing will be implemented in a later stage.</p>
      </section>

      <section className="panel import-panel">
        <label>
          HDF5 file
          <input
            type="file"
            accept=".h5,.hdf5"
            onChange={(event) => {
              setSelectedFile(event.target.files?.[0] ?? null);
              setResult(null);
              setError('');
            }}
          />
        </label>
        <button className="button primary" type="button" onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Dataset'}
        </button>
      </section>

      {result && (
        <p className="notice success">
          {result.message} Mock dataset ID: {result.datasetId}. File: {result.fileName}.
        </p>
      )}
      {error && <p className="notice error">{error}</p>}
    </div>
  );
}
