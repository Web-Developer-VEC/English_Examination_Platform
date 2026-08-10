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

        // ----------------------------
        // Validation
        // ----------------------------
        if (
            !testId ||
            !admissionNo ||
            questionNo == null ||
            !studentAnswer
        ) {
            return res.status(400).json({
                success: false,
                message: "testId, admissionNo, questionNo and studentAnswer are required."
            });
        }

        // ----------------------------
        // Find Exam Attempt
        // ----------------------------
        const examAttempt = await db.collection("exam").findOne({
            testId: new ObjectId(testId),
            admissionNo
        });

        if (!examAttempt) {
            return res.status(404).json({
                success: false,
                message: "Exam not started."
            });
        }

        // ----------------------------
        // Already Submitted?
        // ----------------------------
        if (examAttempt.status === false) {
            return res.status(403).json({
                success: false,
                message: "Exam has already been submitted."
            });
        }

        // ----------------------------
        // Find Existing Answer
        // ----------------------------
        const existingIndex = examAttempt.answers.findIndex(
            answer => Number(answer.questionNo) === Number(questionNo)
        );

        if (existingIndex >= 0) {

            // Update existing answer
            await db.collection("exam").updateOne(
                {
                    _id: examAttempt._id,
                    "answers.questionNo": Number(questionNo)
                },
                {
                    $set: {
                        "answers.$.studentAnswer": String(studentAnswer).trim().toUpperCase(),
                        updatedAt: new Date()
                    }
                }
            );

        } else {

            // Insert new answer
            await db.collection("exam").updateOne(
                {
                    _id: examAttempt._id
                },
                {
                    $push: {
                        answers: {
                            questionNo: Number(questionNo),
                            studentAnswer: String(studentAnswer).trim().toUpperCase()
                        }
                    },
                    $set: {
                        updatedAt: new Date()
                    }
                }
            );

        }

        // ----------------------------
        // Return Updated Answers
        // ----------------------------
        const updatedExam = await db.collection("exam").findOne({
            _id: examAttempt._id
        });

        return res.status(200).json({
            success: true,
            message: "Answer synchronized successfully.",
            answers: updatedExam.answers
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
    submitExam,
    syncExam 

};