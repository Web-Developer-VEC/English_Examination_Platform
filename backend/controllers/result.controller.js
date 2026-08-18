const puppeteer = require("puppeteer");
const { ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");

const { getDB } = require("../config/db");
const { getFromS3, uploadToS3 } = require("../service/s3_service");


// ============================================================
// GENERATE EXAM RESULT REPORT
// ============================================================

const generateExamReport = async (req, res) => {

    let browser = null;

    try {

        // ====================================================
        // GET JSON BODY
        // ====================================================

        const {
            batch,
            department,
            section,
            cie
        } = req.body;


        console.log("========================================");
        console.log("REPORT REQUEST");
        console.log("========================================");

        console.log({
            batch,
            department,
            section,
            cie
        });


        // ====================================================
        // VALIDATE CIE
        // ====================================================

        const cieNumber = Number(cie);

        if (![1, 2, 3].includes(cieNumber)) {

            return res.status(400).json({
                success: false,
                message: "cie must be 1, 2 or 3."
            });

        }


        // ====================================================
        // EXPECTED TEST COUNT
        // ====================================================

        const expectedTests =
            cieNumber === 3 ? 2 : 4;


        // ====================================================
        // DATABASE
        // ====================================================

        const db = getDB();


        // ====================================================
        // SCHEDULE FILTER
        // ====================================================

        const scheduleFilter = {
            cie: cieNumber
        };


        if (
            batch &&
            typeof batch === "string" &&
            batch.trim() !== ""
        ) {

            scheduleFilter.batch = batch.trim();

        }


        if (
            department &&
            typeof department === "string" &&
            department.trim() !== ""
        ) {

            scheduleFilter.department = department.trim();

        }


        if (
            section &&
            typeof section === "string" &&
            section.trim() !== ""
        ) {

            scheduleFilter.section = section.trim();

        }


        console.log("========================================");
        console.log("SCHEDULE FILTER");
        console.log("========================================");

        console.log(scheduleFilter);


        // ====================================================
        // GET SCHEDULES
        //
        // questionSetId -> testcode
        // ====================================================

        const schedules = await db
            .collection("schedule")
            .find(scheduleFilter)
            .project({
                questionSetId: 1,
                testcode: 1,
                cie: 1,
                startTime: 1,
                endTime: 1
            })
            .sort({
                startTime: 1
            })
            .toArray();


        console.log("========================================");
        console.log("SCHEDULES FOUND");
        console.log("========================================");

        console.log(schedules);


        // ====================================================
        // CHECK TEST COUNT
        // ====================================================

        // if (schedules.length !== expectedTests) {

        //     return res.status(400).json({

        //         success: false,

        //         message:
        //             `Expected ${expectedTests} tests for CIE ${cieNumber}, but found ${schedules.length}.`,

        //         expectedTests,

        //         foundTests:
        //             schedules.length

        //     });

        // }


        // ====================================================
        // CREATE QUESTION SET -> SCHEDULE MAP
        // ====================================================

        const scheduleMap = new Map();


        schedules.forEach(schedule => {

            if (!schedule.questionSetId) {
                return;
            }

            scheduleMap.set(
                schedule.questionSetId.toString(),
                schedule
            );

        });


        // ====================================================
        // GET QUESTION SET IDS
        // ====================================================

        const questionSetIds = schedules
            .map(schedule =>
                schedule.questionSetId?.toString()
            )
            .filter(Boolean);


        // ====================================================
        // CONVERT QUESTION SET IDS TO OBJECT IDS
        // ====================================================

        const questionSetObjectIds =
            questionSetIds
                .filter(id =>
                    ObjectId.isValid(id)
                )
                .map(id =>
                    new ObjectId(id)
                );


        if (questionSetObjectIds.length === 0) {

            return res.status(400).json({

                success: false,

                message:
                    "No valid questionSetId found in schedules."

            });

        }


        // ====================================================
        // EXAM FILTER
        // ====================================================

        const examFilter = {

            questionSetId: {
                $in: questionSetObjectIds
            }

        };


        if (
            batch &&
            typeof batch === "string" &&
            batch.trim() !== ""
        ) {

            examFilter.batch = batch.trim();

        }


        if (
            department &&
            typeof department === "string" &&
            department.trim() !== ""
        ) {

            examFilter.department = department.trim();

        }


        if (
            section &&
            typeof section === "string" &&
            section.trim() !== ""
        ) {

            examFilter.section = section.trim();

        }


        console.log("========================================");
        console.log("EXAM FILTER");
        console.log("========================================");

        console.log(examFilter);


        // ====================================================
        // GET EXAM RESULTS
        // ====================================================

        const exams = await db
            .collection("exam")
            .find(examFilter)
            .project({

                _id: 0,

                admissionNo: 1,
                registerNo: 1,
                studentName: 1,

                department: 1,
                batch: 1,
                section: 1,

                questionSetId: 1,

                obtainedMarks: 1,
                totalMarks: 1

            })
            .sort({

                admissionNo: 1,
                createdAt: 1

            })
            .toArray();


        // ====================================================
        // CHECK RESULTS
        // ====================================================

        if (exams.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    `No examination records found for CIE ${cieNumber}.`

            });

        }


        // ====================================================
        // GROUP BY STUDENT
        //
        // ONE STUDENT = ONE ROW
        // ====================================================

        const studentMap = new Map();


        for (const exam of exams) {

            if (!exam.admissionNo) {
                continue;
            }


            const admissionNo =
                exam.admissionNo.toString();


            // =================================================
            // CREATE STUDENT
            // =================================================

            if (!studentMap.has(admissionNo)) {

                studentMap.set(
                    admissionNo,
                    {

                        admissionNo,

                        registerNo:
                            exam.registerNo || "-",

                        studentName:
                            exam.studentName || "-",

                        department:
                            exam.department || "-",

                        batch:
                            exam.batch || "-",

                        section:
                            exam.section || "-",

                        tests: []

                    }
                );

            }


            // =================================================
            // QUESTION SET ID
            // =================================================

            const questionSetId =
                exam.questionSetId?.toString();


            if (!questionSetId) {
                continue;
            }


            // =================================================
            // FIND SCHEDULE
            //
            // questionSetId
            //       ↓
            // schedule
            //       ↓
            // testcode
            // =================================================

            const schedule =
                scheduleMap.get(questionSetId);


            if (!schedule) {
                continue;
            }


            // =================================================
            // GET STUDENT
            // =================================================

            const student =
                studentMap.get(admissionNo);


            // =================================================
            // ADD TEST RESULT
            // =================================================

            student.tests.push({

                questionSetId,

                testcode:
                    schedule.testcode || "-",

                obtainedMarks:
                    exam.obtainedMarks ?? 0,

                totalMarks:
                    exam.totalMarks ?? 0

            });

        }


        // ====================================================
        // CONVERT TO ARRAY
        // ====================================================

        const students =
            Array.from(
                studentMap.values()
            );


        // ====================================================
        // SORT STUDENTS
        // ====================================================

        students.sort((a, b) => {

            return a.admissionNo.localeCompare(
                b.admissionNo
            );

        });


        // ====================================================
        // GENERATE TEST HEADERS
        // ====================================================

        const testHeaders =
            schedules
                .map((schedule, index) => {

                    return `
                        <th class="test-header">

                            Test ${index + 1}

                            <small>
                                ${schedule.testcode || "-"}
                            </small>

                        </th>
                    `;

                })
                .join("");


        // ====================================================
        // GENERATE STUDENT ROWS
        //
        // ONE STUDENT = ONE ROW
        // ====================================================

        const rows =
            students
                .map((student, index) => {

                    const testCells =
                        schedules
                            .map(schedule => {

                                const questionSetId =
                                    schedule.questionSetId?.toString();


                                const test =
                                    student.tests.find(
                                        item =>
                                            item.questionSetId ===
                                            questionSetId
                                    );


                                if (!test) {

                                    return `
                                        <td>-</td>
                                    `;

                                }


                                return `
                                    <td>
                                        ${test.obtainedMarks}/${test.totalMarks}
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
                                ${student.admissionNo}
                            </td>

                            <td class="name">
                                ${student.studentName}
                            </td>

                            <td>
                                ${student.department}
                            </td>

                            <td>
                                ${student.batch}
                            </td>

                            <td>
                                ${student.section}
                            </td>

                            ${testCells}

                        </tr>
                    `;

                })
                .join("");


        // ====================================================
        // GET LOCAL HTML TEMPLATE
        // ====================================================

        const templatePath = path.join(
            __dirname,
            "../../templates/examExport.html"
        );


        let html;


        try {

            html = fs.readFileSync(
                templatePath,
                "utf8"
            );

        } catch (error) {

            console.error(
                "Local HTML Template Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "HTML template not found.",

                error:
                    error.message

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
        // LOGO DATA
        // ====================================================

        const logoData =
            `data:image/png;base64,${logoBase64}`;


        // ====================================================
        // FILTER VALUES
        // ====================================================

        const batchValue =
            batch?.trim() || "All";

        const departmentValue =
            department?.trim() || "All";

        const sectionValue =
            section?.trim() || "All";


        // ====================================================
        // REPLACE HTML PLACEHOLDERS
        // ====================================================

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
                "{{CIE}}",
                cieNumber
            )

            .replace(
                "{{TEST_HEADERS}}",
                testHeaders
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
        // PUPPETEER
        // ====================================================

        browser = await puppeteer.launch({
            headless: true
        });


        const page =
            await browser.newPage();


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
        // UPLOAD PDF
        // ====================================================

        const file = {

            buffer: pdf,

            filename:
                `cie-${cieNumber}-report-${Date.now()}.pdf`,

            mimeType:
                "application/pdf"

        };


        const uploadResult =
            await uploadToS3(
                file,
                "reports"
            );


        // ====================================================
        // RESPONSE
        // ====================================================

        return res.status(200).json({

            success: true,

            message:
                `CIE ${cieNumber} report generated successfully.`,

            data: {

                cie:
                    cieNumber,

                tests:
                    schedules.map(
                        (schedule, index) => ({

                            testNo:
                                index + 1,

                            questionSetId:
                                schedule.questionSetId,

                            testcode:
                                schedule.testcode

                        })
                    ),

                totalStudents:
                    students.length,

                key:
                    uploadResult.key,

                url:
                    uploadResult.url

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