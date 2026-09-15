const { plaqueImageUrl } = require("../services/plaqueImageService");

/**
 * Map a Sequelize Plaque instance to a plain API response.
 * Adds `plaqueImageUrl` derived from tier + thankYouNoteOnly.
 */
function serializePlaque(plaque) {
  if (!plaque) return null;

  const raw = plaque.get ? plaque.get({ plain: true }) : plaque;

  return {
    ...raw,
    plaqueImageUrl: plaqueImageUrl(raw.plaqueType, {
      isThankYou: raw.thankYouNoteOnly,
    }),
  };
}

module.exports = { serializePlaque };