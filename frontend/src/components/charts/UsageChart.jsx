import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function UsageChart({ data }) {
  return (
    <div className="chart-card">
      <h3>Monthly Issued Quantity</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="4 4" opacity={0.2} />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="quantityIssued" radius={[8, 8, 0, 0]} fill="#15616d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default UsageChart;
