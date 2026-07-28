const XLSX = require("xlsx");

const REQUIRED_HEADERS = [
    "Question",
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Answer"
];

const VALID_ANSWERS = ["A", "B", "C", "D"];

const throwValidationError = (message) => {
    const error = new Error(message);
    error.status = 400;
    throw error;
};

const parseExcel = (buffer) => {

    let workbook;

    // Read Excel
    try {

        workbook = XLSX.read(buffer, {
            type: "buffer"
        });

    } catch (err) {

        throwValidationError(
            "Invalid Excel file. Please upload a valid .xlsx file."
        );

    }

    // Workbook validation
    if (!workbook.SheetNames.length) {
        throwValidationError(
            "Excel workbook contains no worksheets."
        );
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!sheet) {
        throwValidationError(
            "Worksheet not found."
        );
    }

    // Convert to JSON
    const rows = XLSX.utils.sheet_to_json(sheet, {
        defval: ""
    });

    // Empty sheet
    if (!rows.length) {
        throwValidationError(
            "Excel file is empty."
        );
    }

    // Normalize headers
    const headers = Object.keys(rows[0]).map(header => header.trim());

    // Missing columns
    const missingHeaders = REQUIRED_HEADERS.filter(
        header => !headers.includes(header)
    );

    if (missingHeaders.length) {

        throwValidationError(
            `Invalid Excel format. Missing columns: ${missingHeaders.join(", ")}`
        );

    }

    // Normalize rows
    const normalizedRows = rows.map(row => {

        const obj = {};

        Object.keys(row).forEach(key => {

            obj[key.trim()] = row[key];

        });

        return obj;

    });

    const questionSet = new Set();

    const parsedQuestions = normalizedRows.map((row, index) => {

        const excelRow = index + 2;

        const question = String(row["Question"]).trim();

        const optionA = String(row["Option A"]).trim();

        const optionB = String(row["Option B"]).trim();

        const optionC = String(row["Option C"]).trim();

        const optionD = String(row["Option D"]).trim();

        const answer = String(row["Answer"])
            .trim()
            .toUpperCase();

        // Question validation
        if (!question) {
            throwValidationError(
                `Row ${excelRow}: Question cannot be empty.`
            );
        }

        // Duplicate question
        if (questionSet.has(question)) {
            throwValidationError(
                `Row ${excelRow}: Duplicate question found.`
            );
        }

        questionSet.add(question);

        // Option validation
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

        // Duplicate options
        const optionSet = new Set([
            optionA,
            optionB,
            optionC,
            optionD
        ]);

        if (optionSet.size !== 4) {
            throwValidationError(
                `Row ${excelRow}: Duplicate options are not allowed.`
            );
        }

        // Answer validation
        if (!answer) {
            throwValidationError(
                `Row ${excelRow}: Answer cannot be empty.`
            );
        }

        if (!VALID_ANSWERS.includes(answer)) {
            throwValidationError(
                `Row ${excelRow}: Answer must be A, B, C or D.`
            );
        }

        return {

            questionNo: index + 1,

            question,

            options: {
                A: optionA,
                B: optionB,
                C: optionC,
                D: optionD
            },

            answer

        };

    });

    return parsedQuestions;

};

module.exports = parseExcel;