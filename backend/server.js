const express = require("express");
require("dotenv").config();
const {connectDB} = require("./config/db");
const indexRoutes = require("./routes/index.routes");
const startExamCron = require("./middleware/cron_middleware");

const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Health Check
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Listening Test API is running"
    });
});

// Register Routes
app.use("/api", indexRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

// Start Server
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
     startExamCron();
});