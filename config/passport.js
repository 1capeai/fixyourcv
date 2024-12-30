const dotenv = require('dotenv');
dotenv.config();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await User.findOneAndUpdate(
          { googleId: profile.id },
          {
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
          },
          { upsert: true, new: true }
        );
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);


// Serialize User: Stores user ID in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize User: Retrieves user data from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});

module.exports = passport;
