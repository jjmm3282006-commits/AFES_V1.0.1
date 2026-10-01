import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Layout from './components/Layout';
import Login from './components/Login';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DeanDashboard from './pages/DeanDashboard';
import AccountCreation from './pages/AccountCreation';
import type { UserRole } from './types';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: UserRole[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <DashboardWithLayout>{children}</DashboardWithLayout>;
}

function DashboardWithLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [viewingCycleId, setViewingCycleId] = useState<string>('');
  const showFilter = user?.role !== 'student';
  return (
    <Layout viewingCycleId={viewingCycleId} onViewingCycleChange={showFilter ? setViewingCycleId : undefined}>
      {React.isValidElement(children) ? React.cloneElement(children as React.ReactElement<any>, { viewingCycleId, onViewingCycleChange: setViewingCycleId }) : children}
    </Layout>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute allowedRoles={['admin', 'faculty', 'student', 'dean']}><DashboardRouter /></ProtectedRoute>} />
      <Route path="/create-account" element={<ProtectedRoute allowedRoles={['admin']}><AccountCreation /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function DashboardRouter() {
  const { user } = useAuth();
  switch (user?.role) {
    case 'admin': return <AdminDashboard />;
    case 'faculty': return <FacultyDashboard />;
    case 'student': return <StudentDashboard />;
    case 'dean': return <DeanDashboard />;
    default: return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (<BrowserRouter><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter>);
}
