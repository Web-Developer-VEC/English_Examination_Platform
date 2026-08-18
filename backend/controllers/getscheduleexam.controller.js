const { getDB } = require("../config/db");

const getScheduleData = async (req, res) => {
    try {

        // ==========================================
        // Get retest from form-data
        // ==========================================

        const { retest } = req.body;

        const db = getDB();

        // ==========================================
        // Get required student fields
        // ==========================================

        const students = await db
            .collection("students")
            .find({})
            .sort({
                batch:1,
                department:1,
                section: 1,
                name: 1
            })
            .toArray();
            

        // ==========================================
        // Batch + Department + Section combinations
        // ==========================================

        const batchDepartmentSections = [
            ...new Map(
                students
                    .filter(
                        student =>
                            student.batch &&
                            student.department &&
                            student.section
                    )
                    .map(student => [
                        `${student.batch}_${student.department}_${student.section}`,
                        {
                            batch: student.batch,
                            department: student.department,
                            section: student.section
                        }
                    ])
            ).values()
        ];

        // ==========================================
        // Get test codes from questions collection
        // ==========================================

        const questions = await db
            .collection("questions")
            .find(
                {},
                {
                    projection: {
                        _id: 1,
                        testcode: 1
                    }
                }
            )
            .toArray();

        const tests = questions.map(question => ({
            questionSetId: question._id,
            questionCode: question.questionCode,
        }));

        // ==========================================
        // Prepare response
        // ==========================================

        const data = {
            batchDepartmentSections,
            tests
        };

        // ==========================================
        // Retest
        // ==========================================

        if (retest === "true") {

            data.admissionNos = [
                ...new Set(
                    students
                        .map(student => student.admissionNo)
                        .filter(Boolean)
                )
            ].sort();
        }

        // ==========================================
        // Response
        // ==========================================

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        console.error("Get Schedule Data Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};


const getScheduledExams = async (req, res) => {
    try {

        const db = getDB();

        const exams = await db
            .collection("schedule")
            .find({})
            .sort({ startTime: 1 })
            .toArray();

        const scheduledExams = await Promise.all(
            exams.map(async (exam) => {

                const questionSet = await db
                    .collection("questions")
                    .findOne(
                        {
                            _id: exam.questionSetId
                        },
                        {
                            projection: {
                                testcode: 1
                            }
                        }
                    );

                return {
                    examId: exam._id,

                    category: exam.category,

                    questionSetId: exam.questionSetId,

                    testcode: questionSet
                        ? questionSet.testcode
                        : null,

                    department: exam.department,

                    batch: exam.batch,

                    section: exam.section,

                    admissionNo: exam.admissionNo || [],

                    duration: exam.duration,

                    startTime: exam.startTime,

                    endTime: exam.endTime,

                    status: exam.status
                };
            })
        );

        return res.status(200).json({
            success: true,
            data: scheduledExams
        });

    } catch (error) {

        console.error("Get Scheduled Exams Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};
const getStudentsByDepartmentAndBatch = async (req, res) => {
    try {

        const { department, batch } = req.body;

        // ==========================================
        // Validate input
        // ==========================================

        if (!department || !department.trim()) {
            return res.status(400).json({
                success: false,
                message: "Department is required"
            });
        }

        if (!batch || !batch.trim()) {
            return res.status(400).json({
                success: false,
                message: "Batch is required"
            });
        }

        const db = getDB();

        // ==========================================
        // Get students
        // ==========================================

        const students = await db
            .collection("students")
            .find({
                department: department.trim(),
                batch: batch.trim()
            })
            .sort({
                section: 1,
                name: 1
            })
            .toArray();

        // ==========================================
        // Response
        // ==========================================

        return res.status(200).json({
            success: true,
            data: students
        });

    } catch (error) {

        console.error(
            "Get Students By Department And Batch Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};


module.exports = {
    getScheduleData, getScheduledExams,getStudentsByDepartmentAndBatch

};