const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    trim: true,
  },
  username: {
    type: String,
    required: [true, "Please provide a username"],
    unique: true,
    trim: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  profilePicture: {
    type: String,
    default: "http://127.0.0.1:3000/uploads/users/1749598021684-s.jpg",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: "Passwords do not match",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: Date,
  bio: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ["hacker", "admin"],
    default: "hacker",
  },
  accuracy: {
    type: Number,
    default: 0,
  },
  reputationScore: {
    type: Number,
    default: 0,
  },
  reportsSubmitted: {
    type: Number,
    default: 0,
  },
  reportsAccepted: {
    type: Number,
    default: 0,
  },
  reportsRejected: {
    type: Number,
    default: 0,
  },
  duplicateReports: {
    type: Number,
    default: 0,
  },
  bountiesEarned: {
    type: Number,
    default: 0,
  },
  invitedToPrograms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Program" }],

  githubProfile: String,
  linkedinProfile: String,
  twitterProfile: String,
  website: String,

  accountStatus: {
    type: String,
    enum: ["active", "suspended", "banned"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
});

// Combined pre-save hook
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
    this.passwordConfirm = undefined;
    this.passwordChangedAt = Date.now() - 1000;
  }

  this.updatedAt = Date.now(); 
  next();
});

// Instance methods
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.isPasswordChanged = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; 
  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
