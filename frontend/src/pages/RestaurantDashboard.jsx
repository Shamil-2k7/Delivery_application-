import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Check, X, ClipboardList, UtensilsCrossed, AlertTriangle } from 'lucide-react';

const RestaurantDashboard = () => {
  const { user, apiFetch } = useContext(AuthContext);
  
  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'menu'
  const [loading, setLoading] = useState(false);
  
  // Menu Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState(null);
  const [foodForm, setFoodForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    isAvailable: true,
  });

  const { name, description, price, category, isAvailable } = foodForm;

  const fetchOrders = async () => {
    try {
      const data = await apiFetch('/orders/restaurant');
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMenu = async () => {
    try {
      const data = await apiFetch(`/foods/restaurant/${user._id}`);
      if (data.success) {
        setFoods(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user.status === 'approved') {
      fetchOrders();
      fetchMenu();
      // Poll orders
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [user.status]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const data = await apiFetch(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (data.success) {
        alert(`Order status updated to: ${newStatus}`);
        fetchOrders();
      }
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setSelectedFoodId(null);
    setFoodForm({
      name: '',
      description: '',
      price: '',
      category: 'Main Course',
      isAvailable: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (food) => {
    setEditMode(true);
    setSelectedFoodId(food._id);
    setFoodForm({
      name: food.name,
      description: food.description || '',
      price: food.price.toString(),
      category: food.category,
      isAvailable: food.isAvailable,
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedData = {
        ...foodForm,
        price: parseFloat(price),
      };

      let response;
      if (editMode) {
        response = await apiFetch(`/foods/${selectedFoodId}`, {
          method: 'PUT',
          body: JSON.stringify(formattedData),
        });
      } else {
        response = await apiFetch('/foods', {
          method: 'POST',
          body: JSON.stringify(formattedData),
        });
      }

      if (response.success) {
        alert(editMode ? 'Food item updated!' : 'Food item added successfully!');
        setModalOpen(false);
        fetchMenu();
      }
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFood = async (foodId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const response = await apiFetch(`/foods/${foodId}`, {
        method: 'DELETE',
      });
      if (response.success) {
        alert('Food item deleted');
        fetchMenu();
      }
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleFormChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFoodForm({ ...foodForm, [e.target.name]: val });
  };

  // If restaurant is NOT approved
  if (user.status !== 'approved') {
    return (
      <div className="restaurant-dashboard">
        <h1 className="dashboard-title">Restaurant Control Panel</h1>
        <div className="alert alert-warning" style={{ marginTop: '2rem', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={32} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Registration Status: PENDING APPROVAL</h3>
          </div>
          <p style={{ fontSize: '1rem' }}>
            Thank you for registering your restaurant! Your business profile is currently undergoing verification by our administration team.
            Once approved, you will have access to the full restaurant control panel, including menu management and food delivery orders.
          </p>
          <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            Please check back shortly or contact support at support@quickbite.com if approval takes longer than 24 hours.
          </p>
        </div>
      </div>
    );
  }

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

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const completedOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  return (
    <div className="restaurant-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">{user.restaurantDetails?.name || user.name}</h1>
          <p className="dashboard-subtitle">Manage your digital storefront, adjust menus, and handle active orders.</p>
        </div>
        {activeTab === 'menu' && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            <span>Add Menu Item</span>
          </button>
        )}
      </div>

      <div className="tab-container">
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Active Orders ({activeOrders.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('menu');
            fetchMenu();
          }}
        >
          Menu Management ({foods.length})
        </button>
      </div>

      {activeTab === 'orders' ? (
        /* Orders View */
        <div>
          {orders.length === 0 ? (
            <div className="empty-state">
              <ClipboardList size={36} className="empty-state-icon" />
              <p>No orders received yet.</p>
            </div>
          ) : (
            <>
              <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>Incoming & Active Orders</h3>
              {activeOrders.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>No active orders at the moment.</p>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Order Items</th>
                        <th>Address</th>
                        <th>Bill</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeOrders.map(order => (
                        <tr key={order._id}>
                          <td>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{order.user?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{order.phone}</div>
                          </td>
                          <td>
                            <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                              {order.items.map((item, idx) => (
                                <li key={idx} style={{ fontSize: '0.8125rem' }}>
                                  {item.food?.name || 'Deleted Food'} x {item.quantity}
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.deliveryAddress}</td>
                          <td style={{ fontWeight: 700 }}>${order.totalAmount.toFixed(2)}</td>
                          <td>
                            <span className={`badge ${getStatusClass(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {order.status === 'placed' && (
                                <>
                                  <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleStatusUpdate(order._id, 'accepted')}
                                  >
                                    Accept
                                  </button>
                                  <button 
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                                    style={{ color: 'var(--color-danger)' }}
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {order.status === 'accepted' && (
                                <button 
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleStatusUpdate(order._id, 'preparing')}
                                >
                                  Start Preparing
                                </button>
                              )}
                              {order.status === 'preparing' && (
                                <button 
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleStatusUpdate(order._id, 'ready_for_pickup')}
                                >
                                  Ready for Pickup
                                </button>
                              )}
                              {order.status === 'ready_for_pickup' && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                  Awaiting driver pickup...
                                </span>
                              )}
                              {order.status === 'out_for_delivery' && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                  Out for Delivery
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h3 style={{ marginBottom: '1rem', fontWeight: 700, marginTop: '2rem' }}>Order History</h3>
              {completedOrders.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No completed orders.</p>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Order Items</th>
                        <th>Address</th>
                        <th>Bill</th>
                        <th>Status</th>
                        <th>Delivery Rider</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedOrders.map(order => (
                        <tr key={order._id}>
                          <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td>{order.user?.name}</td>
                          <td>
                            {order.items.map((item, idx) => (
                              <div key={idx} style={{ fontSize: '0.8125rem' }}>
                                {item.food?.name} x {item.quantity}
                              </div>
                            ))}
                          </td>
                          <td>{order.deliveryAddress}</td>
                          <td style={{ fontWeight: 700 }}>${order.totalAmount.toFixed(2)}</td>
                          <td>
                            <span className={`badge ${getStatusClass(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>{order.deliveryPartner?.name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Menu Management View */
        <div>
          {foods.length === 0 ? (
            <div className="empty-state">
              <UtensilsCrossed size={36} className="empty-state-icon" />
              <p>Your menu is currently empty. Click "Add Menu Item" above to create dishes.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Dish Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {foods.map(food => (
                    <tr key={food._id}>
                      <td style={{ fontWeight: 600 }}>{food.name}</td>
                      <td>
                        <span className="role-tag badge-user" style={{ fontSize: '0.7rem' }}>
                          {food.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>${food.price.toFixed(2)}</td>
                      <td style={{ color: 'var(--color-text-muted)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {food.description || 'No description.'}
                      </td>
                      <td>
                        <span className={`badge ${food.isAvailable ? 'badge-approved' : 'badge-rejected'}`}>
                          {food.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditModal(food)}
                            style={{ padding: '0.25rem 0.5rem' }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDeleteFood(food._id)}
                            style={{ padding: '0.25rem 0.5rem', color: 'var(--color-danger)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Menu Form Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editMode ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="food-name">Dish Name</label>
                  <input
                    type="text"
                    id="food-name"
                    name="name"
                    value={name}
                    onChange={handleFormChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="food-price">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="food-price"
                    name="price"
                    value={price}
                    onChange={handleFormChange}
                    className="form-input"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="food-category">Category</label>
                  <select
                    id="food-category"
                    name="category"
                    value={category}
                    onChange={handleFormChange}
                    className="form-select"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="food-desc">Description</label>
                  <textarea
                    id="food-desc"
                    name="description"
                    value={description}
                    onChange={handleFormChange}
                    className="form-input"
                    rows={3}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <input
                    type="checkbox"
                    id="food-available"
                    name="isAvailable"
                    checked={isAvailable}
                    onChange={handleFormChange}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="food-available" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Available for Ordering</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboard;
