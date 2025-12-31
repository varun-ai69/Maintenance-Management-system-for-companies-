const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Equipment",
    required: true
  },

  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  assignedTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true
  },

  issueType: {
    type: String,
    enum: ["PREVENTIVE", "CORRECTIVE"],
    required: true
  },

  description: {
    type: String
  },

  status: {
    type: String,
    enum: ["OPEN", "SCHEDULED", "IN_PROGRESS", "COMPLETED"],
    default: "OPEN"
  },

  scheduledDate: {
    type: Date
  },

  completedAt: {
    type: Date
  }

}, { timestamps: true });

module.exports = mongoose.model("Maintenance", maintenanceSchema);
