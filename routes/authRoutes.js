const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const passport = require('passport');
const { register, login, logout } = require('../controllers/authController');
const url = require('url');
const User = require('../models/User');

const router = express.Router();

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

router.get('/login', (req, res) => {
  res.render('login', { title: 'Login', error: null });
});

router.get('/register', (req, res) => {
  res.render('register', { title: 'Register', error: null });
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', async (req, res) => {
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

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    const redirectUri = `${process.env.REDIRECT_URI}?token=${token}`;
    res.redirect(redirectUri);
  } catch (error) {
    console.error('Error in Google OAuth callback:', error.message);
    res.status(500).json({ error: 'Google login failed.' });
  }
});

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;
