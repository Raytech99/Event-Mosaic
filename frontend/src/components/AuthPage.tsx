import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import { buildPath, API_ROUTES } from '../utils/api';
import { validateEmail, validatePassword } from '../utils/validationUtils';
import LoadingScreen from './LoadingScreen';


interface AuthPageProps {
  isLogin: boolean;
}

const AuthPage: React.FC<AuthPageProps> = ({ isLogin }) => {
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
  const [validPassword, setValidPassword] = useState(false);
  const [validEmail, setValidEmail] = useState(false);


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
  
    if (name === 'email') setValidEmail(validateEmail(value));
    if (name === 'password') setValidPassword(validatePassword(value));
  };
  

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent multiple submissions
    
    
    setIsLoading(true);
    setMessage('');

    if (isRegistering && (!validateEmail(formData.email) || !validatePassword(formData.password))) {
      setMessage('Please fill out the form correctly before submitting.');
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = buildPath(isRegistering ? API_ROUTES.REGISTER : API_ROUTES.LOGIN);
      const body = isRegistering ? formData : { emailOrUsername, password: formData.password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        if (!isRegistering) {
          // Store user data first
          const userData = {
            _id: data.user.id,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
            username: data.user.username
          };
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('token', data.token);
          
          // Keep loading state true and redirect after showing loading screen
          // The loading state will keep the loading screen visible
          setTimeout(() => {
            window.location.replace('/dashboard');
          }, 1500); // Show loading for at least 1.5 seconds for good UX
        } else {
          setMessage('Registration successful! Please check your email to verify your account before logging in.');
          setFormData({
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            password: '',
            followedAccounts: []
          });
          setIsRegistering(false);
          setIsLoading(false);
        }
      } else {
        setMessage(data.msg || 'Error occurred. Please try again.');
        setIsLoading(false); // Clear loading state on error
      }
    } catch (error) {
      console.error('Error during auth:', error);
      setMessage('An error occurred. Please try again later.');
      setIsLoading(false); // Clear loading state on error
    }
  };

  return (
    <div className="auth-container">
      {isLoading && !isRegistering && <LoadingScreen message="Logging in..." />}
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
                <div className="input-wrapper">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {isRegistering && formData.email && (
                    <span className="input-icon">{validEmail ? '✅' : '❌'}</span>
                  )}
              </div>

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
            
            <div className="input-wrapper">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {isRegistering && formData.password && (
                <span className="input-icon">{validPassword ? '✅' : '❌'}</span>
              )}
            </div>
          {isRegistering && formData.password && !validPassword && (
            <p style={{ color: 'red', fontSize: '0.9em' }}>
              Must be 8+ characters with uppercase, lowercase, number, and symbol
            </p>
          )}


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
