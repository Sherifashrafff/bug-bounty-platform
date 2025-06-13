const catchAsync = require('../utilities/catchAsync');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const Organization = require('../models/orgModel');
const AppError = require('../utilities/appError');

exports.eitherAuthProtect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You must be logged in first to get access', 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);
  if (user) {
    req.user = user;
    return next();
  }

  const org = await Organization.findById(decoded.id);
  if (org) {
    req.organization = org;
    return next();
  }

  return next(
    new AppError('Invalid token or user/organization not found', 401)
  );
});
