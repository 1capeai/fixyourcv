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

    // Hash password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    // Store user info in session after registration
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    console.log('User session after registration:', req.session.user); // Debugging session

    // Redirect to dashboard
    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Error during registration:', error.message);
    return res.status(400).render('register', {
      title: 'Register',
      error: 'An error occurred while registering. Please try again.',
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password'); // Fetch user and password explicitly
    if (!user) {
      return res.status(404).render('login', { title: 'Login', error: 'User not found' });
    }

    if (!user.password) {
      return res.status(400).render('login', { title: 'Login', error: 'Google account detected. Use Google login.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(403).render('login', { title: 'Login', error: 'Invalid credentials' });
    }

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    console.log('Session after manual login:', req.session);

    // Redirect to the dashboard
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).render('login', { title: 'Login', error: 'Session saving failed' });
      }
      res.redirect('/dashboard');
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).render('login', { title: 'Login', error: 'An error occurred. Please try again.' });
  }
};


exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).send('Error logging out');
    }
    req.session.destroy(() => {
      res.redirect('/auth/login'); // Redirect to login after logout
    });
  });
};
