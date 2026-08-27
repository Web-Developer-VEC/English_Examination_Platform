const jwt = require("jsonwebtoken");

const roleByAccess = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      // Check token
      if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
      ) {
        return res.status(401).json({
          success: false,
          message: "Access denied. Token not provided.",
        });
      }

      // Get token
      const token = authHeader.split(" ")[1];

      // Verify JWT
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
      

      // Check role
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You don't have permission.",
        });
      }

      // Store user details
      req.user = decoded;

      next();

    } catch (error) {
      console.error("Auth Error:", error.message);

      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }
  };
};

module.exports = {
  roleByAccess,
};