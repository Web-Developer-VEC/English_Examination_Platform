import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ClipboardClock,
  GraduationCap,
  ShieldCheck,
  Building2,
  Users,
  BookOpenCheck,
  CalendarDays,
  Clock3,
  Clock4,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  X,
  Undo2,
  CalendarRange,
  Layers,
  AlertCircle,
  Loader2,
} from "lucide-react";

// -----------------------------------------------------
// API CONFIG
// -----------------------------------------------------
const API_BASE_URL = "http://localhost:5000";
const SCHEDULE_EXAM_ENDPOINT = `${API_BASE_URL}/api/staff/scheduleexam`;
// NOTE: this route is registered as GET on the backend but its controller
// reads a "retest" flag from req.body. Browsers cannot send a body on a
// GET request (fetch/XHR strips or rejects it), so retest === "true" can
// never be true from this client — admissionNos will never be included
// in the response as the backend is currently written. Flag this to the
// backend team; until fixed, admission numbers fall back to a static list.
const GET_SCHEDULE_DATA_ENDPOINT = `${API_BASE_URL}/api/staff/getscheduledata`;

// -----------------------------------------------------
// PROJECT COLOR TOKENS
// -----------------------------------------------------
export const colors = {
  primary: "#FFFFFF",
  secondary: "#FDCC03",
  accent: "#800000",
  text: "#000000",
  gray: "#808080",

  darkPrimary: "#1A1A1A",
  darkSecondary: "#D4AF37",
  darkAccent: "#70C1FF",
  darkText: "#F0F0F0",
  darkSurface: "#212121",
  darkBorder: "#1A202C",
};

// -----------------------------------------------------
// STATIC OPTIONS
// (batch, department, section, and test/questionSetId now come from
// GET /api/staff/getscheduledata — see fetchScheduleData in the
// component. These remain static because the backend doesn't provide them.)
// -----------------------------------------------------
const CATEGORY_OPTIONS = ["Normal", "Retest", "University"];

const ACADEMIC_YEAR_OPTIONS = [
  "2023-2024",
  "2024-2025",
  "2025-2026",
  "2026-2027",
  "2027-2028",
];

// Backend requires semester as an integer 1-8, not "Odd"/"Even".
const SEMESTER_OPTIONS = [1, 2];
// const SEMESTER_OPTIONS = useMemo(
//   () => scheduleData.semesters || [],
//   [scheduleData.semesters]
// );


// CIE is a separate field from category, required only when
// category === "Normal". Backend accepts "I" | "II" | "III".
const CIE_OPTIONS = ["I", "II", "III"];


const ADMISSION_NO_OPTIONS = [
  "113224072054",
  "113224072087",
  "113224072060",
  "113224072005",
];

// 12-hour clock face values
const HOUR_VALUES = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTE_VALUES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,...,55
const PERIOD_OPTIONS = ["AM", "PM"];

// -----------------------------------------------------
// SHARED STYLES
// -----------------------------------------------------
const labelClasses =
  "mb-1.5 block text-sm font-semibold text-[#000000]";

const boxClasses =
  "w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-9 text-sm text-[#000000] placeholder:text-[#9CA3AF] shadow-sm outline-none transition focus:border-[#FDCC03] focus:ring-2 focus:ring-[#FDCC03]/40";

const iconLeftClasses =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]";

// Card container: light grey surface + soft shadow (screen bg is also grey,
// so cards get a hairline border to stay legible against it). Inner
// controls (inputs/selects/buttons) keep their own bg-white.
const cardClasses =
  "rounded-2xl border border-gray-200 bg-[#F4F5F7] shadow-md shadow-gray-300/40 p-5";

