const Equipment = require("../models/Equipment");
const Team = require("../models/Team");

// Create equipment (Admin only)
exports.createEquipment = async (req, res) => {
  const { name, serialNumber, location, teamId, description } = req.body;

  const team = await Team.findById(teamId);
  if (!team) {
    return res.status(404).json({ message: "Team not found" });
  }

  const equipment = await Equipment.create({
    name,
    serialNumber,
    location,
    teamId,
    description
  });

  res.status(201).json({
    message: "Equipment created successfully",
    equipment
  });
};

// Get all equipment
exports.getAllEquipment = async (req, res) => {
  const equipment = await Equipment.find()
    .populate("teamId", "name");

  res.json(equipment);
};

// Get equipment by id
exports.getEquipmentById = async (req, res) => {
  const equipment = await Equipment.findById(req.params.id).populate("teamId");

  if (!equipment) {
    return res.status(404).json({ message: "Equipment not found" });
  }

  res.json(equipment);
};
