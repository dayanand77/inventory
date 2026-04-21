import apiClient from "./api";

export async function fetchMetrics() {
  const response = await apiClient.get("/dashboard/metrics");
  return response.data.metrics;
}

export async function fetchCategoryBreakdown() {
  const response = await apiClient.get("/dashboard/category-breakdown");
  return response.data.categories;
}

export async function fetchMonthlyUsage() {
  const response = await apiClient.get("/dashboard/monthly-usage");
  return response.data.usage;
}

export async function fetchLowStock() {
  const response = await apiClient.get("/dashboard/low-stock");
  return response.data.items;
}
