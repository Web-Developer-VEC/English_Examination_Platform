const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const scheduleExam = async (req, res) => {
    try {
        const {
            category,
            questionSetId,
            department,
            batch,
            section,
            admissionNo,
            duration,
            startTime,
            endTime
        } = req.body;

        // ==========================
        // Required Fields Validation
        // ==========================
        if (
           
            !category ||
            !questionSetId ||
            !department ||
            !batch ||
            !section ||
            !duration ||
            !startTime ||
            !endTime
        ) {
            return res.status(400).json({
                success: false,
                message: "All required fields are mandatory."
            });
        }

        // ==========================
        // Category Validation
        // ==========================
        const allowedCategories = [
            "university",
            "normal",
            "retest"
        ];

        if (!allowedCategories.includes(category.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: "Category must be university, cie or retest."
            });
        }

        // ==========================
        // Section Validation
        // ==========================
        const allowedSections = [
            "A",
            "B",
            "C",
            "D"
        ];

        if (!allowedSections.includes(section.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: "Section must be A, B, C or D."
            });
        }

        // ==========================
        // admissionNo Validation
        // ==========================
        if (admissionNo && !Array.isArray(admissionNo)) {
            return res.status(400).json({
                success: false,
                message: "admissionNo must be an array."
            });
        }

        if (
            category.toLowerCase() === "retest" &&
            (!admissionNo || admissionNo.length === 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Admission numbers are required for retest."
            });
        }

        // ==========================
        // Date Validation
        // ==========================
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (end <= start) {
            return res.status(400).json({
                success: false,
                message: "End time must be greater than start time."
            });
        }

        const db = getDB();

        // ==========================
        // Question Set Validation
        // ==========================
        let questionObjectId;

        try {
            questionObjectId = new ObjectId(questionSetId);
        } catch {
            return res.status(400).json({
                success: false,
                message: "Invalid Question Set ID."
            });
        }

        const questionSet = await db.collection("questions").findOne({
            _id: questionObjectId
        });

        if (!questionSet) {
            return res.status(404).json({
                success: false,
                message: "Question set not found."
            });
        }

        // ==========================
        // Duplicate Schedule Check
        // ==========================
        const existingExam = await db.collection("schedule").findOne({
            category: category.toLowerCase(),
            "eligibility.department": department,
            "eligibility.batch": batch,
            "eligibility.section": section.toUpperCase(),
            startTime: { $lte: end },
            endTime: { $gte: start }
        });

        if (existingExam) {
            return res.status(409).json({
                success: false,
                message: "An exam is already scheduled for this department, batch and section during this time."
            });
        }

        // ==========================
        // Create Exam
        // ==========================
        const exam = {

            category: category.toLowerCase(),

            questionSetId: questionObjectId,

            eligibility: {

                department,

                batch,

                section: section.toUpperCase(),

                // Always stored as an array
                admissionNo: Array.isArray(admissionNo)
                    ? admissionNo
                    : []

            },

            duration: Number(duration),

            startTime: start,

            endTime: end,

            status: "Scheduled",

            createdBy: req.user.username,

            createdAt: new Date(),

            updatedAt: new Date()

        };

        const result = await db.collection("schedule").insertOne(exam);

        return res.status(201).json({
            success: true,
            message: "Exam scheduled successfully.",
            examId: result.insertedId,
            exam
        });

    } catch (error) {

        console.error("Schedule Exam Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });

    }
};

module.exports = {
    scheduleExam
};