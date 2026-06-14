import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Utensils, MapPin, Phone, ShoppingCart, Clock, CheckCircle2, ChevronRight, X } from 'lucide-react';

const UserDashboard = ({ cart, setCart, isCartOpen, setIsCartOpen }) => {
  const { user, apiFetch } = useContext(AuthContext);
  
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('restaurants'); // 'restaurants' or 'orders'
  
  const [loading, setLoading] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutAddress, setCheckoutAddress] = useState(user?.address || '');
  const [checkoutPhone, setCheckoutPhone] = useState(user?.phone || '');
  
  // Fetch approved restaurants
  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/foods/restaurants');
      if (data.success) {
        setRestaurants(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch menu for a specific restaurant
  const selectRestaurant = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    try {
      setLoading(true);
      const data = await apiFetch(`/foods/restaurant/${restaurant._id}`);
      if (data.success) {
        setMenuItems(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user orders
  const fetchOrders = async () => {
    try {
      const data = await apiFetch('/orders/user');
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    fetchOrders();
    // Poll orders every 10 seconds for real-time delivery status updates
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAddToCart = (item) => {
    // If cart has items from a different restaurant, ask to clear cart
    if (cart.length > 0 && cart[0].food.restaurant !== item.restaurant) {
      if (window.confirm('Adding items from a different restaurant will clear your current cart. Continue?')) {
        setCart([{ food: item, quantity: 1 }]);
      }
      return;
    }

    const exist = cart.find(x => x.food._id === item._id);
    if (exist) {
      setCart(cart.map(x => x.food._id === item._id ? { ...exist, quantity: exist.quantity + 1 } : x));
    } else {
      setCart([...cart, { food: item, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (item) => {
    const exist = cart.find(x => x.food._id === item._id);
    if (exist.quantity === 1) {
      setCart(cart.filter(x => x.food._id !== item._id));
    } else {
      setCart(cart.map(x => x.food._id === item._id ? { ...exist, quantity: exist.quantity - 1 } : x));
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    try {
      const orderData = {
        restaurantId: selectedRestaurant._id,
        items: cart.map(item => ({
          foodId: item.food._id,
          quantity: item.quantity,
        })),
        deliveryAddress: checkoutAddress,
        phone: checkoutPhone,
      };

      const response = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      if (response.success) {
        alert('Order placed successfully!');
        setCart([]);
        setCheckoutModalOpen(false);
        setIsCartOpen(false);
        fetchOrders();
        setActiveTab('orders');
      }
    } catch (err) {
      alert(err.message || 'Checkout failed');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.food.price * item.quantity), 0);

  const getStatusClass = (status) => {
    switch (status) {
      case 'placed': return 'badge-placed';
      case 'accepted': return 'badge-accepted';
      case 'preparing': return 'badge-preparing';
      case 'ready_for_pickup': return 'badge-ready_for_pickup';
      case 'out_for_delivery': return 'badge-out_for_delivery';
      case 'delivered': return 'badge-delivered';
      case 'cancelled': return 'badge-cancelled';
      default: return 'badge-placed';
    }
  };

  const getOrderStatusText = (status) => {
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Hungry, {user.name}?</h1>
          <p className="dashboard-subtitle">Order delicious meals from your favorite local restaurants.</p>
        </div>
      </div>

      <div className="tab-container">
        <button 
          className={`tab-btn ${activeTab === 'restaurants' ? 'active' : ''}`}
          onClick={() => setActiveTab('restaurants')}
        >
          Restaurants
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('orders');
            fetchOrders();
          }}
        >
          My Orders
        </button>
      </div>

      {activeTab === 'restaurants' ? (
        <>
          {selectedRestaurant ? (
            /* Restaurant Menu View */
            <div>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setSelectedRestaurant(null)}
                style={{ marginBottom: '1.5rem' }}
              >
                ← Back to Restaurants
              </button>

              <div className="restaurant-banner">
                <h2 className="restaurant-banner-title">{selectedRestaurant.restaurantDetails?.name || selectedRestaurant.name}</h2>
                <div className="restaurant-banner-meta">
                  <span>Cuisine: {selectedRestaurant.restaurantDetails?.cuisine || 'General'}</span>
                  <span>Description: {selectedRestaurant.restaurantDetails?.description}</span>
                  <span>Contact: {selectedRestaurant.phone}</span>
                </div>
              </div>

              <div className="menu-grid">
                <div>
                  <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>Menu Items</h3>
                  {loading ? (
                    <p>Loading menu...</p>
                  ) : menuItems.length === 0 ? (
                    <div className="empty-state">
                      <p>This restaurant has not added any food items yet.</p>
                    </div>
                  ) : (
                    <div className="food-card-grid">
                      {menuItems.map(item => (
                        <div key={item._id} className="food-card">
                          <div className="food-card-img-placeholder">
                            <Utensils size={32} />
                          </div>
                          <div className="food-card-details">
                            <div>
                              <div className="food-card-title">{item.name}</div>
                              <div className="food-card-desc">{item.description}</div>
                            </div>
                            <div className="food-card-footer">
                              <span className="food-card-price">${item.price.toFixed(2)}</span>
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => handleAddToCart(item)}
                              >
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inline Desktop Cart View */}
                <div className="cart-sidebar">
                  <h3 className="cart-title">
                    <ShoppingCart size={18} />
                    <span>Your Order</span>
                  </h3>
                  {cart.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
                      Your cart is empty. Add food items to start.
                    </p>
                  ) : (
                    <>
                      <div className="cart-items">
                        {cart.map(item => (
                          <div key={item.food._id} className="cart-item">
                            <div>
                              <div className="cart-item-name">{item.food.name}</div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                ${item.food.price.toFixed(2)} each
                              </span>
                            </div>
                            <div className="cart-item-qty">
                              <button className="qty-btn" onClick={() => handleRemoveFromCart(item.food)}>-</button>
                              <span>{item.quantity}</span>
                              <button className="qty-btn" onClick={() => handleAddToCart(item.food)}>+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="cart-total-row">
                        <span>Total:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                      <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', marginTop: '0.5rem' }}
                        onClick={() => setCheckoutModalOpen(true)}
                      >
                        Proceed to Checkout
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Restaurants List View */
            <div>
              <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Available Restaurants</h2>
              {loading ? (
                <p>Loading restaurants...</p>
              ) : restaurants.length === 0 ? (
                <div className="empty-state">
                  <p>No restaurants are currently registered or approved.</p>
                </div>
              ) : (
                <div className="grid-cols-1-2-3">
                  {restaurants.map(rest => (
                    <div key={rest._id} className="card" onClick={() => selectRestaurant(rest)} style={{ cursor: 'pointer' }}>
                      <div className="card-body">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                          <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', color: 'var(--color-primary)' }}>
                            <Utensils size={24} />
                          </div>
                          <div>
                            <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{rest.restaurantDetails?.name || rest.name}</h3>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {rest.restaurantDetails?.cuisine || 'General Cuisine'}
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem', minHeight: '3rem' }}>
                          {rest.restaurantDetails?.description || 'No description provided.'}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                          <MapPin size={14} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rest.address}</span>
                        </div>
                      </div>
                      <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-primary)' }}>View Menu</span>
                        <ChevronRight size={16} color="var(--color-primary)" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Customer Orders List */
        <div>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Your Orders</h2>
          {orders.length === 0 ? (
            <div className="empty-state">
              <Clock size={36} className="empty-state-icon" />
              <p>You haven't placed any orders yet.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => setActiveTab('restaurants')}>
                Order Now
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Order Date</th>
                    <th>Restaurant</th>
                    <th>Items</th>
                    <th>Total Price</th>
                    <th>Status</th>
                    <th>Delivery Driver</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id}>
                      <td>{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ fontWeight: 600 }}>{order.restaurant?.restaurantDetails?.name || order.restaurant?.name}</td>
                      <td>
                        <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                          {order.items.map((item, idx) => (
                            <li key={idx} style={{ fontSize: '0.8125rem' }}>
                              {item.food?.name || 'Item'} x {item.quantity}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td style={{ fontWeight: 700 }}>${order.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${getStatusClass(order.status)}`}>
                          {getOrderStatusText(order.status)}
                        </span>
                      </td>
                      <td>
                        {order.deliveryPartner ? (
                          <div>
                            <div style={{ fontWeight: 500 }}>{order.deliveryPartner.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{order.deliveryPartner.phone}</div>
                          </div>
                        ) : order.status === 'ready_for_pickup' ? (
                          <span style={{ fontStyle: 'italic', color: 'var(--color-text-light)' }}>Waiting for rider...</span>
                        ) : order.status === 'cancelled' || order.status === 'delivered' ? (
                          <span>-</span>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: 'var(--color-text-light)' }}>Cooking...</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delivery Details</h3>
              <button className="modal-close-btn" onClick={() => setCheckoutModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCheckout}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-address">Delivery Address</label>
                  <input
                    type="text"
                    id="checkout-address"
                    value={checkoutAddress}
                    onChange={(e) => setCheckoutAddress(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-phone">Phone Number</label>
                  <input
                    type="tel"
                    id="checkout-phone"
                    value={checkoutPhone}
                    onChange={(e) => setCheckoutPhone(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                <div className="cart-total-row" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <span>Total Bill:</span>
                  <span style={{ color: 'var(--color-primary)' }}>${cartTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCheckoutModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer overlay for Mobile Shopping Cart */}
      {isCartOpen && (
        <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', marginLeft: 'auto', marginRight: 0, height: '100vh', borderRadius: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 className="modal-title">Shopping Cart</h3>
              <button className="modal-close-btn" onClick={() => setIsCartOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
                  Your cart is empty.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {cart.map(item => (
                    <div key={item.food._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.food.name}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>${item.food.price.toFixed(2)}</span>
                      </div>
                      <div className="cart-item-qty">
                        <button className="qty-btn" onClick={() => handleRemoveFromCart(item.food)}>-</button>
                        <span>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => handleAddToCart(item.food)}>+</button>
                      </div>
                    </div>
                  ))}
                  <div className="cart-total-row">
                    <span>Total:</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="modal-footer" style={{ borderTop: '1px solid var(--color-border)' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                  onClick={() => {
                    setCheckoutModalOpen(true);
                  }}
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
