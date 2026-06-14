import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Phone, CheckCircle, Navigation, Clock, PackageOpen } from 'lucide-react';

const DeliveryDashboard = () => {
  const { user, apiFetch } = useContext(AuthContext);
  
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' (available) or 'my-deliveries' (assigned)
  const [loading, setLoading] = useState(false);

  const fetchAvailableJobs = async () => {
    try {
      const data = await apiFetch('/orders/delivery/available');
      if (data.success) {
        setAvailableJobs(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyJobs = async () => {
    try {
      const data = await apiFetch('/orders/delivery/assigned');
      if (data.success) {
        setMyJobs(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAvailableJobs();
    fetchMyJobs();
    
    // Poll for new available delivery jobs every 10 seconds
    const interval = setInterval(() => {
      fetchAvailableJobs();
      fetchMyJobs();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleAcceptJob = async (orderId) => {
    try {
      setLoading(true);
      const response = await apiFetch(`/orders/${orderId}/accept-delivery`, {
        method: 'PUT',
      });
      if (response.success) {
        alert('Delivery accepted! Please head to the restaurant for pickup.');
        fetchAvailableJobs();
        fetchMyJobs();
        setActiveTab('my-deliveries');
      }
    } catch (err) {
      alert(err.message || 'Failed to accept delivery job');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async (orderId) => {
    try {
      setLoading(true);
      const response = await apiFetch(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'delivered' }),
      });
      if (response.success) {
        alert('Order marked as DELIVERED! Thank you.');
        fetchMyJobs();
      }
    } catch (err) {
      alert(err.message || 'Failed to update delivery status');
    } finally {
      setLoading(false);
    }
  };

  const activeDeliveries = myJobs.filter(j => j.status === 'out_for_delivery');
  const pastDeliveries = myJobs.filter(j => j.status === 'delivered');

  return (
    <div className="delivery-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Rider Dispatch Center</h1>
          <p className="dashboard-subtitle">Pick up ready orders from restaurants and navigate to customer addresses.</p>
        </div>
      </div>

      <div className="tab-container">
        <button 
          className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('feed');
            fetchAvailableJobs();
          }}
        >
          Available Pickups ({availableJobs.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'my-deliveries' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('my-deliveries');
            fetchMyJobs();
          }}
        >
          My Active Deliveries ({activeDeliveries.length})
        </button>
      </div>

      {activeTab === 'feed' ? (
        /* Available Jobs Feed */
        <div>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Pickup Opportunities</h2>
          {availableJobs.length === 0 ? (
            <div className="empty-state">
              <PackageOpen size={36} className="empty-state-icon" />
              <p>No orders are currently waiting for pickup. We'll automatically fetch new jobs when they become ready.</p>
            </div>
          ) : (
            <div className="grid-cols-1-2-3">
              {availableJobs.map(job => (
                <div key={job._id} className="card">
                  <div className="card-header" style={{ backgroundColor: 'var(--color-bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Order #{job._id.substring(18)}</span>
                    <span className="badge badge-ready_for_pickup">Ready</span>
                  </div>
                  <div className="card-body">
                    {/* Restaurant details */}
                    <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase' }}>Pickup from</span>
                      <h4 style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.125rem' }}>{job.restaurant?.restaurantDetails?.name || job.restaurant?.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        <MapPin size={12} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.restaurant?.address}</span>
                      </div>
                    </div>
                    {/* Customer details */}
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Deliver to</span>
                      <h4 style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.125rem' }}>{job.user?.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        <MapPin size={12} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.deliveryAddress}</span>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ width: '100%' }}
                      onClick={() => handleAcceptJob(job._id)}
                      disabled={loading}
                    >
                      <Navigation size={14} />
                      <span>Accept & Navigate</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* My Jobs/Deliveries */
        <div>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Active Delivery Jobs</h2>
          {activeDeliveries.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '2.5rem' }}>
              You don't have any active deliveries. Accept a pickup from the dashboard feed tab.
            </p>
          ) : (
            <div className="grid-cols-1-2-3" style={{ marginBottom: '3rem' }}>
              {activeDeliveries.map(job => (
                <div key={job._id} className="card" style={{ borderColor: 'var(--color-primary)' }}>
                  <div className="card-header" style={{ backgroundColor: 'var(--color-primary-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-primary)' }}>Active Order #{job._id.substring(18)}</span>
                    <span className="badge badge-out_for_delivery">In Transit</span>
                  </div>
                  <div className="card-body">
                    {/* Restaurant Info */}
                    <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 700, textTransform: 'uppercase' }}>Store</span>
                      <h4 style={{ fontWeight: 700 }}>{job.restaurant?.restaurantDetails?.name || job.restaurant?.name}</h4>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>📍 {job.restaurant?.address}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>📞 {job.restaurant?.phone}</p>
                    </div>
                    {/* Customer Info */}
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 700, textTransform: 'uppercase' }}>Recipient</span>
                      <h4 style={{ fontWeight: 700 }}>{job.user?.name}</h4>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>📍 {job.deliveryAddress}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>📞 {job.phone}</p>
                    </div>
                  </div>
                  <div className="card-footer">
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ width: '100%', backgroundColor: 'var(--color-success)' }}
                      onClick={() => handleMarkDelivered(job._id)}
                      disabled={loading}
                    >
                      <CheckCircle size={14} />
                      <span>Confirm Delivered</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Delivery History</h2>
          {pastDeliveries.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No past deliveries recorded.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Restaurant</th>
                    <th>Customer Name</th>
                    <th>Delivery Address</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pastDeliveries.map(job => (
                    <tr key={job._id}>
                      <td>{new Date(job.updatedAt).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>{job.restaurant?.restaurantDetails?.name || job.restaurant?.name}</td>
                      <td>{job.user?.name}</td>
                      <td>{job.deliveryAddress}</td>
                      <td>
                        <span className="badge badge-delivered" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', width: 'fit-content' }}>
                          <CheckCircle size={12} />
                          <span>Delivered</span>
                        </span>
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

export default DeliveryDashboard;
