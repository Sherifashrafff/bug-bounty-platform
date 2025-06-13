// controllers/programController.js
const catchAsync = require("../utilities/catchAsync");
const AppError = require("../utilities/appError");
const Program = require("../models/programModel"); // Import the Program model
const multer = require("multer");
const path = require("path");
const User = require("../models/userModel");
// Multer configuration for image upload
const programStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/programs/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const programUpload = multer({
  storage: programStorage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(
        new AppError("Only image files (jpeg, jpg, png) are allowed", 400),
        false
      );
    }
  },
});

// Middleware to export image upload function
exports.uploadProgramImage = programUpload.single("programPicture");

// Controller to handle uploaded image and add it to the program in the database
exports.addProgramImage = catchAsync(async (req, res, next) => {
  const { programId } = req.params;

  // Find the specific program by ID
  const program = await Program.findById(programId);
  if (!program) {
    return next(new AppError("Program not found", 404));
  }

  // Check if an image file is uploaded
  if (!req.file) {
    return next(new AppError("No image file uploaded", 400));
  }

  // Set the program's picture URL to the uploaded file
  program.programPicture = `${req.protocol}://${req.get(
    "host"
  )}/uploads/programs/${req.file.filename}`;

  await program.save();

  res.status(200).json({
    status: "success",
    message: "Program image uploaded successfully",
    data: {
      program,
    },
  });
});


// Original code to create a program
exports.createProgram = catchAsync(async (req, res, next) => {

  const { organization } = req;
 
  if (!organization) {

    return next(new AppError("You must be logged in to create a program", 401));

  }
 
  const {

    programName,

    programDescription,

    scope,

    outOfScope,

    validationWithin,

    rewardRange,

    programType,

    additionalInfo,

    visibility,

    invitedResearchers = [],

  } = req.body;
 
  // Validate programType

  if (!['bug bounty program', 'BBP', 'vulnerability disclosure program', 'VDP'].includes(programType)) {

    return next(new AppError("Invalid programType. Must be 'bug bounty program' or 'vulnerability disclosure program'", 400));

  }
 
  // Validate required fields for all programs

  if (

    !programName ||

    !programDescription ||

    !Array.isArray(scope) ||

    scope.length === 0

  ) {

    return next(

      new AppError(

        "Please provide required fields: programName, programDescription, and a non-empty scope array",

        400

      )

    );

  }
 
  // If it's a bug bounty program, rewardRange is required with all levels

  if (['bug bounty program', 'BBP'].includes(programType)) {

    const priorities = ['P1', 'P2', 'P3', 'P4'];

    const missing = priorities.some(

      (p) =>

        rewardRange?.[p]?.min === undefined ||

        rewardRange?.[p]?.max === undefined

    );
 
    if (missing) {

      return next(

        new AppError(

          "For bug bounty programs, rewardRange for all priorities (P1–P5 with min and max) is required",

          400

        )

      );

    }

  }
 
  // Set fallback reward range for VDP (if no rewards should be offered)

  const finalRewardRange =

    ['vulnerability disclosure program', 'VDP'].includes(programType)

      ? {

          P1: { min: 0, max: 0 },

          P2: { min: 0, max: 0 },

          P3: { min: 0, max: 0 },

          P4: { min: 0, max: 0 },

          P5: { min: 0, max: 0 },

        }

      : rewardRange;
 
  const newProgram = new Program({

    programName,

    programDescription,

    programPicture: "default-program.png",

    validationWithin: validationWithin || "3 days",

    scope,

    outOfScope: Array.isArray(outOfScope) ? outOfScope : [],

    rewardRange: finalRewardRange,

    programType,

    additionalInfo,

    visibility,

    invitedResearchers,

    organization: organization._id,

  });
 
  await newProgram.save();
 
  organization.programs.push(newProgram._id);

  await organization.save();
 
  res.status(201).json({

    status: "success",

    message: "Program created successfully",

    data: {

      program: newProgram,

    },

  });

});



