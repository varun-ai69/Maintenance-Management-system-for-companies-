const express = require("express");
const router = express.Router();

const {
  createMaintenance,
  getAllMaintenance,
  scheduleMaintenance,
  startMaintenance,
  completeMaintenance,
  getMyMaintenance
} = require("../controllers/maintenanceController");

const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");


router.post(
  "/",
  auth,
  createMaintenance
);

router.get(
  "/",
  auth,
  role(["ADMIN"]),
  getAllMaintenance
);

router.put(
  "/schedule",
  auth,
  role(["ADMIN"]),
  scheduleMaintenance
);
router.get(
  "/my",
  auth,
  role(["TECHNICIAN"]),
  getMyMaintenance
);

router.put(
  "/start/:maintenanceId",
  auth,
  role(["TECHNICIAN"]),
  startMaintenance
);

router.put(
  "/complete/:maintenanceId",
  auth,
  role(["TECHNICIAN"]),
  completeMaintenance
);
router.get(
  "/my",
  auth,
  role(["TECHNICIAN"]),
  getMyMaintenance
);


module.exports = router;
