import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DataIntegrityPanel from './DataIntegrityPanel';
import * as datasetApi from '../api/datasetApi';
import type { DatasetDetail, IntegrityReport } from '../types/dataset';

const SHA = '2d04ec55c5cf3b5381e07e39e701de64c775b9b3f30b204ed8c566d0f5fd34ac';

const mm3a: DatasetDetail = {
  id: 5,
  name: 'mm3a',
  sourceFile: 'mm3a.hdf5',
  experimentDate: '2026-10-22',
  target: 'Mushroom',
  status: 'IMPORTED',
  importedAt: '2026-10-22T11:53:09',
  description: 'Imported HDF5 dataset',
  availableOutputs: [],
  hdf5Available: true,
  amplitudeFrameCount: 899,
  phaseFrameCount: 899,
  frameHeight: 1300,
  frameWidth: 400,
  fileSize: 2368577814,
  sha256: SHA
};

function report(status: IntegrityReport['status']): IntegrityReport {
  return {
    datasetId: 5,
    status,
    recordedSha256: SHA,
    storedSha256: status === 'MISMATCH' ? '0'.repeat(64) : SHA,
    fileSizeBytes: 2368577814,
    checkedAt: '2026-11-01T10:00:00.000'
  };
}

describe('DataIntegrityPanel', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('shows the stored file size and recorded SHA-256', () => {
    render(<DataIntegrityPanel dataset={mm3a} onDeleted={vi.fn()} />);

    expect(screen.getByText(SHA)).toBeInTheDocument();
    expect(screen.getByText(/2\.206 GiB/)).toBeInTheDocument();
  });

  it('reports a verified stored file', async () => {
    const verify = vi.spyOn(datasetApi, 'verifyDatasetIntegrity').mockResolvedValue(report('VERIFIED'));
    render(<DataIntegrityPanel dataset={mm3a} onDeleted={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Verify integrity' }));

    expect(verify).toHaveBeenCalledWith('5');
    expect(await screen.findByText(/Verified: the stored file is byte-for-byte identical/)).toHaveClass('success');
  });

  it('reports a checksum mismatch as an error', async () => {
    vi.spyOn(datasetApi, 'verifyDatasetIntegrity').mockResolvedValue(report('MISMATCH'));
    render(<DataIntegrityPanel dataset={mm3a} onDeleted={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Verify integrity' }));

    expect(await screen.findByText(/Mismatch: the stored file does not match/)).toHaveClass('error');
  });

  it('does not delete when the confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const remove = vi.spyOn(datasetApi, 'deleteDataset').mockResolvedValue(undefined);
    const onDeleted = vi.fn();
    render(<DataIntegrityPanel dataset={mm3a} onDeleted={onDeleted} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete dataset' }));

    expect(remove).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('deletes after confirmation and notifies the page', async () => {
    const remove = vi.spyOn(datasetApi, 'deleteDataset').mockResolvedValue(undefined);
    const onDeleted = vi.fn();
    render(<DataIntegrityPanel dataset={mm3a} onDeleted={onDeleted} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete dataset' }));

    expect(remove).toHaveBeenCalledWith('5');
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it('shows the error and keeps the page when deletion fails', async () => {
    vi.spyOn(datasetApi, 'deleteDataset').mockRejectedValue(new Error('Dataset not found: 5'));
    const onDeleted = vi.fn();
    render(<DataIntegrityPanel dataset={mm3a} onDeleted={onDeleted} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete dataset' }));

    expect(await screen.findByText('Dataset not found: 5')).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('offers only deletion for records without a stored HDF5 file', () => {
    const seed = { ...mm3a, id: 1, hdf5Available: false, fileSize: null, sha256: null };
    render(<DataIntegrityPanel dataset={seed} onDeleted={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Verify integrity' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete dataset' })).toBeInTheDocument();
  });
});
