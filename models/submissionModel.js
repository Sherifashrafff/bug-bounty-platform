const mongoose = require("mongoose");
const vrtCategories = require("../utilities/vrtCategories");

const submissionSchema = new mongoose.Schema({
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Program",
    required: true,
  },
  programName: {
    type: String,
    required: false,
  },
  programPicture: {
    type: String,
    default: "default-program.png",
  },
  title: {
    type: String,
    required: [true, "Please provide a title for your report"],
  },
  description: {
    type: String,
    required: [true, "Please provide a detailed description of the issue"],
  },
  reward: {
    type: Number,
    min: 0,
  },
  points: {
    type: Number,
    min: 0,
  },
  target: {
    type: String,
    required: false,
    enum: [],
  },
  category: {
    type: String,
    required: [true, "Please select a category for the report"],
    enum: vrtCategories,
  },
  severity: {
    type: String,
    enum: ["P1", "P2", "P3", "P4", "P5"],
  },
  status: {
    type: String,
    enum: [
      "pending",
      "triaged",
      "accepted",
      "rejected",
      "duplicated",
      "resolved",
      "unresolved",
    ],
    default: "pending",
  },
  vulnerableUrl: {
    type: String,
    default: "",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userName: String,
  collaborators: [
    {
      type: String, 
    },
  ],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: Date,
  files: [
    {
      fileName: { type: String },
      fileSize: { type: Number },
      fileUrl: { type: String },
    },
  ],
  messages: [
    {
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "messages.senderModel",
        required: true,
      },
      senderModel: {
        type: String,
        enum: ["User", "Organization", "admin"],
        required: true,
      },
      senderName: {
        type: String,
      },
      message: {
        type: String,
        required: true,
      },
      sentAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

// Dynamically set target enum based on program scope
submissionSchema.methods.setTarget = function (programScope) {
  this.schema.path("target").enum = programScope;
};

const Submission = mongoose.model("Submission", submissionSchema);
module.exports = Submission;
