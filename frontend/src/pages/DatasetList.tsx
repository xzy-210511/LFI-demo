import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DatasetTable from '../components/DatasetTable';
import { getDatasets } from '../api/datasetApi';
import type { DatasetStatus, DatasetSummary } from '../types/dataset';

type StatusFilter = 'ALL' | DatasetStatus;

export default function DatasetList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const statusFromUrl = readStatusFilter(searchParams.get('status'));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(statusFromUrl);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setStatusFilter(readStatusFilter(searchParams.get('status')));
  }, [searchParams]);

  useEffect(() => {
    async function loadDatasets() {
      try {
        setLoading(true);
        const response = await getDatasets();
        setDatasets(response);
        setError('');
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load datasets.');
      } finally {
        setLoading(false);
      }
    }

    loadDatasets();
  }, []);

  const filteredDatasets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return datasets.filter((dataset) => {
      const matchesSearch =
        dataset.name.toLowerCase().includes(normalizedSearch) ||
        dataset.sourceFile.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'ALL' || dataset.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [datasets, searchTerm, statusFilter]);

  return (
    <div className="page-stack">
      <section className="page-heading">
        <h2>Dataset List</h2>
        <p>Browse mock LFI experiment datasets and open detailed metadata and signal views.</p>
      </section>

      <section className="toolbar">
        <label>
          Search
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Dataset name or source file"
          />
        </label>
        <label>
          Status
          <select
            value={statusFilter}
            onChange={(event) => {
              const nextStatus = event.target.value as StatusFilter;
              setStatusFilter(nextStatus);
              setSearchParams(nextStatus === 'ALL' ? {} : { status: nextStatus });
            }}
          >
            <option value="ALL">All</option>
            <option value="IMPORTED">Imported</option>
            <option value="PROCESSED">Processed</option>
            <option value="ERROR">Error</option>
          </select>
        </label>
      </section>

      {loading && <p className="notice">Loading datasets...</p>}
      {error && <p className="notice error">Unable to load datasets: {error}</p>}
      {!loading && !error && <DatasetTable datasets={filteredDatasets} />}
    </div>
  );
}

function readStatusFilter(value: string | null): StatusFilter {
  if (value === 'IMPORTED' || value === 'PROCESSED' || value === 'ERROR') {
    return value;
  }

  return 'ALL';
}
