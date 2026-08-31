const { ObjectId } = require("mongodb");
const { getDB } = require("../../config/db");

const deleteQuestionSet = async (req, res) => {
    try {

        const { questionSetId } = req.body;

        // =====================================================
        // VALIDATION
        // =====================================================

        if (!questionSetId) {
            return res.status(400).json({
                success: false,
                message: "questionSetId is required."
            });
        }

        // =====================================================
        // VALIDATE OBJECT ID
        // =====================================================

        if (!ObjectId.isValid(questionSetId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid questionSetId."
            });
        }

        const db = getDB();

        // =====================================================
        // FIND QUESTION SET
        // =====================================================

        const questionSet = await db.collection("questions").findOne({
            _id: new ObjectId(questionSetId)
        });

        if (!questionSet) {
            return res.status(404).json({
                success: false,
                message: "Question set not found."
            });
        }

        // =====================================================
        // DELETE ENTIRE QUESTION SET
        // =====================================================

        const result = await db.collection("questions").deleteOne({
            _id: new ObjectId(questionSetId)
        });

        // =====================================================
        // CHECK DELETE
        // =====================================================

        if (result.deletedCount === 0) {
            return res.status(400).json({
                success: false,
                message: "Question set could not be deleted."
            });
        }

        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({
            success: true,
            message: "Question set deleted successfully.",
            questionSetId: questionSetId
        });

    } catch (error) {

        console.error(
            "DELETE QUESTION SET ERROR:",
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
    deleteQuestionSet
};