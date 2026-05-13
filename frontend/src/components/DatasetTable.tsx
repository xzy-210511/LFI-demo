import { Link } from 'react-router-dom';
import type { DatasetSummary } from '../types/dataset';

interface DatasetTableProps {
  datasets: DatasetSummary[];
}

export default function DatasetTable({ datasets }: DatasetTableProps) {
  if (datasets.length === 0) {
    return <p className="empty-state">No datasets match the current filters.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Source File</th>
            <th>Experiment Date</th>
            <th>Target</th>
            <th>Status</th>
            <th>Imported At</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {datasets.map((dataset) => (
            <tr key={dataset.id}>
              <td>{dataset.id}</td>
              <td>{dataset.name}</td>
              <td>{dataset.sourceFile}</td>
              <td>{dataset.experimentDate}</td>
              <td>{dataset.target}</td>
              <td>
                <span className={`status-pill ${dataset.status.toLowerCase()}`}>
                  {dataset.status}
                </span>
              </td>
              <td>{formatDateTime(dataset.importedAt)}</td>
              <td>
                <Link className="button secondary" to={`/datasets/${dataset.id}`}>
                  View Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDateTime(value: string) {
  return value.replace('T', ' ');
}
