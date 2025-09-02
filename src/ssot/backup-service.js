const svc = require("./start-object-service");

module.exports = {
  listBackups: svc.listBackups,
  restore: svc.restore,
};
