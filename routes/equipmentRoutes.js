const express = require("express");
const router = express.Router();
const {
  createEquipment,
  getAllEquipment,
  getEquipmentById
} = require("../controllers/equipmentController");

const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

router.post("/", auth, role(["ADMIN"]), createEquipment);
router.get("/", auth, getAllEquipment);
router.get("/:id", auth, getEquipmentById);

module.exports = router;
