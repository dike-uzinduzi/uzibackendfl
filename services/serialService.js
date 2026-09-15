const crypto = require("crypto");
const { Plaque } = require("../models");

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ"; // no 0/O, 1/I/L, 5/S, 8/B, U

function randomSegment(len = 6) {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

async function generateSerialNumber(plaqueType) {
  const yy = String(new Date().getFullYear()).slice(-2);

  for (let attempt = 0; attempt < 5; attempt++) {
    const serial = `UZI-${plaqueType}-${yy}-${randomSegment(6)}`;
    const exists = await Plaque.findOne({
      where: { serialNumber: serial },
      attributes: ["id"],
    });
    if (!exists) return serial;
  }
  throw new Error("Failed to generate unique serial after 5 attempts");
}

function generateVerificationCode() {
  return crypto.randomBytes(24).toString("base64url");
}

module.exports = { generateSerialNumber, generateVerificationCode };