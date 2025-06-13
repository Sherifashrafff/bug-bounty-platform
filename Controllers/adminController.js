const catchAsync = require('../utilities/catchAsync');
const Submission = require('../models/submissionModel');
const AppError = require('../utilities/appError');
const Program = require('../models/programModel');

// Get all submissions with program names
exports.getAllSubmissions = catchAsync(async (req, res, next) => {
  const submissions = await Submission.find();
  const programs = await Program.find().select('programName');
  const programMap = new Map(programs.map(p => [p._id.toString(), p.programName]));

  const enhancedSubmissions = submissions.map(sub => {
    const programName = programMap.get(sub.programId.toString()) || 'Unknown Program';
    return {
      ...sub.toObject(),
      programName,
    };
  });

  const sortedSubmissions = enhancedSubmissions.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return a.status.localeCompare(b.status);
  });

  res.status(200).json({
    status: 'success',
    results: sortedSubmissions.length,
    data: {
      submissions: sortedSubmissions,
    },
  });
});
