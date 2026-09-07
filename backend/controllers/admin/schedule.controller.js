const { ObjectId } = require("mongodb");
const { getDB } = require("../../config/db");
const { toIST } = require("../../helper/ist_converter");

const scheduleExam = async (req, res) => {
    try {

        const {
            category,
            cie,
            questionSetId,
            department,
            batch,
            academicYear,
            semester,
            section,
            admissionNo,
            duration,
            startTime,
            endTime
        } = req.body;

        // =====================================================
        // REQUIRED FIELD VALIDATION
        // =====================================================

        if (
            !category ||
            !questionSetId ||
            !department ||
            !batch ||
            !academicYear ||
            !semester ||
            !section ||
            !duration ||
            !startTime ||
            !endTime
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "category, questionSetId, department, batch, academicYear, semester, section, duration, startTime and endTime are required."
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
        // CIE VALIDATION
        //
        // CIE is a SEPARATE variable.
        //
        // Allowed:
        // I
        // II
        // III
        // =====================================================

        const allowedCIE = [
            "I",
            "II",
            "III"
        ];

        let normalizedCIE = null;

        if (cie !== undefined && cie !== null && cie !== "") {

            normalizedCIE =
                String(cie)
                    .trim()
                    .toUpperCase();

            if (!allowedCIE.includes(normalizedCIE)) {

                return res.status(400).json({
                    success: false,
                    message:
                        "CIE must be I, II or III."
                });
            }
        }

        // =====================================================
        // CIE REQUIRED FOR NORMAL CATEGORY
        // =====================================================

        if (
            normalizedCategory === "normal" &&
            !normalizedCIE
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "CIE is required for normal examination."
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
            String(section)
                .trim()
                .toUpperCase();

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

        const normalizedSemester =semester;

        if (
            normalizedSemester !="odd" &&
            normalizedSemester !="even"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Semester must be odd or even"
            });
        }

        // =====================================================
        // ADMISSION NUMBER VALIDATION
        // =====================================================

        if (
            admissionNo !== undefined &&
            admissionNo !== null &&
            !Array.isArray(admissionNo)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "admissionNo must be an array."
            });
        }

        // =====================================================
        // RETEST REQUIRES ADMISSION NUMBERS
        // =====================================================

        if (
            normalizedCategory === "retest" &&
            (!admissionNo || admissionNo.length === 0)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Admission numbers are required for retest."
            });
        }

        // =====================================================
        // SEMESTER VALIDATION
        // =====================================================

        const semesterNumber =semester;

        if (
            semesterNumber !="odd" &&
            semesterNumber !="even"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Semester must be a number between 1 and 8."
            });
        }

        // =====================================================
        // DURATION VALIDATION
        // =====================================================

        const durationNumber =
            Number(duration);

        if (
            !Number.isInteger(durationNumber) ||
            durationNumber <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Duration must be a positive number in minutes."
            });
        }

        // =====================================================
        // DATE VALIDATION
        // =====================================================

const start = new Date(`${startTime}+05:30`);
const end = new Date(`${endTime}+05:30`);

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
                    "Invalid startTime."
            });
        }

        if (isNaN(end.getTime())) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid endTime."
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
        const requiredDuration = questionSet.audioDurationMinutes * 2;

        if (Number(duration) < requiredDuration) {
            return res.status(400).json({
                success: false,
                message: `Duration must be at least ${requiredDuration} minutes.`
            });
        }   
        // =====================================================
        // DUPLICATE SCHEDULE CHECK
        // =====================================================

        const duplicateQuery = {
            category: normalizedCategory,

            "eligibility.department":
                department,

            "eligibility.batch":
                batch,

            "eligibility.academicYear":
                academicYear,

            "eligibility.semester":
                semesterNumber,

            "eligibility.section":
                normalizedSection,

            startTime: {
                $lte: end
            },

            endTime: {
                $gte: start
            }
        };

        // CIE is checked separately if supplied
        if (normalizedCIE) {
            duplicateQuery.cie =
                normalizedCIE;
        }

        const existingExam =
            await db.collection("schedule").findOne(
                duplicateQuery
            );

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

        const exam = {

            // -------------------------------------------------
            // BASIC INFORMATION
            // -------------------------------------------------

            category:
                normalizedCategory,

            // CIE is a separate field
            // I / II / III
            cie:
                normalizedCIE,

            questionSetId:
                questionObjectId,

            // -------------------------------------------------
            // ELIGIBILITY
            // -------------------------------------------------

            eligibility: {

                department:
                    String(department).trim(),

                batch:
                    String(batch).trim(),

                academicYear:
                    String(academicYear).trim(),

                semester:
                    semesterNumber,

                section:
                    normalizedSection,

                admissionNo:
                    Array.isArray(admissionNo)
                        ? admissionNo
                        : []

            },

            // -------------------------------------------------
            // EXAM TIMING
            // -------------------------------------------------

            duration:
                durationNumber,

            // MongoDB stores Date in UTC.
            // The input can be IST/ISO and JavaScript
            // converts it correctly to UTC internally.
            startTime:
                start,

            endTime:
                end,

            // -------------------------------------------------
            // STATUS
            // -------------------------------------------------

            status:
                "Scheduled",

            // testcode will be generated by cron
            testcode:
                null,

            testcodeGeneratedAt:
                null,

            // -------------------------------------------------
            // AUDIT
            // -------------------------------------------------

            createdBy:
                req.user?.username || null,

            createdAt:
                new Date(),

            updatedAt:
                new Date()
        };

        // =====================================================
        // INSERT
        // =====================================================

        const result =
            await db.collection("schedule").insertOne(
                exam
            );

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