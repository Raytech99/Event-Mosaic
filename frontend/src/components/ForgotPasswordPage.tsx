import React, { useState } from 'react';
import { buildPath, API_ROUTES } from '../utils/api';
import { Link } from 'react-router-dom';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch(buildPath(API_ROUTES.FORGOT_PASSWORD), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsSuccess(true);
        setMessage(data.message || 'Check your email for password reset instructions.');
      } else {
        setIsSuccess(false);
        setMessage(data.error || 'Something went wrong. Try again.');
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} id="authDiv">
        <h2>Forgot Password</h2>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input type="submit" value="Send Reset Link" id="authButton" />
        {message && (
          <p style={{ color: isSuccess ? 'green' : 'red', marginTop: '10px' }}>{message}</p>
        )}
        <p style={{ textAlign: 'center', marginTop: '10px' }}>
          <Link to="/login">Back to Login</Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
