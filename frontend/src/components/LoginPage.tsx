import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../App.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      console.log('Attempting login with:', { emailOrUsername });
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ emailOrUsername, password }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        localStorage.setItem('token', data.token);
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify({
          id: data.userId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        }));
        setMessage('Login successful!');
        // Use React Router's navigate instead of window.location
        navigate('/dashboard');
      } else {
        setMessage(data.msg || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/login">Login</Link></li>
        </ul>
      </nav>

      <div className="logo-container">
        <img src="/images/logo.png" alt="Logo" />
      </div>

      <div id="loginDiv">
        <h1 id="title">Login</h1>

        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <input
              type="text"
              placeholder="Email or Username"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <input
            type="submit"
            value={isLoading ? "Logging in..." : "Login"}
            id="loginButton"
            disabled={isLoading}
          />
        </form>

        {message && (
          <p style={{ 
            color: message.includes('successful') ? 'green' : 'red',
            marginTop: '10px',
            textAlign: 'center'
          }}>
            {message}
          </p>
        )}

        <p style={{ 
          marginTop: '20px',
          textAlign: 'center',
          color: '#666'
        }}>
          Don't have an account? <Link to="/register" style={{ color: '#21255b' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage; 