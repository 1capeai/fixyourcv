const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, select: false }, // Excludes password from queries by default for security
    googleId: { type: String, unique: true }, // Ensure Google ID is unique
    avatar: { type: String }, // To store profile picture URL if needed
    createdAt: { type: Date, default: Date.now }, // Track user creation time
    updatedAt: { type: Date, default: Date.now }, // Track updates
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

userSchema.pre('save', function (next) {
  this.updatedAt = Date.now(); // Update the timestamp before saving
  next();
});

module.exports = mongoose.model('User', userSchema);
