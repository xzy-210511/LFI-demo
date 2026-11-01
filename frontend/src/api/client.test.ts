import { describe, expect, it, vi } from 'vitest';
import { apiRequest } from './client';

function mockFetch(response: Partial<Response>) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response as Response);
}

describe('apiRequest', () => {
  it('returns undefined for 204 No Content instead of parsing an empty body', async () => {
    const json = vi.fn();
    mockFetch({ ok: true, status: 204, json });

    await expect(apiRequest<void>('/api/datasets/5', { method: 'DELETE' })).resolves.toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });

  it('parses JSON for successful responses', async () => {
    mockFetch({ ok: true, status: 200, json: async () => ({ status: 'UP' }) });

    await expect(apiRequest('/api/health')).resolves.toEqual({ status: 'UP' });
  });

  it('surfaces the backend error message', async () => {
    mockFetch({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Invalid file type. Please upload a .h5 or .hdf5 file.' })
    });

    await expect(apiRequest('/api/datasets/import')).rejects.toThrow('Invalid file type');
  });
});
