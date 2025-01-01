const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists. Please log in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    console.log('Redirecting with token:', token);

    const redirectUri = `${process.env.REDIRECT_URI}?token=${token}`;
    return res.redirect(redirectUri);
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'Google account detected. Please use Google login.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(403).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    const redirectUri = `${process.env.REDIRECT_URI}?token=${token}`;
    return res.redirect(redirectUri);
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ error: 'An error occurred during login. Please try again.' });
  }
};
exports.googleLoginCallback = async (req, res) => {
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
    console.log('Redirecting to:', redirectUri);

    return res.redirect(redirectUri);
  } catch (error) {
    console.error('Error in Google OAuth callback:', error.message);
    res.status(500).send('Google login failed. Please try again.');
  }
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error during logout:', err.message);
      return res.status(500).send('Error logging out');
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/auth/login');
    });
  });
};
