require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname)));

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const WISHLIST_FILE = path.join(DATA_DIR, 'wishlists.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({
    users: [
      { id: 1, username: "user1", password: bcrypt.hashSync("pass1", 10) },
      { id: 2, username: "user2", password: bcrypt.hashSync("pass2", 10) }
    ]
  }));
}

if (!fs.existsSync(WISHLIST_FILE)) {
  fs.writeFileSync(WISHLIST_FILE, JSON.stringify({
    wishlists: {
      "user1": [
        { name: "Socks", description: "Warm winter socks", category: "clothing" },
        { name: "Toy Helicopter", description: "Remote controlled helicopter", category: "toy" }
      ],
      "user2": [
        { name: "Book", description: "Science fiction novel", category: "book" },
        { name: "Sweater", description: "Blue wool sweater", category: "clothing" }
      ]
    }
  }));
}

function getUsers() {
  const data = fs.readFileSync(USERS_FILE, 'utf8');
  return JSON.parse(data).users;
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2));
}

function getWishlists() {
  const data = fs.readFileSync(WISHLIST_FILE, 'utf8');
  return JSON.parse(data).wishlists;
}

function saveWishlists(wishlists) {
  fs.writeFileSync(WISHLIST_FILE, JSON.stringify({ wishlists }, null, 2));
}

function authenticate(req, res, next) {
  const username = req.cookies.username;
  if (!username) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = user;
  next();
}

// Routes
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const users = getUsers();

  if (users.some(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const newUser = {
    id: users.length + 1,
    username,
    password: bcrypt.hashSync(password, 10)
  };

  users.push(newUser);
  saveUsers(users);

  const wishlists = getWishlists();
  wishlists[username] = [];
  saveWishlists(wishlists);

  res.cookie('username', username, { maxAge: 900000, httpOnly: false, path: '/', sameSite: 'lax' });
  res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const users = getUsers();
  const user = users.find(u => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.cookie('username', username, { maxAge: 900000, httpOnly: false, path: '/', sameSite: 'lax' });
  res.status(200).json({ message: 'Login successful' });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('username', { path: '/', sameSite: 'lax' });
  res.status(200).json({ message: 'Logout successful' });
});

app.get('/api/wishlist', authenticate, (req, res) => {
  const wishlists = getWishlists();
  const userWishlist = wishlists[req.user.username] || [];
  res.json(userWishlist);
});

app.post('/api/wishlist', authenticate, (req, res) => {
  const { name, description, category } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Item name is required' });
  }

  const wishlists = getWishlists();
  const userWishlist = wishlists[req.user.username] || [];

  userWishlist.push({ name, description, category });
  wishlists[req.user.username] = userWishlist;

  saveWishlists(wishlists);
  res.status(201).json({ message: 'Item added successfully' });
});

app.delete('/api/wishlist/:index', authenticate, (req, res) => {
  const index = parseInt(req.params.index);

  const wishlists = getWishlists();
  const userWishlist = wishlists[req.user.username] || [];

  if (index < 0 || index >= userWishlist.length) {
    return res.status(404).json({ error: 'Item not found' });
  }

  userWishlist.splice(index, 1);
  wishlists[req.user.username] = userWishlist;

  saveWishlists(wishlists);
  res.status(200).json({ message: 'Item removed successfully' });
});

app.get('/', (req, res) => {
  const username = req.cookies.username;

  if (username) {
    const users = getUsers();
    const userExists = users.some(u => u.username === username);
    if (!userExists) {
      res.clearCookie('username', { path: '/', sameSite: 'lax' });
      return res.redirect('/');
    }
  }

  let htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

  if (username) {
    const welcomeSection = `
      <section class="welcome-section">
        <h2>Welcome back, ${username}!</h2>
        <p>You are logged in. <a href="#" id="logout-link">Logout</a></p>
      </section>
    `;
    htmlContent = htmlContent.replace('<section class="intro-text">', `<section class="intro-text">${welcomeSection}`);
  } else {
    const loginSection = `
      <section class="login-section">
        <h2>Login or Register</h2>
        <p>Please <a href="/login.html">login</a> or <a href="/register.html">register</a> to access all features.</p>
      </section>
    `;
    htmlContent = htmlContent.replace('<section class="intro-text">', `<section class="intro-text">${loginSection}`);
  }

  const hour = new Date().getHours();
  const isDarkMode = hour < 6 || hour >= 20;

  if (isDarkMode) {
    const darkModeStyle = `
      <style>
        body { background-color: #222; color: #eee; }
        .sidebar { background-color: #333; }
        .content { background-color: #444; }
        a { color: #9cf; }
        a:hover { color: #cef; }
      </style>
    `;
    htmlContent = htmlContent.replace('</head>', `${darkModeStyle}</head>`);
  }

  res.send(htmlContent);
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/api/weather-key', (req, res) => {
  res.json({ key: process.env.WEATHER_API_KEY });
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
