import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import DatasetList from './DatasetList';
import * as datasetApi from '../api/datasetApi';
import type { DatasetSummary } from '../types/dataset';

const datasets: DatasetSummary[] = [
  { id: 1, name: 'Mushroom LFI Sample 01', sourceFile: 'mushroom_sample_01.h5', experimentDate: '2026-04-20', target: 'Mushroom', status: 'IMPORTED', importedAt: '2026-05-12T10:30:00' },
  { id: 2, name: 'Mushroom LFI Sample 02', sourceFile: 'mushroom_sample_02.h5', experimentDate: '2026-04-22', target: 'Mushroom', status: 'PROCESSED', importedAt: '2026-05-12T11:00:00' },
  { id: 5, name: 'mm3a', sourceFile: 'mm3a.hdf5', experimentDate: '2026-10-22', target: 'Mushroom', status: 'IMPORTED', importedAt: '2026-10-22T11:53:09' }
];

function renderList(path = '/datasets') {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <DatasetList />
    </MemoryRouter>
  );
}

function rowNames() {
  const rows = screen.getAllByRole('row').slice(1);
  return rows.map((row) => within(row).getAllByRole('cell')[1].textContent);
}

describe('DatasetList', () => {
  it('searches by dataset name or source file', async () => {
    vi.spyOn(datasetApi, 'getDatasets').mockResolvedValue(datasets);
    renderList();

    await screen.findByText('mm3a');
    await userEvent.type(screen.getByRole('searchbox'), 'hdf5');

    expect(rowNames()).toEqual(['mm3a']);
  });

  it('filters by status, including a status passed in the URL', async () => {
    vi.spyOn(datasetApi, 'getDatasets').mockResolvedValue(datasets);
    renderList('/datasets?status=PROCESSED');

    await screen.findByText('Mushroom LFI Sample 02');

    expect(rowNames()).toEqual(['Mushroom LFI Sample 02']);
  });

  it('shows the backend error instead of an empty table', async () => {
    vi.spyOn(datasetApi, 'getDatasets').mockRejectedValue(new Error('Request failed with status 503'));
    renderList();

    expect(await screen.findByText(/Unable to load datasets: Request failed with status 503/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
