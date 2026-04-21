import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import StatCard from "../components/charts/StatCard";
import UsageChart from "../components/charts/UsageChart";
import Loader from "../components/common/Loader";
import { fetchCategoryBreakdown, fetchLowStock, fetchMetrics, fetchMonthlyUsage } from "../services/dashboardService";

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [usageData, setUsageData] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [metricsResult, categoryResult, usageResult, lowStockResult] = await Promise.all([
        fetchMetrics(),
        fetchCategoryBreakdown(),
        fetchMonthlyUsage(),
        fetchLowStock(),
      ]);

      setMetrics(metricsResult);
      setCategoryData(categoryResult);
      setUsageData(usageResult);
      setLowStockItems(lowStockResult);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <Loader message="Loading dashboard..." />;
  }

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <h1>Dashboard</h1>
          <p>Live inventory insights and stock intelligence.</p>
        </div>
        <button type="button" className="outline-button" onClick={loadDashboard}>
          Refresh
        </button>
      </section>

      <section className="stats-grid">
        <StatCard label="Total Items" value={metrics?.totalItems || 0} hint="Distinct inventory records" />
        <StatCard label="Available Units" value={metrics?.availableUnits || 0} hint="Ready for issuance" />
        <StatCard label="Issued Units" value={metrics?.issuedUnits || 0} hint="Currently in use" />
        <StatCard
          label="Low Stock Alerts"
          value={metrics?.lowStockCount || 0}
          hint="Requires replenishment"
          className="warning"
        />
      </section>

      <section className="panel-grid">
        <UsageChart data={usageData} />

        <article className="chart-card">
          <h3>Category Distribution</h3>
          <div className="list-panel">
            {categoryData.map((item) => (
              <div key={item.category} className="list-row">
                <strong>{item.category}</strong>
                <span>
                  {item.availableUnits}/{item.totalUnits} units
                </span>
              </div>
            ))}
            {!categoryData.length && <p>No category data found.</p>}
          </div>
        </article>
      </section>

      <section className="panel-card">
        <h3>Low Stock Items</h3>
        <div className="list-panel">
          {lowStockItems.map((item) => (
            <div key={item._id} className="list-row">
              <div>
                <strong>{item.name}</strong>
                <p>
                  {item.itemCode} · {item.location}
                </p>
              </div>
              <span className="pill danger">
                {item.availableQuantity} left (min {item.minimumThreshold})
              </span>
            </div>
          ))}
          {!lowStockItems.length && <p>All items are above threshold.</p>}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
