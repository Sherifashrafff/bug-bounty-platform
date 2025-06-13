const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const Organization = require('../models/orgModel');
const AppError = require('../utilities/appError');
const catchAsync = require('../utilities/catchAsync');
const sendEmail = require('../utilities/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

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
  res.set('Authorization', `Bearer ${token}`);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res) => {
  const newOrg = await Organization.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    profilePicture: req.body.profilePicture,
    website: req.body.website,
    industry: req.body.industry,
    description: req.body.description,
    location: req.body.location,
    contactNumber: req.body.contactNumber,
  });

  createSendToken(newOrg, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const organization = await Organization.findOne({
    email: email.toLowerCase(),
  }).select('+password');

  if (
    !organization ||
    !(await organization.correctPassword(password, organization.password))
  ) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(organization, 200, res);
});

exports.restrictedTo =
  (...roles) =>
    (req, res, next) => {
      if (!roles.includes(req.organization.role)) {
        return next(
          new AppError('You do not have permission to perform this action', 403)
        );
      }
      next();
    };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const organization = await Organization.findOne({ email });
  if (!organization) {
    return next(new AppError('Organization not found', 404));
  }

  const resetToken = organization.createPasswordResetToken();
  await organization.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/organizations/resetPassword/${resetToken}`;
  const message = `Forgot Your Password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\nIf you didn't request a password reset, please ignore this email.`;

  try {
    await sendEmail({
      email: organization.email,
      subject: 'Your Password Reset Token (valid for 10 minutes)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
      resetToken,
    });
  } catch (err) {
    organization.passwordResetToken = undefined;
    organization.passwordResetExpires = undefined;
    await organization.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later.',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const organization = await Organization.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!organization) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  organization.password = req.body.password;
  organization.passwordConfirm = req.body.passwordConfirm;
  organization.passwordResetToken = undefined;
  organization.passwordResetExpires = undefined;
  await organization.save();

  createSendToken(organization, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const organization = await Organization.findById(req.organization.id).select(
    '+password'
  );

  if (
    !(await organization.correctPassword(
      req.body.passwordCurrent,
      organization.password
    ))
  ) {
    return next(new AppError('Your current password is incorrect', 401));
  }

  organization.password = req.body.password;
  organization.passwordConfirm = req.body.passwordConfirm;
  await organization.save();

  createSendToken(organization, 200, res);
});
