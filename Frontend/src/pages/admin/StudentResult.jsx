import React, { useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  Building2,
  Users,
  BookOpenCheck,
  CalendarRange,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileSearch,
  ClipboardList,
  Download,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getFormData, getExamResults } from "../../services/adminService";
import { getApiErrorMessage } from "../../utils/apiError";
import { getAdminSession } from "../../utils/helpers";
// -----------------------------------------------------
// PROJECT COLORS
// -----------------------------------------------------
const colors = {
  primary: "#FFFFFF",
  secondary: "#FDCC03",
  accent: "#800000",
  text: "#000000",
  gray: "#808080",
};

// -----------------------------------------------------
// DEFAULT CIE + SEMESTER OPTIONS
// -----------------------------------------------------
const CIE_OPTIONS = ["I", "II", "III"];
const SEM_OPTIONS = ["Odd", "Even"];
const CATEGORY_OPTIONS = ["Normal", "University"];
// -----------------------------------------------------
// FAIL GRADES
// -----------------------------------------------------
const FAIL_GRADES = ["RA", "F"];

// -----------------------------------------------------
// SHARED STYLES
// -----------------------------------------------------
const labelClasses = "mb-1.5 block text-sm font-semibold text-[#000000]";

const boxClasses =
  "w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-9 text-sm text-[#000000] placeholder:text-[#9CA3AF] shadow-sm outline-none transition focus:border-[#FDCC03] focus:ring-2 focus:ring-[#FDCC03]/40";

const iconLeftClasses =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]";

const cardClasses =
  "rounded-2xl border border-gray-200 bg-[#F4F5F7] shadow-md shadow-gray-300/40 p-5";

// -----------------------------------------------------
// CLEAN VALUE
// -----------------------------------------------------
const cleanValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

// -----------------------------------------------------
// GET VALUE FROM OBJECT
// -----------------------------------------------------
const getValue = (item, keys) => {
  if (!item || typeof item !== "object") {
    return "";
  }

  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null && item[key] !== "") {
      return cleanValue(item[key]);
    }
  }

  return "";
};

