import { useState } from 'react';
import { Link } from 'react-router-dom';
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
        <p>Upload a mushroom HDF5 result file to extract frame metadata and generate amplitude, phase, and combined THz visualisations.</p>
      </section>

      <section className="panel import-panel">
        <label className="file-picker">
          <span>HDF5 file</span>
          <input
            className="file-input"
            type="file"
            accept=".h5,.hdf5"
            onChange={(event) => {
              setSelectedFile(event.target.files?.[0] ?? null);
              setResult(null);
              setError('');
            }}
          />
          <span className="file-control" aria-hidden="true">
            <span className="file-button">Choose File</span>
            <span className="file-name">{selectedFile?.name ?? 'No file selected'}</span>
          </span>
        </label>
        <button className="button primary" type="button" onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Dataset'}
        </button>
      </section>

      {result && (
        <p className="notice success">
          {result.message} Dataset ID: {result.datasetId}. File: {result.fileName}.{' '}
          <Link to={`/datasets/${result.datasetId}`}>View dataset</Link>
        </p>
      )}
      {error && <p className="notice error">{error}</p>}
    </div>
  );
}
