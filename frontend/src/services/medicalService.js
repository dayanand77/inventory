import axios from 'axios';
import { getAccessToken } from './tokenService';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';
const api = axios.create({ baseURL: API_BASE });

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Expiry Service
export const expiryService = {
  getAlerts: () => api.get('/api/expiry/alerts'),
  getExpiring: (days = 30) => api.get(`/api/expiry/expiring?days=${days}`),
  getExpired: () => api.get('/api/expiry/expired'),
  recordWastage: (itemId, quantity, reason) =>
    api.post('/api/expiry/wastage', { itemId, quantity, reason }),
  getWastageRecords: (itemId = null, startDate = null, endDate = null) => {
    let url = '/api/expiry/wastage';
    const params = new URLSearchParams();
    if (itemId) params.append('itemId', itemId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += '?' + params.toString();
    return api.get(url);
  },
  getWastageSummary: () => api.get('/api/expiry/wastage/summary'),
};

// Department Service
export const departmentService = {
  createDepartment: (name, description = '', contactInfo = '') =>
    api.post('/api/departments', { name, description, contactInfo }),
  listDepartments: () => api.get('/api/departments'),
  getDepartment: (deptId) => api.get(`/api/departments/${deptId}`),
  allocateItems: (deptId, itemId, quantity) =>
    api.post(`/api/departments/${deptId}/allocate`, { itemId, quantity }),
  getDepartmentAllocations: (deptId) =>
    api.get(`/api/departments/${deptId}/allocations`),
  recordUsage: (allocationId, usedQuantity) =>
    api.post(`/api/departments/allocations/${allocationId}/usage`, { usedQuantity }),
  getDepartmentConsumption: (deptId, startDate = null, endDate = null) => {
    let url = `/api/departments/${deptId}/consumption`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += '?' + params.toString();
    return api.get(url);
  },
  getDepartmentSummary: (deptId) =>
    api.get(`/api/departments/${deptId}/summary`),
  getItemAllocations: (itemId) =>
    api.get(`/api/departments/allocations/item/${itemId}`),
};

// Compliance Service
export const complianceService = {
  getStandards: () => api.get('/api/compliance/standards'),
  addItemCompliance: (itemId, standards, details = '') =>
    api.post(`/api/compliance/items/${itemId}`, { standards, details }),
  getItemCompliance: (itemId) =>
    api.get(`/api/compliance/items/${itemId}`),
  getReport: (standard = null, type = 'summary') => {
    let url = '/api/compliance/report?type=' + type;
    if (standard) url += '&standard=' + encodeURIComponent(standard);
    return api.get(url);
  },
  getNonCompliant: () => api.get('/api/compliance/non-compliant'),
  getSummary: () => api.get('/api/compliance/summary'),
  getAuditLog: (startDate = null, endDate = null) => {
    let url = '/api/compliance/audit-log';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += '?' + params.toString();
    return api.get(url);
  },
};
