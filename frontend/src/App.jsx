import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/common/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import AuditLogsPage from "./pages/AuditLogsPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import LoginPage from "./pages/LoginPage";
import NotificationsPage from "./pages/NotificationsPage";
import SuppliersPage from "./pages/SuppliersPage";
import TransactionsPage from "./pages/TransactionsPage";
import ExpiryManagementPage from "./pages/ExpiryManagementPage";
import DepartmentAllocationPage from "./pages/DepartmentAllocationPage";
import ComplianceManagementPage from "./pages/ComplianceManagementPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/audit" element={<AuditLogsPage />} />
        <Route path="/expiry" element={<ExpiryManagementPage />} />
        <Route path="/departments" element={<DepartmentAllocationPage />} />
        <Route path="/compliance" element={<ComplianceManagementPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
