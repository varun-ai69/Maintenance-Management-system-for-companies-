const { Team, User } = require("../models");

/**
 * CREATE TEAM (ADMIN ONLY)
 */
exports.createTeam = async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Team name is required" });
  }

  const exists = await Team.findOne({ where: { name } });
  if (exists) {
    return res.status(400).json({ message: "Team already exists" });
  }

  const team = await Team.create({ name, description });

  res.status(201).json({
    message: "Team created successfully",
    team
  });
};

/**
 * GET ALL TEAMS WITH MEMBERS
 */
exports.getAllTeams = async (req, res) => {
  const teams = await Team.findAll({
    include: {
      model: User,
      attributes: ["id", "name", "email", "role"]
    }
  });

  res.json(teams);
};

/**
 * GET ALL AVAILABLE TECHNICIANS (NOT ASSIGNED)
 */
exports.getAvailableTechnicians = async (req, res) => {
  const technicians = await User.findAll({
    where: {
      role: "TECHNICIAN",
      teamId: null
    },
    attributes: ["id", "name", "email"]
  });

  res.json(technicians);
};

/**
 * ASSIGN TECHNICIAN TO TEAM (ADMIN ONLY)
 */
exports.assignUserToTeam = async (req, res) => {
  const { userId, teamId } = req.body;

  const user = await User.findByPk(userId);
  if (!user)
    return res.status(404).json({ message: "User not found" });

  if (user.role !== "TECHNICIAN") {
    return res.status(400).json({
      message: "Only technicians can be assigned to a team"
    });
  }

  if (user.teamId) {
    return res.status(400).json({
      message: "Technician already assigned to a team"
    });
  }

  const team = await Team.findByPk(teamId);
  if (!team) {
    return res.status(404).json({ message: "Team not found" });
  }

  user.teamId = teamId;
  await user.save();

  res.json({
    message: "Technician assigned successfully",
    user
  });
};

/**
 * REMOVE TECHNICIAN FROM TEAM
 */
exports.removeUserFromTeam = async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (!user.teamId)
    return res.status(400).json({ message: "User is not assigned to any team" });

  user.teamId = null;
  await user.save();

  res.json({ message: "User removed from team" });
};
