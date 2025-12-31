const Maintenance = require("../models/maintenance");
const Equipment = require("../models/Equipment");
const User = require("../models/User")



exports.createMaintenance = async (req, res) => {
  try {
    const { equipmentId, issueType, description } = req.body;

    if (!equipmentId || !issueType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment)
      return res.status(404).json({ message: "Equipment not found" });

    const maintenance = await Maintenance.create({
      equipment: equipment._id,
      issueType,
      description,
      reportedBy: req.user.id,
      assignedTeam: equipment.teamId,
      status: "OPEN"
    });

    res.status(201).json({
      message: "Maintenance request created",
      maintenance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getAllMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.find()
      .populate("equipment")
      .populate("assignedTeam")
      .populate("reportedBy", "name email");

    res.json(maintenance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.scheduleMaintenance = async (req, res) => {
  try {
    const { maintenanceId, scheduledDate } = req.body;

    const maintenance = await Maintenance.findById(maintenanceId);
    if (!maintenance)
      return res.status(404).json({ message: "Maintenance not found" });

    maintenance.status = "SCHEDULED";
    maintenance.scheduledDate = scheduledDate;

    await maintenance.save();

    res.json({
      message: "Maintenance scheduled successfully",
      maintenance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.startMaintenance = async (req, res) => {
  try {
    const { maintenanceId } = req.params;

    const maintenance = await Maintenance.findById(maintenanceId);
    if (!maintenance)
      return res.status(404).json({ message: "Maintenance not found" });

    maintenance.status = "IN_PROGRESS";
    await maintenance.save();

    res.json({ message: "Maintenance started" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.completeMaintenance = async (req, res) => {
  try {
    const { maintenanceId } = req.params;

    const maintenance = await Maintenance.findById(maintenanceId);
    if (!maintenance)
      return res.status(404).json({ message: "Maintenance not found" });

    maintenance.status = "COMPLETED";
    maintenance.completedAt = new Date();

    await maintenance.save();

    res.json({
      message: "Maintenance completed successfully",
      maintenance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getMyMaintenance = async (req, res) => {
  try {
    // technician ka user id
    const technicianId = req.user.id;
if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // pehle user nikalo taaki team pata chale
    const user = await User.findById(technicianId);

    if (!user || !user.teamId) {
      return res.status(404).json({ message: "Technician not assigned to any team" });
    }

    const maintenance = await Maintenance.find({
      assignedTeam: user.teamId,
      status: { $in: ["OPEN", "SCHEDULED", "IN_PROGRESS"] }
    })
      .populate("equipment", "name location")
      .populate("reportedBy", "name email");

    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
