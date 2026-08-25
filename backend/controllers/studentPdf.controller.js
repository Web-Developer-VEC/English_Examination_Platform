const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

// IMPORT YOUR EMAIL SERVICE HERE
const { sendExamPDFEmail } = require("../service/mail.service");

// ============================================================
// HTML ESCAPE
// ============================================================

const escapeHtml = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// ============================================================
// GET OPTION LETTER
// ============================================================

const getOptionLetter = (options, answer) => {
  if (!options || !answer) {
    return "";
  }

  const normalizedAnswer = String(answer).trim().toLowerCase();

  for (const [letter, text] of Object.entries(options)) {
    if (String(text).trim().toLowerCase() === normalizedAnswer) {
      return letter;
    }
  }

  return "";
};

// ============================================================
// FORMAT DATE
// ============================================================

const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",

    day: "2-digit",

    month: "2-digit",

    year: "numeric",

    hour: "2-digit",

    minute: "2-digit",

    hour12: true,
  });
};

// ============================================================
// GENERATE STUDENT EXAM PDF
// ============================================================

const generateStudentExamPDF = async (req, res) => {
  let browser = null;

  try {
    // ====================================================
    // GET PARAMETERS
    // ====================================================

    const { testId, admissionNo } = req.body;

    // ====================================================
    // VALIDATION
    // ====================================================

    if (!testId || !admissionNo) {
      return res.status(400).json({
        success: false,

        message: "testId and admissionNo are required.",
      });
    }

    if (!ObjectId.isValid(testId)) {
      return res.status(400).json({
        success: false,

        message: "Invalid testId.",
      });
    }

    // ====================================================
    // DATABASE
    // ====================================================

    const db = getDB();

    // ====================================================
    // FIND STUDENT
    // ====================================================

    const student = await db.collection("students").findOne({
      admissionNo: admissionNo.trim(),
    });

    if (!student) {
      return res.status(404).json({
        success: false,

        message: "Student not found.",
      });
    }

    // VALIDATE STUDENT EMAIL EXISTANCE
    const studentEmail = student.email; // Ensure this matches your DB schema
    if (!studentEmail) {
      return res.status(400).json({
        success: false,
        message: "Student email address not found in the database.",
      });
    }

    // ====================================================
    // FIND SCHEDULE
    // ====================================================

    const exam = await db.collection("schedule").findOne({
      _id: new ObjectId(testId),
    });

    if (!exam) {
      return res.status(404).json({
        success: false,

        message: "Scheduled examination not found.",
      });
    }

    // ====================================================
    // FIND STUDENT ATTEMPT
    // ====================================================

    const examAttempt = await db.collection("exam").findOne({
      testId: new ObjectId(testId),

      admissionNo: student.admissionNo,
    });

    if (!examAttempt) {
      return res.status(404).json({
        success: false,

        message: "Student exam attempt not found.",
      });
    }

    // ====================================================
    // QUESTION SET ID
    // ====================================================

    if (!exam.questionSetId) {
      return res.status(404).json({
        success: false,

        message: "Question set not assigned.",
      });
    }

    const questionSetId =
      exam.questionSetId instanceof ObjectId
        ? exam.questionSetId
        : new ObjectId(exam.questionSetId);

    // ====================================================
    // FIND QUESTION SET
    // ====================================================

    const questionSet = await db.collection("questions").findOne({
      _id: questionSetId,
    });

    if (!questionSet) {
      return res.status(404).json({
        success: false,

        message: "Question set not found.",
      });
    }
    const questionCode = questionSet.questionCode || "N/A";

    // ====================================================
    // QUESTIONS
    // ====================================================

    const questions = Array.isArray(questionSet.questions)
      ? questionSet.questions
      : [];

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,

        message: "No questions found.",
      });
    }

    // ====================================================
    // STUDENT ANSWERS
    // ====================================================

    const studentAnswers = Array.isArray(examAttempt.answers)
      ? examAttempt.answers
      : [];

    // ====================================================
    // LOGO
    // ====================================================

    const logoPath = path.join(__dirname, "../assets/vec-logo.png");

    let logoHTML = "";

    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);

      const logoBase64 = logoBuffer.toString("base64");

      logoHTML = `
                <img
                    class="college-logo"
                    src="data:image/png;base64,${logoBase64}"
                />
            `;
    }

    // ====================================================
    // GENERATE QUESTIONS
    // ====================================================

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const questionHTML = questions
      .map((question, index) => {
        // ========================================
        // STUDENT ANSWER
        // ========================================

        const savedAnswer = studentAnswers.find(
          (item) => Number(item.questionNo) === Number(question.questionNo),
        );

        const studentAnswer =
          savedAnswer && savedAnswer.studentAnswer
            ? String(savedAnswer.studentAnswer).trim()
            : "";

        // ========================================
        // CORRECT ANSWER
        // ========================================

        const correctAnswer = question.answer
          ? String(question.answer).trim()
          : "";

        // ========================================
        // OPTION LETTERS
        // ========================================

        const studentLetter = getOptionLetter(question.options, studentAnswer);

        const correctLetter = getOptionLetter(question.options, correctAnswer);

        // ========================================
        // CHECK RESULT
        // ========================================

        const isCorrect =
          studentAnswer !== "" &&
          studentAnswer.toLowerCase() === correctAnswer.toLowerCase();

        if (!studentAnswer) {
          unansweredCount++;
        } else if (isCorrect) {
          correctCount++;
        } else {
          wrongCount++;
        }

        // ========================================
        // OPTIONS
        // ========================================

        const optionLetters = ["A", "B", "C", "D"];

        const optionsHTML = optionLetters
          .map((letter) => {
            const optionText =
              question.options && question.options[letter]
                ? question.options[letter]
                : "";

            const normalizedOption = String(optionText).trim().toLowerCase();

            const normalizedStudent = studentAnswer.trim().toLowerCase();

            const normalizedCorrect = correctAnswer.trim().toLowerCase();

            const isStudentOption =
              studentAnswer !== "" && normalizedOption === normalizedStudent;

            const isCorrectOption = normalizedOption === normalizedCorrect;

            let className = "option";

            if (isStudentOption && isCorrectOption) {
              className += " student-correct";
            } else if (isStudentOption) {
              className += " student-option";
            } else if (isCorrectOption) {
              className += " correct-option";
            }

            return `

                                    <span
                                        class="${className}"
                                    >

                                        <strong>
                                            ${letter}.
                                        </strong>

                                        ${escapeHtml(optionText)}

                                    </span>

                                `;
          })
          .join("");

        // ========================================
        // STATUS
        // ========================================

        let statusText = "";
        let statusClass = "";

        if (!studentAnswer) {
          statusText = "NOT ANSWERED";

          statusClass = "status-unanswered";
        } else if (isCorrect) {
          statusText = "CORRECT";

          statusClass = "status-correct";
        } else {
          statusText = "WRONG";

          statusClass = "status-wrong";
        }

        // ========================================
        // RETURN QUESTION HTML
        // ========================================

        return `

                        <div class="question">

                            <div class="question-text">

                                <strong>
                                    Q${index + 1}.
                                </strong>

                                ${escapeHtml(question.question)}

                            </div>


                            <div class="options">

                                ${optionsHTML}

                            </div>


                            <div class="answer-row">

                                <span>

                                    <strong>
                                        Student Answer:
                                    </strong>

                                    ${
                                      studentAnswer
                                        ? `
                                                <strong>
                                                    ${escapeHtml(
                                                      studentLetter,
                                                    )}.
                                                    ${escapeHtml(studentAnswer)}
                                                </strong>
                                            `
                                        : `
                                                <strong>
                                                    Not Answered
                                                </strong>
                                            `
                                    }

                                </span>


                                <span>

                                    <strong>
                                        Correct Answer:
                                    </strong>

                                    <strong>
                                        ${escapeHtml(correctLetter)}.
                                        ${escapeHtml(correctAnswer)}
                                        ✓
                                    </strong>

                                </span>


                                <span
                                    class="status ${statusClass}"
                                >
                                    ${statusText}
                                </span>

                            </div>

                        </div>

                    `;
      })
      .join("");

    // ====================================================
    // SUMMARY VALUES
    // ====================================================

    const totalQuestions = questions.length;

    const totalMarks = examAttempt.totalMarks ?? totalQuestions;

    const obtainedMarks = examAttempt.obtainedMarks ?? correctCount;

    const percentage =
      examAttempt.percentage ??
      (totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(2) : 0);

    const result =
      examAttempt.result || (Number(percentage) >= 50 ? "Pass" : "Fail");

    // ====================================================
    // HTML
    // ====================================================

    const html = `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
Velammal Engineering College - Exam Report
</title>


<style>


/* ==========================================================
   PAGE
   ========================================================== */

@page {

    size: A4;

    margin:
        12mm
        12mm
        15mm
        12mm;
}


* {

    box-sizing: border-box;

}


body {

    margin: 0;

    padding: 0;

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    color: #111;

    font-size: 11px;

}


/* ==========================================================
   HEADER
   ========================================================== */

.college-header {

    text-align: center;

    padding-bottom: 10px;

    border-bottom:
        2px solid #111;

    margin-bottom: 12px;

}


.college-logo {

    width: 65px;

    height: 65px;

    object-fit: contain;

    margin-bottom: 3px;

}


.college-name {

    font-size: 19px;

    font-weight: bold;

    text-transform: uppercase;

    margin-bottom: 4px;

}


.college-autonomous {

    font-size: 10px;

    font-weight: 600;

    line-height: 1.4;

}


.college-address {

    font-size: 10px;

    margin-top: 2px;

}


.report-title {

    font-size: 16px;

    font-weight: bold;

    margin-top: 8px;

    letter-spacing: 1px;

}


/* ==========================================================
   STUDENT INFORMATION
   ========================================================== */

.student-info {

    border:
        1px solid #333;

    padding: 9px;

    margin-bottom: 14px;

}


.student-grid {

    display: grid;

    grid-template-columns:
        1fr 1fr;

    row-gap: 5px;

}


.student-field {

    font-size: 10.5px;

}


.student-field strong {

    font-weight: bold;

}


/* ==========================================================
   SUMMARY
   ========================================================== */

.summary {

    border:
        1px solid #333;

    margin-bottom: 15px;

    padding: 8px;

}


.summary-title {

    text-align: center;

    font-size: 12px;

    font-weight: bold;

    margin-bottom: 7px;

}


.summary-grid {

    display: grid;

    grid-template-columns:
        repeat(6, 1fr);

    gap: 5px;

}


.summary-box {

    border:
        1px solid #aaa;

    padding: 5px;

    text-align: center;

}


.summary-value {

    display: block;

    font-size: 13px;

    font-weight: bold;

}


.summary-label {

    display: block;

    font-size: 8px;

    margin-top: 2px;

}


/* ==========================================================
   QUESTIONS
   ========================================================== */

.question {

    page-break-inside: avoid;

    border-bottom:
        1px solid #999;

    padding-bottom: 11px;

    margin-bottom: 12px;

}


.question-text {

    font-size: 11.5px;

    line-height: 1.5;

    margin-bottom: 7px;

}


/* ==========================================================
   OPTIONS
   ========================================================== */

.options {

    display: flex;

    flex-wrap: wrap;

    align-items: center;

    gap: 6px;

    line-height: 1.7;

}


.option {

    display: inline-block;

    padding:
        3px
        7px;

    border:
        1px solid transparent;

    border-radius: 3px;

    white-space: nowrap;

}


/* Student selected answer */

.student-option {

    background:
        #fff176;

    border:
        1px solid #d6a700;

    font-weight: bold;

}


/* Correct answer */

.correct-option {

    font-weight: bold;

}


/* Student selected + correct */

.student-correct {

    background:
        #b9f6b5;

    border:
        2px solid #259b25;

    font-weight: bold;

}


/* ==========================================================
   ANSWER ROW
   ========================================================== */

.answer-row {

    display: flex;

    flex-wrap: wrap;

    align-items: center;

    gap: 14px;

    margin-top: 7px;

    padding:
        5px
        7px;

    background:
        #f5f5f5;

    border-radius: 3px;

    font-size: 9.5px;

}


.answer-row strong {

    font-weight: bold;

}


.status {

    margin-left: auto;

    font-weight: bold;

}


.status-correct {

    color: #138a13;

}


.status-wrong {

    color: #c00000;

}


.status-unanswered {

    color: #666;

}


/* ==========================================================
   FOOTER
   ========================================================== */

.footer {

    text-align: center;

    border-top:
        1px solid #999;

    padding-top: 7px;

    margin-top: 15px;

    font-size: 8px;

    color: #555;

}


</style>

</head>


<body>


<!-- ========================================================
     COLLEGE HEADER
     ======================================================== -->

<div class="college-header">

    ${logoHTML}


    <div class="college-name">

        VELAMMAL ENGINEERING COLLEGE

    </div>


    <div class="college-autonomous">

        (An Autonomous Institution, Affiliated to
        Anna University-Chennai)

    </div>


    <div class="college-address">

        Velammal Newgen Ambattur-Redhills Road,
        Chennai - 600 066

    </div>


    <div class="report-title">

        EXAM REPORT - ${questionCode}

    </div>

</div>


<!-- ========================================================
     STUDENT INFORMATION
     ======================================================== -->

<div class="student-info">

    <div class="student-grid">


        <div class="student-field">

            <strong>Name:</strong>

            ${escapeHtml(student.name || examAttempt.studentName || "-")}

        </div>


        <div class="student-field">

            <strong>Roll No:</strong>

            ${escapeHtml(student.rollNo || examAttempt.rollNo || "-")}

        </div>


        <div class="student-field">

            <strong>Register No:</strong>

            ${escapeHtml(student.registerNo || examAttempt.registerNo || "-")}

        </div>


        <div class="student-field">

            <strong>Admission No:</strong>

            ${escapeHtml(student.admissionNo || examAttempt.admissionNo || "-")}

        </div>


        <div class="student-field">

            <strong>Department:</strong>

            ${escapeHtml(student.department || examAttempt.department || "-")}

        </div>


        <div class="student-field">

            <strong>Section:</strong>

            ${escapeHtml(student.section || examAttempt.section || "-")}

        </div>


        <div class="student-field">

            <strong>Batch:</strong>

            ${escapeHtml(student.batch || examAttempt.batch || "-")}

        </div>


        <div class="student-field">

            <strong>Category:</strong>

            ${escapeHtml(exam.category || examAttempt.category || "-")}

        </div>


        


        


    </div>

</div>


<!-- ========================================================
     SUMMARY
     ======================================================== -->

<div class="summary">

    <div class="summary-title">

        EXAM SUMMARY

    </div>


    <div class="summary-grid">


        <div class="summary-box">

            <span class="summary-value">
                ${totalQuestions}
            </span>

            <span class="summary-label">
                QUESTIONS
            </span>

        </div>


        <div class="summary-box">

            <span class="summary-value">
                ${correctCount}
            </span>

            <span class="summary-label">
                CORRECT
            </span>

        </div>


        <div class="summary-box">

            <span class="summary-value">
                ${wrongCount}
            </span>

            <span class="summary-label">
                WRONG
            </span>

        </div>


        <div class="summary-box">

            <span class="summary-value">
                ${unansweredCount}
            </span>

            <span class="summary-label">
                UNANSWERED
            </span>

        </div>


        <div class="summary-box">

            <span class="summary-value">
                ${obtainedMarks}/${totalMarks}
            </span>

            <span class="summary-label">
                MARKS
            </span>

        </div>


        <div class="summary-box">

            <span class="summary-value">
                ${percentage}%
            </span>

            <span class="summary-label">
                RESULT: ${escapeHtml(result)}
            </span>

        </div>


    </div>

</div>


<!-- ========================================================
     QUESTIONS
     ======================================================== -->

${questionHTML}


<!-- ========================================================
     FOOTER
     ======================================================== -->

<div class="footer">

    Velammal Engineering College -
    Examination Report

</div>


</body>

</html>

`;

    // ====================================================
    // PUPPETEER
    // ====================================================

    browser = await puppeteer.launch({
      headless: true,

      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    // ====================================================
    // GENERATE PDF
    // ====================================================

    const pdfBuffer = await page.pdf({
      format: "A4",

      printBackground: true,

      preferCSSPageSize: true,

      margin: {
        top: "8mm",

        bottom: "10mm",

        left: "10mm",

        right: "10mm",
      },
    });

    await browser.close();

    browser = null;

    // ====================================================
    // FILE NAME
    // ====================================================

    const safeAdmissionNo = admissionNo.replace(/[^a-zA-Z0-9_-]/g, "_");

    const filename = `Velammal Engineering College - ${safeAdmissionNo}.pdf`;

    // Extract the test name/title from the scheduled exam object
    // Ensure "title" or "name" matches your DB schema for the test name
    const examTitle = exam.title || exam.testName || exam.name || "Assessment";

    // ====================================================
    // SAVE PDF TO CURRENT FOLDER
    // ====================================================

    // Define the exact path to save the file in the current directory
    const savePath = path.join(__dirname, filename);

    // Write the PDF buffer to the disk
    fs.writeFileSync(savePath, pdfBuffer);

    // ====================================================
    // SEND EMAIL
    // ====================================================

    const studentName = student.name || examAttempt.studentName || "Student";
    const { addEmailToQueue } = require("../utils/sesEmailQueue");

    await addEmailToQueue(() =>
      sendExamPDFEmail({
        to,
        studentName,
        examTitle,
        questions,
        pdfBuffer,
        filename,
      }),
    );

    // ====================================================
    // RESPONSE
    // ====================================================

    // Note: Removed res.setHeader application/pdf here
    // to prevent API conflicts when returning JSON.

    return res.status(200).json({
      success: true,
      message: `Examination report generated and emailed successfully to ${studentEmail}.`,
    });
  } catch (error) {
    console.error("GENERATE STUDENT PDF ERROR:", error);

    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }

    return res.status(500).json({
      success: false,

      message: error.message || "Failed to generate and email examination PDF.",
    });
  }
};

module.exports = {
  generateStudentExamPDF,
};
