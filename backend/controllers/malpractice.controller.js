const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
//POST /api/exam/malpractice
const MALPRACTICE_LIMIT = 3;

const reportMalpractice = async (req, res) => {
    try {

        const db = getDB();

        const {
            testId,
            admissionNo,
            reason
        } = req.body;

        // =====================================================
        // VALIDATION
        // =====================================================

        if (!testId || !admissionNo) {
            return res.status(400).json({
                success: false,
                message:
                    "testId and admissionNo are required."
            });
        }

        if (!ObjectId.isValid(testId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid testId."
            });
        }

        // =====================================================
        // FIND EXAM ATTEMPT
        // =====================================================

        const exam = await db.collection("exam").findOne({
            testId: new ObjectId(testId),
            admissionNo: String(admissionNo).trim()
        });

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Exam attempt not found."
            });
        }

        // =====================================================
        // CHECK EXAM STATUS
        // =====================================================

        if (exam.status === false) {
            return res.status(403).json({
                success: false,
                message:
                    "Exam has already been submitted or closed.",
                examClosed: true
            });
        }

        // =====================================================
        // COUNT EXISTING MALPRACTICE
        // =====================================================

        const malpracticeCount =
            await db.collection("malpractice").countDocuments({
                examId: exam._id,
                testId: new ObjectId(testId),
                admissionNo: String(admissionNo).trim()
            });

        const violationNo =
            malpracticeCount + 1;

        // =====================================================
        // MALPRACTICE REASON
        // =====================================================

        const malpracticeReason =
            reason &&
            String(reason).trim()
                ? String(reason).trim()
                : "Malpractice detected.";

        const detectedAt = new Date();

        // =====================================================
        // STORE MALPRACTICE
        // =====================================================

        const malpracticeDocument = {

            testId: new ObjectId(testId),

            examId: exam._id,

            admissionNo:
                String(admissionNo).trim(),

            violationNo,

            reason: malpracticeReason,

            createdAt: detectedAt

        };

        await db.collection("malpractice").insertOne(
            malpracticeDocument
        );

        // =====================================================
        // CHECK LIMIT
        // =====================================================

        if (violationNo >= MALPRACTICE_LIMIT) {

            // =================================================
            // CLOSE EXAM
            // =================================================

            await db.collection("exam").updateOne(
                {
                    _id: exam._id,
                    status: true
                },
                {
                    $set: {
                        status: false,

                        result: "Malpractice",

                        submittedAt: detectedAt,

                        updatedAt: detectedAt
                    }
                }
            );

            return res.status(403).json({

                success: false,

                message:
                    "Malpractice limit exceeded. Examination has been closed.",

                malpractice: {

                    violationNo,

                    limit: MALPRACTICE_LIMIT,

                    remaining: 0

                },

                examClosed: true

            });
        }

        // =====================================================
        // LIMIT NOT EXCEEDED
        // =====================================================

        const remaining =
            MALPRACTICE_LIMIT - violationNo;

        return res.status(200).json({

            success: true,

            message:
                "Malpractice recorded successfully.",

            malpractice: {

                violationNo,

                limit: MALPRACTICE_LIMIT,

                remaining

            },

            examClosed: false

        });

    } catch (error) {

        console.error(
            "MALPRACTICE ERROR:",
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
    reportMalpractice
};