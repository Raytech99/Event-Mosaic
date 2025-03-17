import React from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import CardPage from './pages/CardPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/cards" element={<CardPage />} />
        <Route path="*" element={<NavigateToLogin />} /> {/* Catch-all route */}
      </Routes>
    </Router>
  );
}

function NavigateToLogin() {
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate('/'); // Navigate to the login page
  }, [navigate]);

  return null; // Render nothing while navigating
}

export default App;