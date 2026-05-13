import { apiRequest, uploadRequest } from './client';
import type {
  DatasetDetail,
  DatasetSummary,
  HealthStatus,
  ImportResult,
  MetadataItem,
  SignalPoint
} from '../types/dataset';

export function getHealth(): Promise<HealthStatus> {
  return apiRequest<HealthStatus>('/api/health');
}

export function getDatasets(): Promise<DatasetSummary[]> {
  return apiRequest<DatasetSummary[]>('/api/datasets');
}

export function getDatasetDetail(id: string): Promise<DatasetDetail> {
  return apiRequest<DatasetDetail>(`/api/datasets/${id}`);
}

export function getDatasetMetadata(id: string): Promise<MetadataItem[]> {
  return apiRequest<MetadataItem[]>(`/api/datasets/${id}/metadata`);
}

export function getDatasetSignals(id: string): Promise<SignalPoint[]> {
  return apiRequest<SignalPoint[]>(`/api/datasets/${id}/signals`);
}

export function importDataset(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  return uploadRequest<ImportResult>('/api/datasets/import', formData);
}
