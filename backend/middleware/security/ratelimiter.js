const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const { getDB } = require("../../config/db");

// =====================================================
// SAFE IP HASH
// =====================================================

const safeIpKeyGenerator = (ip) => {

    return crypto
        .createHash("sha256")
        .update(ip)
        .digest("hex");

};

// =====================================================
// RATE LIMITER
// =====================================================

const createRateLimiter = (options = {}) => {

    return rateLimit({

        // -------------------------------------------------
        // RATE LIMIT WINDOW
        // -------------------------------------------------

        windowMs:
            options.windowMs ||
            15 * 60 * 1000,

        // -------------------------------------------------
        // MAX REQUESTS
        // -------------------------------------------------

        max:
            options.max ||
            100,

        standardHeaders: true,
        legacyHeaders: false,

        // -------------------------------------------------
        // KEY GENERATOR
        // -------------------------------------------------

        keyGenerator:
            options.keyGenerator ||
            ((req) => {

                // If API key exists, use it
                if (req.query?.apiKey) {
                    return String(req.query.apiKey);
                }

                // Get client IP
                const realIp =
                    req.headers["x-forwarded-for"]
                        ?.split(",")[0]
                        ?.trim() ||
                    req.ip ||
                    "unknown";

                // Hash IP
                return safeIpKeyGenerator(realIp);

            }),

        // -------------------------------------------------
        // RATE LIMIT EXCEEDED
        // -------------------------------------------------

        handler: async (req, res) => {

            const clientIp =
                req.headers["x-forwarded-for"]
                    ?.split(",")[0]
                    ?.trim() ||
                req.ip ||
                "unknown";

            const now =
                new Date().toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    hour12: false,
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                });

            // -------------------------------------------------
            // LOG TO MONGODB
            // -------------------------------------------------

            try {

                const db = getDB();

                await db.collection("ratelog").updateOne(

                    {
                        _id: "rate_limit_log"
                    },

                    {
                        $push: {
                            logs: {
                                status: 429,
                                ip: clientIp,
                                endpoint: req.originalUrl,
                                method: req.method,
                                message: "Rate limit exceeded",
                                timestamp: now
                            }
                        }
                    },

                    {
                        upsert: true
                    }

                );

                console.log(
                    `[RATE LIMIT] ${clientIp} -> ${req.originalUrl}`
                );

            } catch (error) {

                console.error(
                    "[RATE LIMIT MongoDB LOG ERROR]",
                    error.message
                );

            }

            // -------------------------------------------------
            // RESPONSE
            // -------------------------------------------------

            const windowMinutes =
                (
                    options.windowMs ||
                    15 * 60 * 1000
                ) / 60000;

            return res.status(429).json({

                success: false,

                status: 429,

                message:
                    `Too many requests. Please try again after ${windowMinutes} minute${windowMinutes > 1 ? "s" : ""}.`

            });

        },

        // -------------------------------------------------
        // ALLOW CUSTOM OPTIONS
        // -------------------------------------------------

        ...options

    });

};

module.exports = createRateLimiter;