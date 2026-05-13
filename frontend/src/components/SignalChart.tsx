import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { SignalPoint } from '../types/dataset';

interface SignalChartProps {
  data: SignalPoint[];
}

export default function SignalChart({ data }: SignalChartProps) {
  return (
    <section className="panel">
      <h2>Signal Visualisation</h2>
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 24, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d8e1e8" />
            <XAxis dataKey="x" label={{ value: 'Sample index', position: 'insideBottom', offset: -4 }} />
            <YAxis label={{ value: 'Signal value', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend verticalAlign="top" height={32} />
            <Line type="monotone" dataKey="raw" name="Raw signal" stroke="#2166ac" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="processed" name="Processed signal" stroke="#1b7f5f" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