exports.editProgram = catchAsync(async (req, res, next) => {
  const { programId } = req.params;

  const {
    programName,
    programDescription,
    rewards,
    programPicture,
    totalPaidRewards,
    rewardRange,
    validationWithin,
    programType,
    visibility,
    invitedResearchers,
    scope,
    outOfScope,
    programStatus,
    additionalInfo, // New field
  } = req.body;

  // Find the specific program
  const program = await Program.findById(programId);
  if (!program) {
    return next(new AppError("Program not found", 404));
  }

  // Update fields
  if (programName) program.programName = programName;
  if (programDescription) program.programDescription = programDescription;
  if (rewards) {
    if (rewards.min !== undefined) program.rewards.min = rewards.min;
    if (rewards.max !== undefined) program.rewards.max = rewards.max;
  }
  if (programPicture) program.programPicture = programPicture;
  if (totalPaidRewards !== undefined)
    program.totalPaidRewards = totalPaidRewards;

  if (rewardRange) {
    if (rewardRange.P1 !== undefined) program.rewardRange.P1 = rewardRange.P1;
    if (rewardRange.P2 !== undefined) program.rewardRange.P2 = rewardRange.P2;
    if (rewardRange.P3 !== undefined) program.rewardRange.P3 = rewardRange.P3;
    if (rewardRange.P4 !== undefined) program.rewardRange.P4 = rewardRange.P4;
    if (rewardRange.P5 !== undefined) program.rewardRange.P5 = rewardRange.P5;
  }

  if (validationWithin) program.validationWithin = validationWithin;
  if (programType) program.programType = programType;
  if (visibility) program.visibility = visibility;
  if (Array.isArray(invitedResearchers))
    program.invitedResearchers = invitedResearchers;
  if (Array.isArray(scope)) program.scope = scope;
  if (Array.isArray(outOfScope)) program.outOfScope = outOfScope;
  if (programStatus) program.programStatus = programStatus;
  if (Array.isArray(additionalInfo)) program.additionalInfo = additionalInfo;

  program.updatedAt = Date.now(); // Optional: update timestamp
  await program.save();

  res.status(200).json({
    status: "success",
    message: "Program updated successfully",
    data: {
      program: program.toObject(),
    },
  });
});

// Controller to get all programs with specific fields
// controllers/programController.js
exports.getAllPrograms = catchAsync(async (req, res, next) => {
  const userId = req.user.id; // Assuming the user ID is available in the request

  const programs = await Program.find()
    .populate("organization", "name") // Populate the organization name
    .select("programName programDescription programPicture rewardRange visibility invitedResearchers");

  // Filter programs based on visibility and invited researchers
  const allPrograms = programs.filter((program) => {
    if (program.visibility === 'private') {
      return program.invitedResearchers.includes(userId);
    }
    return true; // If the program is public, return it
  }).map((program) => ({
    programId: program._id,
    organizationName: program.organization.name,
    programName: program.programName,
    programDescription: program.programDescription,
    programPicture: program.programPicture,
    minReward: program.rewardRange?.P4?.min ?? 0,
    maxReward: program.rewardRange?.P1?.max ?? 0,
  }));

  res.status(200).json({
    status: "success",
    results: allPrograms.length,
    data: {
      programs: allPrograms,
    },
  });
});

// controllers/programController.js
exports.getProgram = catchAsync(async (req, res, next) => {
  const { programId } = req.params;

  // Find the program by ID
  const program = await Program.findById(programId).populate("organization", "name");
  if (!program) {
    return next(new AppError("Program not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      program: {
        organizationName: program.organization.name,
        ...program.toObject(), // Return all fields from the program object
      },
    },
  });
});

exports.inviteToProgram = catchAsync(async (req, res, next) => {
  const { programId } = req.params;
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Please provide an email to invite', 400));
  }
  // Find the program by ID and check visibility
  const program = await Program.findById(programId);
  if (!program) {
    return next(new AppError('Program not found', 404));
  }

  if (program.visibility !== 'private') {
    return next(new AppError('Invitations are only for private programs', 400));
  }

  // Find the user by email
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  console.log(user)

  const isAlreadyInvited =
    program.invitedResearchers.includes(user._id) ||
    user.invitedToPrograms.includes(program._id);

  if (isAlreadyInvited) {
    return next(new AppError('User is already invited to this program', 400));
  }

  // Invite user
  program.invitedResearchers.push(user._id);
  user.invitedToPrograms  .push(program._id);

  await Promise.all([program.save({ validateBeforeSave: false }), user.save({ validateBeforeSave: false })]);


  res.status(200).json({
    status: 'success',
    message: 'User invited successfully',
    data: {
      userId: user._id,
      programId: program._id,
    },
  });
});
