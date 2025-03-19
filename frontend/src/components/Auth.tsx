// src/components/Auth.tsx
import React, { useState } from 'react';

const Auth = () => {
  // State to toggle between login and signup forms
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin); // Toggle between login and signup
  };

  const doLogin = (event: React.FormEvent) => {
    event.preventDefault();
    alert('Login attempt');
  };

  const doSignUp = (event: React.FormEvent) => {
    event.preventDefault();
    alert('Sign-up attempt');
  };

  return (
    <div id="authDiv">
      <h2>{isLogin ? 'LOGIN' : 'SIGN UP'}</h2>

      {/* Login Form */}
      {isLogin ? (
        <form onSubmit={doLogin}>
          <input type="text" placeholder="USERNAME" required /><br />
          <input type="password" placeholder="PASSWORD" required /><br />
          <button type="submit">LOGIN</button>
        </form>
      ) : (
        // Sign-up Form
        <form onSubmit={doSignUp}>
          <input type="text" placeholder="FIRST NAME" required /><br />
          <input type="text" placeholder="LAST NAME" required /><br />
          <input type="text" placeholder="USERNAME" required /><br />
          <input type="email" placeholder="EMAIL" required /><br />
          <input type="password" placeholder="PASSWORD" required /><br />
          <button type="submit">SIGN UP</button>
        </form>
      )}

      {/* Toggle between Login and Sign-up */}
      <p onClick={toggleForm} style={{ color: 'blue', cursor: 'pointer' }}>
        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
      </p>
    </div>
  );
};

export default Auth;