// -----------------------------------------------------
// UNIQUE + SORT
// -----------------------------------------------------
const uniqueSorted = (values) => {
  return [...new Set(values.map(cleanValue).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
};

// -----------------------------------------------------
// FIND ARRAY FROM API RESPONSE
// -----------------------------------------------------
const findArrayInResponse = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const possibleKeys = [
    "data",
    "results",
    "result",
    "schedules",
    "schedule",
    "records",
    "rows",
    "items",
  ];

  for (const key of possibleKeys) {
    if (Array.isArray(data[key])) {
      return data[key];
    }
  }

  // Search nested objects
  for (const value of Object.values(data)) {
    if (Array.isArray(value)) {
      return value;
    }

    if (value && typeof value === "object") {
      for (const nestedValue of Object.values(value)) {
        if (Array.isArray(nestedValue)) {
          return nestedValue;
        }
      }
    }
  }

  return [];
};

// -----------------------------------------------------
// NORMALIZE SCHEDULE DATA
// -----------------------------------------------------
const normalizeScheduleRecord = (item) => {
  return {
    batch: getValue(item, [
      "batch",
      "Batch",
      "batch_name",
      "batchName",
      "batch_year",
      "batchYear",
      "academic_year",
      "academicYear",
    ]),

    dept: getValue(item, [
      "dept",
      "Dept",
      "department",
      "branch",
      "Branch",
      "dept_name",
      "deptName",
    ]),

    section: getValue(item, [
      "section",
      "Section",
      "section_name",
      "sectionName",
    ]),

    subjectCode: getValue(item, [
      "code",
      "course_code",
      "courseCode",
      "subject_code",
      "subjectCode",
    ]),

    subjectName: getValue(item, [
      "name",
      "course_name",
      "courseName",
      "subject_name",
      "subjectName",
    ]),

    mark:
      item?.mark ??
      item?.marks ??
      item?.internal_mark ??
      item?.internalMark ??
      item?.internal_marks ??
      item?.internalMarks ??
      null,

    grade: getValue(item, ["grade", "Grade", "result_grade", "resultGrade"]),
  };
};

// -----------------------------------------------------
// CUSTOM WHITE / LIGHT-GOLD DROPDOWN
// -----------------------------------------------------
function SelectField({
  label,
  IconComponent,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);

  // ---------------------------------------------------
  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  // ---------------------------------------------------
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // ...

  // Unique ID for this dropdown
  const dropdownId = React.useId();

  // ---------------------------------------------------
  // CLOSE THIS DROPDOWN WHEN ANOTHER ONE OPENS
  // ---------------------------------------------------
  useEffect(() => {
    const handleOtherDropdownOpen = (event) => {
      if (event.detail !== dropdownId) {
        setIsOpen(false);
      }
    };

    window.addEventListener(
      "student-result-dropdown-open",
      handleOtherDropdownOpen,
    );

    return () => {
      window.removeEventListener(
        "student-result-dropdown-open",
        handleOtherDropdownOpen,
      );
    };
  }, [dropdownId]);

  // ---------------------------------------------------
  // TOGGLE DROPDOWN
  // ---------------------------------------------------
  const toggleDropdown = () => {
    if (disabled) {
      return;
    }

    if (isOpen) {
      setIsOpen(false);
      return;
    }

    // Close all other dropdowns
    window.dispatchEvent(
      new CustomEvent("student-result-dropdown-open", {
        detail: dropdownId,
      }),
    );

    setIsOpen(true);
  };

  return (
    <div ref={dropdownRef}>
      <label className={labelClasses}>{label}</label>

      <div className="relative">
        {/* LEFT ICON */}
        <IconComponent
          className={
            "pointer-events-none absolute left-3 top-1/2 z-20 h-4 w-4 -translate-y-1/2 transition-colors duration-200 " +
            (isOpen ? "text-[#CAA302]" : "text-[#9CA3AF]")
          }
        />

        {/* DROPDOWN FIELD */}
        <button
          type="button"
          disabled={disabled}
          onClick={toggleDropdown}
          className={
            "relative flex w-full items-center rounded-lg border py-2.5 pl-9 pr-10 text-left text-sm outline-none transition-all duration-200 " +
            // WHITE BACKGROUND
            "border-gray-300 bg-white " +
            // SELECTED VALUE = BLACK
            (value ? "text-[#000000] font-semibold " : "text-[#808080] ") +
            // GOLD BORDER ON HOVER
            "hover:border-[#CAA302] " +
            // GOLD BORDER WHEN OPEN
            (isOpen
              ? "border-[#CAA302] shadow-[0_0_0_3px_rgba(202,163,2,0.15)] "
              : "shadow-sm ") +
            // DISABLED
            (disabled
              ? "cursor-not-allowed bg-gray-100 opacity-60"
              : "cursor-pointer")
          }
        >
          {/* SELECTED VALUE / PLACEHOLDER */}
          <span
            className={
              "truncate " +
              (value ? "font-semibold text-[#000000]" : "text-[#808080]")
            }
          >
            {value || placeholder}
          </span>

          {/* CHEVRON */}
          <ChevronDown
            className={
              "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-all duration-200 " +
              (isOpen ? "rotate-180 text-[#CAA302]" : "rotate-0 text-[#CAA302]")
            }
          />
        </button>

        {/* ------------------------------------------------
            DROPDOWN OPTIONS
        ------------------------------------------------ */}
        {isOpen && !disabled && (
          <div
            className="
              absolute
              left-0
              right-0
              top-[calc(100%+6px)]
              z-50
              overflow-hidden
              rounded-lg
              border
              border-gray-200
              bg-white
              shadow-[0_10px_25px_rgba(0,0,0,0.12)]
              transition-all
              duration-200
            "
          >
            <div className="max-h-56 overflow-y-auto p-1.5">
              {options.map((option) => {
                const isSelected = value === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                    className={
                      "flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm transition-all duration-150 " +
                      // OPTION TEXT = BLACK
                      "text-[#000000] " +
                      // SELECTED OPTION = LIGHT GOLD BACKGROUND
                      (isSelected ? "bg-[#CAA302]/15 font-bold " : "") +
                      // HOVER = LIGHT GOLD BACKGROUND + BLACK TEXT
                      "hover:bg-[#CAA302]/10 hover:text-[#000000]"
                    }
                  >
                    <span className="truncate">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------
// RESULT BADGE
// -----------------------------------------------------
function ResultBadge({ pass }) {
  return pass ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      PASS
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
      <XCircle className="h-3.5 w-3.5" />
      FAIL
    </span>
  );
}

// -----------------------------------------------------
// GRADE BADGE
// -----------------------------------------------------
function GradeBadge({ grade }) {
  const isFail = FAIL_GRADES.includes(cleanValue(grade).toUpperCase());

  return (
    <span
      className={
        "inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-bold " +
        (isFail ? "bg-red-50 text-red-700" : "bg-[#FDCC03]/20 text-[#800000]")
      }
    >
      {grade || "-"}
    </span>
  );
}

// -----------------------------------------------------
// RESULT NORMALIZER
// -----------------------------------------------------
const normalizeResult = (item) => {
  return {
    code: getValue(item, [
      "code",
      "course_code",
      "courseCode",
      "subject_code",
      "subjectCode",
    ]),

    name: getValue(item, [
      "name",
      "course_name",
      "courseName",
      "subject_name",
      "subjectName",
    ]),

    mark:
      item?.mark ??
      item?.marks ??
      item?.internal_mark ??
      item?.internalMark ??
      item?.internal_marks ??
      item?.internalMarks ??
      0,

    grade: getValue(item, ["grade", "Grade", "result_grade", "resultGrade"]),
  };
};

// -----------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------
export default function StudentResult() {
  // ---------------------------------------------------
  // FILTER STATE
  // ---------------------------------------------------
  const [batch, setBatch] = useState("");
  const [dept, setDept] = useState("");
  const [section, setSection] = useState("");

  // CIE and Semester are fixed options
  const [cie, setCie] = useState("");
  const [sem, setSem] = useState("");
  const [category, setCategory] = useState("Normal");

  const adminSession = getAdminSession();
  const role = adminSession?.user?.role || adminSession?.role;
  const isAdmin = role === "admin";

  const categoryOptions = useMemo(() => {
    return isAdmin ? ["Normal", "University"] : ["Normal"];
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin && category !== "Normal") {
      setCategory("Normal");
    }
  }, [isAdmin, category]);

  // ---------------------------------------------------
  // API DATA
  // ---------------------------------------------------
  const [scheduleData, setScheduleData] = useState([]);

  // ---------------------------------------------------
  // RESULT DATA
  // ---------------------------------------------------
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState("");

  // ---------------------------------------------------
  // GET SCHEDULE DATA
  // ---------------------------------------------------
  useEffect(() => {
    const fetchScheduleData = async () => {
      setLoadingSchedule(true);
      setError("");

      try {
        const data = await getFormData();
        if (!data.success) {
          throw new Error(data.message || "Failed to fetch form data.");
        }

        const rawArray = findArrayInResponse(data);

        const normalizedData = rawArray
          .map(normalizeScheduleRecord)
          .filter((item) => item.batch || item.dept || item.section);

        setScheduleData(normalizedData);

        if (normalizedData.length === 0) {
          setError(
            "No Batch, Branch or Section data was returned by the schedule API.",
          );
        }
      } catch (err) {
        console.error("Schedule API error:", err);
        setError(
          getApiErrorMessage(
            err,
            "Unable to load schedule data from the server.",
          ),
        );
        setScheduleData([]);
      } finally {
        setLoadingSchedule(false);
      }
    };

    fetchScheduleData();
  }, []);

  // ---------------------------------------------------
  // BATCH OPTIONS FROM API
  // ---------------------------------------------------
  const batchOptions = useMemo(() => {
    return uniqueSorted(scheduleData.map((item) => item.batch));
  }, [scheduleData]);

  // ---------------------------------------------------
  // DEPARTMENT OPTIONS FROM API
  // ---------------------------------------------------
  const departmentOptions = useMemo(() => {
    const filtered = batch
      ? scheduleData.filter((item) => item.batch === batch)
      : scheduleData;

    return uniqueSorted(filtered.map((item) => item.dept));
  }, [scheduleData, batch]);

  // ---------------------------------------------------
  // SECTION OPTIONS FROM API
  // ---------------------------------------------------
  const sectionOptions = useMemo(() => {
    const filtered = scheduleData.filter((item) => {
      if (batch && item.batch !== batch) {
        return false;
      }
      if (dept && item.dept !== dept) {
        return false;
      }
      return true;
    });

    return uniqueSorted(filtered.map((item) => item.section));
  }, [scheduleData, batch, dept]);

  // ---------------------------------------------------
  // RESET DEPENDENT API FILTERS
  // ---------------------------------------------------
  useEffect(() => {
    if (dept && !departmentOptions.includes(dept)) {
      setDept("");
      setSection("");
    }
  }, [departmentOptions, dept]);

  useEffect(() => {
    if (section && !sectionOptions.includes(section)) {
      setSection("");
    }
  }, [sectionOptions, section]);

  // ---------------------------------------------------
  // VALIDATE
  // ---------------------------------------------------
  const validate = () => {
    if (!batch || !dept || !section || !sem) {
      setError("Please select Batch, Branch, Section, and Semester.");
      return false;
    }

    const isUniv = category?.toLowerCase() === "university";
    if (isUniv) {
      if (!isAdmin) {
        setError(
          "University examination reports are restricted to administrators only.",
        );
        return false;
      }
    } else {
      if (!cie) {
        setError("Please select CIE for Normal examination.");
        return false;
      }
    }

    return true;
  };

  // ---------------------------------------------------
  // FETCH / PREPARE RESULTS
  // ---------------------------------------------------
  const fetchStudentResults = async (filters) => {
    const semesterValue = filters.sem ? filters.sem.toLowerCase() : "";
    const isUniv = filters.category?.toLowerCase() === "university";

    const requestBody = {
      batch: filters.batch,
      department: filters.dept,
      section: filters.section,
      cie: isUniv ? null : filters.cie || null,
      semester: semesterValue,
      category: isUniv ? "university" : "normal",
    };
    const responseData = await getExamResults(requestBody);

    if (!responseData.success || !responseData.data || !responseData.data.url) {
      throw new Error(
        responseData.message || "PDF URL was not returned by the server.",
      );
    }

    return responseData;
  };

  // ---------------------------------------------------
  // VIEW / GENERATE RESULT
  // ---------------------------------------------------
  const handleViewResult = async () => {
    setError("");

    if (!validate()) {
      return;
    }

    setLoadingResults(true);

    try {
      const filters = {
        batch,
        dept,
        section,
        cie: category?.toLowerCase() === "university" ? "" : cie,
        sem,
        category,
      };

      const responseData = await fetchStudentResults(filters);
      const pdfUrl = responseData?.data?.url;

      if (!pdfUrl) {
        throw new Error(
          responseData?.message || "PDF URL was not returned by the server.",
        );
      }

      toast.success("Examination report ready! Opening in a new tab...");

      // Open the PDF report in a single new tab
      window.open(pdfUrl, "_blank");
    } catch (err) {
      console.error("PDF download error:", err);
      const errMsg = getApiErrorMessage(
        err,
        "Something went wrong while generating or downloading the PDF.",
      );
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoadingResults(false);
    }
  };

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------
  return (
    <div className="min-h-screen w-full bg-[#EEF0F2] px-4 py-10 md:px-10">
      <div className="mx-auto max-w-4xl">
        {/* HEADER */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#FDCC03]/40 bg-[#800000] shadow-md shadow-[#800000]/20">
            <ClipboardList className="h-7 w-7 text-[#FDCC03]" strokeWidth={2} />
          </div>

          <div>
            <h1
              className="text-2xl font-bold tracking-tight md:text-3xl"
              style={{
                color: colors.accent,
              }}
            >
              Class Examination Report
            </h1>

            <p className="mt-1 text-sm text-[#808080]">
              Generate and download department and class-wise examination PDF reports
            </p>
          </div>
        </div>

        {/* FILTER CARD */}
        <div className={cardClasses}>
          <h2
            className="mb-5 text-center text-lg font-bold"
            style={{
              color: colors.accent,
            }}
          >
            Select Class Details
          </h2>

          {loadingSchedule ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-8 text-sm font-medium text-[#808080]">
              <Loader2 className="h-5 w-5 animate-spin text-[#800000]" />
              Loading available details...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {/* BATCH */}
              <SelectField
                label="Batch"
                IconComponent={GraduationCap}
                value={batch}
                onChange={(value) => {
                  setBatch(value);
                  setDept("");
                  setSection("");
                  setCie("");
                  setSem("");
                  setError("");
                }}
                options={batchOptions}
                placeholder="Select Batch"
              />

              {/* DEPARTMENT */}
              <SelectField
                label="Branch"
                IconComponent={Building2}
                value={dept}
                onChange={(value) => {
                  setDept(value);
                  setSection("");
                  setCie("");
                  setSem("");
                  setError("");
                }}
                options={departmentOptions}
                placeholder={batch ? "Select Branch" : "Select Batch First"}
              />

              {/* SECTION */}
              <SelectField
                label="Section"
                IconComponent={Users}
                value={section}
                onChange={(value) => {
                  setSection(value);
                  setCie("");
                  setSem("");
                  setError("");
                }}
                options={sectionOptions}
                placeholder={dept ? "Select Section" : "Select Branch First"}
                disabled={!dept || sectionOptions.length === 0}
              />

              {/* SEMESTER */}
              <SelectField
                label="Semester"
                IconComponent={CalendarRange}
                value={sem}
                onChange={(value) => {
                  setSem(value);
                  setError("");
                }}
                options={SEM_OPTIONS}
                placeholder="Select Semester"
                disabled={false}
              />

              {/* CATEGORY (University enabled for Admin only) */}
              <SelectField
                label="Category"
                IconComponent={CalendarRange}
                value={category}
                onChange={(value) => {
                  if (value === "University" && !isAdmin) {
                    setError("University reports are enabled for Admin only.");
                    return;
                  }
                  setCategory(value);
                  if (value === "University") {
                    setCie("");
                  }
                  setError("");
                }}
                options={categoryOptions}
                placeholder="Select Category"
                disabled={!isAdmin}
              />

              {/* CIE (Strictly for Normal exams - NO CIE for University) */}
              {category?.toLowerCase() === "normal" && (
                <SelectField
                  label="CIE"
                  IconComponent={BookOpenCheck}
                  value={cie}
                  onChange={(value) => {
                    setCie(value);
                    setError("");
                  }}
                  options={CIE_OPTIONS}
                  placeholder="Select CIE"
                  disabled={false}
                />
              )}
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <span>{error}</span>
            </div>
          )}

          {/* VIEW / DOWNLOAD RESULT */}
          <button
            type="button"
            onClick={handleViewResult}
            disabled={loadingResults || loadingSchedule}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FDCC03] px-6 py-3.5 text-sm font-bold text-[#000000] shadow-md shadow-[#FDCC03]/30 transition-all duration-200 hover:bg-[#800000] hover:text-white active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingResults ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating Class Examination Report...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Generate & Download Class Report
              </>
            )}
          </button>
        </div>

        <ToastContainer position="bottom-right" autoClose={3000} />
      </div>
    </div>
  );
}
