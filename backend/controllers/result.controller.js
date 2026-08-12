const fs = require("fs");
const path = require("path");
const Busboy = require("busboy");
const puppeteer = require("puppeteer");

const { getDB } = require("../config/db");


// =========================
// GENERATE EXAM REPORT PDF
// =========================
const generateExamReport = async (req, res) => {

    let browser = null;

    try {

        // =====================================
        // PARSE MULTIPART/FORM-DATA USING BUSBOY
        // =====================================

        const fields = {};

        const busboy = Busboy({
            headers: req.headers
        });


        busboy.on("field", (name, value) => {

            fields[name] = value;

        });


        await new Promise((resolve, reject) => {

            busboy.on("finish", resolve);

            busboy.on("error", reject);

            req.pipe(busboy);

        });


        console.log("FORM-DATA:");
        console.log(fields);


        // =====================================
        // GET JSON DATA
        // =====================================

        if (!fields.data) {

            return res.status(400).json({

                success: false,

                message: "data field is required."

            });

        }


        // =====================================
        // PARSE JSON
        // =====================================

        let data;

        try {

            data = JSON.parse(fields.data);

        } catch (error) {

            return res.status(400).json({

                success: false,

                message: "Invalid JSON in data field."

            });

        }


        console.log("JSON DATA:");
        console.log(data);


        // =====================================
        // GET FILTERS
        // =====================================

        const {
            batch,
            department,
            section
        } = data;


        // =====================================
        // GET DATABASE
        // =====================================

        const db = getDB();


        // =====================================
        // BUILD MONGODB FILTER
        // =====================================

        const filter = {};


        if (
            batch &&
            typeof batch === "string" &&
            batch.trim() !== ""
        ) {

            filter.batch = batch.trim();

        }


        if (
            department &&
            typeof department === "string" &&
            department.trim() !== ""
        ) {

            filter.department = department.trim();

        }


        if (
            section &&
            typeof section === "string" &&
            section.trim() !== ""
        ) {

            filter.section = section.trim();

        }


        console.log("MONGODB FILTER:");
        console.log(filter);


        // =====================================
        // GET EXAM RECORDS
        // =====================================

        const students = await db
            .collection("exam")
            .find(filter)
            .project({

                _id: 0,

                admissionNo: 1,

                studentName: 1,

                department: 1,

                batch: 1,

                section: 1,

                obtainedMarks: 1,

                totalMarks: 1

            })
            .sort({

                studentName: 1

            })
            .toArray();


        // =====================================
        // CHECK RECORDS
        // =====================================

        if (students.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "No examination records found for the given filters."

            });

        }


        console.log(
            `Found ${students.length} students`
        );


        // =====================================
        // GENERATE TABLE ROWS
        // =====================================

        const rows = students
            .map((student, index) => {

                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${student.admissionNo || "-"}
                        </td>

                        <td class="name">
                            ${student.studentName || "-"}
                        </td>

                        <td>
                            ${student.department || "-"}
                        </td>

                        <td>
                            ${student.batch || "-"}
                        </td>

                        <td>
                            ${student.section || "-"}
                        </td>

                        <td>
                            ${student.obtainedMarks ?? 0}/${student.totalMarks ?? 0}
                        </td>

                    </tr>
                `;

            })
            .join("");


        // =====================================
        // READ HTML TEMPLATE
        // =====================================

        const templatePath = path.join(
            __dirname,
            "../html/examExport.html"
        );


        if (!fs.existsSync(templatePath)) {

            return res.status(500).json({

                success: false,

                message: "HTML template not found."

            });

        }


        let html = fs.readFileSync(
            templatePath,
            "utf8"
        );


        // =====================================
        // READ LOGO
        // =====================================

        const logoPath = path.join(
            __dirname,
            "../assets/logo.png"
        );


        if (!fs.existsSync(logoPath)) {

            return res.status(500).json({

                success: false,

                message: "College logo not found."

            });

        }


        const logoBase64 = fs.readFileSync(
            logoPath,
            "base64"
        );


        const logoData =
            `data:image/png;base64,${logoBase64}`;


        // =====================================
        // DISPLAY FILTER VALUES
        // =====================================

        const batchValue =
            batch &&
            typeof batch === "string" &&
            batch.trim() !== ""
                ? batch.trim()
                : "All";


        const departmentValue =
            department &&
            typeof department === "string" &&
            department.trim() !== ""
                ? department.trim()
                : "All";


        const sectionValue =
            section &&
            typeof section === "string" &&
            section.trim() !== ""
                ? section.trim()
                : "All";


        // =====================================
        // REPLACE HTML PLACEHOLDERS
        // =====================================

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
                "{{ROWS}}",
                rows
            )

            .replace(
                "{{TOTAL_STUDENTS}}",
                students.length
            );


        // =====================================
        // LAUNCH PUPPETEER
        // =====================================

        browser = await puppeteer.launch({

            headless: true

        });


        // =====================================
        // CREATE PAGE
        // =====================================

        const page = await browser.newPage();


        // =====================================
        // LOAD HTML
        // =====================================

        await page.setContent(
            html,
            {
                waitUntil: "networkidle0"
            }
        );


        // =====================================
        // GENERATE PDF
        // =====================================

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


        // =====================================
        // CLOSE BROWSER
        // =====================================

        await browser.close();

        browser = null;


        // =====================================
        // SEND PDF
        // =====================================

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );


        res.setHeader(
            "Content-Disposition",
            "attachment; filename=exam-report.pdf"
        );


        return res.send(pdf);


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

            error: error.message

        });

    }

};


module.exports = {
    generateExamReport
};