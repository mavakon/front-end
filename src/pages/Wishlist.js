import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Loading Spinner Component
function LoadingSpinner() {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  );
}

function LoginForm({ setIsLoggedIn, setUsername, isDarkMode }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    return () => {
      document.body.classList.remove('dark-mode');
    };
  }, [isDarkMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setUsername(formData.username);
      setIsLoggedIn(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="text-center" style={{ marginBottom: '20px' }}>Login to Your Wishlist</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter your username"
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter your password"
            required
          />
        </div>

        <button 
          type="submit" 
          className="form-button"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="text-center mt-20">
        Don't have an account? <Link to="/register" className="link-primary">Register</Link>
      </p>

      <div className="text-center mt-20" style={{ fontSize: '14px' }}>
        <p>Demo accounts: user1/pass1 or user2/pass2</p>
      </div>
    </div>
  );
}

function WishlistManager({ username, setIsLoggedIn, isDarkMode }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'toy'
  });
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    return () => {
      document.body.classList.remove('dark-mode');
    };
  }, [isDarkMode]);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await fetch('/api/wishlist');

        if (!response.ok) {
          if (response.status === 401) {
            setIsLoggedIn(false);
            return;
          }
          throw new Error('Failed to fetch wishlist');
        }

        const data = await response.json();
        setWishlistItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [setIsLoggedIn]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || formData.name.length < 3) {
      setFormError('Item name must be at least 3 characters');
      return;
    }

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      const updatedResponse = await fetch('/api/wishlist');
      const updatedData = await updatedResponse.json();
      setWishlistItems(updatedData);

      setFormData({
        name: '',
        description: '',
        category: 'toy'
      });
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (index) => {
    try {
      const response = await fetch(`/api/wishlist/${index}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      const updatedResponse = await fetch('/api/wishlist');
      const updatedData = await updatedResponse.json();
      setWishlistItems(updatedData);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setIsLoggedIn(false);
      navigate('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="content-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Welcome, {username}!</h2>
        <button onClick={handleLogout} className="action-button" style={{ backgroundColor: isDarkMode ? '#d35400' : '#e74c3c' }}>
          Logout
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="content-container" style={{ backgroundColor: isDarkMode ? '#444' : '#f5f5f5', marginBottom: '30px' }}>
        <h3 className="section-heading">Add New Item</h3>
        {formError && <div className="error-message">{formError}</div>}

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Item Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter item name (min 3 characters)"
              required
            />
          </div>

          <div>
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter a description"
            />
          </div>

          <div>
            <label htmlFor="category">Category:</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-input"
            >
              <option value="toy">Toy</option>
              <option value="book">Book</option>
              <option value="clothing">Clothing</option>
            </select>
          </div>

          <button type="submit" className="action-button">
            Add to Wishlist
          </button>
        </form>
      </div>

      <div>
        <h3 className="section-heading">Your Wishlist Items</h3>
        {wishlistItems.length === 0 ? (
          <p>No items in your wishlist yet.</p>
        ) : (
          <ul className="unstyled-list">
            {wishlistItems.map((item, index) => (
              <li key={index} className="recent-item" style={{ padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>{item.name}</h4>
                  <span 
                    className="category-badge"
                    style={{ 
                      backgroundColor: isDarkMode ? '#2c3e50' : '#ecf0f1',
                      color: isDarkMode ? '#ecf0f1' : '#2c3e50'
                    }}
                  >
                    {item.category}
                  </span>
                </div>
                <p style={{ margin: '10px 0' }}>{item.description || 'No description provided'}</p>
                <button 
                  onClick={() => handleDelete(index)} 
                  className="action-button"
                  style={{ 
                    padding: '5px 10px', 
                    backgroundColor: isDarkMode ? '#c0392b' : '#e74c3c',
                    marginTop: '10px'
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Wishlist() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentHour = new Date().getHours();
  const isDarkMode = currentHour < 6 || currentHour >= 20;

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    return () => {
      document.body.classList.remove('dark-mode');
    };
  }, [isDarkMode]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const cookies = document.cookie.split(';');
        const usernameCookie = cookies.find(cookie => cookie.trim().startsWith('username='));

        if (usernameCookie) {
          const user = usernameCookie.split('=')[1];
          setUsername(user);
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error('Error checking login status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <div>
      <header className="page-header">
        <h1>Shared Wishlist</h1>
      </header>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="wishlist-container">
          {isLoggedIn ? (
            <WishlistManager username={username} setIsLoggedIn={setIsLoggedIn} isDarkMode={isDarkMode} />
          ) : (
            <LoginForm setIsLoggedIn={setIsLoggedIn} setUsername={setUsername} isDarkMode={isDarkMode} />
          )}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
