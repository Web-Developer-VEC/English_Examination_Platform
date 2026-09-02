import React , { useEffect, useMemo, useState } from "react";
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
  BarChart3,
} from "lucide-react";
import { getFormData, getExamResults } from "../../services/adminService";
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
    }

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

  // ---------------------------------------------------
  // API DATA
  // ---------------------------------------------------
  const [scheduleData, setScheduleData] = useState([]);

  // ---------------------------------------------------
  // RESULT DATA
  // ---------------------------------------------------
  const [results, setResults] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState("");

  const [showResults, setShowResults] = useState(false);
  const [submittedFilters, setSubmittedFilters] = useState(null);

  // ---------------------------------------------------
  // GET SCHEDULE DATA
  // ---------------------------------------------------
  useEffect(() => {
    const fetchScheduleData = async () => {
      setLoadingSchedule(true);
      setError("");

      try {
        const data = await getFormData();
console.log("YRYUi🐦‍🔥🐦‍🔥🐦‍🔥",JSON.stringify(data,null,2));

        if (!data.success) {
          throw new Error(
            data.message || "Failed to fetch form data."
          );
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
        setError("Unable to load schedule data from the server.");
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
    if (!batch || !dept || !section || !cie || !sem) {
      setError("Please select Batch, Branch, Section, CIE and Semester.");
      return false;
    }

    return true;
  };

  // ---------------------------------------------------
  // FETCH / PREPARE RESULTS
  // ---------------------------------------------------
  const fetchStudentResults = async (filters) => {

    const cieMapping = {
      I: 1,
      II: 2,
      III: 3,
    };

    const cieNumber = filters.cie
      ? cieMapping[filters.cie]
      : null;

    const semesterValue = filters.sem
      ? filters.sem.toLowerCase()
      : "";

    const requestBody = {
      batch: filters.batch,
      department: filters.dept,
      section: filters.section,
      cie: filters.cie,
      semester: semesterValue,
    };

    const responseData =
      await getExamResults(requestBody);

    if (
      !responseData.success ||
      !responseData.data ||
      !responseData.data.url
    ) {
      throw new Error(
        responseData.message ||
        "PDF URL was not returned by the server."
      );
    }

    const pdfUrl =
      responseData.data.url;

    window.open(
      pdfUrl,
      "_blank",
      "noopener,noreferrer"
    );

    return responseData;
  };
  // ---------------------------------------------------
  // VIEW RESULT
  // ---------------------------------------------------
  const handleViewResult = async () => {
    setError("");

    // ---------------------------------------------------
    // VALIDATE FILTERS
    // ---------------------------------------------------

    if (!validate()) {
      setShowResults(false);
      return;
    }

    setLoadingResults(true);
    setShowResults(false);
    setResults([]);

    try {
      const filters = {
        batch,
        dept,
        section,
        cie,
        sem,
      };

      await fetchStudentResults(filters);

      setSubmittedFilters(filters);
      setShowResults(false);

    } catch (err) {
      console.error("PDF download error:", err);
      setError(
        err.message ||
        "Something went wrong while generating or downloading the PDF.",
      );

      setShowResults(false);
    } finally {
      setLoadingResults(false);
    }
  };

  // ---------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------
  const summary = useMemo(() => {
    if (!results.length) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        average: "0.0",
      };
    }

    const total = results.length;

    const failed = results.filter((row) =>
      FAIL_GRADES.includes(cleanValue(row.grade).toUpperCase()),
    ).length;

    const passed = total - failed;

    const numericMarks = results
      .map((row) => Number(row.mark))
      .filter((mark) => Number.isFinite(mark));

    const average = numericMarks.length
      ? (
        numericMarks.reduce((sum, mark) => sum + mark, 0) /
        numericMarks.length
      ).toFixed(1)
      : "0.0";

    return {
      total,
      passed,
      failed,
      average,
    };
  }, [results]);

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
              Student Result
            </h1>

            <p className="mt-1 text-sm text-[#808080]">
              View your Continuous Internal Evaluation results
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
            Select Your Details
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
                  setShowResults(false);
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
                  setShowResults(false);
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
                  setShowResults(false);
                  setError("");
                }}
                options={sectionOptions}
                placeholder={
                  dept ? "Select Section" : "Select Branch First"
                }
                disabled={!dept || sectionOptions.length === 0}
              />

              {/* CIE */}
              <SelectField
                label="CIE"
                IconComponent={BookOpenCheck}
                value={cie}
                onChange={(value) => {
                  setCie(value);
                  setShowResults(false);
                  setError("");
                }}
                options={CIE_OPTIONS}
                placeholder="Select CIE"
                disabled={false}
              />

              {/* SEMESTER */}
              <SelectField
                label="Semester"
                IconComponent={CalendarRange}
                value={sem}
                onChange={(value) => {
                  setSem(value);
                  setShowResults(false);
                  setError("");
                }}
                options={SEM_OPTIONS}
                placeholder="Select Semester"
                disabled={false}
              />
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <span>{error}</span>
            </div>
          )}

          {/* VIEW RESULT */}
          <button
            type="button"
            onClick={handleViewResult}
            disabled={loadingResults || loadingSchedule}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FDCC03] px-6 py-3.5 text-sm font-bold text-[#000000] shadow-md shadow-[#FDCC03]/30 transition-all duration-200 hover:bg-[#800000] hover:text-white active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingResults ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Fetching results...
              </>
            ) : (
              <>
                <FileSearch className="h-5 w-5" />
                View Result
              </>
            )}
          </button>
        </div>

        {/* RESULT SECTION */}
        {showResults && submittedFilters && (
          <div className="mt-8">
            {/* SELECTED DETAILS */}
            <div className="mb-5 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3">
              {[
                ["Batch", submittedFilters.batch],
                ["Branch", submittedFilters.dept],
                ["Section", submittedFilters.section],
                ["CIE", submittedFilters.cie],
                ["Semester", submittedFilters.sem],
              ].map(([label, value]) => (
                <span
                  key={label}
                  className="rounded-full bg-[#F4F5F7] px-3 py-1 text-xs font-medium text-[#000000]"
                >
                  <span className="text-[#808080]">{label}:</span>{" "}
                  <span className="font-semibold">{value}</span>
                </span>
              ))}
            </div>

            {/* EMPTY */}
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F5F7]">
                  <FileSearch className="h-7 w-7 text-[#808080]" />
                </div>

                <h3 className="text-lg font-bold text-[#000000]">
                  No Result Data Found
                </h3>

                <p className="mt-2 max-w-md text-sm text-[#808080]">
                  No result data is available for the selected details.
                </p>
              </div>
            ) : (
              <>
                {/* SUMMARY */}
                <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <SummaryCard
                    icon={ClipboardList}
                    label="Total Subjects"
                    value={summary.total}
                  />

                  <SummaryCard
                    icon={CheckCircle2}
                    label="Passed"
                    value={summary.passed}
                    tone="success"
                  />

                  <SummaryCard
                    icon={XCircle}
                    label="Failed"
                    value={summary.failed}
                    tone="danger"
                  />

                  <SummaryCard
                    icon={BarChart3}
                    label="Average Mark"
                    value={summary.average}
                  />
                </div>

                {/* RESULT TABLE */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-[#F4F5F7] text-xs font-bold uppercase tracking-wide text-[#808080]">
                          <th className="px-5 py-3">S.No</th>

                          <th className="px-5 py-3">Course Code</th>

                          <th className="px-5 py-3">Course Name</th>

                          <th className="px-5 py-3">Internal Mark</th>

                          <th className="px-5 py-3">Grade</th>

                          <th className="px-5 py-3">Result</th>
                        </tr>
                      </thead>

                      <tbody>
                        {results.map((row, index) => {
                          const isFail = FAIL_GRADES.includes(
                            cleanValue(row.grade).toUpperCase(),
                          );

                          return (
                            <tr
                              key={row.code || `${row.name}-${index}`}
                              className="border-b border-gray-100 last:border-0 hover:bg-[#FDCC03]/5"
                            >
                              <td className="px-5 py-3.5 text-[#808080]">
                                {index + 1}
                              </td>

                              <td className="px-5 py-3.5 font-semibold text-[#000000]">
                                {row.code || "-"}
                              </td>

                              <td className="px-5 py-3.5 text-[#000000]">
                                {row.name || "-"}
                              </td>

                              <td className="px-5 py-3.5 text-[#000000]">
                                {row.mark ?? "-"}
                              </td>

                              <td className="px-5 py-3.5">
                                <GradeBadge grade={row.grade} />
                              </td>

                              <td className="px-5 py-3.5">
                                <ResultBadge pass={!isFail} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------
// SUMMARY CARD
// -----------------------------------------------------
function SummaryCard({ icon: Icon, label, value, tone }) {
  const toneClasses =
    tone === "success"
      ? "text-green-700 bg-green-50"
      : tone === "danger"
        ? "text-red-700 bg-red-50"
        : "text-[#800000] bg-[#FDCC03]/15";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div
        className={
          "mb-2 flex h-9 w-9 items-center justify-center rounded-lg " +
          toneClasses
        }
      >
        <Icon className="h-4.5 w-4.5" />
      </div>

      <p className="text-xs font-medium text-[#808080]">{label}</p>

      <p className="mt-1 text-xl font-bold text-[#000000]">{value}</p>
    </div>
  );
}
