const express = require("express");
const userController = require("../Controllers/userController");
const authController = require("../Controllers/authController");
const subController = require("../Controllers/subController");
const { eitherAuthProtect } = require("../utilities/protect.js");
const { uploadUserProfilePicture } = require("../Controllers/userController");

const router = express.Router();
//Authuntication Routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.patch(
  "/updateMyPassword",
  eitherAuthProtect,
  authController.updatePassword
);
router.get("/me", eitherAuthProtect, userController.getMe);
router.get(
  "/getInvitedPrivatePrograms",
  eitherAuthProtect,
  userController.getInvitedPrivatePrograms
);
router.patch("/me", eitherAuthProtect, userController.updateMe);
router.patch(
  "/upload-profile-picture",
  eitherAuthProtect,
  uploadUserProfilePicture,
  userController.addUserProfilePicture
);
module.exports = router;
