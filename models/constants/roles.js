const ROLES = [
  "fan",
  "artist",
  "producer",
  "artist_manager",
  "promoter",
  "corporate",
  "admin",
  "super_admin",
];

const SELF_ASSIGNABLE_ROLES = [
  "fan",
  "artist",
  "producer",
  "artist_manager",
  "promoter",
];

const PRIVILEGED_ROLES = ["corporate", "admin", "super_admin"];

module.exports = { ROLES, SELF_ASSIGNABLE_ROLES, PRIVILEGED_ROLES };