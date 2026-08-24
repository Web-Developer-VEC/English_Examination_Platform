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
    "Academic_Year",
  "Gender",
  "DOB",
];

const ALLOWED_DEPARTMENTS = new Set([
  "Automobile Engineering",
  "Civil Engineering",
  "Computer Science and Engineering",
  "Computer Science and Engineering (Cyber Security)",
  "Electrical and Electronics Engineering",
  "Electronics and Communication Engineering",
  "Electronics and Instrumentation Engineering",
  "Mechanical Engineering",
  "Artificial Intelligence and Data Science",
  "Information Technology",
]);

const ALLOWED_GENDERS = new Set(["Male", "Female", "Other"]);

const throwValidationError = (message) => {
  const error = new Error(message);
  error.status = 400;
  throw error;
};

// Smart formatter for text dates like "1/1/06", "1-2-24", "15/08/2004"
const normalizeDateString = (dateStr) => {
  if (!dateStr) return "";

  // Replace slashes with dashes
  let formatted = String(dateStr).trim().replace(/\//g, "-");

  const parts = formatted.split("-");
  if (parts.length === 3) {
    let [day, month, year] = parts;

    // Pad day and month with leading zeros (1 -> 01)
    day = day.padStart(2, "0");
    month = month.padStart(2, "0");

    // Convert 2-digit year to 4-digit year (e.g., 06 -> 2006)
    if (year.length === 2) {
      const numYear = parseInt(year, 10);
      year = (numYear < 50 ? 2000 + numYear : 1900 + numYear).toString();
    }

    return `${day}-${month}-${year}`;
  }

  return formatted;
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
  // Pad with zeros to ensure DD-MM-YYYY
  const day = String(date.d).padStart(2, "0");
  const month = String(date.m).padStart(2, "0");
  return `${day}-${month}-${date.y}`;
};

const parseStudentExcel = (buffer) => {
  let workbook;

  try {
    workbook = XLSX.read(buffer, {
      type: "buffer",
    });
  } catch (err) {
    throwValidationError(
      "Invalid Excel file. Please upload a valid .xlsx file.",
    );
  }

  if (!workbook.SheetNames.length) {
    throwValidationError("Excel workbook contains no worksheets.");
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    throwValidationError("Worksheet not found.");
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: true, // MUST BE TRUE to catch Excel date formatting
  });

  if (!rows.length) {
    throwValidationError("Excel file is empty.");
  }

  const headers = Object.keys(rows[0]).map((header) => header.trim());

  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !headers.includes(header),
  );

  if (missingHeaders.length) {
    throwValidationError(
      `Invalid Excel format. Missing columns: ${missingHeaders.join(", ")}`,
    );
  }

  const normalizedRows = rows.map((row) => {
    const obj = {};
    Object.keys(row).forEach((key) => {
      obj[key.trim()] = row[key];
    });
    return obj;
  });

  const admissionSet = new Set();
  const registerSet = new Set();

  const students = normalizedRows.map((row, index) => {
    const excelRow = index + 2;

    // Basic String Fields
    const name = String(row.Name || "").trim();
    const admissionNo = String(row.Admission_no || "").trim();
    const email = String(row.Email || "").trim().toLowerCase();
    const phone = String(row.Phone || "").trim();
    const year = Number(row.Year);
    const section = String(row.Section || "").trim();
    const batch = String(row.Batch || "").trim();
    
    // Register No Logic
    const rawRegisterNo = String(row.Reg_no || "").trim();
    const registerNo =
      rawRegisterNo === "" || rawRegisterNo.toLowerCase() === "null"
        ? null
        : rawRegisterNo;

    // Gender Logic
    let rawGender = String(row.Gender || "").trim();
        const academicYear = String(row.Academic_Year).trim();  
    const gender = rawGender ? rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase() : "";

    // DOB Logic
    let rawDOB = row.DOB;
    let dob = "";
    if (typeof rawDOB === "number") {
      // Handles Excel Date Serial Numbers
      dob = excelDateToString(rawDOB);
    } else {
      // Handles plain text dates like "1/1/06"
      dob = normalizeDateString(rawDOB);
    }

    // Department Logic
    let rawDepartment = String(row.Department || "").trim();
    rawDepartment = rawDepartment.replace(/^(B\.E\.|B\.Tech\.)\s*/i, "").trim();

    // ================= VALIDATIONS ================= //
    if (!name) {
      throwValidationError(`Row ${excelRow}: Name cannot be empty.`);
    }

    if (!admissionNo) {
      throwValidationError(`Row ${excelRow}: Admission Number cannot be empty.`);
    }

    if (admissionSet.has(admissionNo)) {
      throwValidationError(`Row ${excelRow}  : Duplicate Admission Number found.`);
    }
    admissionSet.add(admissionNo);

    if (registerNo) {
      if (registerSet.has(registerNo)) {
        throwValidationError(`Row ${excelRow}: Duplicate Register Number found.`);
      }
      registerSet.add(registerNo);
    }

    if (!rawDepartment) {
      throwValidationError(`Row ${excelRow}: Department cannot be empty.`);
    }

    if (!ALLOWED_DEPARTMENTS.has(rawDepartment)) {
      throwValidationError(
        `Row ${excelRow}: Invalid department "${rawDepartment}". Department must be one of the allowed programs.`,
      );
    }
    const department = rawDepartment;

    if (!year || year < 1 || year > 4) {
      throwValidationError(`Row ${excelRow}: Year must be between 1 and 4.`);
    }

    if (!section) {
      throwValidationError(`Row ${excelRow}: Section cannot be empty.`);
    }

    if (!batch) {
      throwValidationError(`Row ${excelRow}: Batch cannot be empty.`);
    }

    if (!gender) {
      throwValidationError(`Row ${excelRow}: Gender cannot be empty.`);
    }

    if (!ALLOWED_GENDERS.has(gender)) {
      throwValidationError(
        `Row ${excelRow}: Invalid Gender "${rawGender}". Must be Male, Female, or Other.`,
      );
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throwValidationError(`Row ${excelRow}: Invalid email address.`);
      }
    }
        if(academicYear){

            const academicYearRegex = /^\d{4}-\d{4}$/;

            if (!academicYearRegex.test(academicYear)) {

                throwValidationError(
                    `Row ${excelRow}: Invalid Academic Year. Use YYYY-YYYY format.`
                );

            }

        }
    if (phone) {
      if (!/^\d{10}$/.test(phone)) {
        throwValidationError(`Row ${excelRow}: Phone number must contain exactly 10 digits.`);
      }
    }

    if (!isValidDOB(dob)) {
      throwValidationError(`Row ${excelRow}: Invalid DOB. Use DD-MM-YYYY format.`);
    }

    return {
      name,
      registerNo,
      admissionNo,
      email: email || null,
      phone: phone || null,
      department,
      year,
      section,
      batch,
      gender,
      dob,
            academicYear,
    };
  });

  return students;
};

module.exports = parseStudentExcel;