const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  serialNumber: {
    type: String,
    required: true,
    unique: true
  },

  location: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true
  },

  status: {
    type: String,
    enum: ["ACTIVE", "UNDER_MAINTENANCE", "SCRAPPED"],
    default: "ACTIVE"
  }
}, { timestamps: true });

module.exports = mongoose.model("Equipment", equipmentSchema);