// -----------------------------------------------------
// ANALOG CLOCK TIME PICKER
// -----------------------------------------------------
function polarPoint(index, radius, cx, cy) {
  const angle = ((index % 12) * 30 - 90) * (Math.PI / 180);
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function AnalogClockPicker({ label, IconComponent, hour, minute, period, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("hour"); // "hour" | "minute"
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setMode("hour");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue =
    hour && minute !== "" ? `${hour}:${minute} ${period}` : "";

  const pad2 = (n) => String(n).padStart(2, "0");

  const handlePickHour = (h) => {
    onChange({ hour: pad2(h), minute, period });
    setMode("minute");
  };

  const handlePickMinute = (m) => {
    onChange({ hour, minute: pad2(m), period });
    setMode("hour");
    setIsOpen(false);
  };

  const cx = 90;
  const cy = 90;
  const outerRadius = 70;

  return (
    <div ref={wrapperRef} className="relative">
      <label className={labelClasses}>{label}</label>
      <div className="relative">
        <IconComponent className={iconLeftClasses} />
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setMode("hour");
          }}
          className={boxClasses + " flex items-center justify-between text-left"}
        >
          <span className={displayValue ? "" : "text-[#9CA3AF]"}>
            {displayValue || "Select time"}
          </span>
        </button>
        <ChevronDown
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] transition-transform ${isOpen ? "rotate-180" : ""
            }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-30 bottom-full mb-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {/* Header: big time readout + AM/PM toggle */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-[#FAFAFA] px-3 py-2">
            <div className="flex items-center gap-0.5 text-base font-bold text-[#000000]">
              <button
                type="button"
                onClick={() => setMode("hour")}
                className={
                  "rounded px-1 py-0.5 " +
                  (mode === "hour" ? "bg-[#FDCC03]/30 text-[#800000]" : "")
                }
              >
                {hour || "--"}
              </button>
              <span>:</span>
              <button
                type="button"
                onClick={() => setMode("minute")}
                className={
                  "rounded px-1 py-0.5 " +
                  (mode === "minute" ? "bg-[#FDCC03]/30 text-[#800000]" : "")
                }
              >
                {minute || "--"}
              </button>
            </div>
            <div className="flex overflow-hidden rounded-md border border-gray-300">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onChange({ hour, minute, period: p })}
                  className={
                    "px-1.5 py-0.5 text-[10px] font-semibold transition " +
                    (period === p
                      ? "bg-[#800000] text-white"
                      : "bg-white text-[#000000] hover:bg-gray-100")
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Analog clock face */}
          <div className="px-3 pb-3 pt-2">
            <svg viewBox="0 0 180 180" className="mx-auto block h-36 w-36">
              <circle cx={cx} cy={cy} r={outerRadius + 14} fill="#F4F5F7" />
              <circle
                cx={cx}
                cy={cy}
                r={outerRadius + 14}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="1"
              />
              <circle cx={cx} cy={cy} r="3" fill="#800000" />

              {mode === "hour"
                ? HOUR_VALUES.map((h) => {
                  const { x, y } = polarPoint(h, outerRadius, cx, cy);
                  const isSelected = hour === pad2(h);
                  return (
                    <g
                      key={h}
                      onClick={() => handlePickHour(h)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r="13"
                        fill={isSelected ? "#800000" : "transparent"}
                      />
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="12"
                        fontWeight="600"
                        fill={isSelected ? "#FFFFFF" : "#000000"}
                      >
                        {h}
                      </text>
                    </g>
                  );
                })
                : MINUTE_VALUES.map((m, idx) => {
                  const { x, y } = polarPoint(idx, outerRadius, cx, cy);
                  const isSelected = minute === pad2(m);
                  return (
                    <g
                      key={m}
                      onClick={() => handlePickMinute(m)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r="13"
                        fill={isSelected ? "#800000" : "transparent"}
                      />
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="12"
                        fontWeight="600"
                        fill={isSelected ? "#FFFFFF" : "#000000"}
                      >
                        {pad2(m)}
                      </text>
                    </g>
                  );
                })}
            </svg>

            <p className="mt-2 text-center text-[11px] text-[#9CA3AF]">
              {mode === "hour" ? "Select hour, then minute" : "Select minute"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------
// SCHEDULE COMPONENT
// -----------------------------------------------------
export default function Schedule() {
  // ---------------- STATE ----------------
  const [category, setCategory] = useState("Normal");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [cie, setCie] = useState("");
  const [batch, setBatch] = useState("");
  const [testCode, setTestCode] = useState("");

  // Department & Section (multi-select combo picker)
  const [selectedCombos, setSelectedCombos] = useState([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  // Admission Numbers (multi-select) — now shown for BOTH Normal and Retest
  const [selectedAdmissionNos, setSelectedAdmissionNos] = useState([]);
  const [isAdmissionPickerOpen, setIsAdmissionPickerOpen] = useState(false);
  const admissionPickerRef = useRef(null);

  // Range picker: pick a "from" and "to" admission number and select
  // everything in between (inclusive), based on ADMISSION_NO_OPTIONS order.
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  const [date, setDate] = useState("");

  // 12-hour Start / End time
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");
  const [endPeriod, setEndPeriod] = useState("AM");

  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------------- REFERENCE DATA (batches, dept/section, tests) ----------------
  const [scheduleData, setScheduleData] = useState({
    batchDepartmentSections: [],
    tests: [],
    admissionNos: [],
  });
  const [isLoadingScheduleData, setIsLoadingScheduleData] = useState(true);
  const [scheduleDataError, setScheduleDataError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    let cancelled = false;

    async function fetchScheduleData() {
      setIsLoadingScheduleData(true);
      setScheduleDataError("");
      try {
        // GET request — no body sent (browsers can't send one on GET),
        // so the backend's retest-flag/admissionNos branch never fires.
        const res = await fetch(GET_SCHEDULE_DATA_ENDPOINT, {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const body = await res.json();
        if (!res.ok || !body.success) {
          throw new Error(body.message || `Request failed (${res.status})`);
        }
        if (!cancelled) {
          setScheduleData({
            batchDepartmentSections: body.data.batchDepartmentSections || [],
            tests: body.data.tests || [],
            admissionNos: body.data.admissionNos || [],
          });
        }
      } catch (err) {
        if (!cancelled) {
          setScheduleDataError(
            err.message || "Failed to load batches/departments/test codes."
          );
        }
      } finally {
        if (!cancelled) setIsLoadingScheduleData(false);
      }
    }

    fetchScheduleData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Unique batches, in the order they first appear.
  const BATCH_OPTIONS = useMemo(
    () => [...new Set(scheduleData.batchDepartmentSections.map((c) => c.batch))],
    [scheduleData.batchDepartmentSections]
  );

  // Department + Section combos, filtered to the currently selected batch —
  // a section only shows up here if a student in that batch/dept/section
  // actually exists, matching how getScheduleData builds the list server-side.
  const DEPT_SECTION_OPTIONS = useMemo(() => {
    return scheduleData.batchDepartmentSections
      .filter((c) => !batch || c.batch === batch)
      .map((c) => ({
        key: `${c.department}__${c.section}`,
        dept: c.department,
        section: c.section,
        label: `${c.department} - Section ${c.section}`,
      }));
  }, [scheduleData.batchDepartmentSections, batch]);
  const ADMISSION_NO_OPTIONS = useMemo(
    () => scheduleData.admissionNos || [],
    [scheduleData.admissionNos]
  );

  // Test code -> questionSetId lookup, built from the real questions
  // collection instead of a hardcoded stub.
  const TEST_CODE_OPTIONS = useMemo(
    () => scheduleData.tests,
    [scheduleData.tests]
  );
  // Per-category drafts: each category (Normal / Retest) keeps its own
  // in-progress field values. Switching category never wipes anything —
  // it just saves what's currently on screen under the OLD category and
  // loads back whatever was last saved under the NEW category (blank the
  // first time). This keeps them independent without losing pending work.
  const draftsRef = useRef({ Normal: null, Retest: null, University: null });

  const captureCurrentFields = () => ({
    academicYear,
    semester,
    cie,
    batch,
    testCode,
    selectedCombos,
    selectedAdmissionNos,
    rangeFrom,
    rangeTo,
    date,
    startHour,
    startMinute,
    startPeriod,
    endHour,
    endMinute,
    endPeriod,
  });

  // Applies a saved draft (or blanks everything if none was saved yet)
  const applyFields = (draft) => {
    const d = draft || {};
    setAcademicYear(d.academicYear || "");
    setSemester(d.semester || "");
    setCie(d.cie || "");
    setBatch(d.batch || "");
    setTestCode(d.testCode || "");
    setSelectedCombos(d.selectedCombos || []);
    setIsPickerOpen(false);
    setSelectedAdmissionNos(d.selectedAdmissionNos || []);
    setIsAdmissionPickerOpen(false);
    setRangeFrom(d.rangeFrom || "");
    setRangeTo(d.rangeTo || "");
    setDate(d.date || "");
    setStartHour(d.startHour || "");
    setStartMinute(d.startMinute || "");
    setStartPeriod(d.startPeriod || "AM");
    setEndHour(d.endHour || "");
    setEndMinute(d.endMinute || "");
    setEndPeriod(d.endPeriod || "AM");
  };

  // Clears every field EXCEPT category — used after a successful submit
  // (fresh form for the next schedule) and also clears that category's
  // saved draft so it doesn't reappear later.
  const resetFormFields = () => {
    applyFields(null);
    draftsRef.current[category] = null;
  };

  const handleCategoryChange = (e) => {
    const nextCategory = e.target.value;
    // Save whatever is currently on screen under the category we're leaving
    draftsRef.current[category] = captureCurrentFields();
    // Restore whatever was previously saved for the category we're entering
    applyFields(draftsRef.current[nextCategory]);
    setCategory(nextCategory);
  };

  // Department & Section options depend on the selected batch. If the
  // batch changes, drop any selected combos that no longer belong to it
  // rather than silently submitting a stale department/section.
  useEffect(() => {
    setSelectedCombos((prev) => {
      const validKeys = new Set(DEPT_SECTION_OPTIONS.map((o) => o.key));
      const next = prev.filter((k) => validKeys.has(k));
      return next.length === prev.length ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch]);

  // Close dropdowns when clicking outside them
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsPickerOpen(false);
      }
      if (
        admissionPickerRef.current &&
        !admissionPickerRef.current.contains(event.target)
      ) {
        setIsAdmissionPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-clear the confirmation banner
  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  // Auto-clear the validation error banner
  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => setErrorMessage(""), 6000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  // ---------------- DEPARTMENT & SECTION FUNCTIONS ----------------
  const isAllCombosSelected =
    DEPT_SECTION_OPTIONS.length > 0 &&
    selectedCombos.length === DEPT_SECTION_OPTIONS.length;

  const handleComboToggle = (key) => {
    setSelectedCombos((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleToggleAllCombos = () => {
    setSelectedCombos(
      isAllCombosSelected ? [] : DEPT_SECTION_OPTIONS.map((o) => o.key)
    );
  };

  const handleRemoveCombo = (key) => {
    setSelectedCombos((prev) => prev.filter((k) => k !== key));
  };

  const handleClearAllCombos = () => setSelectedCombos([]);

  const getComboLabel = (key) =>
    DEPT_SECTION_OPTIONS.find((o) => o.key === key)?.label || key;

  // ---------------- ADMISSION NUMBER FUNCTIONS ----------------
  const isAllAdmissionSelected =
    ADMISSION_NO_OPTIONS.length > 0 &&
    selectedAdmissionNos.length === ADMISSION_NO_OPTIONS.length;

  const handleAdmissionToggle = (no) => {
    setSelectedAdmissionNos((prev) =>
      prev.includes(no) ? prev.filter((n) => n !== no) : [...prev, no]
    );
  };

  const handleToggleAllAdmission = () => {
    setSelectedAdmissionNos(
      isAllAdmissionSelected ? [] : [...ADMISSION_NO_OPTIONS]
    );
  };

  const handleRemoveAdmission = (no) => {
    setSelectedAdmissionNos((prev) => prev.filter((n) => n !== no));
  };

  // Clears everything, and doubles as "undo" for the whole selection
  const handleClearAllAdmission = () => setSelectedAdmissionNos([]);

  // Selects every admission number between rangeFrom and rangeTo
  // (inclusive), based on their order in ADMISSION_NO_OPTIONS. Works
  // regardless of which one the user picked first (from/to auto-swap).
  const handleApplyAdmissionRange = () => {
    if (!rangeFrom || !rangeTo) return;

    const fromIndex = ADMISSION_NO_OPTIONS.indexOf(rangeFrom);
    const toIndex = ADMISSION_NO_OPTIONS.indexOf(rangeTo);
    if (fromIndex === -1 || toIndex === -1) return;

    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    const rangeNos = ADMISSION_NO_OPTIONS.slice(start, end + 1);

    setSelectedAdmissionNos((prev) => {
      const merged = new Set(prev);
      rangeNos.forEach((no) => merged.add(no));
      return ADMISSION_NO_OPTIONS.filter((no) => merged.has(no));
    });
  };

  // ---------------- SUBMIT HELPERS ----------------

  // Converts 12-hour hour/minute/period into 24-hour {h, m}.
  const to24Hour = (hour, minute, period) => {
    let h = parseInt(hour, 10) % 12;
    if (period === "PM") h += 12;
    return { h, m: parseInt(minute, 10) };
  };

  // Combines the date input (YYYY-MM-DD) with a 12-hour time selection
  // into an ISO datetime string, e.g. "2026-08-04T09:00:00".
  // NOTE: built as local time, no explicit timezone offset — matches the
  // "Z"-less/"Z" ambiguity seen in the sample payloads. If the backend
  // expects UTC specifically, convert here before sending.
  const buildIsoDateTime = (dateStr, hour, minute, period) => {
    if (!dateStr || !hour || !minute) return null;
    const { h, m } = to24Hour(hour, minute, period);
    const pad2 = (n) => String(n).padStart(2, "0");
    return `${dateStr}T${pad2(h)}:${pad2(m)}:00`;
  };

  // Minutes-since-midnight, for comparing/validating start vs end and for
  // computing duration.
  const toMinutesSinceMidnight = (hour, minute, period) => {
    const { h, m } = to24Hour(hour, minute, period);
    return h * 60 + m;
  };

  // Checks every required field and returns a list of human-readable
  // problems. An empty list means the form is ready to submit.
  const validateForm = () => {
    const problems = [];

    if (!academicYear) problems.push("Academic Year is required");
    if (!semester) problems.push("Semester is required");
    if (category === "Normal" && !cie)
      problems.push("CIE (I, II, or III) is required for Normal category");
    if (!batch) problems.push("Batch is required");
    if (selectedCombos.length === 0)
      problems.push("Select at least one Department & Section");
    if (!testCode) problems.push("Test Code is required");
    if (!date) problems.push("Date is required");

    const hasStartTime = startHour && startMinute && startPeriod;
    const hasEndTime = endHour && endMinute && endPeriod;
    if (!hasStartTime) problems.push("Start Time is required");
    if (!hasEndTime) problems.push("End Time is required");

    if (hasStartTime && hasEndTime) {
      const startMinutes = toMinutesSinceMidnight(startHour, startMinute, startPeriod);
      const endMinutes = toMinutesSinceMidnight(endHour, endMinute, endPeriod);
      if (endMinutes <= startMinutes) {
        problems.push("End Time must be after Start Time");
      }
    }

    // Admission Number is mandatory for Retest (matches backend rule);
    // optional for Normal.
    if (category === "Retest" && selectedAdmissionNos.length === 0) {
      problems.push("Select at least one Admission Number for Retest");
    }

    return problems;
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const problems = validateForm();
    if (problems.length > 0) {
      setStatusMessage("");
      setErrorMessage(problems.join(" • "));
      return;
    }
    const questionSetId = testCode;

    if (!questionSetId) {
      setStatusMessage("");
      setErrorMessage("Test Code is required");
      return;
    }

    const startTime = buildIsoDateTime(date, startHour, startMinute, startPeriod);
    const endTime = buildIsoDateTime(date, endHour, endMinute, endPeriod);
    const duration =
      toMinutesSinceMidnight(endHour, endMinute, endPeriod) -
      toMinutesSinceMidnight(startHour, startMinute, startPeriod);

    // The backend only accepts one department + one section per request,
    // so a multi-combo selection becomes one POST per combo.
    const combosToSubmit = selectedCombos
      .map((key) => DEPT_SECTION_OPTIONS.find((o) => o.key === key))
      .filter(Boolean);

    const token = localStorage.getItem("token");

    setIsSubmitting(true);
    setErrorMessage("");
    setStatusMessage("");

    const results = await Promise.allSettled(
      combosToSubmit.map((combo) => {
        const payload = {
          // testcode is NOT sent — the backend generates it itself via a
          // cron job (stored as null at creation time). The frontend's
          // testCode dropdown is only used locally to look up questionSetId.
          category: category.toLowerCase(),
          questionSetId,
          department: combo.dept,
          batch,
          academicYear,
          semester: Number(semester),
          section: combo.section,
          admissionNo: selectedAdmissionNos,
          duration,
          startTime,
          endTime,
        };
        // CIE is a separate field from category, required only for
        // "normal" — omit entirely for Retest/University so the backend's
        // "cie must be I/II/III" check isn't triggered on an empty value.
        if (category === "Normal") {
          payload.cie = cie;
        }

        return fetch(SCHEDULE_EXAM_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        }).then(async (res) => {
          let body = null;
          try {
            body = await res.json();
          } catch {
            // no JSON body — leave as null
          }
          if (!res.ok) {
            const message =
              (body && (body.message || body.error)) ||
              `Request failed (${res.status})`;
            throw new Error(`${combo.label}: ${message}`);
          }
          return body;
        });
      })
    );

    setIsSubmitting(false);

    const failures = results.filter((r) => r.status === "rejected");
    const successCount = results.length - failures.length;

    if (failures.length === 0) {
      const verb =
        category === "Retest"
          ? "Retest assigned"
          : category === "University"
            ? "University exam scheduled"
            : "Schedule created";
      setStatusMessage(
        `${verb} for ${successCount} section${successCount > 1 ? "s" : ""}.`
      );
      // Clear the form after a fully successful submit so leftover data
      // never carries into the next schedule (or the other category).
      resetFormFields();
    } else if (successCount > 0) {
      setStatusMessage(`${successCount} section${successCount > 1 ? "s" : ""} scheduled successfully.`);
      setErrorMessage(
        failures.map((f) => f.reason?.message || "Unknown error").join(" • ")
      );
    } else {
      setErrorMessage(
        failures.map((f) => f.reason?.message || "Unknown error").join(" • ")
      );
    }
  };

  // ---------------- RENDER ----------------
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#EEF0F2] px-4 py-10 md:px-10">
      {/* ---------------- PAGE CONTENT ---------------- */}
      <div className="relative mx-auto max-w-3xl">
        {/* ---------------- HEADER (SAME FOR BOTH CATEGORIES) ---------------- */}
        <div className="mb-8 flex items-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#FDCC03]/40 bg-[#800000] shadow-md shadow-[#800000]/20">
            <ClipboardClock
              className="h-7 w-7 text-[#FDCC03]"
              strokeWidth={2}
            />

          </div>
          <div>
            <h3
              className="text-2xl font-bold tracking-tight md:text-3xl"
              style={{ color: colors.accent }}
            >
              Schedule Examination
            </h3>
            <p className="mt-1 text-sm text-[#808080]">
              Create and manage examination schedules for students.
            </p>
          </div>
        </div>

        {/* ---------------- SINGLE UNIFIED FORM ---------------- */}
        <form onSubmit={handleSubmit}>
          {/* Category */}
          <div className={"mb-6 " + cardClasses}>
            <label className={labelClasses}>Category</label>
            <div className="relative">
              <BadgeCheck className={iconLeftClasses} />
              <select
                value={category}
                onChange={handleCategoryChange}
                className={boxClasses + " appearance-none font-medium"}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            </div>
          </div>

          {/* Main card — same fields always, including Admission Number */}
          <div className={cardClasses + " md:p-6"}>
            <h2
              className="mb-5 text-center text-lg font-bold"
              style={{ color: colors.accent }}
            >
              Schedule Details
            </h2>

            <div className="flex flex-col gap-5">
              {/* Academic Year & Semester — single row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClasses}>Academic Year</label>
                  <div className="relative">
                    <CalendarRange className={iconLeftClasses} />
                    <select
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className={boxClasses + " appearance-none"}
                    >
                      <option value="">Select Academic Year</option>
                      {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Semester</label>
                  <div className="relative">
                    <Layers className={iconLeftClasses} />
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className={boxClasses + " appearance-none"}
                    >
                      <option value="">Select Semester</option>
                      {SEMESTER_OPTIONS.map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  </div>
                </div>
              </div>

              {/* Batch */}
              <div>
                <label className={labelClasses}>Batch</label>
                <div className="relative">
                  <GraduationCap className={iconLeftClasses} />
                  <select
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className={boxClasses + " appearance-none"}
                  >
                    <option value="">Select Batch</option>
                    {BATCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                </div>
              </div>

              {/* CIE — required by backend only for Normal category */}
              {category === "Normal" && (
                <div>
                  <label className={labelClasses}>CIE</label>
                  <div className="relative">
                    <BadgeCheck className={iconLeftClasses} />
                    <select
                      value={cie}
                      onChange={(e) => setCie(e.target.value)}
                      className={boxClasses + " appearance-none"}
                    >
                      <option value="">Select CIE</option>
                      {CIE_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          CIE {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  </div>
                </div>
              )}

              {/* Department & Section */}
              <div ref={pickerRef} className="relative">
                <label className={labelClasses}>Department &amp; Section</label>
                <div className="relative">
                  <Building2 className={iconLeftClasses} />
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen((prev) => !prev)}
                    className={boxClasses + " flex items-center justify-between text-left"}
                  >
                    <span className={selectedCombos.length ? "" : "text-[#9CA3AF]"}>
                      {selectedCombos.length
                        ? `${selectedCombos.length} Selected`
                        : "Select department & section"}
                    </span>
                  </button>
                  <ChevronDown
                    className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] transition-transform ${isPickerOpen ? "rotate-180" : ""
                      }`}
                  />
                </div>

                {isPickerOpen && (
                  <div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    <label className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-2.5 text-sm font-semibold text-[#800000] transition hover:bg-[#FDCC03]/10">
                      <input
                        type="checkbox"
                        checked={isAllCombosSelected}
                        onChange={handleToggleAllCombos}
                        className="h-4 w-4 rounded border-gray-300 accent-[#800000]"
                      />
                      All
                    </label>
                    {DEPT_SECTION_OPTIONS.map((option) => (
                      <label
                        key={option.key}
                        className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-[#000000] transition hover:bg-[#FDCC03]/10"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCombos.includes(option.key)}
                          onChange={() => handleComboToggle(option.key)}
                          className="h-4 w-4 rounded border-gray-300 accent-[#800000]"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                )}

                {selectedCombos.length > 0 && (
                  <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#000000]">
                        Selected ({selectedCombos.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleClearAllCombos}
                        className="flex items-center gap-1 text-xs font-semibold text-[#800000] hover:underline"
                      >
                        <Undo2 className="h-3 w-3" />
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {selectedCombos.map((key) => (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded-md bg-white px-3 py-1.5 text-xs text-[#000000] shadow-sm"
                        >
                          <span className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-[#800000]" />
                            {getComboLabel(key)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCombo(key)}
                            className="rounded-full p-0.5 text-[#9CA3AF] transition hover:bg-[#800000]/10 hover:text-[#800000]"
                            aria-label={`Remove ${getComboLabel(key)}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Admission Number — now rendered for BOTH Normal and Retest */}
              <div ref={admissionPickerRef} className="relative">
                <label className={labelClasses}>Admission Number</label>
                <div className="relative">
                  <BadgeCheck className={iconLeftClasses} />
                  <button
                    type="button"
                    onClick={() => setIsAdmissionPickerOpen((prev) => !prev)}
                    className={boxClasses + " flex items-center justify-between text-left"}
                  >
                    <span className={selectedAdmissionNos.length ? "" : "text-[#9CA3AF]"}>
                      {selectedAdmissionNos.length
                        ? `${selectedAdmissionNos.length} Selected`
                        : "Select admission number(s)"}
                    </span>
                  </button>
                  <ChevronDown
                    className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] transition-transform ${isAdmissionPickerOpen ? "rotate-180" : ""
                      }`}
                  />
                </div>

                {isAdmissionPickerOpen && (
                  <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                    {/* Range picker: select from-number to-number */}
                    <div className="border-b border-gray-100 bg-[#FAFAFA] p-3">
                      <p className="mb-2 text-xs font-semibold text-[#000000]">
                        Select Range
                      </p>
                      <div className="flex items-center gap-2">
                        <select
                          value={rangeFrom}
                          onChange={(e) => setRangeFrom(e.target.value)}
                          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-[#000000] outline-none focus:border-[#FDCC03] focus:ring-2 focus:ring-[#FDCC03]/40"
                        >
                          <option value="">From</option>
                          {ADMISSION_NO_OPTIONS.map((no) => (
                            <option key={no} value={no}>
                              {no}
                            </option>
                          ))}
                        </select>
                        <span className="shrink-0 text-xs font-semibold text-[#9CA3AF]">
                          to
                        </span>
                        <select
                          value={rangeTo}
                          onChange={(e) => setRangeTo(e.target.value)}
                          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-[#000000] outline-none focus:border-[#FDCC03] focus:ring-2 focus:ring-[#FDCC03]/40"
                        >
                          <option value="">To</option>
                          {ADMISSION_NO_OPTIONS.map((no) => (
                            <option key={no} value={no}>
                              {no}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyAdmissionRange}
                        disabled={!rangeFrom || !rangeTo}
                        className="mt-2 w-full rounded-md bg-[#800000] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#690000] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Add Range
                      </button>
                    </div>

                    <div className="max-h-56 overflow-y-auto">
                      <label className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-2.5 text-sm font-semibold text-[#800000] transition hover:bg-[#FDCC03]/10">
                        <input
                          type="checkbox"
                          checked={isAllAdmissionSelected}
                          onChange={handleToggleAllAdmission}
                          className="h-4 w-4 rounded border-gray-300 accent-[#800000]"
                        />
                        All
                      </label>
                      {ADMISSION_NO_OPTIONS.map((no) => (
                        <label
                          key={no}
                          className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-[#000000] transition hover:bg-[#FDCC03]/10"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAdmissionNos.includes(no)}
                            onChange={() => handleAdmissionToggle(no)}
                            className="h-4 w-4 rounded border-gray-300 accent-[#800000]"
                          />
                          {no}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAdmissionNos.length > 0 && (
                  <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#000000]">
                        Selected ({selectedAdmissionNos.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleClearAllAdmission}
                        className="flex items-center gap-1 text-xs font-semibold text-[#800000] hover:underline"
                      >
                        <Undo2 className="h-3 w-3" />
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {selectedAdmissionNos.map((no) => (
                        <div
                          key={no}
                          className="flex items-center justify-between rounded-md bg-white px-3 py-1.5 text-xs text-[#000000] shadow-sm"
                        >
                          <span className="flex items-center gap-2">
                            <BadgeCheck className="h-3.5 w-3.5 text-[#800000]" />
                            {no}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAdmission(no)}
                            className="rounded-full p-0.5 text-[#9CA3AF] transition hover:bg-[#800000]/10 hover:text-[#800000]"
                            aria-label={`Remove ${no}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Test Code */}
              <div>
                <label className={labelClasses}>Test Code</label>
                <div className="relative">
                  <BookOpenCheck className={iconLeftClasses} />
                  <select
                    value={testCode}
                    onChange={(e) => setTestCode(e.target.value)}
                    className={boxClasses + " appearance-none"}
                  >
                    <option value="">Select Test Code</option>
                    {TEST_CODE_OPTIONS.map((test) => (
                      <option
                        key={test.questionSetId}
                        value={test.questionSetId}
                      >
                        {test.questionCode}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                </div>
              </div>

              {/* Date / Start Time / End Time — single row, analog clock pickers */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClasses}>Date</label>
                  <div className="relative">
                    <CalendarDays className={iconLeftClasses} />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={boxClasses + " pr-2"}
                    />
                  </div>
                </div>

                <AnalogClockPicker
                  label="Start Time"
                  IconComponent={Clock3}
                  hour={startHour}
                  minute={startMinute}
                  period={startPeriod}
                  onChange={({ hour, minute, period }) => {
                    setStartHour(hour);
                    setStartMinute(minute);
                    setStartPeriod(period);
                  }}
                />

                <AnalogClockPicker
                  label="End Time"
                  IconComponent={Clock4}
                  hour={endHour}
                  minute={endMinute}
                  period={endPeriod}
                  onChange={({ hour, minute, period }) => {
                    setEndHour(hour);
                    setEndMinute(minute);
                    setEndPeriod(period);
                  }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || isLoadingScheduleData}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FDCC03] px-6 py-3.5 text-sm font-bold text-[#000000] shadow-md shadow-[#FDCC03]/30 transition-colors duration-200 hover:bg-[#800000] hover:text-white active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              {isSubmitting
                ? "Submitting..."
                : isLoadingScheduleData
                  ? "Loading options..."
                  : category === "Retest"
                    ? "Assign Retest"
                    : "Confirm Schedule"}
            </button>

            {scheduleDataError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Couldn't load batches/departments/test codes: {scheduleDataError}
                </span>
              </div>
            )}

            {errorMessage && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {statusMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#800000]/20 bg-[#800000]/3 px-4 py-3 text-sm font-medium text-[#800000]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {statusMessage}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}