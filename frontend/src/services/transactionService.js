import apiClient from "./api";

export async function fetchTransactions(params = {}) {
  const response = await apiClient.get("/transactions", { params });
  return response.data.transactions;
}

export async function requestItem(payload) {
  const response = await apiClient.post("/transactions/request", payload);
  return response.data.transaction;
}

export async function issueItem(payload) {
  const response = await apiClient.post("/transactions/issue", payload);
  return response.data.result;
}

export async function returnItem(payload) {
  const response = await apiClient.post("/transactions/return", payload);
  return response.data.result;
}

export async function approveRequest(requestId) {
  const response = await apiClient.post(`/transactions/requests/${requestId}/approve`);
  return response.data.result;
}

export async function restockItem(payload) {
  const response = await apiClient.post("/transactions/restock", payload);
  return response.data.result;
}
