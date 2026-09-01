const bcrypt = require("bcrypt");
const { getDB } = require("../../config/db");

const resetPassword = async (req, res) => {
    try {
        const { username, newPassword } = req.body;

        if ((!username) || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Username and new password are required."
            });
        }

        const db = getDB();

        // Find student
        const student = await db.collection("students").findOne({ username });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await db.collection("students").updateOne(
            { _id: student._id },
            {
                $set: {
                    password: hashedPassword,
                    updatedAt: new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata"
})
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: "Password updated successfully."
        });

    } catch (error) {
        console.error("Reset Password Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};

module.exports = {
    resetPassword
};