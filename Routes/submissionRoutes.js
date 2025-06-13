const express = require("express");
const submissionController = require("../Controllers/subController");
const authController = require("../Controllers/authController");
const adminController = require("../Controllers/adminController");
const userController = require("../Controllers/userController");
const { eitherAuthProtect } = require("../utilities/protect.js");

const router = express.Router();
router.get(
  "/getAllSubmissions",
  eitherAuthProtect,
  authController.restrictedTo("admin"),
  adminController.getAllSubmissions
);
router.get(
  "/getHackerReports",
  eitherAuthProtect,
  userController.getUserReports
);
router.get("/:submissionId", submissionController.getSubmissionById);
router.post(
  "/:programId",
  eitherAuthProtect,
  submissionController.createSubmission
);
router.patch(
  "/updateSubmission/:submissionId",
  eitherAuthProtect,
  authController.restrictedTo("admin"),
  submissionController.updateSubmission
);
router.patch(
  "/updateSubmissionForOrg/:submissionId",
  eitherAuthProtect,
  submissionController.updateSubmission
);
router.post(
  "/:id/message",
  eitherAuthProtect,
  submissionController.addMessageToSubmission
);

module.exports = router;
