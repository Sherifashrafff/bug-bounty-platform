const multer = require("multer");
  const catchAsync = require("../utilities/catchAsync");
  const AppError = require("../utilities/appError");
  const Submission = require("../models/submissionModel");
  const Program = require("../models/programModel");
  const Organization = require("../models/orgModel");
  const User = require("../models/userModel");
  const path = require("path");
 
  // Configure multer
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });
 
  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      const filetypes = /jpeg|jpg|png|gif|pdf/;
      const extname = filetypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      const mimetype = filetypes.test(file.mimetype);
      if (extname && mimetype) cb(null, true);
      else cb(new AppError("Only image and PDF files are allowed", 400));
    },
  });
 
  // Get submission by ID
  exports.getSubmissionById = catchAsync(async (req, res, next) => {
    const submission = await Submission.findById(req.params.submissionId);
    if (!submission) return next(new AppError("Submission not found", 404));
 
    const enhancedFiles = submission.files.map((file) => {
      return {
        ...file.toObject(),
        filePath: file.filePath || `${req.protocol}://${req.get("host")}/uploads/${file.fileName}`,
      };
    });
 
    const enhancedSubmission = submission.toObject();
    enhancedSubmission.files = enhancedFiles;
 
    res.status(200).json({
      status: "success",
      message: "Submission fetched successfully",
      data: { submission: enhancedSubmission },
    });
  });
 
 
  // Create submission
  exports.createSubmission = [
    upload.array("files"),
    catchAsync(async (req, res, next) => {
      const { user } = req;
      const { programId } = req.params;
      const {
        title,
        description,
        target,
        category,
        vulnerableUrl,
        collaborators = [],
      } = req.body;
 
      if (!user) return next(new AppError("User not found", 404));
 
      const program = await Program.findById(programId);
      if (!program) return next(new AppError("Program not found", 404));
 
      const programName = program.programName;
 
      const files = req.files
        ? req.files.map((file) => ({
            fileName: file.filename,
            fileSize: file.size,
            filePath: `http://127.0.0.1:3000/${file.filename}`,
          }))
        : [];
 
      let collaboratorEmails = [];
      try {
        collaboratorEmails =
          typeof collaborators === "string"
            ? JSON.parse(collaborators)
            : collaborators;
      } catch (err) {
        return next(new AppError("Invalid format for collaborators field", 400));
      }
 
      const submission = await Submission.create({
        user: user._id,
        userName: user.username,
        programId,
        programName,
        title,
        description,
        target,
        category,
        vulnerableUrl,
        collaborators: collaboratorEmails,
        files,
      });
 
      program.reportCount += 1;
      user.reportsSubmitted += 1;
 
      await program.save();
      await user.save({ validateBeforeSave: false });
 
      res.status(201).json({
        status: "success",
        message: "Submission created successfully",
        data: {
          submission: {
            ...submission.toObject(),
            files: submission.files.map((file) => ({
              _id: file._id,
              fileName: file.fileName,
              fileSize: file.fileSize,
              filePath: file.filePath,
            })),
          },
        },
      });
    }),
  ];
 
  // Update submission
  exports.updateSubmission = [
    upload.array("files"),
    catchAsync(async (req, res, next) => {
      const { submissionId } = req.params;
      const { title, description, reward, target, category, severity, status } =
        req.body;
 
      const submission = await Submission.findById(submissionId);
      if (!submission) return next(new AppError("Submission not found", 404));
 
      const reportOwner = await User.findById(submission.user);
      if (!reportOwner)
        return next(new AppError("Submitting user not found", 404));
 
      const originalSeverity = submission.severity;
      const originalStatus = submission.status;
 
      submission.title = title || submission.title;
      submission.description = description || submission.description;
      submission.reward = reward || submission.reward;
      submission.target = target || submission.target;
      submission.category = category || submission.category;
      submission.severity = severity || submission.severity;
      submission.status = status || submission.status;
 
      if (severity && severity !== originalSeverity) {
        let points =
          { p1: 40, p2: 20, p3: 10, p4: 5, p5: 0 }[severity.toLowerCase()] || 0;
        submission.points = points;
        reportOwner.reputationScore += points;
      }
 
      if (req.files?.length) {
        submission.files = req.files.map((file) => ({
          fileName: file.filename,
          fileSize: file.size,
          filePath: `${req.protocol}://${req.get("host")}/${file.filename}`,
        }));
      }
 
      reportOwner.bountiesEarned += submission.reward;
 
      if (status && status !== originalStatus) {
        switch (status.toLowerCase()) {
          case "unresolved":
            reportOwner.reportsAccepted += 1;
            const program = await Program.findById(submission.programId);
            if (program) {
              program.resolvedReports = (program.resolvedReports || 0) + 1;
              await program.save({ validateBeforeSave: false });
            }
            break;
            case "resolved":
            reportOwner.reportsAccepted += 1;
            if (program) {
              program.resolvedReports = (program.resolvedReports || 0) + 1;
              await program.save({ validateBeforeSave: false });
            }
            break;
          case "rejected":
            reportOwner.reportsRejected += 1;
            break;
          case "duplicate":
            reportOwner.duplicateReports += 1;
            break;
        }
      }
 
      await reportOwner.save({ validateBeforeSave: false });
      await submission.save();
 
      res.status(200).json({
        status: "success",
        message: "Submission updated successfully",
        data: { submission },
      });
    }),
  ];
 
  // Update submission for org
  exports.updateSubmissionForOrg = [
    upload.array("files"),
    catchAsync(async (req, res, next) => {
      const { organization } = req;
      const { submissionId } = req.params;
      const {
        title,
        description,
        reward,
        target,
        category,
        severity,
        status,
        message,
      } = req.body;
 
      if (!organization) {
        return next(new AppError("Organization not found", 404));
      }
 
      const populatedOrganization = await Organization.findById(
        organization._id
      ).populate("programs");
 
      if (!populatedOrganization) {
        return next(new AppError("Organization not found", 404));
      }
 
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        return next(new AppError("Submission not found", 404));
      }
 
      const programIds = populatedOrganization.programs.map((program) =>
        program._id.toString()
      );
      if (!programIds.includes(submission.programId.toString())) {
        return next(
          new AppError("This submission does not belong to your organization's program", 403)
        );
      }
 
      const previousSeverity = submission.severity;
 
      submission.title = title || submission.title;
      submission.description = description || submission.description;
      submission.reward = reward || submission.reward;
      submission.target = target || submission.target;
      submission.category = category || submission.category;
      submission.severity = severity || submission.severity;
      submission.status = status || submission.status;
 
      if (message && message.trim() !== "") {
        submission.messages.push({
          senderType: "Organization",
          sender: organization._id,
          senderName: organization.name,
          message,
          sentAt: new Date(),
        });
      }
 
      if (req.files && req.files.length > 0) {
        const files = req.files.map((file) => ({
          fileName: file.filename,
          fileSize: file.size,
          filePath: `${req.protocol}://${req.get("host")}/${file.filename}`,
        }));
        submission.files = files;
      }
 
      await submission.save();
 
      if (severity && severity !== previousSeverity) {
        const reputationMap = {
          P1: 40,
          P2: 20,
          P3: 10,
          P4: 5,
        };
 
        const points = reputationMap[severity];
        if (points) {
          await User.findByIdAndUpdate(submission.reporter, {
            $inc: { reputationScore: points },
          });
        }
      }
 
      res.status(200).json({
        status: "success",
        message: "Submission updated successfully",
        data: {
          submission,
        },
      });
    }),
  ];
 
  // Add message to submission
  exports.addMessageToSubmission = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { message } = req.body;
 
    if (!message || !message.trim())
      return next(new AppError("Message cannot be empty", 400));
 
    const submission = await Submission.findById(id);
    if (!submission) return next(new AppError("Submission not found", 404));
 
    let senderModel, senderId, senderName;
 
    if (req.user) {
      senderModel = "User";
      senderId = req.user._id;
      senderName = req.user.fullName || req.user.username;
    } else if (req.organization) {
      senderModel = "Organization";
      senderId = req.organization._id;
      senderName = req.organization.name;
    } else {
      return next(new AppError("Not authorized to send a message", 401));
    }
 
    const newMessage = { sender: senderId, senderModel, senderName, message };
    submission.messages.push(newMessage);
    await submission.save();
 
    res.status(201).json({
      status: "success",
      data: {
        submissionId: id,
        message: { ...newMessage, sentAt: new Date() },
      },
    });
  });