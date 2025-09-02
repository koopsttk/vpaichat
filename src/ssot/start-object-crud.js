// Placeholder for start-object CRUD helpers (moved into start-object-service)
// Kept for compatibility and future expansion.

const svc = require("./start-object-service");

module.exports = {
  read: svc.read,
  update: svc.update,
  getStartObject: svc.getStartObject,
};
