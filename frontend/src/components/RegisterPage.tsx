import React, { useState } from 'react';
import '../App.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    followedAccounts: []
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      console.log('Attempting registration with:', { ...formData, password: '***' });
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setMessage('Registration successful! Please login.');
        // Clear form
        setFormData({
          firstName: '',
          lastName: '',
          username: '',
          email: '',
          password: '',
          followedAccounts: []
        });
      } else {
        setMessage(data.msg || data.errors?.[0]?.msg || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <nav>
        <ul>
          <li><a href="#">Home</a></li>
          <li><a href="#">About</a></li>
          <li><a href="/login">Login</a></li>
        </ul>
      </nav>

      <div className="logo-container">
        <img src="/images/logo.png" alt="Logo" />
      </div>

      <div id="loginDiv">
        <h1 id="title">Register</h1>

        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password (min 8 characters)"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <input
            type="submit"
            value={isLoading ? "Registering..." : "Register"}
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
          Already have an account? <a href="/login" style={{ color: '#21255b' }}>Login here</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage; 