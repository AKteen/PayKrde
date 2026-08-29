import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { DataRefreshProvider } from '@/lib/data-refresh';
import { DashboardPage } from '@/pages/dashboard';
import { InvestmentsPage } from '@/pages/investments';
import { LoginPage } from '@/pages/login';
import { SettingsPage } from '@/pages/settings';
import { SignupPage } from '@/pages/signup';
import { TransactionsPage } from '@/pages/transactions';
import { VehiclesPage } from '@/pages/vehicles';
import { AnalyticsPage } from '@/pages/analytics';
import { DietPage } from '@/pages/diet';
import { UdharPage } from '@/pages/udhar';
import { MoneyPage } from '@/pages/money';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <DataRefreshProvider>
              <DashboardLayout />
            </DataRefreshProvider>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/udhar" element={<UdharPage />} />
          <Route path="/money" element={<MoneyPage />} />
          <Route path="/diet" element={<DietPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/investments" element={<InvestmentsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
