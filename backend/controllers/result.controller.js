const fs = require("fs");
const path = require("path");

const puppeteer = require("puppeteer");
const { ObjectId } = require("mongodb");

const { getDB } = require("../config/db");
const { getFromS3, uploadToS3 } = require("../service/s3_service");


// ============================================================
// GENERATE EXAM REPORT PDF
// ============================================================


const generateExamReport = async (req, res) => {

    let browser = null;

    try {

    
        const data = req.body;

        if (!data || Object.keys(data).length === 0) {

            return res.status(400).json({
                success: false,
                message: "Request body is required."
            });

        }

        console.log("JSON DATA:");
        console.log(data);


        // ====================================================
        // CLEAN FILTERS
        // ====================================================

        const {
            department,
            section,
            cie,
            semester,
            academicYear
        } = data;

        const cleanBatch = batch && typeof batch === "string" && batch.trim() !== "" ? batch.trim() : null;
        const cleanDept = department && typeof department === "string" && department.trim() !== "" ? department.trim() : null;
        const cleanSec = section && typeof section === "string" && section.trim() !== "" ? section.trim() : null;
        const cleanSem = semester && typeof semester === "string" && ["odd", "even"].includes(semester.trim().toLowerCase()) 
            ? semester.trim().toLowerCase() 
            : null;


        // ====================================================
        // CHECK IF A SPECIFIC CIE WAS REQUESTED
        // ====================================================

        const isCieReport =
            cie !== undefined &&
            cie !== null &&
            typeof cie === "string" &&
            cie.trim() !== "";

        const cieValue =
            isCieReport
                ? cie.trim()
                : null;

        console.log(
            "isCieReport:",
            isCieReport
        );


        // ====================================================
        // GET DATABASE
        // ====================================================

        const db = getDB();


        // ====================================================
        // BUILD STUDENT ROSTER FILTER (Top-Level Fields)
        // ====================================================
        // The "students" collection stores data at the root level.

        const studentFilter = {};

        if (cleanBatch) {
            studentFilter.batch = cleanBatch;
        }
        
        if (cleanDept) {
            studentFilter.department = cleanDept;
        }
        
        if (cleanSec) {
            studentFilter.section = cleanSec;
        }


        // ====================================================
        // FETCH CLASS ROSTER FROM "student"
        // ====================================================
        // This is the source of truth for which rows appear in
        // the report — NOT the exam collection. A student with
        // zero attempts still gets a row, filled with "AB".

        const studentRoster = await db
            .collection("students")
            .find(studentFilter)
            .project({

                _id: 0,
                admissionNo: 1,
                name: 1

            })
            .sort({
                name: 1
            })
            .toArray();


        console.log(
            `Found ${studentRoster.length} student(s) in roster`
        );


        if (studentRoster.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "No students found for the given filters."

            });

        }


        // ====================================================
        // BUILD SCHEDULE FILTER (Nested "eligibility" Fields)
        // ====================================================
        // The "schedule" collection nests these fields inside "eligibility"
        // except for "cie", which is top-level.

        const scheduleFilter = {};

        if (cleanBatch) {
            scheduleFilter["eligibility.batch"] = cleanBatch;
        }

        if (cleanDept) {
            scheduleFilter["eligibility.department"] = cleanDept;
        }

        if (cleanSec) {
            scheduleFilter["eligibility.section"] = cleanSec;
        }

        if (cleanSem) {
            scheduleFilter["eligibility.semester"] = cleanSem;
        }

        if (isCieReport) {
            scheduleFilter.cie = cieValue;
        }


        console.log(
            "SCHEDULE FILTER:",
            scheduleFilter
        );


        // ====================================================
        // FETCH TEST COLUMNS FROM "schedule"
        // ====================================================

        const scheduleTests = await db
            .collection("schedule")
            .find(scheduleFilter)
            .project({

                _id: 1,
                testcode: 1,
                title: 1,
                questionSetId: 1

            })
            .toArray();


        console.log(
            `Found ${scheduleTests.length} schedule test(s)`
        );


        if (scheduleTests.length === 0) {

            return res.status(404).json({

                success: false,

                message: isCieReport
                    ? `No tests found for CIE ${cieValue} with the given filters.`
                    : "No tests found for the given filters."

            });

        }


        // ====================================================
        // ORDER TESTS BY testcode (NATURAL NUMERIC SORT)
        // ====================================================
        const extractTestNumber = (testcode) => {

            if (!testcode) {

                return Number.MAX_SAFE_INTEGER;

            }

            const match =
                testcode.match(/(\d+)\s*$/);

            return match
                ? parseInt(match[1], 10)
                : Number.MAX_SAFE_INTEGER;

        };

        scheduleTests.sort((a, b) => {

            return (
                extractTestNumber(a.testcode) -
                extractTestNumber(b.testcode)
            );

        });


  
        const testColumns = scheduleTests.map((test, index) => {

            const testNumber =
                extractTestNumber(test.testcode);

            const label =
                testNumber !== Number.MAX_SAFE_INTEGER
                    ? `Test-${testNumber}`
                    : (test.testcode || test.title || `Test-${index + 1}`);

            return {

                questionSetId:
                    test.questionSetId.toString(),

                label: label

            };

        });


        const questionSetIds =
            scheduleTests.map(
                (test) => new ObjectId(test.questionSetId)
            );


        // ====================================================
        // BUILD EXAM FILTER (Top-Level Fields + QuestionSet IDs)
        // ====================================================
        // The "exam" collection stores data at the root level.
        // It strictly binds to the matched schedules via questionSetId.

        const examFilter = {
            questionSetId: {
                $in: questionSetIds
            }
        };

        if (cleanBatch) {
            examFilter.batch = cleanBatch;
        }

        if (cleanDept) {
            examFilter.department = cleanDept;
        }

        if (cleanSec) {
            examFilter.section = cleanSec;
        }

        console.log(
            "EXAM FILTER:",
            examFilter
        );


        // ====================================================
        // FETCH ALL EXAM ATTEMPTS FOR THESE TESTS
        // ====================================================

        const examRecords = await db
            .collection("exam")
            .find(examFilter)
            .project({

                _id: 0,
                questionSetId: 1,
                admissionNo: 1,
                category: 1,
                obtainedMarks: 1

            })
            .toArray();


        console.log(
            `Found ${examRecords.length} exam attempt(s)`
        );


        // ====================================================
        // BUILD admissionNo -> questionSetId -> {normal, retest}
        // ====================================================

        const examMap = new Map();

        examRecords.forEach((record) => {

            if (!record.admissionNo) {

                
                return;

            }

            if (!examMap.has(record.admissionNo)) {

                examMap.set(
                    record.admissionNo,
                    new Map()
                );

            }

            const studentTests =
                examMap.get(record.admissionNo);

            const testKey =
                record.questionSetId.toString();

            if (!studentTests.has(testKey)) {

                studentTests.set(testKey, {});

            }

            const entry =
                studentTests.get(testKey);

            const category =
                (record.category || "")
                    .toString()
                    .trim()
                    .toLowerCase();

            if (category === "retest") {

                entry.retest = record.obtainedMarks ?? 0;

            } else {

                // Anything that isn't explicitly "retest" is
                // treated as the normal attempt.
                entry.normal = record.obtainedMarks ?? 0;

            }

        });


        console.log(
            `Found ${studentRoster.length} student row(s)`
        );


        // ====================================================
        // GENERATE TABLE HEADER
        // ====================================================

        const extraHeaderCells = testColumns
            .map((col) => `<th>${col.label}</th>`)
            .join("");


        // ====================================================
        // GENERATE TABLE ROWS
        // ====================================================
        // One row per roster student. Per test column: retest
        // mark if it exists, else the normal mark, else "AB" if
        // the student has neither.

        const rows = studentRoster
            .map((student, index) => {

                const studentTests =
                    examMap.get(student.admissionNo);

                const marksCells = testColumns
                    .map((col) => {

                        const entry =
                            studentTests
                                ? studentTests.get(col.questionSetId)
                                : undefined;

                        let markDisplay = "AB";

                        if (entry) {

                            if (entry.retest !== undefined) {

                                markDisplay = entry.retest;

                            } else if (entry.normal !== undefined) {

                                markDisplay = entry.normal;

                            }

                        }

                        return `
                            <td>
                                ${markDisplay}
                            </td>
                        `;

                    })
                    .join("");

                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${student.admissionNo || "-"}
                        </td>

                        <td class="name">
                            ${student.name || "-"}
                        </td>

                        ${marksCells}

                    </tr>
                `;

            })
            .join("");


        // ====================================================
        // FETCH STAFF (MENTOR) NAME FOR THIS CLASS
        // ====================================================
        // Only looked up when enough details are present in the
        // request to identify the staff (department + section at
        // minimum). Exactly one mentor is expected per class, so
        // this uses findOne rather than collecting a list. If
        // nothing matches, the report simply shows "-" instead
        // of failing.

        let staffValue = "-";

        const staffFilter = {};

        if (
            department &&
            typeof department === "string" &&
            department.trim() !== ""
        ) {

            staffFilter.department = department.trim();

        }

        if (
            section &&
            typeof section === "string" &&
            section.trim() !== ""
        ) {

            staffFilter.section = section.trim();

        }

        if (
            academicYear &&
            typeof academicYear === "string" &&
            academicYear.trim() !== ""
        ) {

            staffFilter.academicYear = academicYear.trim();

        }

        if (
            semester &&
            typeof semester === "string" &&
            semester.trim() !== ""
        ) {

            staffFilter.semester = semester.trim();

        }

        // Only query when we actually have department + section at
        // minimum — anything looser risks matching unrelated staff.
        const hasEnoughDetailsForStaff =
            staffFilter.department &&
            staffFilter.section;

        if (hasEnoughDetailsForStaff) {

            console.log(
                "STAFF FILTER:",
                staffFilter
            );

            const staffMember = await db
                .collection("staff")
                .findOne(
                    staffFilter,
                    {
                        projection: {
                            _id: 0,
                            name: 1
                        }
                    }
                );

            console.log(
                staffMember
                    ? `Found mentor: ${staffMember.name}`
                    : "No mentor found for this class"
            );

            if (staffMember && staffMember.name) {

                staffValue = staffMember.name;

            }

        }


        // ====================================================
        // GET HTML TEMPLATE FROM LOCAL FILE
        // ====================================================
        

        const templatePath =
            path.join(
                __dirname,
                "../html/examExport.html"
            );

        let html;

        try {

            html =
                fs.readFileSync(templatePath, "utf8");

        } catch (error) {

            console.error(
                "Local HTML Template Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "HTML template not found."

            });

        }


        // ====================================================
        // GET LOGO FROM S3
        // ====================================================

        const logoKey =
            "english_exam_platform/assets/logo.png";

        let logoBase64;

        try {

            const logoBuffer =
                await getFromS3(logoKey);

            logoBase64 =
                logoBuffer.toString("base64");

        } catch (error) {

            console.error(
                "S3 Logo Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "College logo not found."

            });

        }


        // ====================================================
        // CREATE LOGO DATA URI
        // ====================================================

        const logoData =
            `data:image/png;base64,${logoBase64}`;


        // ====================================================
        // DISPLAY FILTER VALUES
        // ====================================================

        const batchValue = cleanBatch || "All";
        const departmentValue = cleanDept || "All";
        const sectionValue = cleanSec || "All";
        const semesterValue =
            cleanSem
                ? cleanSem.charAt(0).toUpperCase() + cleanSem.slice(1)
                : "All";
        const cieDisplay = isCieReport ? `CIE ${cieValue}` : "All";


        // ====================================================
        // REPLACE HTML PLACEHOLDERS
        // ====================================================
        

        html = html

            .replace(
                "{{LOGO}}",
                logoData
            )

            .replace(
                "{{ACADEMIC_YEAR}}",
                academicYearValue
            )

            .replace(
                "{{DEPARTMENT}}",
                departmentValue
            )

            .replace(
                "{{SECTION}}",
                sectionValue
            )

            .replace(
                "{{SEMESTER}}",
                semesterValue
            )

            .replace(
                "{{CIE}}",
                cieDisplay
            )

            .replace(
                "{{STAFF}}",
                staffValue
            )

            .replace(
                "{{STAFF}}",
                staffValue
            )

            .replace(
                "{{MARKS_HEADERS}}",
                extraHeaderCells
            )

            .replace(
                "{{ROWS}}",
                rows
            )

            .replace(
                "{{TOTAL_STUDENTS}}",
                studentRoster.length
            );


        // ====================================================
        // LAUNCH PUPPETEER
        // ====================================================

        browser = await puppeteer.launch({
            headless: true
        });


        // ====================================================
        // CREATE PAGE
        // ====================================================

        const page =
            await browser.newPage();


        // ====================================================
        // LOAD HTML
        // ====================================================

        await page.setContent(
            html,
            {
                waitUntil: "networkidle0"
            }
        );


        // ====================================================
        // GENERATE PDF
        // ====================================================

        const pdf = await page.pdf({

            format: "A4",

            landscape: true,

            printBackground: true,

            margin: {

                top: "15mm",
                bottom: "15mm",
                left: "10mm",
                right: "10mm"

            }

        });


        // ====================================================
        // CLOSE BROWSER
        // ====================================================

        await browser.close();

        browser = null;


        // ====================================================
        // UPLOAD GENERATED PDF TO S3
        // ====================================================
        // Build a meaningful filename from the applied filters,
        // e.g. "exam-report-AIDS-2024-2028-A-odd-CIE1-1755500000000.pdf"
        // (falls back to "All" segments when a filter wasn't set).

        const sanitizeForFilename = (value) => {

            return String(value)
                .trim()
                .replace(/[^a-zA-Z0-9-]+/g, "")
                || "All";

        };

        const filenameParts = [

            "exam-report",
            sanitizeForFilename(departmentValue),
            sanitizeForFilename(academicYearValue),
            sanitizeForFilename(sectionValue),
            cleanSem
                ? cleanSem
                : "AllSem",
            isCieReport
                ? `CIE${cieValue}`
                : "AllCIE"

        ];

        const meaningfulFilename =
            `${filenameParts.join("-")}-${Date.now()}.pdf`;


        const file = {

            buffer: pdf,

            filename:
                meaningfulFilename,

            mimeType:
                "application/pdf"

        };


        const uploadResult =
            await uploadToS3(
                file,
                "reports"
            );


        console.log(
            "PDF uploaded to S3:",
            uploadResult
        );


        // ====================================================
        // RESPONSE
        // ====================================================

        return res.status(200).json({

            success: true,

            message:
                "Exam report generated and uploaded successfully.",

            data: {

                key:
                    uploadResult.key,

                url:
                    uploadResult.url,

                totalStudents:
                    studentRoster.length,

                staff:
                    staffValue

            }

        });


    } catch (error) {

        console.error(
            "PDF generation error:",
            error
        );


        if (browser) {

            await browser.close();

        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to generate examination report.",

            error:
                error.message

        });

    }

};


module.exports = {
    generateExamReport
};