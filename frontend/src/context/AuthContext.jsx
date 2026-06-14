import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'https://delivery-application-jb5l.onrender.com/';

  // Check if user session exists in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('food_delivery_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        localStorage.removeItem('food_delivery_user');
      }
    }
    setLoading(false);
  }, []);

  // Standard API call helper that includes headers and error handling
  const apiFetch = async (endpoint, options = {}) => {
    setError(null);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Auto-append Auth token if available
      if (user && user.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setUser(data.data);
      localStorage.setItem('food_delivery_user', JSON.stringify(data.data));
      setLoading(false);
      return data.data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setUser(data.data);
      localStorage.setItem('food_delivery_user', JSON.stringify(data.data));
      setLoading(false);
      return data.data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('food_delivery_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
};
