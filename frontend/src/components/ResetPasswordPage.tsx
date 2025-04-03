import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { buildPath, API_ROUTES } from '../utils/api';
import { validatePassword } from '../utils/validationUtils';


const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [validPassword, setValidPassword] = useState(false);


  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(newPassword)) {
      setMessage('Please enter a valid password.');
      return;
    }
    
    try {
      const response = await fetch(buildPath(API_ROUTES.RESET_PASSWORD), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsSuccess(true);
        setMessage(data.message || 'Password successfully reset!');
      } else {
        setIsSuccess(false);
        setMessage(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
      setMessage('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} id="authDiv">
        <h2>Reset Your Password</h2>
        <div className="input-wrapper">
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => {
              const pwd = e.target.value;
              setNewPassword(pwd);
              setValidPassword(validatePassword(pwd));
            }}
            required
          />
          {newPassword && (
            <span className="input-icon">{validPassword ? '✅' : '❌'}</span>
          )}
        </div>
        {newPassword && !validPassword && (
          <p style={{ color: 'red', fontSize: '0.9em' }}>
            Must be 8+ characters with uppercase, lowercase, number, and symbol
          </p>
        )}


        <input type="submit" value="Reset Password" id="authButton" />
        {message && (
          <p style={{ color: isSuccess ? 'green' : 'red', marginTop: '10px' }}>{message}</p>
        )}
        {isSuccess && (
          <p style={{ textAlign: 'center', marginTop: '10px' }}>
            <Link to="/login">Back to Login</Link>
          </p>
        )}
      </form>
    </div>
  );
};

export default ResetPasswordPage;
