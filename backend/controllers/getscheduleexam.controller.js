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
            .find(
                {},
                {
                    projection: {
                        _id: 0,
                        batch: 1,
                        department: 1,
                        section: 1,
                        admissionNo: 1
                    }
                }
            )
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
            testcode: question.testcode
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
            ];
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


module.exports = {
    getScheduleData, getScheduledExams

};