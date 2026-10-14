import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { HistogramBin } from '../types/dataset';

interface HistogramChartsProps {
  amplitude: HistogramBin[];
  phase: HistogramBin[];
}

function chartData(bins: HistogramBin[]) {
  return bins.map((bin) => ({
    range: (bin.start + bin.end) / 2,
    count: bin.count
  }));
}

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', { maximumSignificantDigits: 3 }).format(value);
}

function Histogram({ title, bins, color }: { title: string; bins: HistogramBin[]; color: string }) {
  return (
    <article className="analysis-chart">
      <h3>{title}</h3>
      <div className="chart-frame histogram">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData(bins)} margin={{ top: 12, right: 18, bottom: 8, left: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d8e1e8" />
            <XAxis dataKey="range" tickFormatter={compactNumber} minTickGap={28} />
            <YAxis width={58} tickFormatter={compactNumber} />
            <Tooltip
              labelFormatter={(value: number) => `Value ${compactNumber(value)}`}
              formatter={(value: number) => [value.toLocaleString(), 'Pixels']}
            />
            <Bar dataKey="count" fill={color} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export default function HistogramCharts({ amplitude, phase }: HistogramChartsProps) {
  return (
    <section className="panel">
      <h2>Value Distribution</h2>
      <div className="chart-grid">
        <Histogram title="Amplitude Histogram" bins={amplitude} color="#2f7d64" />
        <Histogram title="Phase Histogram" bins={phase} color="#2f6fa3" />
      </div>
    </section>
  );
}
