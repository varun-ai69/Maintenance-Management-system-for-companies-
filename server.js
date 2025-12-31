const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db")
dotenv.config();
connectDB() //use to connect DB 

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes")
const teamRoutes = require("./routes/teamRoutes")
const equipmentRoutes = require("./routes/equipmentRoutes")
const maintenanceRoutes = require("./routes/maintenanceRoutes")

app.use("/api/auth", authRoutes)
app.use("/api/team", teamRoutes)
app.use("/api/equipment", equipmentRoutes)
app.use("/api/maintenance", maintenanceRoutes)


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
