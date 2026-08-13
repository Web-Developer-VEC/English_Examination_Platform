const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { toIST } = require("../helper/ist_converter");

const scheduleExam = async (req, res) => {
    try {

        const {
            category,
            questionSetId,
            department,
            batch,
            section,
            admissionNo,

            // NEW
            academicYear,
            semester,

            duration,
            startTime,
            endTime
        } = req.body;

        // =====================================================
        // REQUIRED FIELDS VALIDATION
        // =====================================================

        if (
            !category ||
            !questionSetId ||
            !department ||
            !batch ||
            !section ||
            !academicYear ||
            semester == null ||
            !duration ||
            !startTime ||
            !endTime
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Category, questionSetId, department, batch, section, academicYear, semester, duration, startTime and endTime are required."
            });
        }

        // =====================================================
        // CATEGORY VALIDATION
        // =====================================================

        const allowedCategories = [
            "university",
            "normal",
            "retest"
        ];

        const normalizedCategory =
            String(category).trim().toLowerCase();

        if (!allowedCategories.includes(normalizedCategory)) {
            return res.status(400).json({
                success: false,
                message:
                    "Category must be university, normal or retest."
            });
        }

        // =====================================================
        // SECTION VALIDATION
        // =====================================================

        const allowedSections = [
            "A",
            "B",
            "C",
            "D"
        ];

        const normalizedSection =
            String(section).trim().toUpperCase();

        if (!allowedSections.includes(normalizedSection)) {
            return res.status(400).json({
                success: false,
                message:
                    "Section must be A, B, C or D."
            });
        }

        // =====================================================
        // ACADEMIC YEAR VALIDATION
        // =====================================================

        const normalizedAcademicYear =
            String(academicYear).trim();

        if (!normalizedAcademicYear) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic year is required."
            });
        }

        // Example:
        // 2024-2028
        // 2025-2029

        if (!/^\d{4}-\d{4}$/.test(normalizedAcademicYear)) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic year must be in format YYYY-YYYY. Example: 2024-2028."
            });
        }

        // =====================================================
        // SEMESTER VALIDATION
        // =====================================================

        const normalizedSemester =
            Number(semester);

        if (
            !Number.isInteger(normalizedSemester) ||
            normalizedSemester < 1 ||
            normalizedSemester > 8
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Semester must be an integer between 1 and 8."
            });
        }

        // =====================================================
        // ADMISSION NUMBER VALIDATION
        // =====================================================

        if (
            admissionNo &&
            !Array.isArray(admissionNo)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "admissionNo must be an array."
            });
        }

        // Retest requires specific students
        if (
            normalizedCategory === "retest" &&
            (!admissionNo ||
                admissionNo.length === 0)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Admission numbers are required for retest."
            });
        }

        // =====================================================
        // DURATION VALIDATION
        // =====================================================

        const examDuration =
            Number(duration);

        if (
            !Number.isInteger(examDuration) ||
            examDuration <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Duration must be a positive number."
            });
        }

        // =====================================================
        // DATE VALIDATION
        // =====================================================

        const start = new Date(startTime);
        const end = new Date(endTime);
        // ==========================
        // Date Validation
        // ==========================
        
        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid startTime or endTime."
            });
        }

        if (end <= start) {
            return res.status(400).json({
                success: false,
                message:
                    "End time must be greater than start time."
            });
        }

        // =====================================================
        // DATABASE
        // =====================================================

        const db = getDB();

        // =====================================================
        // QUESTION SET VALIDATION
        // =====================================================

        if (!ObjectId.isValid(questionSetId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid Question Set ID."
            });
        }

        const questionObjectId =
            new ObjectId(questionSetId);

        const questionSet =
            await db.collection("questions").findOne({
                _id: questionObjectId
            });

        if (!questionSet) {
            return res.status(404).json({
                success: false,
                message:
                    "Question set not found."
            });
        }

        // =====================================================
        // QUESTION VALIDATION
        // =====================================================

        if (
            !Array.isArray(questionSet.questions) ||
            questionSet.questions.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Question set does not contain any questions."
            });
        }

        // =====================================================
        // DUPLICATE SCHEDULE CHECK
        // =====================================================

        const existingExam =
            await db.collection("schedule").findOne({

                category: normalizedCategory,

                "eligibility.department":
                    department,

                "eligibility.batch":
                    batch,

                "eligibility.section":
                    normalizedSection,

                academicYear:
                    normalizedAcademicYear,

                semester:
                    normalizedSemester,

                startTime: {
                    $lte: end
                },

                endTime: {
                    $gte: start
                }
            });

        if (existingExam) {
            return res.status(409).json({
                success: false,
                message:
                    "An exam is already scheduled for this department, batch, academic year, semester and section during this time."
            });
        }

        // =====================================================
        // CREATE EXAM
        // =====================================================

        const now = new Date();

        const exam = {

            // =================================================
            // EXAM INFORMATION
            // =================================================

            category:
                normalizedCategory,

            questionSetId:
                questionObjectId,

            academicYear:
                normalizedAcademicYear,

            semester:
                normalizedSemester,

            duration:
                examDuration,

            // =================================================
            // ELIGIBILITY
            // =================================================

            eligibility: {

                department:
                    String(department).trim(),

                batch:
                    String(batch).trim(),

                section:
                    normalizedSection,

                admissionNo:
                    Array.isArray(admissionNo)
                        ? admissionNo
                        : []
            },

            // =================================================
            // SCHEDULE
            // =================================================

            startTime:
                start,

            endTime:
                end,

            // =================================================
            // STATUS
            // =================================================

            status:
                "Scheduled",

            // =================================================
            // TEST CODE
            //
            // Generated automatically by cron
            // before exam starts.
            // =================================================

            testcode:
                null,

            testcodeGeneratedAt:
                null,

          

            createdAt:
                now,

            updatedAt:
                now
        };

        // =====================================================
        // INSERT
        // =====================================================

        const result =
            await db.collection("schedule")
                .insertOne(exam);

        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(201).json({

            success: true,

            message:
                "Exam scheduled successfully.",

            examId:
                result.insertedId,

            exam

        });

    } catch (error) {

        console.error(
            "Schedule Exam Error:",
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
    scheduleExam
};