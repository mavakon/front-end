import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import Home from './pages/Home';
import Weather from './pages/Weather';
import Wishlist from './pages/Wishlist';
import Plans from './pages/Plans';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <Router>
      <div className="layout">
        <aside className="sidebar" role="region" aria-label="Main menu">
          <header className="sidebar-header">
            <h2>Menu</h2>
          </header>
          <nav className="menu-container" aria-label="Site navigation">
            <ul className="menu-list">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/weather">Weather</Link></li>
              <li><Link to="/wishlist">Wishlist</Link></li>
              <li><Link to="/plans">Plans</Link></li>
              <li><Link to="/about">About</Link></li>
            </ul>
          </nav>
        </aside>

        <main className="content">
          <img src="../public/images/logo.png" alt="Family Hub Logo" className="logo" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;