const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
const app = express();

// Middleware
app.set('view engine', 'ejs'); // Set EJS as the view engine
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data
app.use(express.static('public')); // Serve static files

app.use(
  session({
    secret: process.env.JWT_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      httpOnly: true,
    },
  })
);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Database Connection
connectDB();

// Mount Auth Routes
app.use('/auth', authRoutes);

// Add the dashboard route
app.get('/dashboard', (req, res) => {
  if (req.session && req.session.user) {
    res.render('dashboard', {
      title: 'Dashboard',
      name: req.session.user.name,
      email: req.session.user.email,
      picture: req.session.user.picture,
    });
  } else {
    res.redirect('/auth/login'); // Redirect to login if not authenticated
  }
});

// Default route
app.get('/', (req, res) => {
  res.render('home', { title: 'Home' });
});

// 404 Error Handling
app.use((req, res, next) => {
  res.status(404).render('404', { title: '404 - Page Not Found' });
});

// General Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { title: '500 - Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
