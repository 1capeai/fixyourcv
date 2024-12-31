const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).render('login', {
        title: 'Login',
        error: 'No account found with this email.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(403).render('login', {
        title: 'Login',
        error: 'Invalid password. Please try again.',
      });
    }

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Error during login:', error.message);
    return res.status(400).render('login', {
      title: 'Login',
      error: 'An error occurred while logging in. Please try again.',
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
};
