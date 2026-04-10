import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Shops from './pages/Shops';
import Factories from './pages/Factories';
import Layout from './components/Layout';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
          } 
        />
        <Route element={<Layout isAuthenticated={isAuthenticated} onLogout={handleLogout} />}>
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/orders" 
            element={
              isAuthenticated ? <Orders /> : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/products" 
            element={
              isAuthenticated ? <Products /> : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/shops" 
            element={
              isAuthenticated ? <Shops /> : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/factories" 
            element={
              isAuthenticated ? <Factories /> : <Navigate to="/login" />
            } 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
