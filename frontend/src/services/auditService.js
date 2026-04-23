import apiClient from "./api";

export async function fetchAuditLogs(limit = 100) {
  const response = await apiClient.get("/audit", { params: { limit } });
  return response.data.logs;
}
