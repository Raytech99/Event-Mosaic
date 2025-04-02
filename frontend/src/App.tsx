import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';  // Import the CSS file
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';  // Import the new AuthPage
import DashboardPage from './components/DashboardPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';

const App: React.FC = () => {
  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
  };

  const handleApiRoute = () => {
    return null;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage isLogin={true} />} />  {/* Login Route */}
        <Route path="/register" element={<AuthPage isLogin={false} />} />  {/* Register Route */}
        <Route
          path="/dashboard"
          element={isAuthenticated() ? <DashboardPage /> : <Navigate to="/login" />}
        />
        <Route path="/api-docs/*" element={handleApiRoute()} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
