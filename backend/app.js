
const express = require("express");
const bodyParser = require("body-parser");
const loggingMiddleware = require("./middleware/logging");
const shortUrlRoutes = require("./routes/shorturls");
const controller = require("./controllers/shorturlsController");
const app = express();
app.set("trust proxy", true); 
app.use(bodyParser.json());
app.use(loggingMiddleware);
app.use("/shorturls", shortUrlRoutes);
app.get("/:shortcode", controller.redirectUrl);

app.get("/", (req, res) => {
  res.send(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>URL Shortener API</title></head>
<body style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:40px">
  <h1>HTTP URL Shortener -> Bhanukiran Reddy</h1>
  <p> this is  http://localhost:3000/ \n 
  1.</p>
  <small>This is <code>${req.protocol}://${req.get('host')}</code></small>
</body>
</html>`);
});


app.use((req, res, next) => {
  return res.status(404).json({ error: "Not Found" });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
