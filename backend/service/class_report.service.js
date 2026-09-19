

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { ObjectId } = require("mongodb");

const { getDB } = require("../config/db");
const { uploadToS3 } = require("./s3.service");

const escapeRegex = (str) =>
  str ? String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";

const DEPARTMENT_SHORT_CODES = {
  "automobile engineering": "AUTO",
  "civil engineering": "CIVIL",
  "computer science and engineering": "CSE",
  "computer science and engineering (cyber security)": "CSE-CS",
  "computer science & engineering": "CSE",
  "electrical and electronics engineering": "EEE",
  "electronics and communication engineering": "ECE",
  "electronics and instrumentation engineering": "EIE",
  "mechanical engineering": "MECH",
  "artificial intelligence and data science": "AIDS",
  "information technology": "IT",
};

const getDepartmentShortCode = (dept) => {
  if (!dept) return "DEPT";
  const normalized = String(dept).trim().toLowerCase();
  if (DEPARTMENT_SHORT_CODES[normalized]) {
    return DEPARTMENT_SHORT_CODES[normalized];
  }
  for (const [key, val] of Object.entries(DEPARTMENT_SHORT_CODES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return val;
    }
  }
  return sanitizeForFilename(dept);
};

/**
 * Generate Class Examination Report PDF, upload to S3, and store in "result" collection
 */
