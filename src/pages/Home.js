import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const currentHour = new Date().getHours();
  const isDarkMode = currentHour < 6 || currentHour >= 20;

  let greeting = "Good morning";
  if (currentHour >= 12 && currentHour < 18) {
    greeting = "Good afternoon";
  } else if (currentHour >= 18) {
    greeting = "Good evening";
  }

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

          try {
            const response = await fetch('/api/wishlist');

            if (response.ok) {
              const data = await response.json();
              setRecentItems(data.slice(0, 3));
            }
          } catch (err) {
            console.error('Error fetching wishlist:', err);
          }
        }
      } catch (err) {
        console.error('Error checking login status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);


  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setIsLoggedIn(false);
      setUsername('');
      setRecentItems([]);
      navigate(0);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (loading) {
    return (
      <div>
        <header className="page-header">
          <h1>Welcome to Family Hub</h1>
        </header>
        <div className="loading-spinner-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <h1>Welcome to Family Hub</h1>
      </header>

      <section className="intro-text content-container">
        <h2 className="section-heading">{greeting}, {isLoggedIn ? username : 'Guest'}!</h2>
        <p>Useful tools for the whole family in one place.</p>

        {isLoggedIn ? (
          <div className="mt-15">
            <p>You are logged in. <a href="#" onClick={handleLogout} className="link-primary">Logout</a></p>
          </div>
        ) : (
          <div className="mt-15">
            <Link to="/login" className="action-button">Login</Link>
            <Link to="/register" className="action-button">Register</Link>
          </div>
        )}
      </section>

      <section id="main-content" className="content-container">
        <h2 className="section-heading">Family Hub Features</h2>
        <p>Family Hub brings together all the essential tools your family needs in one convenient place. Stay organized, connected, and informed with our easy-to-use features.</p>

        {isLoggedIn && recentItems.length > 0 && (
          <div className="mt-20">
            <h3 className="sub-heading">Your Recent Wishlist Items</h3>
            <ul className="unstyled-list">
              {recentItems.map((item, index) => (
                <li key={index} className="recent-item">
                  <strong>{item.name}</strong> - {item.category}
                  <p>{item.description || 'No description'}</p>
                </li>
              ))}
            </ul>
            <Link to="/wishlist" className="link-primary">View all wishlist items →</Link>
          </div>
        )}

        <div className="mt-20">
          <h3 className="sub-heading">Current Time</h3>
          <p>{new Date().toLocaleString()}</p>
          <p>{isDarkMode ? 'Night mode is active based on the current time.' : 'Day mode is active based on the current time.'}</p>
        </div>
      </section>

      <section className="plan-map">
        <svg viewBox="0 0 400 400" width="400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Site map">
          <Link to="/">
            <circle cx="200" cy="200" r="50" stroke="#333" fill="none"/>
            <text x="200" y="205" textAnchor="middle" className="node-text">Home</text>
          </Link>

          <Link to="/weather">
            <circle cx="200" cy="80" r="40" stroke="#333" fill="none"/>
            <text x="200" y="85" textAnchor="middle" className="node-text">Weather</text>
          </Link>

          <Link to="/wishlist">
            <circle cx="200" cy="320" r="40" stroke="#333" fill="none"/>
            <text x="200" y="325" textAnchor="middle" className="node-text">Wishlist</text>
          </Link>

          <Link to="/plans">
            <circle cx="80" cy="200" r="40" stroke="#333" fill="none"/>
            <text x="80" y="205" textAnchor="middle" className="node-text">Plans</text>
          </Link>

          <Link to="/about">
            <circle cx="320" cy="200" r="40" stroke="#333" fill="none"/>
            <text x="320" y="205" textAnchor="middle" className="node-text">About</text>
          </Link>
        </svg>
      </section>
    </div>
  );
}

export default Home;
