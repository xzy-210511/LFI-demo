import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { FrameAnalysis } from '../types/dataset';

interface FrameProfileChartsProps {
  analysis: FrameAnalysis;
}

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', { maximumSignificantDigits: 4 }).format(value);
}

export default function FrameProfileCharts({ analysis }: FrameProfileChartsProps) {
  const profileLabel = `${analysis.direction} ${analysis.position}`;

  return (
    <section className="panel">
      <div className="panel-heading-row">
        <div>
          <p className="section-kicker">Frame {analysis.frameIndex}</p>
          <h2>Frame Profiles</h2>
        </div>
        <span className="selection-label">{profileLabel}</span>
      </div>

      <div className="chart-grid">
        <article className="analysis-chart">
          <h3>Amplitude Profile</h3>
          <div className="chart-frame compact">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analysis.profilePoints} margin={{ top: 12, right: 20, bottom: 8, left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8e1e8" />
                <XAxis dataKey="index" label={{ value: 'Matrix index', position: 'insideBottom', offset: -4 }} />
                <YAxis width={72} tickFormatter={compactNumber} />
                <Tooltip formatter={(value: number) => compactNumber(value)} />
                <Line type="linear" dataKey="amplitude" stroke="#176448" dot={false} strokeWidth={1.8} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analysis-chart">
          <h3>Phase Profile</h3>
          <div className="chart-frame compact">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analysis.profilePoints} margin={{ top: 12, right: 20, bottom: 8, left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8e1e8" />
                <XAxis dataKey="index" label={{ value: 'Matrix index', position: 'insideBottom', offset: -4 }} />
                <YAxis width={72} tickFormatter={compactNumber} />
                <Tooltip formatter={(value: number) => compactNumber(value)} />
                <Line type="linear" dataKey="phase" stroke="#285f9e" dot={false} strokeWidth={1.8} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </section>
  );
}
