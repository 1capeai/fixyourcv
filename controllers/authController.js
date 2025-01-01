const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).render('register', {
        title: 'Register',
        error: 'A user with this email already exists. Please log in.',
      });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    // Generate JWT for the user
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Redirect back to app using deep linking
    const redirectUri = `${process.env.REDIRECT_URI}?token=${token}`;
    return res.redirect(redirectUri);
  } catch (error) {
    console.error('Error during registration:', error.message);
    res.status(500).render('register', {
      title: 'Register',
      error: 'Registration failed. Please try again.',
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email }).select('+password'); // Explicitly include password
    if (!user) {
      return res.status(404).render('login', { title: 'Login', error: 'User not found' });
    }

    // Check if the user registered using Google
    if (!user.password) {
      return res.status(400).render('login', {
        title: 'Login',
        error: 'Google account detected. Please use Google login.',
      });
    }

    // Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(403).render('login', { title: 'Login', error: 'Invalid credentials' });
    }

    // Generate JWT and redirect to app
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    const redirectUri = `${process.env.REDIRECT_URI}?token=${token}`;
    return res.redirect(redirectUri);
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).render('login', {
      title: 'Login',
      error: 'An error occurred. Please try again.',
    });
  }
};

exports.googleLoginCallback = async (req, res) => {
  try {
    const { userInfo } = req; // Assuming `passport` middleware injects Google user data

    // Check if the user already exists
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

    // Generate JWT for the user
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Redirect back to the app
    const redirectUri = `${process.env.REDIRECT_URI}?token=${token}`;
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
      res.clearCookie('connect.sid'); // Clear session cookie
      res.redirect('/auth/login'); // Redirect to login
    });
  });
};
