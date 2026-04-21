import apiClient from "./api";

export async function fetchInventory(params = {}) {
  const response = await apiClient.get("/inventory", { params });
  return response.data.items;
}

export async function fetchItemByCode(itemCode) {
  const response = await apiClient.get(`/inventory/code/${itemCode}`);
  return response.data.item;
}

export async function createInventoryItem(payload) {
  const response = await apiClient.post("/inventory", payload);
  return response.data.item;
}

export async function updateInventoryItem(itemId, payload) {
  const response = await apiClient.put(`/inventory/${itemId}`, payload);
  return response.data.item;
}

export async function deleteInventoryItem(itemId) {
  await apiClient.delete(`/inventory/${itemId}`);
}

export async function downloadInventoryCsv() {
  const response = await apiClient.get("/inventory/export/csv", {
    responseType: "blob",
  });
  return response.data;
}

export async function downloadInventoryPdf() {
  const response = await apiClient.get("/inventory/export/pdf", {
    responseType: "blob",
  });
  return response.data;
}
