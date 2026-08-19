const jwt = require("jsonwebtoken");

const staffAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Token not provided."
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "staff") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only staff can upload questions."
            });
        }

        // Store logged-in user details
        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};


const studentAuth = (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        // =========================================
        // CHECK TOKEN
        // =========================================

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Token not provided."
            });
        }

        // =========================================
        // GET TOKEN
        // =========================================

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Token not provided."
            });
        }

        // =========================================
        // VERIFY JWT
        // =========================================

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // =========================================
        // CHECK STUDENT ROLE
        // =========================================

        if (decoded.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only students can access this resource."
            });
        }

        // =========================================
        // STORE USER DETAILS
        // =========================================

        req.user = decoded;

        // =========================================
        // CONTINUE
        // =========================================

        next();

    } catch (error) {

        console.error("Student Auth Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};



module.exports = {staffAuth,studentAuth};