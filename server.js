const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const MongoStore = require('connect-mongo');
const cors = require('cors');

dotenv.config();

const app = express();

// CORS Configuration
app.use(
  cors({
    origin: ['https://fixyourcv.onrender.com', 'http://localhost:19006'], // Add your frontend and local domains
    credentials: true, // Allow cookies in cross-origin requests
  })
);

// Middleware
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session Configuration
app.use(
  session({
    secret: process.env.JWT_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.DB_URL,
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'none', // Allow cross-origin cookies
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Database Connection
connectDB();

// Routes
app.use('/auth', authRoutes);

// Dashboard Route
app.get('/dashboard', (req, res) => {
  if (req.session && req.session.user) {
    res.render('dashboard', {
      title: 'Dashboard',
      name: req.session.user.name,
      email: req.session.user.email,
      picture: req.session.user.picture || '/images/default-avatar.png',
    });
  } else {
    console.log('Unauthorized access to dashboard. Redirecting to login.');
    res.redirect('/auth/login'); // Redirect to login if not authenticated
  }
});

// Default Home Route
app.get('/', (req, res) => {
  res.render('home', { title: 'Home' });
});

// 404 Error Handling
app.use((req, res, next) => {
  console.error(`404 Error: ${req.originalUrl} not found.`);
  res.status(404).render('404', { title: '404 - Page Not Found' });
});

// General Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err.stack);
  res.status(500).render('500', { title: '500 - Internal Server Error' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('==> Your service is live 🎉');
});
