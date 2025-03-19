import React, { useState } from 'react';
import './App.css';  // Ensure the styles are imported from App.css

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // You can replace this with your actual login logic, e.g., calling an API
    if (username === 'admin' && password === 'password') {
      setMessage('Login successful!');
    } else {
      setMessage('Invalid credentials, please try again.');
    }
  };

  return (
    <div>
      <nav>
        <ul>
          <li><a href="#">Home</a></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Login</a></li>
        </ul>
      </nav>

      <div className="logo-container">
        <img src="/images/logo.png" alt="Logo" />
      </div>

      {/* Container with the background box */}
      <div className="login-box">
        <h1 id="title">Login</h1>

        <form onSubmit={handleSubmit}>
          {/* Box behind username and password fields */}
          <div className="input-box">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <input
            type="submit"
            value="Login"
            id="loginButton"
          />
        </form>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
};

export default LoginPage;
