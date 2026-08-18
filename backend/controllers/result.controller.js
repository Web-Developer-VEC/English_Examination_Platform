const puppeteer = require("puppeteer");
const { ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");

const puppeteer = require("puppeteer");
const { ObjectId } = require("mongodb");

const { getDB } = require("../config/db");
const { getFromS3, uploadToS3 } = require("../service/s3_service");
const { getFromS3, uploadToS3 } = require("../service/s3_service");


// ============================================================
// GENERATE EXAM REPORT PDF
// ============================================================

const generateExamReport = async (req, res) => {

    let browser = null;

    try {

        // ====================================================
        // GET JSON BODY
        // ====================================================
        // Requires express.json() middleware to be applied
        // (globally, or on this route) so req.body is already
        // a parsed object here.

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
        // GET FILTERS
        // ====================================================

        const {
            batch,
            department,
            section,
            cie,
            semester
        } = data;


        // ====================================================
        // GET DATABASE
        // ====================================================

        const db = getDB();


        // ====================================================
        // BUILD COMMON FILTER (batch / department / section / semester)
        // ====================================================

        const commonFilter = {};

        if (
            batch &&
            typeof batch === "string" &&
            batch.trim() !== ""
        ) {

            commonFilter.batch = batch.trim();

        }


        if (
            department &&
            typeof department === "string" &&
            department.trim() !== ""
        ) {

            commonFilter.department = department.trim();

        }


        if (
            section &&
            typeof section === "string" &&
            section.trim() !== ""
        ) {

            commonFilter.section = section.trim();

        }


        // semester is stored as "odd" or "even" — validate against
        // that fixed set rather than treating it as a free string.
        if (
            semester &&
            typeof semester === "string" &&
            ["odd", "even"].includes(semester.trim().toLowerCase())
        ) {

            commonFilter.semester = semester.trim().toLowerCase();

        }


        // ====================================================
        // CHECK IF CIE-WISE REPORT WAS REQUESTED
        // ====================================================

        const isCieReport =
            cie !== undefined &&
            cie !== null &&
            cie !== "" &&
            !isNaN(Number(cie));


        console.log(
            "isCieReport:",
            isCieReport
        );


        let students = [];
        let testColumns = [];


        if (isCieReport) {

            // ================================================
            // CIE-WISE REPORT: FETCH ALL TESTS FOR THIS CIE
            // ================================================

            const cieNumber = Number(cie);

            const scheduleFilter = {

                ...commonFilter,

                cie: cieNumber

            };

            console.log(
                "SCHEDULE FILTER:",
                scheduleFilter
            );

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
                `Found ${scheduleTests.length} schedule test(s) for CIE ${cieNumber}`
            );


            if (scheduleTests.length === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        `No tests found for CIE ${cieNumber} with the given filters.`

                });

            }


            // ================================================
            // ORDER TESTS BY testcode (NATURAL NUMERIC SORT)
            // ================================================
            // testcode values look like "test1", "test2", ... "test10".
            // A plain string sort would put "test10" before "test2",
            // so pull out the trailing number and sort on that.

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


            // Column label per test — formatted as "Test-1", "Test-2",
            // etc. using the number pulled from testcode. Falls back to
            // the raw testcode/title, then a positional label, if no
            // number can be extracted. Matching against exam records
            // is done via questionSetId, which is the field that
            // actually links a schedule entry to its exam attempts
            // (schedule._id and exam.testId do NOT match each other).
            testColumns = scheduleTests.map((test, index) => {

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


            // ================================================
            // FETCH ALL EXAM ATTEMPTS FOR THESE TESTS
            // ================================================

            const examFilter = {

                ...commonFilter,

                questionSetId: {
                    $in: questionSetIds
                }

            };

            console.log(
                "EXAM FILTER:",
                examFilter
            );

            const examRecords = await db
                .collection("exam")
                .find(examFilter)
                .project({

                    _id: 0,
                    questionSetId: 1,
                    admissionNo: 1,
                    studentName: 1,
                    department: 1,
                    batch: 1,
                    section: 1,
                    semester: 1,
                    obtainedMarks: 1

                })
                .sort({
                    studentName: 1
                })
                .toArray();


            if (examRecords.length === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        `No examination records found for CIE ${cieNumber} with the given filters.`

                });

            }


            // ================================================
            // GROUP RECORDS BY STUDENT (ONE ROW PER STUDENT)
            // ================================================

            const studentMap = new Map();

            examRecords.forEach((record) => {

                const key =
                    record.admissionNo || record.studentName;

                if (!studentMap.has(key)) {

                    studentMap.set(key, {

                        admissionNo: record.admissionNo,
                        studentName: record.studentName,
                        department: record.department,
                        batch: record.batch,
                        section: record.section,
                        semester: record.semester,
                        marksByTest: {}

                    });

                }

                const studentEntry =
                    studentMap.get(key);

                studentEntry.marksByTest[
                    record.questionSetId.toString()
                ] = record.obtainedMarks ?? 0;

            });

            students = Array.from(studentMap.values());

        } else {

            // ================================================
            // DEFAULT (NON-CIE) REPORT — UNCHANGED BEHAVIOUR
            // ================================================

            students = await db
                .collection("exam")
                .find(commonFilter)
                .project({

                    _id: 0,
                    admissionNo: 1,
                    studentName: 1,
                    department: 1,
                    batch: 1,
                    section: 1,
                    semester: 1,
                    obtainedMarks: 1,
                    totalMarks: 1

                })
                .sort({
                    studentName: 1
                })
                .toArray();


            if (students.length === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "No examination records found for the given filters."

                });

            }

        }


        console.log(
            `Found ${students.length} student row(s)`
        );


        // ====================================================
        // GENERATE TABLE HEADER (ONLY DIFFERS FOR CIE REPORTS)
        // ====================================================

        const extraHeaderCells = isCieReport
            ? testColumns
                .map((col) => `<th>${col.label}</th>`)
                .join("")
            : `<th>Marks</th>`;


        // ====================================================
        // GENERATE TABLE ROWS
        // ====================================================
        // NOTE: department / batch / section / semester are
        // intentionally NOT rendered per student row (they're
        // shown once in the report's filter summary instead).

        const rows = students
            .map((student, index) => {

                const marksCells = isCieReport
                    ? testColumns
                        .map((col) => {

                            const mark =
                                student.marksByTest[
                                    col.questionSetId
                                ];

                            return `
                                <td>
                                    ${mark !== undefined ? mark : "-"}
                                </td>
                            `;

                        })
                        .join("")
                    : `
                        <td>
                            ${student.obtainedMarks ?? 0}/${student.totalMarks ?? 0}
                        </td>
                    `;

                    return `
                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${student.admissionNo}
                            </td>

                            <td class="name">
                                ${student.studentName}
                            </td>

                        ${marksCells}

                        </tr>
                    `;

                })
                .join("");


        // ====================================================
        // GET HTML TEMPLATE FROM LOCAL FILE
        // ====================================================
        // TEMPORARY: reading from disk for now instead of S3.
        // Adjust this path to wherever examExport.html actually
        // lives relative to this controller file.

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

        const batchValue = commonFilter.batch || "All";
        const departmentValue = commonFilter.department || "All";
        const sectionValue = commonFilter.section || "All";
        const semesterValue =
            commonFilter.semester
                ? commonFilter.semester.charAt(0).toUpperCase() + commonFilter.semester.slice(1)
                : "All";
        const cieValue = isCieReport ? `CIE ${Number(cie)}` : "All";


        // ====================================================
        // REPLACE HTML PLACEHOLDERS
        // ====================================================
        // NOTE: the template must include a {{MARKS_HEADERS}}
        // placeholder inside the <thead> row, in place of the
        // single static "Marks" <th>, and a {{CIE}} placeholder
        // wherever the CIE filter value should be shown.
        // {{SEMESTER}} is replaced here too, but the current
        // template has no {{SEMESTER}} placeholder in it, so
        // this particular .replace() is a harmless no-op until
        // one is added to the template.

        html = html

            .replace(
                "{{LOGO}}",
                logoData
            )

            .replace(
                "{{BATCH}}",
                batchValue
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
                cieValue
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
                students.length
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

        const pdf =
            await page.pdf({

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
            sanitizeForFilename(batchValue),
            sanitizeForFilename(sectionValue),
            commonFilter.semester
                ? commonFilter.semester
                : "AllSem",
            isCieReport
                ? `CIE${Number(cie)}`
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
                    students.length

            }

        });


    } catch (error) {

        console.error(
            "PDF generation error:",
            error
        );


        if (browser) {

            try {
                await browser.close();
            } catch (closeError) {
                console.error(
                    "Browser close error:",
                    closeError
                );
            }

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