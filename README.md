# URL Shortener (HTTP Microservice)

A simple, evaluation-ready URL shortener built with **Node.js** and **Express**.

## ✅ Requirements Mapping
- **Mandatory Logging Integration**: Uses custom middleware with `console.log` to log method, URL, status, duration, and body.
- **Simple Microservice Architecture**: Express app exposing only the required endpoints.
- **No Authentication/Registration**: Open endpoints for all requests.
- **Short Link Uniqueness**: Ensured per-process via a Map; custom shortcodes are checked for collisions.
- **Default Validity**: If not provided, defaults to **30 minutes**.
- **Custom Shortcode**: Optional; validated as **4–20 alphanumeric characters**. Conflicts return **409**.
- **Redirection**: Hitting `/:shortcode` redirects to the original URL if not expired.
- **Error Handling**: Returns proper HTTP codes and descriptive JSON for malformed input, unknown shortcode (404), expired link (410), and collisions (409).
- **Statistics**: `/shorturls/:shortcode` returns total clicks, original URL, creation/expiry timestamps, and detailed click data with timestamp, referrer, IP, and coarse-grained location (local/private/unknown).

## Project Structure
```
url-shortener/
├── app.js
├── package.json
├── middleware/
│   └── logging.js
├── routes/
│   └── shorturls.js
├── controllers/
│   └── shorturlsController.js
└── models/
    └── urlStore.js
```

## Installation
```bash
# Unzip the project
cd url-shortener

# Install dependencies
npm install

# Start the server
npm start
```

Server will run on: **http://localhost:3000**

> The service constructs short links dynamically using the incoming request's protocol and host, so the `shortLink` in responses reflects your actual hostname:port.

## API Endpoints

### 1) Create Short URL
**POST** `/shorturls`

**Request Body**
```json
{
  "url": "https://example.com/very-long-path",
  "validity": 30,
  "shortcode": "abcd1"
}
```

**Successful Response (201)**
```json
{
  "shortLink": "http://hostname:port/abcd1",
  "expiry": "2025-09-06T12:34:56.000Z"
}
```

**Possible Errors**
- `400` – invalid URL / invalid shortcode / invalid validity
- `409` – shortcode already exists
- `500` – internal server error

### 2) Redirect to Original URL
**GET** `/:shortcode`  
- Redirects (302) to the original URL if valid.  
- Errors: `404` (unknown shortcode), `410` (expired).

### 3) Retrieve Short URL Statistics
**GET** `/shorturls/:shortcode`

**Successful Response (200)**
```json
{
  "totalClicks": 2,
  "originalUrl": "https://example.com",
  "createdAt": "2025-09-06T12:00:00.000Z",
  "expiry": "2025-09-06T12:30:00.000Z",
  "clicks": [
    {
      "timestamp": "2025-09-06T12:05:00.000Z",
      "referrer": "direct",
      "ip": "::1",
      "location": "local"
    }
  ]
}
```

## Quick Test (cURL)
```bash
# 1) Create a short URL (auto shortcode)
curl -s -X POST http://localhost:3000/shorturls   -H "Content-Type: application/json"   -d '{"url":"https://example.com","validity":30}'

# 2) Create with custom shortcode
curl -s -X POST http://localhost:3000/shorturls   -H "Content-Type: application/json"   -d '{"url":"https://example.com/docs","shortcode":"abcd1"}'

# 3) Follow redirect (should land at example.com)
curl -i http://localhost:3000/abcd1

# 4) Get stats
curl -s http://localhost:3000/shorturls/abcd1 | jq
```

## Notes
- Coarse location is derived from the IP only as **local/private/unknown** without external services.
- Uniqueness is guaranteed **within a single running instance** via an in-memory store.
- For production, replace the in-memory store with a persistent DB and add rate limiting.
