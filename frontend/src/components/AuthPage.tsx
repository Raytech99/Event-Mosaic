import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';
import { buildPath, API_ROUTES } from '../utils/api';

interface AuthPageProps {
  isLogin: boolean;
}

const AuthPage: React.FC<AuthPageProps> = ({ isLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    followedAccounts: []
  });
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(!isLogin);

  // Update isRegistering when isLogin prop changes
  useEffect(() => {
    setIsRegistering(!isLogin);
  }, [isLogin]);

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
      const endpoint = buildPath(isRegistering ? API_ROUTES.REGISTER : API_ROUTES.LOGIN);
      const body = isRegistering ? formData : { emailOrUsername, password: formData.password };

      console.log('Making request to:', endpoint);
      console.log('With body:', body);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        if (!isRegistering) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify({
            id: data.userId,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email
          }));
          navigate('/dashboard');
        } else {
          setMessage('Registration successful! Please login.');
          setFormData({
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            password: '',
            followedAccounts: []
          });
          setIsRegistering(false); // Switch to login form after successful registration
        }
      } else {
        setMessage(data.msg || 'Error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Error during auth:', error);
      setMessage('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <nav>
        <img src="/images/navbarlogo.png" alt="Logo" className="nav-logo" />
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/login">Login</Link></li>
        </ul>
      </nav>

      <div className="toggle-switch" onClick={() => setIsRegistering(!isRegistering)}>
        <span className="toggle-text login-text">LOGIN</span>
        <span className="toggle-text signup-text">REGISTER</span>
        <div className={`toggle-slider ${isRegistering ? 'slide-to-register' : ''}`} />
        <input
          type="checkbox"
          checked={isRegistering}
          onChange={() => setIsRegistering(!isRegistering)}
          className="toggle-input"
        />
      </div>

      <div id="authDiv">
        <form onSubmit={handleSubmit}>
          <div className="input-box">
            {isRegistering && (
              <>
                <div className="name-fields">
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
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
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
              </>
            )}
            {!isRegistering && (
              <input
                type="text"
                name="emailOrUsername"
                placeholder="Email or Username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
              />
            )}
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <input
            type="submit"
            value={isLoading ? "Processing..." : isRegistering ? "Register" : "Login"}
            id="authButton"
            disabled={isLoading}
          />
          
          {!isRegistering && (
            <Link to="/forgot-password" className="forgot-password">
              Forgot Password?
            </Link>
          )}
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
      </div>
    </div>
  );
};

export default AuthPage;
