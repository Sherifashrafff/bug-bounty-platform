const multer = require("multer");
const path = require("path");
const Organization = require("../models/orgModel");
const catchAsync = require("../utilities/catchAsync");
const Submission = require("../models/submissionModel");
const AppError = require("../utilities/appError");
const Program = require("../models/programModel");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new AppError("Invalid file type. Only image files (jpeg, jpg, png, gif) and PDF files are allowed.", 400), false);
    }
  },
});

exports.uploadOrgPicture = upload.single("profilePicture");

exports.addOrgProfilePicture = catchAsync(async (req, res, next) => {
  const org = req.organization;

  if (!org) {
    return next(new AppError("User not found", 404));
  }

  if (!req.file) {
    return next(new AppError("No image file uploaded", 400));
  }

  org.profilePicture = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  await org.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Profile picture uploaded successfully",
    data: { org },
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  let organization = req.organization;

  if (!organization) {
    return next(new AppError("Organization not found", 404));
  }

  organization = await organization.populate({
    path: "programs",
    populate: {
      path: "invitedResearchers",
      select: "email",
    },
  });

  res.status(200).json({
    status: "success",
    data: {
      organization: {
        id: organization._id,
        name: organization.name,
        email: organization.email,
        profilePicture: organization.profilePicture,
        website: organization.website,
        industry: organization.industry,
        description: organization.description,
        location: organization.location,
        contactNumber: organization.contactNumber,
        programs: organization.programs,
        acceptedReports: organization.acceptedReports,
        pendingReports: organization.pendingReports,
        rejectedReports: organization.rejectedReports,
        totalBountiesPaid: organization.totalBountiesPaid,
        accountStatus: organization.accountStatus,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      },
    },
  });
});

const filterFields = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not for password updates. Please use /updateMyPassword.", 400));
  }

  const filteredBody = filterFields(
    req.body,
    "name",
    "email",
    "profilePicture",
    "website",
    "industry",
    "description",
    "location",
    "contactNumber"
  );

  const updatedOrganization = await Organization.findByIdAndUpdate(
    req.organization.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    message: "Organization profile updated successfully",
    data: {
      organization: updatedOrganization,
    },
  });
});

exports.getAllSubmissions = catchAsync(async (req, res, next) => {
  const { organization } = req;

  if (!organization) {
    return next(new AppError("Organization not found", 404));
  }

  const programs = await Program.find({ organization: organization._id });

  if (!programs || programs.length === 0) {
    return next(new AppError("No programs found for this organization", 404));
  }

  const programIds = programs.map((program) => program._id.toString());

  const acceptedSubmissions = await Submission.find({
    programId: { $in: programIds },
    status: { $in: ["triaged", "accepted", "rejected", "resolved", "unresolved", "duplicated"] }
  });

  res.status(200).json({
    status: "success",
    data: {
      organizationId: organization._id,
      organizationName: organization.name,
      totalAcceptedSubmissions: acceptedSubmissions.length,
      submissions: acceptedSubmissions,
    },
  });
});
