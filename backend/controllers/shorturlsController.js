// controllers/shorturlsController.js
const urlStore = require("../models/urlStore");
const crypto = require("crypto");

// Generate a 6-char hex shortcode and retry on collision
function generateShortCode() {
  let attempt = 0;
  while (attempt < 5) {
    const code = crypto.randomBytes(3).toString("hex"); // 6 chars
    if (!urlStore.has(code)) return code;
    attempt++;
  }
  // Fallback to timestamp-based
  return Date.now().toString(36);
}

function isValidHttpUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (e) {
    return false;
  }
}

function isValidShortcode(code) {
  // Alphanumeric only, reasonable length
  return typeof code === "string" && /^[a-zA-Z0-9]+$/.test(code) && code.length >= 4 && code.length <= 20;
}

function coarseGeoFromIp(ip) {
  if (!ip) return "unknown";
  if (ip === "::1" || ip == "127.0.0.1") return "local";
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.16.")) return "private";
  return "unknown";
}

// POST /shorturls
exports.createShortUrl = (req, res) => {
  try {
    const { url, validity = 30, shortcode } = req.body || {};

    if (!url || typeof url !== "string" || !isValidHttpUrl(url)) {
      return res.status(400).json({ error: "Invalid URL. Provide a valid http/https URL string." });
    }

    if (shortcode) {
      if (!isValidShortcode(shortcode)) {
        return res.status(400).json({ error: "Invalid shortcode. Use 4-20 alphanumeric characters." });
      }
      if (urlStore.has(shortcode)) {
        return res.status(409).json({ error: "Shortcode already exists" });
      }
    }

    const minutes = Number.isFinite(validity) ? validity : Number(validity);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return validity = 30 ;
    }

    const code = shortcode || generateShortCode();
    const now = Date.now();
    const expiryMs = now + minutes * 60_000;
    const expiryIso = new Date(expiryMs).toISOString();

    urlStore.set(code, {
      originalUrl: url,
      createdAt: new Date(now).toISOString(),
      expiry: expiryIso,
      clicks: []
    });

    const shortLink = `${req.protocol}://${req.get("host")}/${code}`;

    return res.status(201).json({
      shortLink,
      expiry: expiryIso
    });
  } catch (err) {
    console.error("createShortUrl error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /shorturls/:shortcode
exports.getStats = (req, res) => {
  try {
    const { shortcode } = req.params;
    const data = urlStore.get(shortcode);

    if (!data) {
      return res.status(404).json({ error: "Shortcode not found" });
    }

    return res.json({
      totalClicks: data.clicks.length,
      originalUrl: data.originalUrl,
      createdAt: data.createdAt,
      expiry: data.expiry,
      clicks: data.clicks
    });
  } catch (err) {
    console.error("getStats error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Redirect handler GET /:shortcode
exports.redirectUrl = (req, res) => {
  try {
    const { shortcode } = req.params;
    const data = urlStore.get(shortcode);

    if (!data) {
      return res.status(404).json({ error: "Shortcode not found" });
    }

    if (new Date() > new Date(data.expiry)) {
      return res.status(410).json({ error: "Link expired" });
    }

    const ipRaw = req.ip || req.connection?.remoteAddress || "";
    const ip = Array.isArray(ipRaw) ? ipRaw[0] : ipRaw;

    data.clicks.push({
      timestamp: new Date().toISOString(),
      referrer: req.get("Referer") || "direct",
      ip,
      location: coarseGeoFromIp(ip)
    });

    return res.redirect(data.originalUrl);
  } catch (err) {
    console.error("redirectUrl error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
