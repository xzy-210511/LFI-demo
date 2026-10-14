import type { DataStatistics, FrameAnalysis } from '../types/dataset';

interface FrameStatisticsPanelProps {
  analysis: FrameAnalysis;
}

function formatValue(value: number) {
  return new Intl.NumberFormat('en', { maximumSignificantDigits: 6 }).format(value);
}

function StatisticsGroup({ title, statistics }: { title: string; statistics: DataStatistics }) {
  return (
    <article className="statistics-group">
      <h3>{title}</h3>
      <dl>
        <div><dt>Minimum</dt><dd>{formatValue(statistics.minimum)}</dd></div>
        <div><dt>Maximum</dt><dd>{formatValue(statistics.maximum)}</dd></div>
        <div><dt>Mean</dt><dd>{formatValue(statistics.mean)}</dd></div>
        <div><dt>Standard deviation</dt><dd>{formatValue(statistics.standardDeviation)}</dd></div>
        <div><dt>Finite values</dt><dd>{statistics.finiteCount.toLocaleString()}</dd></div>
      </dl>
    </article>
  );
}

export default function FrameStatisticsPanel({ analysis }: FrameStatisticsPanelProps) {
  return (
    <section className="panel">
      <h2>Frame Statistics</h2>
      <div className="statistics-grid">
        <StatisticsGroup title="Amplitude" statistics={analysis.amplitudeStatistics} />
        <StatisticsGroup title="Phase" statistics={analysis.phaseStatistics} />
      </div>
    </section>
  );
}
