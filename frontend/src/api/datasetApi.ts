import { API_BASE_URL, apiRequest, uploadRequest } from './client';
import type {
  DatasetDetail,
  DatasetSummary,
  FrameAnalysis,
  HealthStatus,
  ImportResult,
  IntegrityReport,
  MetadataItem,
  ProfileDirection
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

export function getFrameAnalysis(
  id: string,
  frame: number,
  direction: ProfileDirection,
  position: number
): Promise<FrameAnalysis> {
  const query = new URLSearchParams({ direction, position: String(position) });
  return apiRequest<FrameAnalysis>(`/api/datasets/${id}/frames/${frame}/analysis?${query}`);
}

export function deleteDataset(id: string): Promise<void> {
  return apiRequest<void>(`/api/datasets/${id}`, { method: 'DELETE' });
}

export function verifyDatasetIntegrity(id: string): Promise<IntegrityReport> {
  return apiRequest<IntegrityReport>(`/api/datasets/${id}/integrity`, { method: 'POST' });
}

export function importDataset(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  return uploadRequest<ImportResult>('/api/datasets/import', formData);
}

export function getAmplitudeImageUrl(id: string, frame: number): string {
  return `${API_BASE_URL}/api/datasets/${id}/frames/${frame}/amplitude-image`;
}

export function getPhaseImageUrl(id: string, frame: number): string {
  return `${API_BASE_URL}/api/datasets/${id}/frames/${frame}/phase-image`;
}

export function getCombinedImageUrl(id: string, frame: number): string {
  return `${API_BASE_URL}/api/datasets/${id}/frames/${frame}/combined-image`;
}
