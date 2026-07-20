import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/ui/Toast";
import { DashboardLayout, RequireRole } from "./layouts/DashboardLayout";

import Login from "./pages/auth/Login";
import Overview from "./pages/dashboard/Overview";
import PosPage from "./pages/pos/PosPage";
import ProductsPage from "./pages/products/ProductsPage";
import EmployeeList from "./pages/employees/EmployeeList";
import EmployeeDetail from "./pages/employees/EmployeeDetail";
import BranchesPage from "./pages/branches/BranchesPage";
import TransactionHistoryPage from "./pages/transactions/TransactionHistoryPage";
import DailyAuditPage from "./pages/transactions/DailyAuditPage";
import AuditLogPage from "./pages/audit/AuditLogPage";
import CategoriesPage from "./pages/categories/CategoriesPage";
import FulfillmentPage from "./pages/fulfillment/FulfillmentPage";
import CustomersPage from "./pages/customers/CustomersPage";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Overview />} />

                <Route path="pos" element={<PosPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="categories" element={<CategoriesPage />} />

                <Route
                  path="fulfillment"
                  element={
                    <RequireRole roles={["CASHIER", "OWNER", "DEVELOPER"]}>
                      <FulfillmentPage />
                    </RequireRole>
                  }
                />

                <Route
                  path="customers"
                  element={
                    <RequireRole roles={["CASHIER", "OWNER", "DEVELOPER"]}>
                      <CustomersPage />
                    </RequireRole>
                  }
                />

                <Route
                  path="employees"
                  element={
                    <RequireRole roles={["OWNER", "DEVELOPER"]}>
                      <EmployeeList />
                    </RequireRole>
                  }
                />
                <Route
                  path="employees/:id"
                  element={
                    <RequireRole roles={["OWNER", "DEVELOPER"]}>
                      <EmployeeDetail />
                    </RequireRole>
                  }
                />

                <Route
                  path="branches"
                  element={
                    <RequireRole roles={["OWNER", "DEVELOPER"]}>
                      <BranchesPage />
                    </RequireRole>
                  }
                />

                <Route
                  path="transactions/history"
                  element={<TransactionHistoryPage />}
                />
                <Route
                  path="transactions/audit"
                  element={
                    <RequireRole roles={["OWNER", "DEVELOPER"]}>
                      <DailyAuditPage />
                    </RequireRole>
                  }
                />

                <Route
                  path="audit-log"
                  element={
                    <RequireRole roles={["DEVELOPER"]}>
                      <AuditLogPage />
                    </RequireRole>
                  }
                />
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
