require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const app = express();
const PORT = process.env.PORT || 3000;

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

const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Family Hub</title>
  <link href="https://fonts.cdnfonts.com/css/cocon" rel="stylesheet">
  <link rel="stylesheet" href="public/style.css">
</head>
<body>
  <div id="root"></div>
  <script src="/bundle.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), indexHtml);

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.includes('.')) {
    return next();
  }

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/weather-key', (req, res) => {
  res.json({ key: process.env.WEATHER_API_KEY });
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
