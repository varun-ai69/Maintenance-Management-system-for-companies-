const express = require("express");
const router = express.Router();
const {
  createTeam,
  getAllTeams,
  getAvailableTechnicians,
  assignTechnician,
  removeTechnician
} = require("../controllers/teamController");

const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

router.post("/", auth, role(["ADMIN"]), createTeam);
router.get("/", auth, getAllTeams);
router.get("/available", auth, role(["ADMIN"]), getAvailableTechnicians);
router.post("/assign", auth, role(["ADMIN"]), assignTechnician);
router.put("/remove/:userId", auth, role(["ADMIN"]), removeTechnician);

module.exports = router;
