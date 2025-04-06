import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';  // Import the CSS file
import LandingPage from './components/LandingPage';
import LoadingScreen from './components/LoadingScreen';

// Lazy loaded components
const AuthPage = lazy(() => import('./components/AuthPage'));
const DashboardPage = lazy(() => import('./components/DashboardPage'));
const ForgotPasswordPage = lazy(() => import('./components/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./components/ResetPasswordPage'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const ClubPage = lazy(() => import('./components/ClubPage'));

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
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage isLogin={true} />} />  {/* Login Route */}
          <Route path="/register" element={<AuthPage isLogin={false} />} />  {/* Register Route */}
          <Route path="/about" element={<AboutPage />} />  {/* About Route */}
          <Route
            path="/dashboard"
            element={isAuthenticated() ? <DashboardPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/club"
            element={isAuthenticated() ? <ClubPage /> : <Navigate to="/login" />}
          />
          <Route path="/api-docs/*" element={handleApiRoute()} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
