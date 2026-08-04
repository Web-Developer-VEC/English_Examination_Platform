const XLSX = require("xlsx");

const REQUIRED_HEADERS = [
    "Name",
    "Reg_no",
    "Admission_no",
    "Email",
    "Phone",
    "Department",
    "Year",
    "Section",
    "Batch",
    "DOB"
];

const throwValidationError = (message) => {
    const error = new Error(message);
    error.status = 400;
    throw error;
};
const isValidDOB = (dob) => {

    const regex = /^(0?[1-9]|[12][0-9]|3[01])-(0?[1-9]|1[0-2])-\d{4}$/;

    if (!regex.test(dob)) {
        return false;
    }

    const [day, month, year] = dob.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );

};
const excelDateToString = (serial) => {

    const date = XLSX.SSF.parse_date_code(serial);
    console.log(date)
    return `${date.d}/${date.m}/${date.y}`;

};
const parseStudentExcel = (buffer) => {

    let workbook;

    try {

        workbook = XLSX.read(buffer, {
            type: "buffer"
        });

    } catch (err) {

        throwValidationError(
            "Invalid Excel file. Please upload a valid .xlsx file."
        );

    }

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

    const rows = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        raw:false
    });

    if (!rows.length) {

        throwValidationError(
            "Excel file is empty."
        );

    }

    const headers = Object.keys(rows[0]).map(header => header.trim());

    const missingHeaders = REQUIRED_HEADERS.filter(
        header => !headers.includes(header)
    );

    if (missingHeaders.length) {

        throwValidationError(
            `Invalid Excel format. Missing columns: ${missingHeaders.join(", ")}`
        );

    }

    const normalizedRows = rows.map(row => {

        const obj = {};

        Object.keys(row).forEach(key => {

            obj[key.trim()] = row[key];

        });

        return obj;

    });

    const admissionSet = new Set();
    const registerSet = new Set();

    const students = normalizedRows.map((row, index) => {

        const excelRow = index + 2;

        const name = String(row.Name).trim();
        const admissionNo = String(row.Admission_no).trim();
        const email = String(row.Email).trim().toLowerCase();
        const phone = String(row.Phone).trim();
        const department = String(row.Department).trim();
        const year = Number(row.Year);
        const section=String(row.Section).trim();
        const batch = String(row.Batch).trim();
        const rawRegisterNo = String(row.Reg_no).trim();
        const registerNo =rawRegisterNo === "" ||rawRegisterNo.toLowerCase() === "null"? null: rawRegisterNo;
        const dob = String(row.DOB).trim();

     console.log(dob);
        if (!name) {
            throwValidationError(
                `Row ${excelRow}: Name cannot be empty.`
            );
        }

        if (!admissionNo) {
            throwValidationError(
                `Row ${excelRow}: Admission Number cannot be empty.`
            );
        }

        if (admissionSet.has(admissionNo)) {
            throwValidationError(
                `Row ${excelRow}: Duplicate Admission Number found.`
            );
        }

        admissionSet.add(admissionNo);

        if (registerNo) {
            
            if (registerSet.has(registerNo)) {
                throwValidationError(
                    `Row ${excelRow}: Duplicate Register Number found.`
                );
            }

            registerSet.add(registerNo);

        }

        if (!department) {
            throwValidationError(
                `Row ${excelRow}: Department cannot be empty.`
            );
        }

        if (!year || year < 1 || year > 4) {
            throwValidationError(
                `Row ${excelRow}: Year must be between 1 and 4.`
            );
        }
        
        if (!section) {
            throwValidationError(
                `Row ${excelRow}: Section cannot be empty.`
            );
        }

        if (!batch) {
            throwValidationError(
                `Row ${excelRow}: Batch cannot be empty.`
            );
        }

        if (email) {

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {

                throwValidationError(
                    `Row ${excelRow}: Invalid email address.`
                );

            }

        }

        if (phone) {

            if (!/^\d{10}$/.test(phone)) {

                throwValidationError(
                    `Row ${excelRow}: Phone number must contain exactly 10 digits.`
                );

            }

        }
    if (!isValidDOB(dob)) {
    throwValidationError(
        `Row ${excelRow}: Invalid DOB. Use DD-MM-YYYY format.`
    );
}
   



        return {

            name,
            registerNo: registerNo || null,
            admissionNo,
            email: email || null,
            phone: phone || null,
            department,
            year,
            section,
            batch,
            dob

        };

    });

    return students;

};

module.exports = parseStudentExcel;