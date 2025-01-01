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
router.get('/google/callback', async (req, res) => {
  console.log('OAuth callback hit');
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);

    const userInfoResponse = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
    });

    const userInfo = userInfoResponse.data;
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

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture,
    };

    console.log('Session after Google login:', req.session);

    const redirectUri = `${process.env.REDIRECT_URI}?token=${tokens.id_token}`;
    return res.redirect(redirectUri);
  } catch (error) {
    console.error('Error in Google OAuth Callback:', error);
    res.status(500).render('500', { title: 'Internal Server Error' });
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
