require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { sequelize, User } = require("./models");
const rateLimit = require("express-rate-limit");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const emailService = require("./services/emailService");
const { globalErrorHandler } = require("./middleware/errorHandler");
const adminRoutes = require("./routes/adminRoutes");
const allowedOrigins = [
  "http://localhost:4200",
  "http://localhost:5000",
  "https://uzinduziui-ohiz.vercel.app",
  "https://uzinduziui.vercel.app",
  "http://127.0.0.1:4200",
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_WWW,
].filter(Boolean);

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const isRender = process.env.RENDER === "true";
app.set("trust proxy", 1);

// ─── 1. CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no Origin (curl, mobile apps)
      if (!origin) return callback(null, true);

      // Dev only: allow any localhost port (Flutter web uses random ports)
      if (!isProduction && /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      if (!isProduction && /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
        return callback(null, true);
      }

      // Whitelist
      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.log("CORS blocked for origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── 2. Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── 3. Session ───────────────────────────────────────────────────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false, // ✅ don't create sessions for unauthenticated requests
    cookie: {
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      httpOnly: true,         // ✅ protect against XSS
    },
  })
);

// ─── 4. Rate limiting ─────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use(limiter);

// Tighter limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many auth attempts, please try again later." },
});

// ─── 5. Database ──────────────────────────────────────────────────────────────
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to PostgreSQL via Sequelize");
    await sequelize.sync(); // Use { force: true } to drop and recreate tables, or { alter: true } to update schema
    console.log("Database Schema Synced");

    if (User?.initializeSuperAdmin) {
      await User.initializeSuperAdmin();
      console.log("Super admin initialised");
    }
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};
initializeDatabase();

// ─── 6. Swagger ───────────────────────────────────────────────────────────────
const localhostURL = "http://localhost:5000";
const renderURL = "https://api.uzinduziafrica.com/";
const currentServerUrl = isRender || isProduction ? renderURL : localhostURL;

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Uzinduzi Africa Platform API",
      version: "1.0.0",
      description: "REST API for the Uzinduzi Africa virtual album launch platform",
    },
    servers: [{ url: currentServerUrl }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userName: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["fan", "artist", "admin", "super_admin", "producer", "artist_manager", "corporate", "promoter", "talent_manager"] },
            isEmailVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Artist: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            bio: { type: "string" },
            profilePictureUrl: { type: "string" },
            cover_photo: { type: "string" },
          },
        },
        Album: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            release_date: { type: "string", format: "date-time" },
            cover_art: { type: "string" },
            description: { type: "string" },
            albumType: { type: "string", enum: ["album", "ep", "single", "mixtape", "playlist"] },
            is_published: { type: "boolean" },
            viewCount: { type: "integer" },
          },
        },
        Track: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            durationMs: { type: "integer" },
            likeCount: { type: "integer" },
            albumId: { type: "string", format: "uuid" },
          },
        },
        Plaque: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            plaqueType: { type: "string" },
            amount: { type: "number" },
            paymentMethod: { type: "string" },
            paymentStatus: { type: "string", enum: ["pending", "paid", "failed", "cancelled"] },
            digital_hash: { type: "string" },
            shippingAddress: { type: "object" },
            paidAt: { type: "string", format: "date-time" },
          },
        },
        Payment: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            referenceNumber: { type: "string" },
            status: { type: "string", enum: ["PENDING", "SUCCESS", "FAILED", "SETTLEMENT_COMPLETED", "PAID"] },
            amount: { type: "number" },
            currency: { type: "string" },
            paymentMethod: { type: "string" },
            paid: { type: "boolean" },
          },
        },
        Genre: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
          },
        },
        News: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string" },
            category: { type: "string", enum: ["Announcements", "Update", "Alert"] },
            image: { type: "string" },
            is_published: { type: "boolean" },
            expires_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── 7. Email test route (dev only) ──────────────────────────────────────────
if (!isProduction) {
  app.get("/test-email", async (req, res) => {
    try {
      const testEmail = process.env.TEST_EMAIL || "test@example.com";
      const otp = emailService.generateOTP();
      const emailSent = await emailService.sendOTPEmail(testEmail, otp, "Test User");
      res.json({ success: emailSent, message: emailSent ? "Test OTP email sent" : "Failed to send", otp, email: testEmail });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
}

// ─── 8. API Routes ────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/users", require("./routes/media.routes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/admin", adminRoutes);
app.use("/api/artists", require("./routes/artistRoutes"));
app.use("/api/albums/:albumId/launch", require("./routes/albumLaunchRoutes"));
app.use("/api/albums", require("./routes/albumRoutes"));
app.use("/api/tracks", require("./routes/trackRoutes"));
app.use("/api/plaque-tiers", require("./routes/plaqueTierRoutes"));
app.use("/api/genres", require("./routes/genreRoutes"));
app.use("/api/plaques", require("./routes/plaqueRoutes"));
app.use("/api/profiles", require("./routes/profileRoutes"));
app.use("/api/news", require("./routes/newsRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/corporate-profiles", require("./routes/corporateProfileRoutes"));
app.use("/api/interactions", require("./routes/interactionsRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/engagement", require("./routes/engagementRoutes"));
// ─── 9. Health & Root ─────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "OK", environment: isProduction ? "production" : "development", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Uzinduzi Africa API", documentation: "/api-docs" });
});

// ─── 10. 404 handler ─────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ─── 11. Global error handler (MUST be last) ─────────────────────────────────
app.use(globalErrorHandler);

// ─── 12. Server start ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} in ${isProduction ? "PROD" : "DEV"} mode`);
});

module.exports = app;
