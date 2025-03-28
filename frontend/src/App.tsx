import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';  // Import the CSS file
import AuthPage from './components/AuthPage';  // Import the new AuthPage
import DashboardPage from './components/DashboardPage';

const App: React.FC = () => {
  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  // Protected Route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" />;  // Redirect to login if not authenticated
    }
    return <>{children}</>;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<AuthPage isLogin={true} />} />  {/* Login Route */}
          <Route path="/register" element={<AuthPage isLogin={false} />} />  {/* Register Route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />  {/* Default route */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
