// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';  // Import routing components
import './App.css';
import Auth from './components/Auth';   // Import Auth component for Login/Sign Up
import Logo from './components/Logo';

const App = () => {
  return (
    <Router>
      <div>
        {/* Navigation */}
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li> {/* Link to Home */}
            <li><Link to="/about">About</Link></li> {/* Link for About */}
            <li><Link to="/auth">Login/Sign Up</Link></li> {/* Link to Login/Sign Up */}
          </ul>
        </nav>

        {/* Routes for different pages */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} /> {/* Route for the Login/Sign Up page */}
        </Routes>
      </div>
    </Router>
  );
};

// Home Page (optional)
const Home = () => (
  <div>
    <h1>Welcome to the Event Mosaic App</h1>
  </div>
);

export default App;
