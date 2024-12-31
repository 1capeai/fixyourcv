const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true }, // Unique and required for user identification
    password: { type: String, select: false }, // Excluded by default from queries for security
    googleId: { type: String, unique: true }, // Ensure each Google ID is unique
    avatar: { type: String }, // Stores profile picture URL (optional for Google OAuth users)
    createdAt: { type: Date, default: Date.now }, // Tracks user registration time
    updatedAt: { type: Date, default: Date.now }, // Tracks when the document was last updated
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  }
);

// Middleware to update `updatedAt` before saving changes
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
