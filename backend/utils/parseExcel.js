const XLSX = require("xlsx");

const REQUIRED_HEADERS = [
    "Question",
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Answer"
];

const throwValidationError = (message) => {
    const error = new Error(message);
    error.status = 400;
    throw error;
};

const parseExcel = (buffer) => {

    let workbook;

    // =========================================================
    // READ EXCEL
    // =========================================================

    try {

        workbook = XLSX.read(buffer, {
            type: "buffer"
        });

    } catch (err) {

        throwValidationError(
            "Invalid Excel file. Please upload a valid .xlsx file."
        );

    }

    // =========================================================
    // WORKBOOK VALIDATION
    // =========================================================

    if (
        !workbook.SheetNames ||
        workbook.SheetNames.length === 0
    ) {

        throwValidationError(
            "Excel workbook contains no worksheets."
        );

    }

    const sheet =
        workbook.Sheets[workbook.SheetNames[0]];

    if (!sheet) {

        throwValidationError(
            "Worksheet not found."
        );

    }

    // =========================================================
    // CONVERT EXCEL TO JSON
    // =========================================================

    const rows = XLSX.utils.sheet_to_json(sheet, {
        defval: ""
    });

    if (!rows.length) {

        throwValidationError(
            "Excel file is empty."
        );

    }

    // =========================================================
    // NORMALIZE HEADERS
    // =========================================================

    const headers = Object.keys(rows[0]).map(
        header => header.trim()
    );

    const missingHeaders =
        REQUIRED_HEADERS.filter(
            header => !headers.includes(header)
        );

    if (missingHeaders.length) {

        throwValidationError(
            `Invalid Excel format. Missing columns: ${missingHeaders.join(", ")}`
        );

    }

    // =========================================================
    // NORMALIZE ROWS
    // =========================================================

    const normalizedRows = rows.map(row => {

        const obj = {};

        Object.keys(row).forEach(key => {

            obj[key.trim()] = row[key];

        });

        return obj;

    });

    // =========================================================
    // DUPLICATE QUESTION TRACKING
    // =========================================================

    const questionSet = new Set();

    // =========================================================
    // PARSE QUESTIONS
    // =========================================================

    const parsedQuestions = normalizedRows.map(
        (row, index) => {

            const excelRow = index + 2;

            const question =
                String(row["Question"]).trim();

            const optionA =
                String(row["Option A"]).trim();

            const optionB =
                String(row["Option B"]).trim();

            const optionC =
                String(row["Option C"]).trim();

            const optionD =
                String(row["Option D"]).trim();

            // IMPORTANT:
            // Answer is actual answer TEXT
            // Example:
            // Quick
            // Disordered

            const answer =
                String(row["Answer"]).trim();

            // =================================================
            // QUESTION VALIDATION
            // =================================================

            if (!question) {

                throwValidationError(
                    `Row ${excelRow}: Question cannot be empty.`
                );

            }

            // =================================================
            // DUPLICATE QUESTION
            // =================================================

            const questionKey =
                question.toLowerCase();

            if (questionSet.has(questionKey)) {

                throwValidationError(
                    `Row ${excelRow}: Duplicate question found.`
                );

            }

            questionSet.add(questionKey);

            // =================================================
            // OPTION VALIDATION
            // =================================================

            if (!optionA) {

                throwValidationError(
                    `Row ${excelRow}: Option A cannot be empty.`
                );

            }

            if (!optionB) {

                throwValidationError(
                    `Row ${excelRow}: Option B cannot be empty.`
                );

            }

            if (!optionC) {

                throwValidationError(
                    `Row ${excelRow}: Option C cannot be empty.`
                );

            }

            if (!optionD) {

                throwValidationError(
                    `Row ${excelRow}: Option D cannot be empty.`
                );

            }

            // =================================================
            // DUPLICATE OPTIONS
            // =================================================

            const optionSet = new Set([
                optionA.toLowerCase(),
                optionB.toLowerCase(),
                optionC.toLowerCase(),
                optionD.toLowerCase()
            ]);

            if (optionSet.size !== 4) {

                throwValidationError(
                    `Row ${excelRow}: Duplicate options are not allowed.`
                );

            }

            // =================================================
            // ANSWER VALIDATION
            // =================================================

            if (!answer) {

                throwValidationError(
                    `Row ${excelRow}: Answer cannot be empty.`
                );

            }

            // =================================================
            // ANSWER MUST MATCH OPTION TEXT
            // =================================================

            const answerExistsInOptions = [
                optionA,
                optionB,
                optionC,
                optionD
            ].some(
                option =>
                    option.trim().toLowerCase() ===
                    answer.trim().toLowerCase()
            );

            if (!answerExistsInOptions) {

                throwValidationError(
                    `Row ${excelRow}: Answer "${answer}" must match one of the option values.`
                );

            }

            // =================================================
            // RETURN QUESTION
            // =================================================

            return {

                questionNo: index + 1,

                question,

                options: {

                    A: optionA,

                    B: optionB,

                    C: optionC,

                    D: optionD

                },

                // Store actual answer text
                answer

            };

        }
    );

    return parsedQuestions;
};

module.exports = parseExcel;