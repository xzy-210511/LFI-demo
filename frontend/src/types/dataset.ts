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
  hdf5Available: boolean;
  amplitudeFrameCount: number | null;
  phaseFrameCount: number | null;
  frameHeight: number | null;
  frameWidth: number | null;
  fileSize: number | null;
  sha256: string | null;
}

export type IntegrityStatus = 'VERIFIED' | 'MISMATCH' | 'BASELINE_RECORDED';

export interface IntegrityReport {
  datasetId: number;
  status: IntegrityStatus;
  recordedSha256: string;
  storedSha256: string;
  fileSizeBytes: number;
  checkedAt: string;
}

export interface MetadataItem {
  key: string;
  value: string;
}

export type ProfileDirection = 'row' | 'column';

export interface FrameProfilePoint {
  index: number;
  amplitude: number | null;
  phase: number | null;
}

export interface DataStatistics {
  minimum: number;
  maximum: number;
  mean: number;
  standardDeviation: number;
  finiteCount: number;
}

export interface HistogramBin {
  start: number;
  end: number;
  count: number;
}

export interface FrameAnalysis {
  frameIndex: number;
  amplitudeFrameName: string;
  phaseFrameName: string;
  frameHeight: number;
  frameWidth: number;
  direction: ProfileDirection;
  position: number;
  profilePoints: FrameProfilePoint[];
  amplitudeStatistics: DataStatistics;
  phaseStatistics: DataStatistics;
  amplitudeHistogram: HistogramBin[];
  phaseHistogram: HistogramBin[];
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
