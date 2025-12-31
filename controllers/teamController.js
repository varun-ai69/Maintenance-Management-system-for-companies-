const Team = require("../models/Team");
const User = require("../models/User");

// 1️⃣ Create Team
exports.createTeam = async (req, res) => {
  const { name } = req.body;

  const exists = await Team.findOne({ name });
  if (exists) return res.status(400).json({ message: "Team already exists" });

  const team = await Team.create({ name });
  res.status(201).json(team);
};

// 2️⃣ Get all teams with members
exports.getAllTeams = async (req, res) => {
  const teams = await Team.find().lean();

  for (let team of teams) {
    const members = await User.find({
      teamId: team._id
    }).select("name email");

    team.members = members;
  }

  res.json(teams);
};

// 3️⃣ Get available technicians (not assigned)
exports.getAvailableTechnicians = async (req, res) => {
  const techs = await User.find({
    role: "TECHNICIAN",
    teamId: null
  });

  res.json(techs);
};

// 4️⃣ Assign technician to team
exports.assignTechnician = async (req, res) => {
  const { userId, teamId } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.role !== "TECHNICIAN")
    return res.status(400).json({ message: "User is not a technician" });

  if (user.teamId)
    return res.status(400).json({ message: "Technician already assigned" });

  user.teamId = teamId;
  await user.save();

  res.json({ message: "Technician assigned successfully" });
};

// 5️⃣ Remove technician from team
exports.removeTechnician = async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.teamId = null;
  await user.save();

  res.json({ message: "Technician removed from team" });
};
