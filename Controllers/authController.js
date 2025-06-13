const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utilities/appError');
const catchAsync = require('../utilities/catchAsync');
const sendEmail = require('../utilities/email');

// Generate JWT Token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// Send JWT Token in Cookie and Response
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  user.password = undefined;

  res.cookie('jwt', token, cookieOptions);
  //res.set('Authorization', `Bearer ${token}`);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// User Signup
exports.signup = catchAsync(async (req, res) => {
  const newUser = await User.create({
    fullName: req.body.fullName,
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  createSendToken(newUser, 201, res);
});

// User Login
exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(`Incorrect email or Password`, 401));
  }

  createSendToken(user, 200, res);
};

// Role-Based Access Control
exports.restrictedTo =
  (...roles) =>
    (req, res, next) => {
      if (!req.user || !req.user.role) {
        return next(new AppError('User role not found. Access denied.', 401));
      }
      if (!roles.includes(req.user.role)) {
        return next(
          new AppError(
            `You do not have permission to perform this action. Required role(s): ${roles.join(', ')}.`,
            403
          )
        );
      }
      next();
    };

// Forgot Password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot Your Password? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}\nIf you didn't forget your password, ignore this message.`;

  try {
    await sendEmail({
      email: user.email,
      message,
      subject: `Your Password Reset Token, 'only valid for 10 minutes'`,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
      resetToken,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('There was an error sending the email', 500));
  }
});

// Reset Password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has been expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});

// Update Password for Logged-In User
exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your Current Password is Wrong'), 401);
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});
