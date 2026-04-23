import apiClient from "./api";

export async function fetchSuppliers(params = {}) {
  const response = await apiClient.get("/suppliers", { params });
  return response.data.suppliers;
}

export async function fetchSupplierById(supplierId) {
  const response = await apiClient.get(`/suppliers/${supplierId}`);
  return response.data.supplier;
}

export async function createSupplier(payload) {
  const response = await apiClient.post("/suppliers", payload);
  return response.data.supplier;
}

export async function updateSupplier(supplierId, payload) {
  const response = await apiClient.put(`/suppliers/${supplierId}`, payload);
  return response.data.supplier;
}

export async function deleteSupplier(supplierId) {
  await apiClient.delete(`/suppliers/${supplierId}`);
}
