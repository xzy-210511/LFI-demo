import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import FrameProfileCharts from '../components/FrameProfileCharts';
import FrameStatisticsPanel from '../components/FrameStatisticsPanel';
import HistogramCharts from '../components/HistogramCharts';
import MetadataPanel from '../components/MetadataPanel';
import ResultPanel from '../components/ResultPanel';
import {
  getAmplitudeImageUrl,
  getCombinedImageUrl,
  getDatasetDetail,
  getDatasetMetadata,
  getFrameAnalysis,
  getPhaseImageUrl
} from '../api/datasetApi';
import type {
  DatasetDetail as DatasetDetailType,
  FrameAnalysis,
  MetadataItem,
  ProfileDirection
} from '../types/dataset';

interface FrameSelection {
  frame: number;
  direction: ProfileDirection;
  position: number;
}

const initialSelection: FrameSelection = { frame: 0, direction: 'row', position: 0 };

export default function DatasetDetail() {
  const { id } = useParams();
  const [dataset, setDataset] = useState<DatasetDetailType | null>(null);
  const [metadata, setMetadata] = useState<MetadataItem[]>([]);
  const [analysis, setAnalysis] = useState<FrameAnalysis | null>(null);
  const [selection, setSelection] = useState<FrameSelection>(initialSelection);
  const [draft, setDraft] = useState<FrameSelection>(initialSelection);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisError, setAnalysisError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDatasetDetail(datasetId: string) {
      try {
        setLoading(true);
        const [detailResponse, metadataResponse] = await Promise.all([
          getDatasetDetail(datasetId),
          getDatasetMetadata(datasetId)
        ]);
        if (!active) return;

        setDataset(detailResponse);
        setMetadata(metadataResponse);
        const firstSelection = {
          frame: 0,
          direction: 'row' as ProfileDirection,
          position: Math.floor((detailResponse.frameHeight ?? 1) / 2)
        };
        setSelection(firstSelection);
        setDraft(firstSelection);
        setError('');
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : 'Unable to load dataset detail.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (id) loadDatasetDetail(id);
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;

    async function loadAnalysis(datasetId: string) {
      try {
        setAnalysisLoading(true);
        const response = await getFrameAnalysis(
          datasetId,
          selection.frame,
          selection.direction,
          selection.position
        );
        if (active) {
          setAnalysis(response);
          setAnalysisError('');
        }
      } catch (caughtError) {
        if (active) {
          setAnalysis(null);
          setAnalysisError(caughtError instanceof Error ? caughtError.message : 'Unable to analyse this frame.');
        }
      } finally {
        if (active) setAnalysisLoading(false);
      }
    }

    if (id && dataset?.hdf5Available) loadAnalysis(id);
    return () => {
      active = false;
    };
  }, [dataset?.hdf5Available, id, selection]);

  if (loading) return <p className="notice">Loading dataset detail...</p>;

  if (error) {
    return (
      <div className="page-stack">
        <p className="notice error">Unable to load dataset detail: {error}</p>
        <Link className="button secondary" to="/datasets">Back to datasets</Link>
      </div>
    );
  }

  if (!dataset || !id) return <p className="notice error">Dataset not found.</p>;

  const maxFrame = Math.max(
    0,
    Math.min(dataset.amplitudeFrameCount ?? 0, dataset.phaseFrameCount ?? 0) - 1
  );
  const positionLimit = draft.direction === 'row'
    ? Math.max(0, (dataset.frameHeight ?? 1) - 1)
    : Math.max(0, (dataset.frameWidth ?? 1) - 1);

  function applySelection(event: FormEvent) {
    event.preventDefault();
    setSelection({
      frame: Math.min(maxFrame, Math.max(0, draft.frame)),
      direction: draft.direction,
      position: Math.min(positionLimit, Math.max(0, draft.position))
    });
  }

  function moveFrame(offset: number) {
    const nextFrame = Math.min(maxFrame, Math.max(0, selection.frame + offset));
    const next = { ...selection, frame: nextFrame };
    setSelection(next);
    setDraft(next);
  }

  function changeDirection(direction: ProfileDirection) {
    const dimension = direction === 'row' ? dataset?.frameHeight : dataset?.frameWidth;
    setDraft({ ...draft, direction, position: Math.floor((dimension ?? 1) / 2) });
  }

  return (
    <div className="page-stack">
      <section className="page-heading with-action">
        <div>
          <h2>{dataset.name}</h2>
          <p>{dataset.description}</p>
        </div>
        <Link className="button secondary" to="/datasets">Back to datasets</Link>
      </section>

      <section className="panel">
        <h2>Basic Information</h2>
        <dl className="info-grid">
          <div><dt>Dataset ID</dt><dd>{dataset.id}</dd></div>
          <div><dt>Source file</dt><dd>{dataset.sourceFile}</dd></div>
          <div><dt>Experiment date</dt><dd>{dataset.experimentDate}</dd></div>
          <div><dt>Target</dt><dd>{dataset.target}</dd></div>
          <div><dt>Status</dt><dd><span className={`status-pill ${dataset.status.toLowerCase()}`}>{dataset.status}</span></dd></div>
          <div><dt>Imported at</dt><dd>{dataset.importedAt.replace('T', ' ')}</dd></div>
          {dataset.hdf5Available && (
            <>
              <div><dt>Amplitude frames</dt><dd>{dataset.amplitudeFrameCount}</dd></div>
              <div><dt>Phase frames</dt><dd>{dataset.phaseFrameCount}</dd></div>
              <div><dt>Frame dimensions</dt><dd>{dataset.frameHeight} × {dataset.frameWidth}</dd></div>
            </>
          )}
        </dl>
      </section>

      <MetadataPanel metadata={metadata} />

      {!dataset.hdf5Available ? (
        <p className="notice">This prototype record has no stored HDF5 source. Import an HDF5 file to use frame visualisation.</p>
      ) : (
        <>
          <section className="panel frame-controls-panel">
            <div className="panel-heading-row">
              <div>
                <p className="section-kicker">HDF5 result data</p>
                <h2>Frame Selection</h2>
              </div>
              <strong>Frame {selection.frame} of {maxFrame}</strong>
            </div>

            <form className="frame-controls" onSubmit={applySelection}>
              <div className="frame-stepper">
                <button className="button secondary" type="button" onClick={() => moveFrame(-1)} disabled={selection.frame === 0}>
                  Previous
                </button>
                <input
                  aria-label="Frame slider"
                  type="range"
                  min="0"
                  max={maxFrame}
                  value={draft.frame}
                  onChange={(event) => setDraft({ ...draft, frame: Number(event.target.value) })}
                />
                <button className="button secondary" type="button" onClick={() => moveFrame(1)} disabled={selection.frame === maxFrame}>
                  Next
                </button>
              </div>

              <label>
                Frame
                <input
                  type="number"
                  min="0"
                  max={maxFrame}
                  value={draft.frame}
                  onChange={(event) => setDraft({ ...draft, frame: Number(event.target.value) })}
                />
              </label>

              <label>
                Profile direction
                <select
                  value={draft.direction}
                  onChange={(event) => changeDirection(event.target.value as ProfileDirection)}
                >
                  <option value="row">Horizontal row</option>
                  <option value="column">Vertical column</option>
                </select>
              </label>

              <label>
                {draft.direction === 'row' ? 'Row' : 'Column'} position
                <input
                  type="number"
                  min="0"
                  max={positionLimit}
                  value={draft.position}
                  onChange={(event) => setDraft({ ...draft, position: Number(event.target.value) })}
                />
              </label>

              <button className="button primary" type="submit">Apply selection</button>
            </form>
          </section>

          <ResultPanel
            frame={selection.frame}
            amplitudeImageUrl={getAmplitudeImageUrl(id, selection.frame)}
            phaseImageUrl={getPhaseImageUrl(id, selection.frame)}
            combinedImageUrl={getCombinedImageUrl(id, selection.frame)}
          />

          {analysisLoading && <p className="notice">Reading frame data...</p>}
          {analysisError && <p className="notice error">Unable to read frame data: {analysisError}</p>}
          {analysis && !analysisLoading && (
            <>
              <FrameProfileCharts analysis={analysis} />
              <FrameStatisticsPanel analysis={analysis} />
              <HistogramCharts
                amplitude={analysis.amplitudeHistogram}
                phase={analysis.phaseHistogram}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
