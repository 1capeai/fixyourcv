const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    const redirectUri = `${process.env.REDIRECT_URI}?token=${token}`;
    return res.redirect(redirectUri);
  } catch (error) {
    console.error('Error during registration:', error.message);
    res.status(400).render('register', {
      title: 'Register',
      error: 'Registration failed. Please try again.',
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

exports.googleLoginCallback = async (req, res) => {
  try {
    // Get user information from Google OAuth callback
    const { userInfo } = req; // Assuming `passport` middleware injects the Google user data

    let user = await User.findOne({ email: userInfo.email });
    if (!user) {
      // If user doesn't exist, create a new user
      user = new User({
        name: userInfo.name,
        email: userInfo.email,
        googleId: userInfo.googleId,
        picture: userInfo.picture,
      });
      await user.save();
    }

    // Store user info in session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture,
    };

    console.log('Session after Google login:', req.session);

    // Redirect to the dashboard
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).send('Failed to save session');
      }

      // Redirect back to mobile app deep link or dashboard
      const redirectUri = `${process.env.REDIRECT_URI}?token=${jwt.sign({ id: user._id }, process.env.JWT_SECRET)}`;
      res.redirect(redirectUri);
    });
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    res.status(500).send('Google login failed');
  }
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).send('Error logging out');
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid'); // Clear session cookie
      res.redirect('/auth/login'); // Redirect to login after logout
    });
  });
};
