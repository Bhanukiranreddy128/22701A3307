// models/urlStore.js
// In-memory store (process-level uniqueness)
const urlStore = new Map(); // shortcode -> { originalUrl, createdAt, expiry, clicks[] }
module.exports = urlStore;
