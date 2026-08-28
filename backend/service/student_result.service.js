const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

// IMPORT YOUR EMAIL SERVICE HERE
const { sendExamPDFEmail } = require("./report_mail.service");

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



const generateStudentExamPDF = async (testId, filters = {}) => {
  let browser = null;

  try {
    // ====================================================
    // VALIDATION
    // ====================================================

    if (!testId) {
      throw new Error("testId is required.");
    }

    if (!ObjectId.isValid(testId)) {
      throw new Error("Invalid testId.");
    }

    const { department, section, batch } = filters;

    // ====================================================
    // DATABASE
    // ====================================================

    const db = getDB();

    // ====================================================
    // FIND SCHEDULE
    // ====================================================

    const exam = await db.collection("schedule").findOne({
      _id: new ObjectId(testId),
    });

    if (!exam) {
      throw new Error("Scheduled examination not found.");
    }

    // ====================================================
    // QUESTION SET
    // ====================================================

    if (!exam.questionSetId) {
      throw new Error("Question set not assigned.");
    }

    const questionSetId =
      exam.questionSetId instanceof ObjectId
        ? exam.questionSetId
        : new ObjectId(exam.questionSetId);

    const questionSet = await db.collection("questions").findOne({
      _id: questionSetId,
    });

    if (!questionSet) {
      throw new Error("Question set not found.");
    }

    const questions = Array.isArray(questionSet.questions)
      ? questionSet.questions
      : [];

    const totalQuestions = questions.length;

    // ====================================================
    // FIND STUDENT LIST (apply optional filters)
    // ====================================================

    const studentQuery = {};

    if (department) studentQuery.department = department;
    if (section) studentQuery.section = section;
    if (batch) studentQuery.batch = batch;

    const students = await db
      .collection("students")
      .find(studentQuery)
      .sort({ admissionNo: 1 })
      .toArray();

    if (!students.length) {
      throw new Error("No students found for the given filters.");
    }

    // ====================================================
    // FIND ALL EXAM ATTEMPTS FOR THIS TEST
    // ====================================================

    const attempts = await db
      .collection("exam")
      .find({ testId: new ObjectId(testId) })
      .toArray();

    const attemptsByAdmissionNo = {};
    attempts.forEach((a) => {
      attemptsByAdmissionNo[a.admissionNo] = a;
    });

    // ====================================================
    // DETERMINE CATEGORY (for signature labels)
    // ====================================================

    const category = exam.category || filters.category || "";
    const isUniversity = String(category).trim().toLowerCase() === "university";

    const leftSignLabel = isUniversity ? "Internal's Sign" : "Staff's Sign";
    const rightSignLabel = isUniversity ? "External's Sign" : "HOD's Sign";

    // ====================================================
    // MARKS HEADERS
    // ====================================================

    const marksHeadersHTML = `
      <th>Marks Obtained</th>
      <th>Total Marks</th>
      <th>Result</th>
    `;

    // ====================================================
    // BUILD ROWS
    // ====================================================

    let totalStudentsAppeared = 0;

    const rowsHTML = students
      .map((student, index) => {
        const attempt = attemptsByAdmissionNo[student.admissionNo];

        let obtainedMarks = "-";
        let totalMarks = totalQuestions || "-";
        let result = "Absent";

        if (attempt) {
          totalStudentsAppeared++;

          const studentAnswers = Array.isArray(attempt.answers)
            ? attempt.answers
            : [];

          let correctCount = 0;

          questions.forEach((question) => {
            const saved = studentAnswers.find(
              (item) =>
                Number(item.questionNo) === Number(question.questionNo),
            );

            const studentAnswer =
              saved && saved.studentAnswer
                ? String(saved.studentAnswer).trim().toLowerCase()
                : "";

            const correctAnswer = question.answer
              ? String(question.answer).trim().toLowerCase()
              : "";

            if (studentAnswer && studentAnswer === correctAnswer) {
              correctCount++;
            }
          });

          totalMarks = attempt.totalMarks ?? totalQuestions;
          obtainedMarks = attempt.obtainedMarks ?? correctCount;

          const percentage =
            attempt.percentage ??
            (totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0);

          result = attempt.result || (Number(percentage) >= 50 ? "Pass" : "Fail");
        }

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(student.admissionNo || "-")}</td>
            <td class="name">${escapeHtml(student.name || "-")}</td>
            <td>${obtainedMarks}</td>
            <td>${totalMarks}</td>
            <td>${escapeHtml(result)}</td>
          </tr>
        `;
      })
      .join("");

    // ====================================================
    // LOGO
    // ====================================================

    const logoPath = path.join(__dirname, "../assets/vec-logo.png");

    let logoBase64Src = "";

    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64Src = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    }

    // ====================================================
    // LOAD TEMPLATE
    // ====================================================

    const templatePath = path.join(
      __dirname,
      "../templates/classExamReport.html",
    );

    let html = fs.readFileSync(templatePath, "utf8");

    // ====================================================
    // FILL PLACEHOLDERS
    // ====================================================

    html = html
      .replace("{{LOGO}}", logoBase64Src)
      .replace("{{BATCH}}", escapeHtml(batch || exam.batch || "-"))
      .replace("{{DEPARTMENT}}", escapeHtml(department || exam.department || "-"))
      .replace("{{SECTION}}", escapeHtml(section || exam.section || "-"))
      .replace("{{CIE}}", escapeHtml(exam.cie || exam.title || "-"))
      .replace("{{STAFF}}", escapeHtml(exam.staffName || "-"))
      .replace("{{MARKS_HEADERS}}", marksHeadersHTML)
      .replace("{{ROWS}}", rowsHTML)
      .replace("{{TOTAL_STUDENTS}}", String(students.length))
      .replace("{{LEFT_SIGN_LABEL}}", leftSignLabel)
      .replace("{{RIGHT_SIGN_LABEL}}", rightSignLabel);

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

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "10mm",
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

    const safeSection = String(section || exam.section || "all").replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    );

    const filename = `Velammal Engineering College - Class Report - ${safeSection}.pdf`;

    // ====================================================
    // RETURN
    // ====================================================

    return {
      success: true,
      filename,
      pdfBuffer,
      totalStudents: students.length,
      totalAppeared: totalStudentsAppeared,
    };
  } catch (error) {
    console.error("GENERATE CLASS PDF ERROR:", error.message);

    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }

    throw new Error(
      error.message || "Failed to generate class examination report PDF.",
    );
  }
};


module.exports = {
  generateStudentExamPDF,
};