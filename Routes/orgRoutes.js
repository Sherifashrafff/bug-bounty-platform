const express = require("express");
const orgController = require("../Controllers/orgController");
const userController = require("../Controllers/userController");
const authControllerOrg = require("../Controllers/authControllerOrg.js");
const { uploadProgramImage } = require("../Controllers/programController");
const { eitherAuthProtect } = require("../utilities/protect.js");
const { uploadOrgPicture } = require("../Controllers/orgController");

const router = express.Router();
//Authentication Routes
router.post("/signup", authControllerOrg.signup);
router.post("/login", authControllerOrg.login);
router.post("/forgotPassword", authControllerOrg.forgotPassword);
router.patch("/resetPassword/:token", authControllerOrg.resetPassword);
router.patch(
  "/updateMyPassword",
  eitherAuthProtect,
  authControllerOrg.updatePassword
);

router.get("/getTopUsers", eitherAuthProtect, userController.getTopUsers);
//Program Routes
router.get("/getReports", eitherAuthProtect, orgController.getAllSubmissions);

router.get("/me", eitherAuthProtect, orgController.getMe);
router.patch("/updateMe", eitherAuthProtect, orgController.updateMe);

router.patch(
  "/upload-profile-picture",
  eitherAuthProtect,
  uploadOrgPicture,
  orgController.addOrgProfilePicture
);
module.exports = router;
