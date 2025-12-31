const User = require("./User");
const Team = require("./Team");

Team.hasMany(User, { foreignKey: "teamId" });
User.belongsTo(Team, { foreignKey: "teamId" });

module.exports = { User, Team };
