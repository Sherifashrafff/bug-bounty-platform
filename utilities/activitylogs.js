const ActivityLog = require('../models/activityLogModel');
const Submission = require('../models/submissionModel');
const AppError = require('../utilities/appError');

// Middleware to detect and log changes in submission fields
exports.logSubmissionUpdate = async (req, res, next) => {
  const { submissionId } = req.params;
  const updatedFields = req.body;

  const submission = await Submission.findById(submissionId);
  if (!submission) {
    return next(new AppError('Submission not found', 404));
  }

  const changes = [];
  const fieldsToCheck = [
    'title',
    'description',
    'reward',
    'target',
    'category',
    'severity',
    'status',
  ];

  for (const field of fieldsToCheck) {
    if (
      Object.prototype.hasOwnProperty.call(updatedFields, field) &&
      updatedFields[field] !== undefined &&
      updatedFields[field] !== submission[field]
    ) {
      changes.push(
        `${field} changed from "${submission[field]}" to "${updatedFields[field]}"`
      );
    }
  }

  if (changes.length > 0) {
    await ActivityLog.create({
      submissionId: submission._id,
      performedBy: {
        id: req.organization?._id || req.user?._id,
        role: req.organization ? 'Organization' : 'User',
      },
      action: 'update_submission',
      message: changes.join(', '),
    });
  }

  next();
};
