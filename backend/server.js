const cors = require("cors");
const express = require("express");
require("dotenv").config();

const { connectDB } = require("./config/db");

const secureNoSQLMiddleware =
    require("./middleware/security/nosql_injection");

const scheduleMongoHealthCheck =
    require("./middleware/security/mongo_health_check");
const xssSanitizer = require("./middleware/security/xss");

const indexRoutes = require("./routes/index.routes");
const startExamCron =
    require("./middleware/cron_middleware");

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: "*",
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
    connectDB().then(() => {
        console.log("✅ MongoDB connected successfully.");

        // Start MongoDB health check only after DB connection
        scheduleMongoHealthCheck();
    })
    .catch((error) => {
        console.error("❌ MongoDB Connection Failed:");
        console.error(error.message);
    });



app.use(xssSanitizer);
// NoSQL Injection Protection
app.use(secureNoSQLMiddleware);

// Request Logger
app.use((req, res, next) => {

  res.on("finish", () => {
    console.log("Hits :", req.originalUrl);
  });


  next();
    });

  


// Register Routes
app.use("/api", indexRoutes);

// 404 Handler
app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "Route not found",
    });

});

// Global Error Handler
app.use((err, req, res, next) => {

    console.error(err);

    res.status(err.status || 500).json({
        success: false,
        message:
            err.message ||
            "Internal Server Error",
    });

});

// Start Server
app.listen(port, () => {

    console.log(
        `🚀 Server running on http://localhost:${port}`
    );

    startExamCron();

});