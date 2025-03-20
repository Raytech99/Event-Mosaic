import './App.css';  // Import the CSS file
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardPage from './components/DashboardPage';

const App = () => {
  // Get the current path from the URL
  const currentPath = window.location.pathname;

  // Render the appropriate component based on the path
  const renderPage = () => {
    switch (currentPath) {
      case '/register':
        return <RegisterPage />;
      case '/dashboard':
        return <DashboardPage />;
      case '/login':
      default:
        return <LoginPage />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
};

export default App;
