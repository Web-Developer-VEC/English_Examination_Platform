const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

// =========================
// START EXAM
// =========================
const startExam = async (req, res) => {
    try {

        const { testcode, admissionNo } = req.body;

        if (!testcode || !admissionNo) {
            return res.status(400).json({
                success: false,
                message: "Test code and Admission Number are required."
            });
        }

        const db = getDB();
         const exam = await db.collection("schedule").findOne({
          testcode: {
            $regex: new RegExp(`^${testcode.trim()}$`, "i")
         }
         });

        console.log(exam);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Invalid Test Code."
            });
        }

        // Student Exists
        const student = await db.collection("students").findOne({
            admissionNo
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        // Already Attempted
        // Check previous exam attempt
        const alreadyAttempted = await db.collection("exam").findOne({
            testId: exam._id,
            admissionNo: student.admissionNo
        });

        // If attempt exists and status is true
        if (alreadyAttempted && alreadyAttempted.status === true) {
            return res.status(403).json({
                success: false,
                message: "You have already attended this examination.",
                status: alreadyAttempted.status
            });
        }
        // Create exam attempt
        const questionSet = await db.collection("questions").findOne({
    _id: new ObjectId(exam.questionSetId)
});

const examAttempt = {

    testId: exam._id,

    questionSetId: exam.questionSetId,

    title: exam.title,

    category: exam.category,

    admissionNo: student.admissionNo,

    registerNo: student.registerNo,

    studentName: student.name,

    department: student.department,

    batch: student.batch,

    year: student.year,

    section: student.section,

    answers: [],

    totalQuestions: questionSet.questions.length,

    obtainedMarks: 0,

    totalMarks: questionSet.questions.length,

    percentage: 0,

    result: "Pending",

    malpractice: {
        status: false,
        reason: ""
    },

    status: true,

    startedAt: new Date(),

    submittedAt: null,

    createdAt: new Date(),

    updatedAt: new Date()
};

        // Save attempt
        const result = await db.collection("exam").insertOne(examAttempt);

        return res.status(200).json({
            success: true,
            message: "Exam started successfully.",
            examId: result.insertedId,
            testId: exam._id,
            questionSetId: exam.questionSetId,
            title: exam.title,
            duration: exam.duration
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
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

        if (
            !testId ||
            !admissionNo ||
            !Array.isArray(answers)
        ) {
            return res.status(400).json({
                success: false,
                message: "testId, admissionNo and answers are required."
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
        // Test
        // ----------------------------
        const test = await db.collection("schedule").findOne({
            _id: new ObjectId(testId)
        });

        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found."
            });
        }

        // ----------------------------
        // Exam Started?
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

        // ----------------------------
        // Already Submitted?
        // ----------------------------
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
                message: "Question Set not found."
            });
        }

        // ----------------------------
        // Calculate Marks
        // ----------------------------
       let obtainedMarks = 0;
let correctAnswers = 0;
let wrongAnswers = 0;

const evaluatedAnswers = [];

for (const studentAnswer of answers) {

    const question = questionSet.questions.find(
        q => Number(q.questionNo) === Number(studentAnswer.questionNo)
    );

    if (!question) {
        continue;
    }

    const isCorrect =
        String(question.answer).trim().toUpperCase() ===
        String(studentAnswer.studentAnswer).trim().toUpperCase();

    if (isCorrect) {
        obtainedMarks++;
        correctAnswers++;
    } else {
        wrongAnswers++;
    }

    evaluatedAnswers.push({
        questionNo: question.questionNo,
        question: question.question,
        studentAnswer: studentAnswer.studentAnswer,
        correctAnswer: question.answer,
        marks: isCorrect ? 1 : 0
    });
}

const totalQuestions = questionSet.questions.length;
const totalMarks = totalQuestions;

const percentage =
    totalMarks === 0
        ? 0
        : Number(((obtainedMarks / totalMarks) * 100).toFixed(2));

const result = percentage >= 50 ? "Pass" : "Fail";

        // ----------------------------
        // Update Existing Exam Document
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

                    startedAt:
                        startedAt || examAttempt.startedAt,

                    submittedAt: new Date(),

                    updatedAt: new Date()
                }
            }
        );

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

module.exports = {
    startExam,
    submitExam
};