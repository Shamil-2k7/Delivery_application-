import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShoppingBag, LogOut, User as UserIcon, PlusCircle, LayoutDashboard, Truck, Shield } from 'lucide-react';

const Navbar = ({ currentPage, setCurrentPage, cartCount, onOpenCart }) => {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    setCurrentPage('login');
  };

  const getRoleTagColor = (role) => {
    switch (role) {
      case 'admin': return 'badge-admin';
      case 'restaurant': return 'badge-restaurant';
      case 'delivery': return 'badge-delivery';
      default: return 'badge-user';
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="brand" onClick={() => setCurrentPage(user ? 'dashboard' : 'login')}>
          <ShoppingBag size={28} strokeWidth={2.5} />
          <span>QuickBite</span>
        </div>

        <nav className="nav-links">
          {user ? (
            <>
              {/* Authenticated Links */}
              <span 
                className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentPage('dashboard')}
              >
                Dashboard
              </span>

              <div className="user-badge">
                <UserIcon size={16} />
                <span>{user.name}</span>
                <span className={`role-tag ${getRoleTagColor(user.role)}`}>
                  {user.role}
                </span>
              </div>

              {/* Show cart button for normal users if they are on dashboard or viewing menu */}
              {user.role === 'user' && (
                <button className="btn btn-secondary btn-sm" onClick={onOpenCart} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <ShoppingBag size={16} />
                  <span>Cart ({cartCount})</span>
                </button>
              )}

              <button className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              {/* Guest Links */}
              <span 
                className={`nav-link ${currentPage === 'login' ? 'active' : ''}`}
                onClick={() => setCurrentPage('login')}
              >
                Login
              </span>
              <span 
                className={`nav-link ${currentPage === 'register' ? 'active' : ''}`}
                onClick={() => setCurrentPage('register')}
              >
                Register
              </span>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
