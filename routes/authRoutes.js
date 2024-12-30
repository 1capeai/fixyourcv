const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const passport = require('passport');
const { register, login, logout } = require('../controllers/authController');
const url = require('url');

const router = express.Router();

// Google OAuth Client Setup
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Render Login Page
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login' }); // Renders the login page
});

// Render Registration Page
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register' }); // Renders the register page
});

// Google OAuth Login
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'], // Request profile and email access
  })
);

// Google OAuth Callback
router.get('/google/callback', async (req, res, next) => {
  try {
    const q = url.parse(req.url, true).query;

    if (q.error) {
      console.error('OAuth Error:', q.error);
      return res.status(400).send(`OAuth Error: ${q.error}`);
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(q.code);
    oauth2Client.setCredentials(tokens);

    // Retrieve user info from Google API
    const userInfoResponse = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
    });

    const userInfo = userInfoResponse.data;

    // Optionally, store user info in session or database
    req.session.user = {
      id: userInfo.id,
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture,
    };

    console.log('User Info:', userInfo);

    // Redirect to dashboard or any authenticated page
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error in Google OAuth Callback:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Dashboard Route
// Dashboard Route
router.get('/dashboard', (req, res) => {
  if (req.session && req.session.user) {
    res.render('dashboard', {
      title: 'Dashboard',
      name: req.session.user.name,
      email: req.session.user.email,
      picture: req.session.user.picture,
    });
  } else {
    res.redirect('/auth/login');
  }
});


// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error logging out:', err);
      return res.status(500).send('Error logging out');
    }
    req.session.destroy(() => {
      res.redirect('/auth/login'); // Redirect to login page
    });
  });
});

// Custom Authentication: Registration
router.post('/register', register);

// Custom Authentication: Login
router.post('/login', login);

// Custom Authentication: Logout
router.post('/logout', logout);

module.exports = router;
