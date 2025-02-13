const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, select: false }, // Exclude password from queries by default
    googleId: { type: String, default: null }, // Allow null values, no unique constraint
    picture: { type: String }, // Profile picture URL
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('User', userSchema);
