import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import GovernmentHeader from './components/GovernmentHeader';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import NewComplaint from './pages/NewComplaint';
import ComplaintDetails from './pages/ComplaintDetails';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Rewards from './pages/Rewards';
import TopPanchayats from './pages/TopPanchayats';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <div className="page-wrapper" style={{ textAlign: 'center', padding: '4rem 0' }}>Authenticating session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?role=CITIZEN" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <GovernmentHeader />
            <main style={{ flex: 1 }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/top-panchayats" element={<TopPanchayats />} />

                {/* Citizen Routes */}
                <Route path="/citizen/dashboard" element={
                  <ProtectedRoute allowedRoles={['CITIZEN']}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/complaint/new" element={
                  <ProtectedRoute allowedRoles={['CITIZEN']}>
                    <NewComplaint />
                  </ProtectedRoute>
                } />
                <Route path="/rewards" element={
                  <ProtectedRoute allowedRoles={['CITIZEN', 'STAFF', 'ADMIN']}>
                    <Rewards />
                  </ProtectedRoute>
                } />

                {/* Shared Complaint Detail Route */}
                <Route path="/complaint/:id" element={
                  <ProtectedRoute allowedRoles={['CITIZEN', 'STAFF', 'ADMIN']}>
                    <ComplaintDetails />
                  </ProtectedRoute>
                } />

                {/* Staff Routes */}
                <Route path="/staff/dashboard" element={
                  <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
