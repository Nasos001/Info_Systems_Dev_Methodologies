import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import Navbar from '../components/layout/Navbar';

import WelcomePage from '../pages/Guest/WelcomePage';
import LoginPage from '../pages/Guest/LoginPage';
import RegisterPage from '../pages/Guest/RegisterPage';

import MyReportsPage from '../pages/Citizen/MyReportsPage';
import CreateReportPage from '../pages/Citizen/CreateReportPage';

import ManageReportsPage from '../pages/Admin/ManageReportsPage';
import ManageTechniciansPage from '../pages/Admin/ManageTechniciansPage';
import CategoryManagementPage from '../pages/Admin/CategoryManagementPage';

import MyAssignedTasksPage from '../pages/Technician/MyAssignedTasksPage';

import { RoleGuard } from './ProtectedRoute';

const NotFoundPage = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-6">
    <p className="text-6xl font-bold text-slate-200 mb-4">404</p>
    <h1 className="text-xl font-semibold text-slate-700 mb-2">Page Not Found</h1>
    <p className="text-sm text-slate-400">The page you are looking for does not exist.</p>
  </div>
);

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <div className="bg-slate-50 min-h-screen">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Citizen Routes */}
            <Route element={<RoleGuard role="citizen" />}>
              <Route path="/citizen/my-reports" element={<MyReportsPage />} />
              <Route path="/citizen/create-report" element={<CreateReportPage />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<RoleGuard role="admin" />}>
              <Route path="/admin/reports" element={<ManageReportsPage />} />
              <Route path="/admin/technicians" element={<ManageTechniciansPage />} />
              <Route path="/admin/categories" element={<CategoryManagementPage />} />
            </Route>

            {/* Technician Routes */}
            <Route element={<RoleGuard role="technician" />}>
              <Route path="/tech/tasks" element={<MyAssignedTasksPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
