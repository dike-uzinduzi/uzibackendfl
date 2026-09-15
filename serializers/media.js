const CDN = process.env.MEDIA_CDN_BASE;
const IS_DEV = process.env.NODE_ENV !== "production";

function imageUrl(key, { w, h, fit = "cover", q = 85 } = {}) {
  if (!key) return null;

  // r2.dev doesn't support /cdn-cgi/image — serve raw until you add a domain
  if (IS_DEV || !CDN || CDN.includes(".r2.dev")) {
    return `${CDN}/${key}`;
  }

  const opts = [];
  if (w) opts.push(`width=${w}`);
  if (h) opts.push(`height=${h}`);
  opts.push(`fit=${fit}`, "format=auto", `quality=${q}`);
  return `${CDN}/cdn-cgi/image/${opts.join(",")}/${key}`;
}

const avatarUrl = (key) => imageUrl(key, { w: 200, h: 200 });
const coverUrl  = (key) => imageUrl(key, { w: 1400, h: 788 });
const albumUrl  = (key) => imageUrl(key, { w: 800,  h: 800 });
const plaqueUrl = (key) => imageUrl(key, { w: 600,  h: 600 });

module.exports = { imageUrl, avatarUrl, coverUrl, albumUrl, plaqueUrl };