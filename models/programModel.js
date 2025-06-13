const mongoose = require("mongoose");

const programSchema = new mongoose.Schema({
  programName: {
    type: String,
    required: [true, "Program name is required"],
    trim: true,
  },
  programDescription: {
    type: String,
    required: [true, "Program description is required"],
    trim: true,
  },
  programPicture: {
    type: String,
    default: "default-program.png",
  },
  totalPaidRewards: {
    type: Number,
    default: 0,
    required: [true, "Minimum reward is required"],
  },
  validationWithin: {
    type: String,
    default: "3 days",
  },
  scope: {
    type: [String],
    required: [true, "Scope is required"],
  },
  outOfScope: {
    type: [String],
    default: [],
  },
  programType: {
    type: String,
    enum: [
      "bug bounty program",
      "vulnerability disclosure program",
      "BBP",
      "VDP",
    ],
  },
  visibility: {
    type: String,
    enum: ["public", "private"],
    default: "public",
  },
  invitedResearchers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
    },
  ],
  avgPayout: {
    type: Number,
    default: 0,
  },
  reportCount: {
    type: Number,
    default: 0,
  },
  resolvedReports: {
    type: Number,
    default: 0,
  },
  duplicateReports: {
    type: Number,
    default: 0,
  },
  programStatus: {
    type: String,
    enum: ["active", "inactive", "archived"],
    default: "active",
  },
  additionalInfo: {
    type: [String],
    default: [],
  },
  rewardRange: {
    P1: {
      min: { type: Number, default: 1000 },
      max: { type: Number, default: 5000 },
    },
    P2: {
      min: { type: Number, default: 500 },
      max: { type: Number, default: 2000 },
    },
    P3: {
      min: { type: Number, default: 200 },
      max: { type: Number, default: 1000 },
    },
    P4: {
      min: { type: Number, default: 50 },
      max: { type: Number, default: 500 },
    },
    P5: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
});

const Program = mongoose.model("Program", programSchema);

module.exports = Program;
