// routes/shorturls.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/shorturlsController");

router.post("/", controller.createShortUrl);
router.get("/:shortcode", controller.getStats);

module.exports = router;
