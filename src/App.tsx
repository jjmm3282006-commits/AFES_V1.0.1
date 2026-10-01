import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Login from './components/Login';
import Layout from './components/Layout';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DeanDashboard from './pages/DeanDashboard';
import type { UserRole } from './types';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: UserRole[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function DashboardRouter() {
  const { user } = useAuth();
  const [viewingCycleId, setViewingCycleId] = useState('');

  switch (user?.role) {
    case 'admin':
      return <AdminDashboard viewingCycleId={viewingCycleId} onViewingCycleChange={setViewingCycleId} />;
    case 'faculty':
      return <FacultyDashboard viewingCycleId={viewingCycleId} onViewingCycleChange={setViewingCycleId} />;
    case 'student':
      return <StudentDashboard viewingCycleId={viewingCycleId} onViewingCycleChange={setViewingCycleId} />;
    case 'dean':
      return <DeanDashboard viewingCycleId={viewingCycleId} onViewingCycleChange={setViewingCycleId} />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={
        <ProtectedRoute allowedRoles={['admin', 'faculty', 'student', 'dean']}>
          <DashboardRouter />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
