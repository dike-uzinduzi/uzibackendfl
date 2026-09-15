const crypto = require("crypto");

const ENCRYPTION_KEY =
  process.env.uziENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
const IV_LENGTH = 16;

const encrypt = (text) => {
  if (!text) return "";
  const textStr = String(text);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );
  let encrypted = cipher.update(textStr);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

const generateDigitalHash = (data) => {
  const encryptedData = {
    firstName: encrypt(data.firstName),
    lastName: encrypt(data.lastName),
    price: encrypt(data.amount),
    date: encrypt(data.date),
    album: encrypt(data.albumTitle),
    artist: encrypt(data.artistName),

    reference: encrypt(data.referenceNumber),
    method: encrypt(data.paymentMethod),
  };

  const dataString = `${encryptedData.firstName}|${encryptedData.lastName}|${encryptedData.price}|${encryptedData.date}|${encryptedData.album}|${encryptedData.artist}|${encryptedData.reference}|${encryptedData.method}`;

  const hash = crypto.createHash("sha256").update(dataString).digest("hex");

  return {
    hash,
    encryptedData,
  };
};

module.exports = { generateDigitalHash };
