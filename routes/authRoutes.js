const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const passport = require('passport');
const { register, login, logout } = require('../controllers/authController');
const url = require('url');
const User = require('../models/User'); // Ensure you have a User model defined

const router = express.Router();

// Google OAuth Client Setup
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Render Login Page
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login', error: null });
});

// Render Registration Page
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register', error: null });
});

// Google OAuth Login
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'], // Request profile and email access
  })
);

// Google OAuth Callback
router.get('/google/callback', async (req, res) => {
  console.log('OAuth callback hit');
  try {
    const q = url.parse(req.url, true).query;

    if (q.error) {
      console.error('OAuth Error:', q.error);
      return res.status(400).render('login', { title: 'Login', error: `OAuth Error: ${q.error}` });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(q.code);
    oauth2Client.setCredentials(tokens);

    // Retrieve user info from Google API
    const userInfoResponse = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
    });

    const userInfo = userInfoResponse.data;

    // Check if user exists or create a new user
    let user = await User.findOne({ email: userInfo.email });
    if (!user) {
      user = new User({
        name: userInfo.name,
        email: userInfo.email,
        googleId: userInfo.id,
        picture: userInfo.picture,
      });
      await user.save();
    }

    // Store user info in session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      picture: userInfo.picture || '/images/default-avatar.png',
    };

    console.log('Session after Google login:', req.session); // Debug log

    // Force session save and redirect
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).render('500', { title: '500 - Internal Server Error' });
      }
      res.redirect('/dashboard');
    });
  } catch (error) {
    console.error('Error in Google OAuth Callback:', error);
    res.status(500).render('500', { title: '500 - Internal Server Error' });
  }
});

// Dashboard Route
router.get('/dashboard', (req, res) => {
  console.log('Session during dashboard access:', req.session); // Debugging log
  if (req.session && req.session.user) {
    res.render('dashboard', {
      title: 'Dashboard',
      name: req.session.user.name,
      email: req.session.user.email,
      picture: req.session.user.picture || '/images/default-avatar.png',
    });
  } else {
    console.log('No session found, redirecting to login.');
    res.redirect('/auth/login'); // Redirect if session is missing
  }
});

// Logout Route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error logging out:', err);
      return res.status(500).send('Error logging out');
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid'); // Clear session cookie
      res.redirect('/auth/login'); // Redirect to login page
    });
  });
});


// Custom Registration Route
router.post('/register', async (req, res) => {
  try {
    await register(req, res);
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(400).render('register', { title: 'Register', error: error.message });
  }
});

// Custom Login Route
router.post('/login', async (req, res) => {
  try {
    await login(req, res);
  } catch (error) {
    console.error('Error during login:', error);
    res.status(400).render('login', { title: 'Login', error: error.message });
  }
});

// Custom Logout Route
router.post('/logout', async (req, res) => {
  try {
    await logout(req, res);
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).send('Error logging out');
  }
});

module.exports = router;
