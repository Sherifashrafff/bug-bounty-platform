const catchAsync = require("../utilities/catchAsync");
const AppError = require("../utilities/appError");
const User = require("../models/userModel");
const Submission = require("../models/submissionModel");
const multer = require("multer");
const path = require("path");

const filterFields = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};
exports.getTopUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({ reputationScore: { $gt: 10 } }).select(
    "username email reputationScore"
  );

  if (!users || users.length === 0) {
    return next(
      new AppError("No users found with points greater than 10", 404)
    );
  }

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  const filteredBody = filterFields(
    req.body,
    "fullName",
    "username",
    "githubProfile",
    "linkedinProfile",
    "twitterProfile",
    "website",
    "bio" 
  );

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    message: "User profile updated successfully",
    data: {
      user: updatedUser,
    },
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const user = req.user;

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  let accuracy = 0;
  if (user.reportsSubmitted > 0) {
    accuracy = ((user.reportsAccepted / user.reportsSubmitted) * 100).toFixed(
      2
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      user: {
        id: user._id,
        profilePicture: user.profilePicture,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        reputationScore: user.reputationScore,
        reportsSubmitted: user.reportsSubmitted,
        reportsAccepted: user.reportsAccepted,
        reportsRejected: user.reportsRejected,
        duplicateReports: user.duplicateReports,
        bountiesEarned: user.bountiesEarned,
        accuracy: parseFloat(accuracy), 
        githubProfile: user.githubProfile,
        linkedinProfile: user.linkedinProfile,
        twitterProfile: user.twitterProfile,
        website: user.website,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
  });
});

exports.getUserReports = catchAsync(async (req, res, next) => {
  const { user } = req; 
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  const submissions = await Submission.find({
    $or: [
      { user: user._id }, 
      { collaborators: user.email }, 
    ],
  });

  if (!submissions || submissions.length === 0) {
    return next(new AppError("No reports found for this user", 404));
  }

  res.status(200).json({
    status: "success",
    message: "User submissions fetched successfully",
    data: {
      length: submissions.length,
      submissions,
    },
  });
});
exports.getInvitedPrivatePrograms = catchAsync(async (req, res, next) => {
  const { user } = req;

  if (!user) {
    return next(new AppError("User not authenticated", 401));
  }

  const populatedUser = await User.findById(user._id).populate({
    path: "invitedToPrograms",
    match: { visibility: "private" },
    populate: {
      path: "organization",
      select: "name",
    },
  });

  const programs = populatedUser.invitedToPrograms.map((program) => ({
    programId: program._id,
    programName: program.programName,
    programDescription: program.programDescription,
    organizationName: program.organization?.name || "Unknown",
    programPicture: program.programPicture,
    minReward: program.rewardRange?.P4?.min ?? 0,
    maxReward: program.rewardRange?.P1?.max ?? 0,
  }));

  res.status(200).json({
    status: "success",
    results: programs.length,
    data: {
      programs,
    },
  });
});

const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/users/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const userUpload = multer({
  storage: userStorage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(
        new AppError("Only image files (jpeg, jpg, png) are allowed", 400),
        false
      );
    }
  },
});

exports.uploadUserProfilePicture = userUpload.single("profilePicture");

exports.addUserProfilePicture = catchAsync(async (req, res, next) => {
  const user = req.user;

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (!req.file) {
    return next(new AppError("No image file uploaded", 400));
  }

  user.profilePicture = `${req.protocol}://${req.get("host")}/uploads/users/${
    req.file.filename
  }`;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Profile picture uploaded successfully",
    data: { user },
  });
});