const generateAndSaveClassReport = async ({
  batch,
  department,
  section,
  semester,
  category = "normal",
  cie = null,
  academicYear = null,
  triggeredTestId = null,
}) => {
  let browser = null;
  const db = getDB();

  try {
    const cleanBatch =
      batch && typeof batch === "string" && batch.trim() !== ""
        ? batch.trim()
        : null;
    const cleanDept =
      department && typeof department === "string" && department.trim() !== ""
        ? department.trim()
        : null;
    const cleanSec =
      section && typeof section === "string" && section.trim() !== ""
        ? section.trim()
        : null;
    const cleanSem =
      semester && typeof semester === "string"
        ? semester.trim().toLowerCase()
        : null;
    const cleanCategory =
      category && typeof category === "string" && category.trim() !== ""
        ? category.trim().toLowerCase()
        : "normal";

    const isUniversityReport = cleanCategory === "university";

    const isCieReport =
      !isUniversityReport &&
      cie !== undefined &&
      cie !== null &&
      typeof cie === "string" &&
      cie.trim() !== "" &&
      !["n/a", "all", "none"].includes(cie.trim().toLowerCase());

    const cieValue = isCieReport ? cie.trim().toUpperCase() : null;

    // 1. Fetch student roster from "students" collection
    const studentFilter = {};
    if (cleanBatch) {
      studentFilter.batch = {
        $regex: new RegExp(`^${escapeRegex(cleanBatch)}$`, "i"),
      };
    }
    if (cleanDept) {
      studentFilter.department = {
        $regex: new RegExp(`^${escapeRegex(cleanDept)}$`, "i"),
      };
    }
    if (cleanSec) {
      studentFilter.section = {
        $regex: new RegExp(`^${escapeRegex(cleanSec)}$`, "i"),
      };
    }

    const studentRoster = await db
      .collection("students")
      .find(studentFilter)
      .project({
        _id: 0,
        admissionNo: 1,
        name: 1,
      })
      .sort({
        name: 1,
      })
      .toArray();

    if (studentRoster.length === 0) {
      throw new Error("No students found for the given class filters.");
    }

    // 2. Fetch scheduled tests from "schedule" collection
    const scheduleFilter = {
      status: { $nin: ["Cancelled", "cancelled"] },
    };
    if (cleanBatch) {
      scheduleFilter["eligibility.batch"] = {
        $regex: new RegExp(`^${escapeRegex(cleanBatch)}$`, "i"),
      };
    }
    if (cleanDept) {
      scheduleFilter["eligibility.department"] = {
        $regex: new RegExp(`^${escapeRegex(cleanDept)}$`, "i"),
      };
    }
    if (cleanSec) {
      scheduleFilter["eligibility.section"] = {
        $regex: new RegExp(`^${escapeRegex(cleanSec)}$`, "i"),
      };
    }
    if (cleanSem) {
      scheduleFilter["eligibility.semester"] = {
        $regex: new RegExp(`^${escapeRegex(cleanSem)}$`, "i"),
      };
    }
    if (academicYear && academicYear !== "All" && academicYear !== "null") {
      scheduleFilter["eligibility.academicYear"] = academicYear;
    }

    if (isUniversityReport) {
      scheduleFilter.category = {
        $regex: /^university$/i,
      };
    } else if (isCieReport) {
      // Normal report with specific CIE: include all tests conducted under this CIE (normal & retest)
      const cieRegex = new RegExp(`^(CIE[\\s-]*)?${escapeRegex(cieValue)}$`, "i");

      // Also find question sets associated with this CIE for this class to catch retests even without explicit cie field
      const normalCieTests = await db
        .collection("schedule")
        .find({
          status: { $nin: ["Cancelled", "cancelled"] },
          ...(cleanBatch
            ? {
                "eligibility.batch": {
                  $regex: new RegExp(`^${escapeRegex(cleanBatch)}$`, "i"),
                },
              }
            : {}),
          ...(cleanDept
            ? {
                "eligibility.department": {
                  $regex: new RegExp(`^${escapeRegex(cleanDept)}$`, "i"),
                },
              }
            : {}),
          ...(cleanSec
            ? {
                "eligibility.section": {
                  $regex: new RegExp(`^${escapeRegex(cleanSec)}$`, "i"),
                },
              }
            : {}),
          cie: cieRegex,
        })
        .project({ questionSetId: 1 })
        .toArray();

      const relatedQSetIds = normalCieTests
        .map((t) => t.questionSetId)
        .filter(Boolean);

      scheduleFilter.$or = [
        {
          cie: cieRegex,
          category: { $in: ["normal", "retest", "Normal", "Retest"] },
        },
        ...(relatedQSetIds.length > 0
          ? [
              {
                category: { $in: ["retest", "Retest"] },
                questionSetId: { $in: relatedQSetIds },
              },
            ]
          : []),
      ];
    } else if (cleanCategory) {
      scheduleFilter.category = {
        $regex: new RegExp(`^${escapeRegex(cleanCategory)}$`, "i"),
      };
    }

    const scheduleTests = await db
      .collection("schedule")
      .find(scheduleFilter)
      .project({
        _id: 1,
        title: 1,
        questionCode: 1,
        questionSetId: 1,
        inchargeStaff: 1,
        status: 1,
      })
      .toArray();

    if (scheduleTests.length === 0) {
      let notFoundMsg = "No tests found for the given filters.";
      if (isUniversityReport) {
        notFoundMsg =
          "No tests found for University examination with the given filters.";
      } else if (isCieReport) {
        notFoundMsg = `No tests found for CIE ${cieValue} with the given filters.`;
      }
      throw new Error(notFoundMsg);
    }

    // Fetch question codes from questions collection to use as column headers (not testcode)
    const questionIdQuery = [];
    scheduleTests.forEach((t) => {
      if (t.questionSetId) {
        const str = t.questionSetId.toString();
        questionIdQuery.push(str);
        if (ObjectId.isValid(str)) {
          questionIdQuery.push(new ObjectId(str));
        }
      }
    });

    const questionDocs = await db
      .collection("questions")
      .find({ _id: { $in: questionIdQuery } })
      .project({ _id: 1, questionCode: 1, quesCode: 1, questioncode: 1 })
      .toArray();

    const questionCodeMap = new Map();
    questionDocs.forEach((q) => {
      const code = (
        q.questionCode ||
        q.quesCode ||
        q.questioncode ||
        ""
      )
        .toString()
        .trim();
      if (code) {
        questionCodeMap.set(q._id.toString(), code);
      }
    });

    // Sort tests by question code (natural/numeric sorting)
    scheduleTests.sort((a, b) => {
      const qCodeA =
        questionCodeMap.get(a.questionSetId?.toString()) ||
        a.questionCode ||
        "";
      const qCodeB =
        questionCodeMap.get(b.questionSetId?.toString()) ||
        b.questionCode ||
        "";
      return qCodeA.localeCompare(qCodeB, undefined, { numeric: true });
    });

    const testColumns = scheduleTests.map((test, index) => {
      const qId = test.questionSetId ? test.questionSetId.toString() : "";
      const questionCode =
        questionCodeMap.get(qId) || test.questionCode;
      const label = questionCode || test.title || `Test-${index + 1}`;

      return {
        questionSetId: qId,
        label,
      };
    });

    // Deduplicate test columns by questionSetId
    const seenQuestionSets = new Set();
    const uniqueTestColumns = [];
    for (const col of testColumns) {
      if (!seenQuestionSets.has(col.questionSetId)) {
        seenQuestionSets.add(col.questionSetId);
        uniqueTestColumns.push(col);
      }
    }

    // 3. Fetch student exam attempts
    const examFilter = {
      questionSetId: {
        $in: questionIdQuery,
      },
    };

    if (cleanBatch) {
      examFilter.batch = {
        $regex: new RegExp(`^${escapeRegex(cleanBatch)}$`, "i"),
      };
    }
    if (cleanDept) {
      examFilter.department = {
        $regex: new RegExp(`^${escapeRegex(cleanDept)}$`, "i"),
      };
    }
    if (cleanSec) {
      examFilter.section = {
        $regex: new RegExp(`^${escapeRegex(cleanSec)}$`, "i"),
      };
    }

    if (isUniversityReport) {
      examFilter.category = {
        $regex: /^university$/i,
      };
    } else {
      // Normal report category includes both normal and retest student attempts
      examFilter.category = {
        $in: ["normal", "retest", "Normal", "Retest"],
      };
    }

    const examRecords = await db
      .collection("exam")
      .find(examFilter)
      .project({
        _id: 0,
        questionSetId: 1,
        admissionNo: 1,
        category: 1,
        obtainedMarks: 1,
      })
      .toArray();

    const examMap = new Map();
    examRecords.forEach((record) => {
      if (!record.admissionNo) return;
      const admKey = String(record.admissionNo).trim().toUpperCase();
      if (!examMap.has(admKey)) {
        examMap.set(admKey, new Map());
      }
      const studentTests = examMap.get(admKey);
      const testKey = record.questionSetId ? record.questionSetId.toString() : "";
      if (!studentTests.has(testKey)) {
        studentTests.set(testKey, {});
      }
      const entry = studentTests.get(testKey);
      const recordCategory = (record.category || "")
        .toString()
        .trim()
        .toLowerCase();

      if (recordCategory === "retest") {
        entry.retest = Math.max(entry.retest ?? 0, Number(record.obtainedMarks) || 0);
      } else {
        entry.normal = Math.max(entry.normal ?? 0, Number(record.obtainedMarks) || 0);
      }
    });

    // 4. Generate HTML table headers and rows
    const extraHeaderCells =
      uniqueTestColumns.map((col) => `<th>${col.label}</th>`).join("") +
      "<th>Total</th>";

    const maxMarksPerTest = 10;
    const maxTotalMarks = Math.max(uniqueTestColumns.length * maxMarksPerTest, 10);

    const rows = studentRoster
      .map((student, index) => {
        const admKey = String(student.admissionNo || "").trim().toUpperCase();
        const studentTests = examMap.get(admKey);
        let total = 0;
        let hasAttempt = false;

        const marksCells = uniqueTestColumns
          .map((col) => {
            const entry = studentTests
              ? studentTests.get(col.questionSetId)
              : undefined;
            let markDisplay = "AB";

            if (entry) {
              if (isUniversityReport) {
                if (entry.normal !== undefined) {
                  markDisplay = entry.normal;
                  hasAttempt = true;
                }
              } else {
                // Normal report: if student took retest, include retest marks; otherwise normal marks
                if (entry.retest !== undefined) {
                  markDisplay = entry.retest;
                  hasAttempt = true;
                } else if (entry.normal !== undefined) {
                  markDisplay = entry.normal;
                  hasAttempt = true;
                }
              }
            }
            if (markDisplay !== "AB") {
              total += Number(markDisplay) || 0;
            }

            return `<td>${markDisplay}</td>`;
          })
          .join("");

        const totalDisplay = hasAttempt ? `${total}/${maxTotalMarks}` : "AB";

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${student.admissionNo || "-"}</td>
            <td class="name">${student.name || "-"}</td>
            ${marksCells}
            <td>${totalDisplay}</td>
          </tr>
        `;
      })
      .join("");

    // 5. Staff display lookup
    let staffValue = "-";
    if (scheduleTests.length > 0 && scheduleTests[0].inchargeStaff) {
      staffValue = scheduleTests[0].inchargeStaff;
    }
    if (staffValue && staffValue !== "-") {
      const staffDoc = await db.collection("staff").findOne({
        $or: [
          { username: staffValue },
          { email: staffValue },
          { name: staffValue },
        ],
      });
      if (staffDoc && staffDoc.name) {
        staffValue = staffDoc.name;
      }
    }

    // 6. Read HTML template & College Logo
    const templatePath = path.join(__dirname, "../html/examExport.html");
    const htmlTemplate = fs.readFileSync(templatePath, "utf8");

    const logoPath = path.join(__dirname, "../assets/logo.png");
    const logoBuffer = fs.readFileSync(logoPath);
    const logoData = `data:image/png;base64,${logoBuffer.toString("base64")}`;

    const batchValue = cleanBatch || "All";
    const departmentValue = cleanDept || "All";
    const sectionValue = cleanSec || "All";
    const academicYearValue = academicYear || "All";
    const semesterValue = cleanSem
      ? cleanSem.charAt(0).toUpperCase() + cleanSem.slice(1)
      : "All";
    const cieDisplay = isCieReport
      ? `CIE ${cieValue}`
      : isUniversityReport
        ? "N/A"
        : "All";

    const reportTitle = isUniversityReport
      ? "English Department - University Examination Report"
      : "English Department - Examination Report";

    const examTypeLabel = isUniversityReport ? "Exam Type" : "CIE";
    const examTypeValue = isUniversityReport ? "University" : cieDisplay;
    const signLeftLabel = isUniversityReport
      ? "Internal Examiner's Signature"
      : "Staff's Signature";
    const signRightLabel = isUniversityReport
      ? "External Examiner's Signature"
      : "HOD's Signature";

    const compiledHtml = htmlTemplate
      .replace("{{LOGO}}", logoData)
      .replace("{{REPORT_TITLE}}", reportTitle)
      .replace("{{BATCH}}", batchValue)
      .replace("{{ACADEMIC_YEAR}}", academicYearValue)
      .replace("{{DEPARTMENT}}", departmentValue)
      .replace("{{SECTION}}", sectionValue)
      .replace("{{SEMESTER}}", semesterValue)
      .replace("{{EXAM_TYPE_LABEL}}", examTypeLabel)
      .replace("{{EXAM_TYPE_VALUE}}", examTypeValue)
      .replace("{{CIE}}", cieDisplay)
      .replace("{{STAFF}}", staffValue)
      .replace("{{MARKS_HEADERS}}", extraHeaderCells)
      .replace("{{ROWS}}", rows)
      .replace("{{TOTAL_STUDENTS}}", studentRoster.length)
      .replace("{{SIGN_LEFT_LABEL}}", signLeftLabel)
      .replace("{{SIGN_RIGHT_LABEL}}", signRightLabel);

    // 7. Launch Puppeteer and generate PDF
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
    const page = await browser.newPage();
    await page.setContent(compiledHtml, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "15mm",
        bottom: "15mm",
        left: "10mm",
        right: "10mm",
      },
    });

    await browser.close();
    browser = null;

    // 8. Upload to S3 with structured subfolder hierarchy and short dept code:
    // reports/<category>/<batch>/<deptShort>/Sec-<section>/
    const deptShort = getDepartmentShortCode(departmentValue);

    const subfolderPath = [
      "reports",
      (cleanCategory || "exam").toLowerCase(),
      batchValue,
      deptShort,
      `Sec-${sectionValue}`,
    ].join("/");

    // Fixed CIE-specific filename: All 4 tests of the same CIE update the exact same file path
    const stableFilename = isUniversityReport
      ? "University.pdf"
      : isCieReport
        ? `CIE-${cieValue}.pdf`
        : "Exam-Report.pdf";

    const uploadResult = await uploadToS3(
      {
        buffer: pdf,
        filename: stableFilename,
        mimeType: "application/pdf",
      },
      subfolderPath
    );

    // 9. Store / Upsert in "result" collection
    const filter = {
      batch: { $regex: new RegExp(`^${escapeRegex(cleanBatch)}$`, "i") },
      department: { $regex: new RegExp(`^${escapeRegex(cleanDept)}$`, "i") },
      section: { $regex: new RegExp(`^${escapeRegex(cleanSec)}$`, "i") },
      category: { $regex: new RegExp(`^${escapeRegex(cleanCategory)}$`, "i") },
    };

    if (cleanSem) {
      filter.semester = {
        $regex: new RegExp(`^${escapeRegex(cleanSem)}$`, "i"),
      };
    }
    if (isCieReport && cieValue) {
      filter.cie = cieValue;
    }

    const now = new Date();
    const resultDocument = {
      batch: cleanBatch,
      department: cleanDept,
      section: cleanSec,
      semester: cleanSem,
      category: cleanCategory,
      cie: isCieReport ? cieValue : null,
      academicYear: academicYearValue,
      url: uploadResult.url,
      key: uploadResult.key,
      filename: stableFilename,
      totalStudents: studentRoster.length,
      staff: staffValue,
      testCount: uniqueTestColumns.length,
      scheduleCount: scheduleTests.length,
      lastUpdatedTestId: triggeredTestId ? String(triggeredTestId) : null,
      updatedAt: now,
    };

    await db.collection("result").updateOne(
      filter,
      {
        $set: resultDocument,
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    console.log(
      `[CLASS REPORT] Saved to result collection: ${cleanDept} Sec-${cleanSec} ${cleanCategory} ${cieValue || ""} (${uploadResult.url})`
    );

    return resultDocument;
  } catch (err) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    throw err;
  }
};

/**
 * Convenience helper to generate class report from a schedule test
 */
const generateAndSaveClassReportForSchedule = async (scheduleOrId) => {
  const db = getDB();
  let schedule = scheduleOrId;

  if (typeof scheduleOrId === "string" || scheduleOrId instanceof ObjectId) {
    schedule = await db.collection("schedule").findOne({
      _id: new ObjectId(scheduleOrId),
    });
  }

  if (!schedule) {
    console.warn(`[CLASS REPORT] Schedule not found: ${scheduleOrId}`);
    return null;
  }

  const batch = schedule.eligibility?.batch;
  const department = schedule.eligibility?.department;
  const section = schedule.eligibility?.section;
  const semester = schedule.eligibility?.semester;
  const academicYear = schedule.eligibility?.academicYear;
  const rawCategory = (schedule.category || "normal").toLowerCase();
  // Retest tests update the normal CIE report (since normal report includes retest marks)
  const category = rawCategory === "university" ? "university" : "normal";
  let cie = schedule.cie || null;

  // If this is a retest without explicit cie, infer CIE from the question set or normal schedule
  if (!cie && rawCategory === "retest" && schedule.questionSetId) {
    const normalMatch = await db.collection("schedule").findOne({
      questionSetId: schedule.questionSetId,
      cie: { $in: ["I", "II", "III", "i", "ii", "iii"] },
      status: { $nin: ["Cancelled", "cancelled"] },
    });
    if (normalMatch?.cie) {
      cie = String(normalMatch.cie).trim().toUpperCase();
    }
  }

  if (!batch || !department || !section) {
    console.warn(
      `[CLASS REPORT] Incomplete eligibility in schedule ${schedule._id}`
    );
    return null;
  }

  return await generateAndSaveClassReport({
    batch,
    department,
    section,
    semester,
    category,
    cie,
    academicYear,
    triggeredTestId: schedule._id,
  });
};

/**
 * Query existing class report from "result" collection
 */
const getStoredClassReport = async ({
  batch,
  department,
  section,
  semester,
  category,
  cie,
}) => {
  const db = getDB();

  const cleanBatch = batch ? String(batch).trim() : "";
  const cleanDept = department ? String(department).trim() : "";
  const cleanSec = section ? String(section).trim() : "";
  const cleanSem = semester ? String(semester).trim().toLowerCase() : "";
  const cleanCategory = category ? String(category).trim().toLowerCase() : "normal";

  const isUniversity = cleanCategory === "university";
  const isCie =
    !isUniversity &&
    cie &&
    typeof cie === "string" &&
    cie.trim() &&
    !["n/a", "all", "none"].includes(cie.trim().toLowerCase());
  const cieVal = isCie ? cie.trim().toUpperCase() : null;

  const query = {
    batch: { $regex: new RegExp(`^${escapeRegex(cleanBatch)}$`, "i") },
    department: { $regex: new RegExp(`^${escapeRegex(cleanDept)}$`, "i") },
    section: { $regex: new RegExp(`^${escapeRegex(cleanSec)}$`, "i") },
    category: { $regex: new RegExp(`^${escapeRegex(cleanCategory)}$`, "i") },
  };

  if (cleanSem) {
    query.semester = { $regex: new RegExp(`^${escapeRegex(cleanSem)}$`, "i") };
  }

  if (isCie && cieVal) {
    query.cie = cieVal;
  }

  return await db.collection("result").findOne(query);
};

/**
 * Count available tests scheduled for a class to determine if stored report cache is stale
 */
const countAvailableTestsForClass = async ({
  batch,
  department,
  section,
  semester,
  category = "normal",
  cie = null,
  academicYear = null,
}) => {
  const db = getDB();
  const cleanBatch = batch && typeof batch === "string" ? batch.trim() : null;
  const cleanDept =
    department && typeof department === "string" ? department.trim() : null;
  const cleanSec =
    section && typeof section === "string" ? section.trim() : null;
  const cleanSem =
    semester && typeof semester === "string"
      ? semester.trim().toLowerCase()
      : null;
  const cleanCategory =
    category && typeof category === "string"
      ? category.trim().toLowerCase()
      : "normal";
  const isUniv = cleanCategory === "university";
  const isCie =
    !isUniv &&
    cie &&
    typeof cie === "string" &&
    !["n/a", "all", "none"].includes(cie.trim().toLowerCase());
  const cieVal = isCie ? cie.trim().toUpperCase() : null;

  const scheduleFilter = {
    status: { $nin: ["Cancelled", "cancelled"] },
  };
  if (cleanBatch) {
    scheduleFilter["eligibility.batch"] = {
      $regex: new RegExp(`^${escapeRegex(cleanBatch)}$`, "i"),
    };
  }
  if (cleanDept) {
    scheduleFilter["eligibility.department"] = {
      $regex: new RegExp(`^${escapeRegex(cleanDept)}$`, "i"),
    };
  }
  if (cleanSec) {
    scheduleFilter["eligibility.section"] = {
      $regex: new RegExp(`^${escapeRegex(cleanSec)}$`, "i"),
    };
  }
  if (cleanSem) {
    scheduleFilter["eligibility.semester"] = {
      $regex: new RegExp(`^${escapeRegex(cleanSem)}$`, "i"),
    };
  }
  if (academicYear && academicYear !== "All" && academicYear !== "null") {
    scheduleFilter["eligibility.academicYear"] = academicYear;
  }

  if (isUniv) {
    scheduleFilter.category = { $regex: /^university$/i };
  } else if (isCie) {
    const cieRegex = new RegExp(`^(CIE[\\s-]*)?${escapeRegex(cieVal)}$`, "i");

    // Also find question sets associated with this CIE for this class to catch retests
    const normalCieTests = await db
      .collection("schedule")
      .find({
        status: { $nin: ["Cancelled", "cancelled"] },
        ...(cleanBatch
          ? {
              "eligibility.batch": {
                $regex: new RegExp(`^${escapeRegex(cleanBatch)}$`, "i"),
              },
            }
          : {}),
        cie: cieRegex,
      })
      .project({ questionSetId: 1 })
      .toArray();

    const relatedQSetIds = normalCieTests
      .map((t) => t.questionSetId)
      .filter(Boolean);

    scheduleFilter.$or = [
      {
        cie: cieRegex,
        category: { $in: ["normal", "retest", "Normal", "Retest"] },
      },
      ...(relatedQSetIds.length > 0
        ? [
            {
              category: { $in: ["retest", "Retest"] },
              questionSetId: { $in: relatedQSetIds },
            },
          ]
        : []),
    ];
  } else if (cleanCategory) {
    scheduleFilter.category = {
      $regex: new RegExp(`^${escapeRegex(cleanCategory)}$`, "i"),
    };
  }

  const tests = await db
    .collection("schedule")
    .find(scheduleFilter)
    .project({ _id: 1, questionSetId: 1 })
    .toArray();

  return tests.length;
};

/**
 * Check if any test was assigned, scheduled, or student exam submitted after saved result timestamp
 */
const checkNewTestAssignedAfterReport = async ({
  batch,
  department,
  section,
  semester,
  category = "normal",
  cie = null,
  academicYear = null,
  reportUpdatedAt = null,
}) => {
  if (!reportUpdatedAt) return true;

  const db = getDB();
  const cleanBatch = batch && typeof batch === "string" ? batch.trim() : null;
  const cleanDept =
    department && typeof department === "string" ? department.trim() : null;
  const cleanSec =
    section && typeof section === "string" ? section.trim() : null;
  const cleanSem =
    semester && typeof semester === "string"
      ? semester.trim().toLowerCase()
      : null;
  const cleanCategory =
    category && typeof category === "string"
      ? category.trim().toLowerCase()
      : "normal";
  const isUniv = cleanCategory === "university";
  const isCie =
    !isUniv &&
    cie &&
    typeof cie === "string" &&
    !["n/a", "all", "none"].includes(cie.trim().toLowerCase());
  const cieVal = isCie ? cie.trim().toUpperCase() : null;

  const scheduleFilter = {
    status: { $nin: ["Cancelled", "cancelled"] },
  };
  if (cleanBatch) {
    scheduleFilter["eligibility.batch"] = {
      $regex: new RegExp(`^${escapeRegex(cleanBatch)}$`, "i"),
    };
  }
  if (cleanDept) {
    scheduleFilter["eligibility.department"] = {
      $regex: new RegExp(`^${escapeRegex(cleanDept)}$`, "i"),
    };
  }
  if (cleanSec) {
    scheduleFilter["eligibility.section"] = {
      $regex: new RegExp(`^${escapeRegex(cleanSec)}$`, "i"),
    };
  }
  if (cleanSem) {
    scheduleFilter["eligibility.semester"] = {
      $regex: new RegExp(`^${escapeRegex(cleanSem)}$`, "i"),
    };
  }
  if (academicYear && academicYear !== "All" && academicYear !== "null") {
    scheduleFilter["eligibility.academicYear"] = academicYear;
  }

  if (isUniv) {
    scheduleFilter.category = { $regex: /^university$/i };
  } else if (isCie) {
    const cieRegex = new RegExp(`^(CIE[\\s-]*)?${escapeRegex(cieVal)}$`, "i");

    // Also find question sets associated with this CIE for this class to catch retests
    const normalCieTests = await db
      .collection("schedule")
      .find({
        status: { $nin: ["Cancelled", "cancelled"] },
        ...(cleanBatch
          ? {
              "eligibility.batch": {
                $regex: new RegExp(`^${escapeRegex(cleanBatch)}$`, "i"),
              },
            }
          : {}),
        cie: cieRegex,
      })
      .project({ questionSetId: 1 })
      .toArray();

    const relatedQSetIds = normalCieTests
      .map((t) => t.questionSetId)
      .filter(Boolean);

    scheduleFilter.$or = [
      {
        cie: cieRegex,
        category: { $in: ["normal", "retest", "Normal", "Retest"] },
      },
      ...(relatedQSetIds.length > 0
        ? [
            {
              category: { $in: ["retest", "Retest"] },
              questionSetId: { $in: relatedQSetIds },
            },
          ]
        : []),
    ];
  } else if (cleanCategory) {
    scheduleFilter.category = {
      $regex: new RegExp(`^${escapeRegex(cleanCategory)}$`, "i"),
    };
  }

  const savedDate = new Date(reportUpdatedAt);
  const timeConditions = [
    { createdAt: { $gt: savedDate } },
    { updatedAt: { $gt: savedDate } },
  ];

  try {
    const idGt = ObjectId.createFromTime(Math.floor(savedDate.getTime() / 1000));
    timeConditions.push({ _id: { $gt: idGt } });
  } catch (e) {}

  // 1. Check if any test (or retest for this CIE) was scheduled/assigned after savedDate
  const newSchedule = await db.collection("schedule").findOne({
    ...scheduleFilter,
    $or: timeConditions,
  });

  if (newSchedule) {
    return true;
  }

  // 2. Check if any student submitted exam attempt after savedDate
  const examFilter = {
    $or: [
      { submittedAt: { $gt: savedDate } },
      { updatedAt: { $gt: savedDate } },
    ],
  };
  if (cleanBatch) {
    examFilter.batch = { $regex: new RegExp(`^${escapeRegex(cleanBatch)}$`, "i") };
  }
  if (cleanDept) {
    examFilter.department = { $regex: new RegExp(`^${escapeRegex(cleanDept)}$`, "i") };
  }
  if (cleanSec) {
    examFilter.section = { $regex: new RegExp(`^${escapeRegex(cleanSec)}$`, "i") };
  }

  const newExamSubmission = await db.collection("exam").findOne(examFilter);
  if (newExamSubmission) {
    return true;
  }

  return false;
};

module.exports = {
  generateAndSaveClassReport,
  generateAndSaveClassReportForSchedule,
  getStoredClassReport,
  countAvailableTestsForClass,
  checkNewTestAssignedAfterReport,
};


