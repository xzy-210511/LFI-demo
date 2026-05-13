export type DatasetStatus = 'IMPORTED' | 'PROCESSED' | 'ERROR';

export interface DatasetSummary {
  id: number;
  name: string;
  sourceFile: string;
  experimentDate: string;
  target: string;
  status: DatasetStatus;
  importedAt: string;
}

export interface DatasetDetail extends DatasetSummary {
  description: string;
  availableOutputs: string[];
}

export interface MetadataItem {
  key: string;
  value: string;
}

export interface SignalPoint {
  x: number;
  raw: number;
  processed: number;
}

export interface ImportResult {
  datasetId: number;
  fileName: string;
  status: DatasetStatus;
  message: string;
}

export interface HealthStatus {
  status: string;
  service: string;
}
