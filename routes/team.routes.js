const express = require("express");
const router = express.Router();
const {
  createTeam,
  getAllTeams,
  getAvailableTechnicians,
  assignUserToTeam,
  removeUserFromTeam
} = require("../controllers/team.controller");

const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

router.post("/", auth, role(["ADMIN"]), createTeam);
router.get("/", auth, getAllTeams);
router.get("/available", auth, role(["ADMIN"]), getAvailableTechnicians);
router.post("/assign", auth, role(["ADMIN"]), assignUserToTeam);
router.put("/remove/:userId", auth, role(["ADMIN"]), removeUserFromTeam);

module.exports = router;
