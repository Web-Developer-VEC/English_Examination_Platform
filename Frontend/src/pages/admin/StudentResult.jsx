import React, { useMemo, useState } from "react";
import {
  GraduationCap,
  Building2,
  Users,
  BookOpenCheck,
  CalendarRange,
  ChevronDown,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileSearch,
  ClipboardList,
  BarChart3,
} from "lucide-react";

// -----------------------------------------------------
// PROJECT COLOR TOKENS (kept consistent with Schedule.jsx)
// -----------------------------------------------------
const colors = {
  primary: "#FFFFFF",
  secondary: "#FDCC03",
  accent: "#800000",
  text: "#000000",
  gray: "#808080",
};

// -----------------------------------------------------
// DROPDOWN OPTIONS
// -----------------------------------------------------
const BATCH_OPTIONS = ["2022-2026", "2023-2027", "2024-2028", "2025-2029"];
const DEPARTMENT_OPTIONS = ["AI & DS", "CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"];
const SECTION_OPTIONS = ["A", "B", "C","D"];
const CIE_OPTIONS = ["CIE 1", "CIE 2", "CIE 3"];
const SEM_OPTIONS = ["Odd", "Even"];

// -----------------------------------------------------
// SHARED STYLES (matches Schedule.jsx conventions)
// -----------------------------------------------------
const labelClasses = "mb-1.5 block text-sm font-semibold text-[#000000]";

const boxClasses =
  "w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-9 text-sm text-[#000000] placeholder:text-[#9CA3AF] shadow-sm outline-none transition focus:border-[#FDCC03] focus:ring-2 focus:ring-[#FDCC03]/40";

const iconLeftClasses =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]";

const cardClasses =
  "rounded-2xl border border-gray-200 bg-[#F4F5F7] shadow-md shadow-gray-300/40 p-5";

// -----------------------------------------------------
// DUMMY RESULT DATA (frontend demo only — replace with API response)
// -----------------------------------------------------
const FAIL_GRADES = ["RA", "F"];

// -----------------------------------------------------
// SELECT FIELD (reusable dropdown block)
// -----------------------------------------------------
function SelectField({ label, IconComponent, value, onChange, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <label className={labelClasses}>{label}</label>
      <div
        className={
          "relative transition-transform duration-200 " +
          (isOpen ? "scale-[1.015]" : "")
        }
      >
        <IconComponent
          className={
            iconLeftClasses +
            " transition-colors duration-200 " +
            (isOpen ? "text-[#FDCC03]" : "")
          }
        />
        <select
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(false);
          }}
          onMouseDown={() => setIsOpen(true)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          className={
            boxClasses +
            " appearance-none transition-all duration-200 " +
            (isOpen ? "shadow-[0_0_0_4px_rgba(253,204,3,0.25)]" : "")
          }
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          className={
            "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-transform duration-200 " +
            (isOpen ? "rotate-180 text-[#800000]" : "text-[#9CA3AF]")
          }
        />
      </div>
    </div>
  );
}
// -----------------------------------------------------
// GRADE / RESULT BADGE
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

function GradeBadge({ grade }) {
  const isFail = FAIL_GRADES.includes(grade);
  return (
    <span
      className={
        "inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-bold " +
        (isFail ? "bg-red-50 text-red-700" : "bg-[#FDCC03]/20 text-[#800000]")
      }
    >
      {grade}
    </span>
  );
}

