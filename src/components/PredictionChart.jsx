import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function PredictionChart({ data }) {
  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="actual" name="Actual Agricultural Land" stroke="#1f8a70" />
          <Line
            type="monotone"
            dataKey="predicted"
            name="Predicted Agricultural Land"
            stroke="#f39c12"
            strokeDasharray="7 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
