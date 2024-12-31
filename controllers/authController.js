const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
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
    res.redirect('/dashboard');
  } catch (error) {
    res.status(400).render('register', { title: 'Register', error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).render('login', { title: 'Login', error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(403).render('login', { title: 'Login', error: 'Invalid credentials' });

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    res.redirect('/dashboard');
  } catch (error) {
    res.status(400).render('login', { title: 'Login', error: error.message });
  }
};

exports.logout = (req, res) => {
  req.logout();
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
};
