import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import SeniorGameBoard from './pages/SeniorGameBoard';
import { DialogProvider } from './components/DialogProvider';
import './App.css';

function App() {
  const [userType, setUserType] = React.useState(localStorage.getItem('userType'));
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem('token'));

  const handleLogin = (newToken, type) => {
    setUserType(type);
    setIsAuthenticated(true);
    localStorage.setItem('token', newToken);
    localStorage.setItem('userType', type);
  };

  const handleLogout = () => {
    setUserType(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
  };

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <DialogProvider>
        <div className="App">
          <Routes>
            <Route
              path="/login"
              element={<Login onLogin={handleLogin} />}
            />
            <Route
              path="/admin"
              element={isAuthenticated && userType === 'admin' ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
            />
            <Route
              path="/game"
              element={isAuthenticated && userType === 'senior' ? <SeniorGameBoard onLogout={handleLogout} /> : <Navigate to="/login" />}
            />
            <Route
              path="/seniorboard"
              element={isAuthenticated && userType === 'senior' ? <SeniorGameBoard onLogout={handleLogout} /> : <Navigate to="/login" />}
            />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </DialogProvider>
    </Router>
  );
}

export default App;
