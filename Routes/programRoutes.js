const express = require("express");
const programController = require("../Controllers/programController.js");
const { uploadProgramImage } = require("../Controllers/programController");
const { eitherAuthProtect } = require("../utilities/protect.js");

const router = express.Router();
router.post("/", eitherAuthProtect, programController.createProgram);
router.post(
  "/upload-image/:programId",
  eitherAuthProtect,
  uploadProgramImage,
  programController.addProgramImage
);
router.post(
  "/:programId/invite",
  eitherAuthProtect,
  programController.inviteToProgram
);
router.patch("/:programId", eitherAuthProtect, programController.editProgram);
router.get("/", eitherAuthProtect, programController.getAllPrograms);
router.get("/:programId", eitherAuthProtect, programController.getProgram);

module.exports = router;
