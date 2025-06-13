const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide the organization name"],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide a contact email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },
  profilePicture: {
    type: String,
    default: "../uploads/users/defaultUser.png",
  },
  website: {
    type: String,
    validate: {
      validator: validator.isURL,
      message: "Please enter a valid website URL",
    },
  },
  industry: String,
  description: {
    type: String,
    maxlength: 500,
  },
  location: String,
  contactNumber: String,
  role: { type: String, default: "Organization" },
  totalBountiesPaid: { type: Number, default: 0 },

  accountStatus: {
    type: String,
    enum: ["active", "suspended", "banned"],
    default: "active",
  },
  programs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program", 
    },
  ],
  passwordChangedAt: { type: Date, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

organizationSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

organizationSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

organizationSchema.methods.isPasswordChanged = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changeTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changeTimestamp;
  }
  return false;
};

organizationSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const Organization = mongoose.model("Organization", organizationSchema);
module.exports = Organization;
