const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = async (req, res) => {
  const { name, email, password, role, teamDept } = req.body;

  const exists = await User.findOne({ where: { email } });
  if (exists) return res.status(400).json({ msg: "User already exists" });

  const salt = await bcrypt.genSalt(10)
  const hashed = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashed,
    role,
    teamDept
  });

  res.status(201).json({
    message: "User registered",
    user
  });
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ msg: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ msg: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token });
};
