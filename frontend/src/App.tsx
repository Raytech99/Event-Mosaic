import React from 'react';
import './App.css';  // Import the CSS file

const App = () => {
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

      <div id="loginDiv">
        <h1 id="title">Welcome to Event Mosaic</h1>
        <input type="text" placeholder="Username" />
        <input type="password" placeholder="Password" />
        <input type="submit" value="Login" id="loginButton" />
      </div>
    </div>
  );
};

export default App;
