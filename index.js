const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const express = require("express");
const multer = require("multer");
const errorHandler = require("./middlewares/errorMiddleware");
const connectDB = require("./config/connectDB");
const cors = require("cors");

require("dotenv").config();

const app = express();

// ------------------- CORS Middleware -------------------
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://www.bzcart.store",
  "https://bzcart.store",
  "https://dashboard.bzcart.store",
  "https://dashboards.bzcart.store",
  "https://bz-cart-d-ashboard.vercel.app",
  "https://dashboardbzcart.vercel.app",
  "https://api.bzcart.store",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (curl, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `CORS policy does not allow access from: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
  }),
);

// Handle preflight OPTIONS requests for all routes
app.options("*", cors());

// ------------------- Middleware -------------------
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

app.use(
  "/images",
  express.static(path.join(__dirname, "images"), { maxAge: "1d", etag: true }),
);

// Multer config
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
}).fields([
  { name: "image", maxCount: 1 },
  { name: "background", maxCount: 1 },
]);

// ------------------- DB Connection -------------------
connectDB();

// ------------------- Routes -------------------
const safeRequire = (modulePath) => {
  try {
    return require(modulePath);
  } catch (err) {
    console.error(`Failed to load ${modulePath}:`, err.message);
    throw err;
  }
};

const registerRoutes = (basePath, ...routeModules) => {
  const routerName =
    routeModules.length > 0 &&
    typeof routeModules[routeModules.length - 1] === "string"
      ? routeModules.pop()
      : "unknown routes";
  try {
    app.use(basePath, ...routeModules);
  } catch (err) {
    console.error(
      `Error registering ${routerName} at ${basePath}:`,
      err.message,
    );
    throw err;
  }
};

// Load routers
const slideRouter = safeRequire("./routes/slideRoutes");
const categoryRouter = safeRequire("./routes/categoryRoutes");
const productRouter = safeRequire("./routes/productRoutes");
const brandRouter = safeRequire("./routes/brandRoutes");
const reelRouter = safeRequire("./routes/reelRoutes");
const dealRoutes = safeRequire("./routes/dealRoutes");
const campaignRoutes = safeRequire("./routes/campaignRoutes");

// Register all routes
registerRoutes("/api/users", safeRequire("./routes/userRoutes"), "userRoutes");
registerRoutes(
  "/api/admins",
  safeRequire("./routes/adminRoutes"),
  "adminRoutes",
);
registerRoutes("/api/products", productRouter, "productRoutes");
registerRoutes(
  "/api/payment",
  safeRequire("./routes/paymentRoutes"),
  "paymentRoutes",
);
registerRoutes(
  "/api/orders",
  safeRequire("./routes/orderRoutes"),
  "orderRoutes",
);
registerRoutes("/api/slides", upload, slideRouter, "slideRoutes");
registerRoutes("/api/categories", categoryRouter, "categoryRoutes");
registerRoutes("/api/brands", brandRouter, "brandRoutes");
registerRoutes("/api/reel", reelRouter, "reelRoutes");
registerRoutes("/api", dealRoutes, "dealRoutes");
registerRoutes("/api/campaigns", campaignRoutes, "campaignRoutes");
registerRoutes(
  "/api/analytics",
  safeRequire("./routes/analyticsRoutes"),
  "analyticsRoutes",
);
registerRoutes(
  "/api/uploads",
  safeRequire("./routes/uploadRoutes"),
  "uploadRoutes",
);
registerRoutes(
  "/api/friday-banner",
  safeRequire("./routes/fridayBannerRoutes"),
  "fridayBannerRoutes",
);

// Multer error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError)
    return res.status(400).json({ message: err.message });
  next(err);
});

// General error handling
app.use(errorHandler);

// ------------------- HTTPS Setup -------------------
const HTTPS_PORT = 443;
const HTTP_PORT = 80;

const sslOptions = {
  key: fs.readFileSync(
    "/etc/letsencrypt/live/bzbackend.online-0001/privkey.pem",
  ),
  cert: fs.readFileSync(
    "/etc/letsencrypt/live/bzbackend.online-0001/fullchain.pem",
  ),
};

// HTTP → HTTPS redirect
http
  .createServer((req, res) => {
    res.writeHead(301, { Location: "https://" + req.headers.host + req.url });
    res.end();
  })
  .listen(HTTP_PORT, () =>
    console.log(`HTTP redirect running on port ${HTTP_PORT}`),
  );

// HTTPS server
https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
  console.log(`HTTPS server running on port ${HTTPS_PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => serverClose());
process.on("SIGINT", () => serverClose());

function serverClose() {
  console.log("Shutting down server gracefully...");
  process.exit(0);
}
