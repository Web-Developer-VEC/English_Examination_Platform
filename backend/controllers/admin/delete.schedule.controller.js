const { ObjectId } = require("mongodb");
const { getDB } = require("../../config/db");

const deleteScheduledExam = async (req, res) => {
    try {

        const { testId } = req.body;

        // =====================================================
        // VALIDATION
        // =====================================================

        if (!testId) {
            return res.status(400).json({
                success: false,
                message: "testId is required."
            });
        }

        // =====================================================
        // VALIDATE OBJECT ID
        // =====================================================

        if (!ObjectId.isValid(testId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid testId."
            });
        }

        const db = getDB();

        // =====================================================
        // FIND SCHEDULED EXAM
        // =====================================================

        const exam = await db.collection("schedule").findOne({
            _id: new ObjectId(testId)
        });

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Scheduled exam not found."
            });
        }

        // =====================================================
        // DELETE SCHEDULED EXAM
        // =====================================================

        const result = await db.collection("schedule").deleteOne({
            _id: new ObjectId(testId)
        });

        // =====================================================
        // CHECK DELETE
        // =====================================================

        if (result.deletedCount === 0) {
            return res.status(400).json({
                success: false,
                message: "Scheduled exam could not be deleted."
            });
        }

        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({
            success: true,
            message: "Scheduled exam deleted successfully.",
            testId: testId
        });

    } catch (error) {

        console.error(
            "DELETE SCHEDULED EXAM ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal Server Error"
        });
    }
};

module.exports = {
    deleteScheduledExam
};