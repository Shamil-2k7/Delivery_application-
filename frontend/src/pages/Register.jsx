import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Register = ({ setCurrentPage }) => {
  const { register } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user',
    address: '',
    restaurantName: '',
    cuisine: '',
    description: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    name,
    email,
    password,
    phone,
    role,
    address,
    restaurantName,
    cuisine,
    description,
  } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await register(formData);
      setCurrentPage('dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <h2 className="form-title">Create Account</h2>
      <p className="form-subtitle">Register to explore, host, or deliver delicious food.</p>

      {errorMsg && (
        <div className="alert alert-danger" role="alert">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={handleChange}
            placeholder="John Doe"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleChange}
            placeholder="john@example.com"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={handleChange}
            placeholder="Minimum 6 characters"
            className="form-input"
            minLength={6}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={phone}
            onChange={handleChange}
            placeholder="+1 234 567 890"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="address">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={address}
            onChange={handleChange}
            placeholder="123 Main St, City, Country"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="role">I want to register as a</label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={handleChange}
            className="form-select"
          >
            <option value="user">Customer (Order Food)</option>
            <option value="restaurant">Restaurant (Manage Menu & Orders)</option>
            <option value="delivery">Delivery Partner (Deliver Orders)</option>

          </select>
        </div>

        {role === 'restaurant' && (
          <fieldset style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem' }}>
            <legend style={{ padding: '0 0.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-primary)' }}>Restaurant Details</legend>

            <div className="form-group">
              <label className="form-label" htmlFor="restaurantName">Restaurant Name</label>
              <input
                type="text"
                id="restaurantName"
                name="restaurantName"
                value={restaurantName}
                onChange={handleChange}
                placeholder="Delicious Italian Pizza"
                className="form-input"
                required={role === 'restaurant'}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cuisine">Cuisines Offered</label>
              <input
                type="text"
                id="cuisine"
                name="cuisine"
                value={cuisine}
                onChange={handleChange}
                placeholder="Italian, Pizza, Pasta"
                className="form-input"
                required={role === 'restaurant'}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">Short Description</label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={handleChange}
                placeholder="We serve authentic brick-oven wood-fired pizzas."
                className="form-input"
                rows={3}
                required={role === 'restaurant'}
              />
            </div>
          </fieldset>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <div className="form-footer">
        Already have an account?{' '}
        <span className="form-link" onClick={() => setCurrentPage('login')}>
          Log in here
        </span>
      </div>
    </div>
  );
};

export default Register;