// -----------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------
export default function StudentResult() {
  // ---------------- SELECTION STATE ----------------
 const [batch, setBatch] = useState("");
  const [dept, setDept] = useState("");
  const [section, setSection] = useState("");
  const [cie, setCie] = useState("");
  const [sem, setSem] = useState("");

  // ---------------- RESULT STATE ----------------
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);

  // Snapshot of the filters actually submitted (so the summary line
  // doesn't change if the user edits dropdowns after viewing a result)
  const [submittedFilters, setSubmittedFilters] = useState(null);

  // ---------------- VALIDATION ----------------
  const validate = () => {
    if (!batch || !dept || !section || !cie || !sem) {
      setError("Please select all fields before viewing the result.");
      return false;
    }
    return true;
  };

  // ---------------- API CALL (backend-ready, isolated) ----------------
  // TODO: Replace with actual API endpoint
  // ---------------- API CALL (backend-ready, isolated) ----------------
  // TODO: Replace API_ENDPOINT with the actual backend URL once available.
  const API_ENDPOINT = "/api/student/results";

  const fetchStudentResults = async ({ batch, dept, section, cie, sem }) => {
    const payload = { batch, dept, section, cie, sem };

    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let message = "Unable to fetch results.";
      try {
        const errorData = await response.json();
        message = errorData?.message || message;
      } catch {
        // response wasn't JSON — keep the default message
      }
      throw new Error(message);
    }

    const data = await response.json();
    return data.results || [];
  };

  // ---------------- SUBMIT HANDLER ----------------
 // ---------------- DOWNLOAD HELPER ----------------
  // Saves the fetched result data as a JSON file. Once the backend
  // returns a ready-made file (e.g. a PDF), replace this with the
  // response's file blob/URL instead of generating one client-side.
  const downloadResultFile = (data, filters) => {
    const fileName = `result_${filters.batch}_${filters.dept}_${filters.section}_${filters.cie}_${filters.sem}.json`
      .replace(/\s+/g, "_");

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ---------------- SUBMIT HANDLER ----------------
  const handleViewResult = async () => {
    setError("");

    if (!validate()) {
      setShowResults(false);
      return;
    }

    setLoading(true);
    setShowResults(false);

    try {
      const filters = { batch, dept, section, cie, sem };
      const data = await fetchStudentResults(filters);

      setResults(data);
      setSubmittedFilters(filters);
      setShowResults(true);

      if (data.length > 0) {
        downloadResultFile(data, filters);
      }
    } catch (err) {
      console.error("Fetch student results error:", err);
      setError(
        "Something went wrong while loading your results. Please try again."
      );
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SUMMARY (derived from results) ----------------
  const summary = useMemo(() => {
    if (!results.length) {
      return { total: 0, passed: 0, failed: 0, average: 0 };
    }

    const total = results.length;
    const failed = results.filter((r) => FAIL_GRADES.includes(r.grade)).length;
    const passed = total - failed;
    const average =
      results.reduce((sum, r) => sum + (r.mark || 0), 0) / total;

    return { total, passed, failed, average: average.toFixed(1) };
  }, [results]);

  // ---------------- RENDER ----------------
  return (
    <div className="min-h-screen w-full bg-[#EEF0F2] px-4 py-10 md:px-10">
      <div className="mx-auto max-w-4xl">
        {/* ---------------- HEADER ---------------- */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#FDCC03]/40 bg-[#800000] shadow-md shadow-[#800000]/20">
            <ClipboardList className="h-7 w-7 text-[#FDCC03]" strokeWidth={2} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight md:text-3xl"
              style={{ color: colors.accent }}
            >
              Student Result
            </h1>
            <p className="mt-1 text-sm text-[#808080]">
              View your Continuous Internal Evaluation results
            </p>
          </div>
        </div>

        {/* ---------------- FILTER CARD ---------------- */}
        <div className={cardClasses}>
          <h2
            className="mb-5 text-center text-lg font-bold"
            style={{ color: colors.accent }}
          >
            Select Your Details
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
           <SelectField
              label="Batch"
              IconComponent={GraduationCap}
              value={batch}
              onChange={setBatch}
              options={BATCH_OPTIONS}
              placeholder="Select Batch"
            />

            <SelectField
              label="Department"
              IconComponent={Building2}
              value={dept}
              onChange={setDept}
              options={DEPARTMENT_OPTIONS}
              placeholder="Select Department"
            />

            <SelectField
              label="Section"
              IconComponent={Users}
              value={section}
              onChange={setSection}
              options={SECTION_OPTIONS}
              placeholder="Select Section"
            />

            <SelectField
              label="CIE"
              IconComponent={BookOpenCheck}
              value={cie}
              onChange={setCie}
              options={CIE_OPTIONS}
              placeholder="Select CIE"
            />

            <SelectField
              label="Semester"
              IconComponent={CalendarRange}
              value={sem}
              onChange={setSem}
              options={SEM_OPTIONS}
              placeholder="Select Semester"
            />
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* VIEW RESULT BUTTON */}
          <button
            type="button"
            onClick={handleViewResult}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FDCC03] px-6 py-3.5 text-sm font-bold text-[#000000] shadow-md shadow-[#FDCC03]/30 transition-all duration-200 hover:bg-[#800000] hover:text-white active:scale-[0.97] active:animate-[goldPulse_0.5s_ease-out] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Fetching results...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Download Result
              </>
            )}
          </button>
        </div>

        {/* ---------------- RESULT SECTION ---------------- */}
        {showResults && submittedFilters && (
          <div className="mt-8">
            {/* SELECTED DETAILS STRIP */}
            <div className="mb-5 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3">
              {[
                ["Batch", submittedFilters.batch],
                ["Department", submittedFilters.dept],
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

            {results.length === 0 ? (
              // ---------------- EMPTY STATE ----------------
              <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F5F7]">
                  <FileSearch className="h-7 w-7 text-[#808080]" />
                </div>
                <h3 className="text-lg font-bold text-[#000000]">
                  No Results Found
                </h3>
                <p className="mt-2 max-w-md text-sm text-[#808080]">
                  No result data is available for the selected Batch,
                  Academic Year, Department, Section, CIE and Semester.
                </p>
              </div>
            ) : (
              <>
                {/* ---------------- SUMMARY CARDS ---------------- */}
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

                {/* ---------------- RESULT TABLE ---------------- */}
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
                          const isFail = FAIL_GRADES.includes(row.grade);
                          return (
                            <tr
                              key={row.code}
                              className="border-b border-gray-100 last:border-0 hover:bg-[#FDCC03]/5"
                            >
                              <td className="px-5 py-3.5 text-[#808080]">
                                {index + 1}
                              </td>
                              <td className="px-5 py-3.5 font-semibold text-[#000000]">
                                {row.code}
                              </td>
                              <td className="px-5 py-3.5 text-[#000000]">
                                {row.name}
                              </td>
                              <td className="px-5 py-3.5 text-[#000000]">
                                {row.mark}
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