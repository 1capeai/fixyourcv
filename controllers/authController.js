const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ensure you have a User model defined

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error registering user', error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(403).json({ message: 'Invalid credentials' });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ token, user });
  } catch (error) {
    res.status(400).json({ message: 'Error logging in', error: error.message });
  }
};

exports.logout = (req, res) => {
  req.logout();
  res.status(200).json({ message: 'Logged out successfully' });
};
