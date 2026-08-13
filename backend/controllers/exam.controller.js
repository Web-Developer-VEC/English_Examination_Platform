const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");


// =====================================================
// START EXAM
// =====================================================
const startExam = async (req, res) => {
    try {

        const {
            testcode,
            admissionNo
        } = req.body;

        // =====================================================
        // VALIDATION
        // =====================================================

        if (!testcode || !admissionNo) {
            return res.status(400).json({
                success: false,
                message: "Test code and Admission Number are required."
            });
        }

        const db = getDB();

        // =====================================================
        // FIND SCHEDULED EXAM
        // =====================================================

        const exam = await db.collection("schedule").findOne({
            testcode: {
                $regex: new RegExp(
                    `^${testcode.trim()}$`,
                    "i"
                )
            }
        });

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Invalid Test Code."
            });
        }

        // =====================================================
        // CHECK EXAM TIME
        // =====================================================

        const now = new Date();

        const startTime = exam.startTime
            ? new Date(exam.startTime)
            : null;

        const endTime = exam.endTime
            ? new Date(exam.endTime)
            : null;

        if (startTime && now < startTime) {
            return res.status(403).json({
                success: false,
                message: "Exam has not started yet.",
                startTime
            });
        }

        if (endTime && now >= endTime) {
            return res.status(403).json({
                success: false,
                message: "Exam time has ended.",
                endTime
            });
        }

        // =====================================================
        // FIND STUDENT
        // =====================================================

        const student = await db.collection("students").findOne({
            admissionNo: admissionNo.trim()
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        // =====================================================
        // CHECK ELIGIBILITY
        // =====================================================

        if (
            exam.department &&
            exam.department !== student.department
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not eligible for this examination."
            });
        }

        if (
            exam.batch &&
            exam.batch !== student.batch
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not eligible for this examination."
            });
        }

        if (
            exam.section &&
            exam.section !== student.section
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not eligible for this examination."
            });
        }

        // =====================================================
        // CHECK QUESTION SET ID
        // =====================================================

        if (!exam.questionSetId) {
            return res.status(404).json({
                success: false,
                message: "Question set not assigned to this exam."
            });
        }

        if (!ObjectId.isValid(exam.questionSetId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid questionSetId."
            });
        }

        // =====================================================
        // GET QUESTION SET
        // =====================================================

        const questionSet = await db.collection("questions").findOne({
            _id: new ObjectId(exam.questionSetId)
        });

        if (!questionSet) {
            return res.status(404).json({
                success: false,
                message: "Question set not found."
            });
        }

        if (
            !Array.isArray(questionSet.questions) ||
            questionSet.questions.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message: "No questions found."
            });
        }

        // =====================================================
        // REMOVE CORRECT ANSWERS
        // =====================================================

        const questions = questionSet.questions.map(question => ({
            questionNo: question.questionNo,
            question: question.question,
            options: question.options
        }));

        // =====================================================
        // CHECK PREVIOUS EXAM ATTEMPT
        // =====================================================

        const alreadyAttempted = await db.collection("exam").findOne({
            testId: exam._id,
            admissionNo: student.admissionNo
        });

        // =====================================================
        // ALREADY SUBMITTED
        // status = false
        // =====================================================

        if (
            alreadyAttempted &&
            alreadyAttempted.status === false
        ) {
            return res.status(403).json({
                success: false,
                message: "You have already attended this examination.",
                status: false
            });
        }

        // =====================================================
        // EXAM ALREADY STARTED
        // status = true
        // =====================================================

        if (
            alreadyAttempted &&
            alreadyAttempted.status === true
        ) {

            return res.status(200).json({

                success: true,

                message: "Exam already started.",

                examId: alreadyAttempted._id,

                testId: exam._id,

                questionSetId: exam.questionSetId,

                duration: exam.duration,

                startedAt: alreadyAttempted.startedAt,

                endTime: endTime,

                questions

            });
        }

        // =====================================================
        // CREATE NEW EXAM ATTEMPT
        // =====================================================

        const startedAt = new Date();

        const examAttempt = {

            testId: exam._id,

            questionSetId: exam.questionSetId,

            title: exam.title || null,

            category: exam.category || null,

            admissionNo: student.admissionNo,

            registerNo: student.registerNo,

            studentName: student.name,

            department: student.department,

            batch: student.batch,

            year: student.year,

            section: student.section,

            // Student answers will be inserted
            // by syncExam
            answers: [],

            totalQuestions: questions.length,

            obtainedMarks: 0,

            totalMarks: questions.length,

            percentage: 0,

            result: "Pending",

            malpractice: {
                status: false,
                reason: ""
            },

            // true = exam is currently active
            // false = exam is submitted
            status: true,

            startedAt: startedAt,

            submittedAt: null,

            createdAt: startedAt,

            updatedAt: startedAt
        };

        // =====================================================
        // INSERT EXAM ATTEMPT
        // =====================================================

        const insertResult = await db
            .collection("exam")
            .insertOne(examAttempt);

        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({

            success: true,

            message: "Exam started successfully.",

            examId: insertResult.insertedId,

            testId: exam._id,

            questionSetId: exam.questionSetId,

            title: exam.title || null,

            category: exam.category || null,

            duration: exam.duration,

            startedAt: startedAt,

            endTime: endTime,

            totalQuestions: questions.length,

            questions

        });

    } catch (error) {

        console.error(
            "START EXAM ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    startExam
};

// =========================
// SUBMIT EXAM
// =========================
const submitExam = async (req, res) => {
    try {

        const db = getDB();

        const {
            testId,
            admissionNo
        } = req.body;

        // ----------------------------
        // Validation
        // ----------------------------
        if (!testId || !admissionNo) {
            return res.status(400).json({
                success: false,
                message: "testId and admissionNo are required."
            });
        }

        // ----------------------------
        // Student
        // ----------------------------
        const student = await db.collection("students").findOne({
            admissionNo
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        // ----------------------------
        // Scheduled Test
        // ----------------------------
        const test = await db.collection("schedule").findOne({
            _id: new ObjectId(testId)
        });

        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Scheduled Test not found."
            });
        }

        // ----------------------------
        // Exam Attempt
        // ----------------------------
        const examAttempt = await db.collection("exam").findOne({
            testId: new ObjectId(testId),
            admissionNo
        });

        if (!examAttempt) {
            return res.status(400).json({
                success: false,
                message: "Please start the exam first."
            });
        }

        if (examAttempt.status === false) {
            return res.status(403).json({
                success: false,
                message: "You have already submitted this examination."
            });
        }

        // ----------------------------
        // Question Set
        // ----------------------------
        const questionSet = await db.collection("questions").findOne({
            _id: new ObjectId(test.questionSetId)
        });

        if (!questionSet) {
            return res.status(404).json({
                success: false,
                message: "Question set not found."
            });
        }

        // ----------------------------
        // Read Saved Answers
        // ----------------------------
        const answers = examAttempt.answers || [];

        let obtainedMarks = 0;
        let correctAnswers = 0;
        let wrongAnswers = 0;

        const evaluatedAnswers = [];

        // ----------------------------
        // Evaluate Answers
        // ----------------------------
        for (const question of questionSet.questions) {

            const submitted = answers.find(
                a => Number(a.questionNo) === Number(question.questionNo)
            );

            const studentAnswer = submitted
                ? String(submitted.studentAnswer).trim().toUpperCase()
                : "";

            const correctAnswer = String(question.answer)
                .trim()
                .toUpperCase();

            const isCorrect = studentAnswer === correctAnswer;

            if (isCorrect) {
                obtainedMarks++;
                correctAnswers++;
            } else {
                wrongAnswers++;
            }

            evaluatedAnswers.push({
                questionNo: question.questionNo,
                question: question.question,
                options: question.options,
                studentAnswer,
                correctAnswer,
                marks: isCorrect ? 1 : 0
            });
        }

        // ----------------------------
        // Result
        // ----------------------------
        const totalQuestions = questionSet.questions.length;
        const totalMarks = totalQuestions;

        const percentage =
            totalMarks === 0
                ? 0
                : Number(
                    ((obtainedMarks / totalMarks) * 100).toFixed(2)
                );

        const result =
            percentage >= 50
                ? "Pass"
                : "Fail";

        // ----------------------------
        // Update Exam
        // ----------------------------
        await db.collection("exam").updateOne(
            {
                _id: examAttempt._id
            },
            {
                $set: {
                    answers: evaluatedAnswers,
                    totalQuestions,
                    correctAnswers,
                    wrongAnswers,
                    obtainedMarks,
                    totalMarks,
                    percentage,
                    result,
                    malpractice: {
                        status: false,
                        reason: ""
                    },
                    status: false,
                    submittedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );

        // ----------------------------
        // Response
        // ----------------------------
        const updatedExam = await db.collection("exam").findOne({
            _id: examAttempt._id
        });

        return res.status(200).json({
            success: true,
            message: "Exam submitted successfully.",
            data: updatedExam
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
const syncExam = async (req, res) => {
    try {

        const db = getDB();

        const {
            testId,
            admissionNo,
            questionNo,
            studentAnswer
        } = req.body;

        // =====================================================
        // 1. VALIDATION
        // =====================================================

        if (
            !testId ||
            !admissionNo ||
            questionNo == null ||
            studentAnswer == null ||
            String(studentAnswer).trim() === ""
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "testId, admissionNo, questionNo and studentAnswer are required."
            });
        }

        // =====================================================
        // 2. VALIDATE OBJECT ID
        // =====================================================

        if (!ObjectId.isValid(testId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid testId."
            });
        }

        // =====================================================
        // 3. FIND STUDENT
        // =====================================================

        const student = await db.collection("students").findOne({
            admissionNo: admissionNo
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        // =====================================================
        // 4. FIND SCHEDULED TEST
        // =====================================================

        const test = await db.collection("schedule").findOne({
            _id: new ObjectId(testId)
        });

        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Scheduled Test not found."
            });
        }

        // =====================================================
        // 5. FIND QUESTION SET
        // =====================================================

        if (!test.questionSetId) {
            return res.status(404).json({
                success: false,
                message: "Question set is not assigned to this test."
            });
        }

        if (!ObjectId.isValid(test.questionSetId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid questionSetId in scheduled test."
            });
        }

        const questionSet = await db.collection("questions").findOne({
            _id: new ObjectId(test.questionSetId)
        });

        if (!questionSet) {
            return res.status(404).json({
                success: false,
                message: "Question set not found."
            });
        }

        // =====================================================
        // 6. CHECK QUESTION EXISTS
        // =====================================================

        if (
            !Array.isArray(questionSet.questions) ||
            questionSet.questions.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message: "No questions found in this question set."
            });
        }

        const question = questionSet.questions.find(
            q =>
                Number(q.questionNo) === Number(questionNo)
        );

        if (!question) {
            return res.status(404).json({
                success: false,
                message: `Question ${questionNo} does not exist.`
            });
        }

        // =====================================================
        // 7. VALIDATE STUDENT ANSWER
        // =====================================================

        const normalizedStudentAnswer = String(studentAnswer)
            .trim()
            .toUpperCase();

        // Optional but recommended:
        // Make sure the submitted option actually exists
        // in this question's options.

        if (
            question.options &&
            !Object.prototype.hasOwnProperty.call(
                question.options,
                normalizedStudentAnswer
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Invalid answer '${normalizedStudentAnswer}' for question ${questionNo}.`
            });
        }

        // =====================================================
        // 8. FIND EXAM ATTEMPT
        // =====================================================

        const examAttempt = await db.collection("exam").findOne({
            testId: new ObjectId(testId),
            admissionNo: student.admissionNo
        });

        if (!examAttempt) {
            return res.status(400).json({
                success: false,
                message: "Please start the exam first."
            });
        }

        // =====================================================
        // 9. CHECK WHETHER EXAM IS ALREADY SUBMITTED
        // =====================================================

        if (examAttempt.status === false) {
            return res.status(403).json({
                success: false,
                message: "Exam has already been submitted."
            });
        }

        // =====================================================
        // 10. ENSURE ANSWERS ARRAY EXISTS
        // =====================================================

        if (!Array.isArray(examAttempt.answers)) {
            await db.collection("exam").updateOne(
                {
                    _id: examAttempt._id
                },
                {
                    $set: {
                        answers: [],
                        updatedAt: new Date()
                    }
                }
            );

            examAttempt.answers = [];
        }

        // =====================================================
        // 11. CHECK IF ANSWER ALREADY EXISTS
        // =====================================================

        const existingAnswer = examAttempt.answers.find(
            answer =>
                Number(answer.questionNo) === Number(questionNo)
        );

        // =====================================================
        // 12. UPDATE EXISTING ANSWER
        // =====================================================

        if (existingAnswer) {

            await db.collection("exam").updateOne(
                {
                    _id: examAttempt._id,
                    "answers.questionNo": Number(questionNo)
                },
                {
                    $set: {
                        "answers.$.studentAnswer":
                            normalizedStudentAnswer,

                        updatedAt: new Date()
                    }
                }
            );

        }

        // =====================================================
        // 13. INSERT NEW ANSWER
        // =====================================================

        else {

            await db.collection("exam").updateOne(
                {
                    _id: examAttempt._id
                },
                {
                    $push: {
                        answers: {
                            questionNo: Number(questionNo),
                            studentAnswer: normalizedStudentAnswer
                        }
                    },

                    $set: {
                        updatedAt: new Date()
                    }
                }
            );
        }

        // =====================================================
        // 14. GET UPDATED EXAM
        // =====================================================

        const updatedExam = await db.collection("exam").findOne({
            _id: examAttempt._id
        });

        // =====================================================
        // 15. RESPONSE
        // =====================================================

        return res.status(200).json({
            success: true,
            message: existingAnswer
                ? "Answer updated successfully."
                : "Answer synchronized successfully.",

            data: {
                testId: updatedExam.testId,
                admissionNo: updatedExam.admissionNo,
                questionNo: Number(questionNo),
                studentAnswer: normalizedStudentAnswer,
                totalAnswered: updatedExam.answers.length
            }
        });

    } catch (error) {

        console.error("SYNC EXAM ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    startExam,
    submitExam,
    syncExam 

};