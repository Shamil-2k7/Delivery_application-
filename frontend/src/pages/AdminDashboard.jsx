import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Users, Store, ShieldAlert, Award, FileText, Check, X } from 'lucide-react';

const AdminDashboard = () => {
  const { apiFetch } = useContext(AuthContext);

  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'users', 'orders'
  const [loading, setLoading] = useState(false);

  const fetchPendingRestaurants = async () => {
    try {
      const data = await apiFetch('/admin/restaurants/pending');
      if (data.success) {
        setPendingRestaurants(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await apiFetch('/admin/users');
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await apiFetch('/admin/orders');
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPendingRestaurants();
    fetchUsers();
    fetchOrders();
  }, []);

  const handleApprove = async (id) => {
    try {
      setLoading(true);
      const response = await apiFetch(`/admin/restaurants/${id}/approve`, {
        method: 'PUT',
      });
      if (response.success) {
        alert('Restaurant approved!');
        fetchPendingRestaurants();
        fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'Approval failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this restaurant registration?')) return;

    try {
      setLoading(true);
      const response = await apiFetch(`/admin/restaurants/${id}/reject`, {
        method: 'PUT',
      });
      if (response.success) {
        alert('Restaurant registration rejected.');
        fetchPendingRestaurants();
        fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'Rejection failed');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'badge-admin';
      case 'restaurant': return 'badge-restaurant';
      case 'delivery': return 'badge-delivery';
      default: return 'badge-user';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'badge-approved';
      case 'pending': return 'badge-pending';
      case 'rejected': return 'badge-rejected';
      default: return 'badge-pending';
    }
  };

  const getOrderStatusClass = (status) => {
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

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">System Administration</h1>
          <p className="dashboard-subtitle">Monitor system status, approve restaurant applications, and view database summaries.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-container">
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('pending');
            fetchPendingRestaurants();
          }}
        >
          Pending Approvals ({pendingRestaurants.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('users');
            fetchUsers();
          }}
        >
          All Users ({users.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('orders');
            fetchOrders();
          }}
        >
          All Orders ({orders.length})
        </button>
      </div>

      {activeTab === 'pending' ? (
        /* Pending Restaurant Approvals */
        <div>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Restaurant Approval Pipeline</h2>
          {pendingRestaurants.length === 0 ? (
            <div className="empty-state">
              <ShieldAlert size={36} className="empty-state-icon" />
              <p>No new restaurant applications currently require approval.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Owner / Rep</th>
                    <th>Restaurant Name</th>
                    <th>Cuisine</th>
                    <th>Description</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRestaurants.map(rest => (
                    <tr key={rest._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rest.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{rest.email}</div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{rest.restaurantDetails?.name || rest.name}</td>
                      <td>{rest.restaurantDetails?.cuisine || '-'}</td>
                      <td style={{ maxWidth: '200px', fontSize: '0.8125rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {rest.restaurantDetails?.description}
                      </td>
                      <td>{rest.phone}</td>
                      <td>{rest.address}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleApprove(rest._id)}
                            disabled={loading}
                            style={{ backgroundColor: 'var(--color-success)', padding: '0.25rem 0.5rem' }}
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleReject(rest._id)}
                            disabled={loading}
                            style={{ backgroundColor: 'var(--color-danger)', padding: '0.25rem 0.5rem' }}
                          >
                            <X size={14} />
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
      ) : activeTab === 'users' ? (
        /* All Users Directory */
        <div>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>System User Registry</h2>
          {users.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Loading registry...</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Registration Date</th>
                    <th>User Profile Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Role Group</th>
                    <th>Account Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>
                        {u.role === 'restaurant' && u.restaurantDetails?.name ? (
                          <span>{u.restaurantDetails.name} <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>({u.name})</span></span>
                        ) : (
                          <span>{u.name}</span>
                        )}
                      </td>
                      <td>{u.email}</td>
                      <td>{u.phone}</td>
                      <td>
                        <span className={`badge ${getRoleBadgeClass(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(u.status)}`}>
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Global Orders List */
        <div>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Global System-Wide Orders</h2>
          {orders.length === 0 ? (
            <div className="empty-state">
              <FileText size={36} className="empty-state-icon" />
              <p>No orders have been recorded on the system yet.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date / Time</th>
                    <th>Customer Account</th>
                    <th>Restaurant Vendor</th>
                    <th>Total Price</th>
                    <th>Order Status</th>
                    <th>Assigned Courier</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id}>
                      <td>{new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{o.user?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{o.user?.email}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{o.restaurant?.restaurantDetails?.name || o.restaurant?.name}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>${o.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${getOrderStatusClass(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td>
                        {o.deliveryPartner ? (
                          <div style={{ fontWeight: 500 }}>{o.deliveryPartner.name}</div>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: 'var(--color-text-light)' }}>Not assigned</span>
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
    </div>
  );
};

export default AdminDashboard;
