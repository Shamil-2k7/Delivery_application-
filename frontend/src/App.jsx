import React, { useState, useEffect, useContext } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import RestaurantDashboard from './pages/RestaurantDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { AuthContext, AuthProvider } from './context/AuthContext';

function AppContent() {
  const { user, loading } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState('login');
  
  // Cart state for customer ordering
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Authentication and role redirection hooks
  useEffect(() => {
    if (!loading) {
      if (user) {
        setCurrentPage('dashboard');
      } else {
        // If not logged in, force to login unless they are registering
        if (currentPage !== 'register') {
          setCurrentPage('login');
        }
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <h2>Loading QuickBite Platform...</h2>
      </div>
    );
  }

  // Render main screen component based on state
  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login setCurrentPage={setCurrentPage} />;
      case 'register':
        return <Register setCurrentPage={setCurrentPage} />;
      case 'dashboard':
        if (!user) return <Login setCurrentPage={setCurrentPage} />;
        
        // Render panels based on JWT Auth user role
        switch (user.role) {
          case 'user':
            return <UserDashboard cart={cart} setCart={setCart} isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />;
          case 'restaurant':
            return <RestaurantDashboard />;
          case 'delivery':
            return <DeliveryDashboard />;
          case 'admin':
            return <AdminDashboard />;
          default:
            return <UserDashboard cart={cart} setCart={setCart} isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />;
        }
      default:
        return <Login setCurrentPage={setCurrentPage} />;
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app-container">
      <Navbar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        cartCount={cartCount} 
        onOpenCart={() => setIsCartOpen(true)} 
      />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
