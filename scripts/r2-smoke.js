// scripts/r2-smoke.js
require("dotenv").config();
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

(async () => {
  const key = `test/hello-${Date.now()}.txt`;

  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: "hello from node",
    ContentType: "text/plain",
  }));
  console.log("✅ uploaded:", key);

  const url = `${process.env.MEDIA_CDN_BASE}/${key}`;
  console.log("public URL:", url);

  const res = await fetch(url);
  console.log("status:", res.status);
  console.log("body:", await res.text());
})();