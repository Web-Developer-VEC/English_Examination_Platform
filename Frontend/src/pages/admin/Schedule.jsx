import React, { useState, useRef, useEffect, useMemo } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
  ChevronUp,
  X,
  Undo2,
  CalendarRange,
  Layers,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react";
import ThemeDropdown from "../../components/common/ThemeDropDown"

// API CONFIG
const API_BASE_URL = "http://localhost:5000";
const SCHEDULE_EXAM_ENDPOINT = `${API_BASE_URL}/api/staff/schedule/scheduleexam`;
const GET_SCHEDULE_DATA_ENDPOINT = `${API_BASE_URL}/api/staff/schedule/getformdata`;

// PROJECT COLOR TOKENS
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

const CATEGORY_OPTIONS = ["Normal", "Retest", "University"];

const ACADEMIC_YEAR_OPTIONS = [
  "2023-2024",
  "2024-2025",
  "2025-2026",
  "2026-2027",
  "2027-2028",
];
const SEMESTER_OPTIONS = ["Odd", "Even"];
const CIE_OPTIONS = ["I", "II", "III"];
// 12-hour clock face values
const HOUR_VALUES = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTE_VALUES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,...,55
const PERIOD_OPTIONS = ["AM", "PM"];

// SHARED STYLES
const labelClasses = "mb-1.5 block text-sm font-semibold text-[#000000]";

const boxClasses =
  "w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-9 text-sm text-[#000000] placeholder:text-[#9CA3AF] shadow-sm outline-none transition focus:border-[#FDCC03] focus:ring-2 focus:ring-[#FDCC03]/40";

const iconLeftClasses =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]";
const cardClasses =
  "rounded-2xl border border-gray-200 bg-[#F4F5F7] shadow-[0_4px_20px_rgba(0,0,0,0.15)] p-5";

// Shared "ThemeDropdown" look for the custom multi-select triggers/panels below,
// so they read as the same family of control as ThemeDropdown itself.
const dropdownTriggerClasses = (isOpen, disabled) =>
  `group flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left transition-all duration-200 focus:outline-none ${isOpen
    ? "border-[#fdcc03] shadow-[0_0_0_3px_rgba(253,204,3,0.15)]"
    : "border-black/15 hover:border-black/30"
  } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`;

const dropdownIconClasses = (isOpen) =>
  `shrink-0 transition-colors duration-200 ${isOpen ? "text-black" : "text-black/60 group-hover:text-black"
  }`;

const dropdownArrowClasses = (isOpen) =>
  `flex shrink-0 items-center justify-center transition-all duration-200 ${isOpen ? "text-black" : "text-black/50 group-hover:text-black"
  }`;

const dropdownPanelClasses =
  "absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-black/10 bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.12)] animate-[dropdownIn_0.15s_ease-out]";

const dropdownAllRowClasses =
  "mb-0.5 flex cursor-pointer items-center gap-3 rounded-lg border-b border-black/5 px-4 py-3 text-[15px] font-semibold text-[#800000] transition-all duration-150 hover:bg-[#fff8d6]";

const dropdownOptionRowClasses = (isSelected) =>
  `mb-0.5 flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-[15px] transition-all duration-150 last:mb-0 ${
    isSelected
      ? "bg-[#fdcc03]/15 font-semibold text-black"
      : "font-medium text-black hover:bg-[#fff8d6]"
  }`;

// SEARCHABLE SELECT FOR RANGE PICKER
function SearchableSelect({ value, options, detailsMap, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter((no) => {
      const details = detailsMap.get(no);
      const searchString = details ? `${no} ${details.name}`.toLowerCase() : no.toLowerCase();
      return searchString.includes(lowerSearch);
    });
  }, [options, detailsMap, search]);

  const details = value ? detailsMap.get(value) : null;
  const displayValue = value ? (details ? `${value} - ${details.name}` : value) : "";

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-left shadow-sm focus:border-[#800000] focus:outline-none hover:border-gray-400 transition"
        title={displayValue}
      >
        <span className={`truncate mr-2 ${value ? "text-black" : "text-gray-400"}`}>
          {displayValue || placeholder}
        </span>
        <ChevronDown size={14} className="text-gray-500 shrink-0" />
      </button>
      
      {isOpen && (
        <div className="absolute z-[60] left-0 mt-1 w-full min-w-[220px] rounded-md border border-gray-200 bg-white shadow-xl">
          <div className="p-2 border-b border-gray-100">
             <div className="relative">
               <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
               <input
                 type="text"
                 autoFocus
                 placeholder="Search..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full rounded border border-gray-300 pl-6 pr-2 py-1 text-xs focus:border-[#800000] focus:outline-none"
               />
             </div>
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
               <div className="px-2 py-3 text-xs text-gray-500 text-center">No results</div>
            ) : (
              filteredOptions.map((no) => {
                const d = detailsMap.get(no);
                const label = d ? `${no} - ${d.name}` : no;
                return (
                  <button
                    key={no}
                    type="button"
                    onClick={() => {
                      onChange(no);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${value === no ? "bg-[#fdcc03]/30 font-semibold text-black" : "text-gray-700 hover:bg-gray-100"}`}
                  >
                    {label}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ANALOG CLOCK TIME PICKER
function polarPoint(index, radius, cx, cy) {
  const angle = ((index % 12) * 30 - 90) * (Math.PI / 180);
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function AnalogClockPicker({
  label,
  IconComponent,
  hour,
  minute,
  period,
  onChange,
}) {
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
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setMode("hour");
          }}
          className={dropdownTriggerClasses(isOpen, false)}
        >
          {IconComponent && (
            <IconComponent size={18} strokeWidth={2} className={dropdownIconClasses(isOpen)} />
          )}
          <span
            className={`flex-1 truncate text-[15px] font-medium ${displayValue ? "text-black" : "text-black/45"
              }`}
          >
            {displayValue || "Select time"}
          </span>
          <span className={dropdownArrowClasses(isOpen)}>
            {isOpen ? (
              <ChevronUp size={18} strokeWidth={2} />
            ) : (
              <ChevronDown size={18} strokeWidth={2} />
            )}
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-30 bottom-full mb-2 w-56 overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] animate-[dropdownIn_0.15s_ease-out]">
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

// SCHEDULE COMPONENT
export default function Schedule() {
  // ---------------- STATE ----------------
  const [category, setCategory] = useState("Normal");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [cie, setCie] = useState("");
  const [batch, setBatch] = useState("");
  // Holds the selected test's display label (questionCode); the matching
  // questionSetId is looked up from TEST_CODE_OPTIONS at submit time.
  const [questionCode, setquestionCode] = useState("");

  // Department & Section (multi-select combo picker)
  const [selectedCombos, setSelectedCombos] = useState([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  // Admission Numbers (multi-select) — now shown for BOTH Normal and Retest
  const [selectedAdmissionNos, setSelectedAdmissionNos] = useState([]);
  const [isAdmissionPickerOpen, setIsAdmissionPickerOpen] = useState(false);
  const admissionPickerRef = useRef(null);
  const [admissionSearch, setAdmissionSearch] = useState("");

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

  // ---------------- REFERENCE DATA (batches, dept/section, tests)
  const [scheduleData, setScheduleData] = useState({
    batchDepartmentSections: [],
    tests: [],
  });
  const [isLoadingScheduleData, setIsLoadingScheduleData] = useState(true);
  const [scheduleDataError, setScheduleDataError] = useState("");
  const [questionCodeSpace, setQuestionCodeSpace] = useState(false);
  const questionCodeRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    let cancelled = false;

    async function fetchScheduleData() {
      setIsLoadingScheduleData(true);
      setScheduleDataError("");
      try {
        const res = await fetch(GET_SCHEDULE_DATA_ENDPOINT, {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const body = await res.json();
        console.log("GET SCHEDULE DATA STATUS:", res.status);
        console.log("GET SCHEDULE DATA RESPONSE:", body);
        console.log("TESTS FROM BACKEND:", body?.data?.tests);
        console.log(
          "BATCH DEPARTMENT SECTIONS:",
          body?.data?.batchDepartmentSections
        );

        if (!res.ok || !body.success) {
          throw new Error(body.message || `Request failed (${res.status})`);
        }
        if (!cancelled) {
          setScheduleData({
            batchDepartmentSections: body.data.batchDepartmentSections || [],
            tests: body.data.tests || [],
          });
        }
      } catch (err) {
        if (!cancelled) {
          setScheduleDataError(
            err.message || "Failed to load batches/departments/test codes.",
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

  const BATCH_OPTIONS = useMemo(
    () => [
      ...new Set(scheduleData.batchDepartmentSections.map((c) => c.batch)),
    ],
    [scheduleData.batchDepartmentSections],
  );

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

  // Gets the exact ordered array of usernames directly out of the matched sections
  const ADMISSION_NO_OPTIONS = useMemo(() => {
    if (!batch) return [];

    const selectedOptions = scheduleData.batchDepartmentSections.filter(
      (item) =>
        item.batch === batch &&
        selectedCombos.includes(`${item.department}__${item.section}`),
    );

    const admissionNumbers = selectedOptions.flatMap((item) =>
      (item.students || []).map((s) => (typeof s === "object" ? s.username : s)),
    );

    return [...new Set(admissionNumbers)];
  }, [scheduleData.batchDepartmentSections, batch, selectedCombos]);

  // Lookup map to quickly get name and gender based on a username
  const ADMISSION_DETAILS = useMemo(() => {
    const map = new Map();
    scheduleData.batchDepartmentSections.forEach((item) => {
      (item.students || []).forEach((s) => {
        if (typeof s === "object" && s !== null) {
          map.set(s.username, s);
        }
      });
    });
    return map;
  }, [scheduleData.batchDepartmentSections]);

  // Filter admission options based on search text (searches both number and name)
  const filteredAdmissionOptions = useMemo(() => {
    if (!admissionSearch.trim()) return ADMISSION_NO_OPTIONS;

    const lowerSearch = admissionSearch.toLowerCase();
    return ADMISSION_NO_OPTIONS.filter((no) => {
      const details = ADMISSION_DETAILS.get(no);
      const searchString = details
        ? `${no} ${details.name}`.toLowerCase()
        : no.toLowerCase();
      return searchString.includes(lowerSearch);
    });
  }, [ADMISSION_NO_OPTIONS, ADMISSION_DETAILS, admissionSearch]);

  const TEST_CODE_OPTIONS = useMemo(
    () =>
      [...scheduleData.tests].sort((a, b) =>
        b.questionSetId.localeCompare(a.questionSetId)
      ),
    [scheduleData.tests]
  );
  const TEST_CODE_LABELS = useMemo(
    () => TEST_CODE_OPTIONS.map((t) => t.questionCode),
    [TEST_CODE_OPTIONS]
  );
  const draftsRef = useRef({ Normal: null, Retest: null, University: null });

  const captureCurrentFields = () => ({
    academicYear,
    semester,
    cie,
    batch,
    questionCode,
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
    setquestionCode(d.questionCode || "");
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
    setAdmissionSearch("");
  };

  const resetFormFields = () => {
    applyFields(null);
    draftsRef.current[category] = null;
  };

  // ThemeDropdown hands back the picked value directly (not an event).
  const handleCategoryChange = (nextCategory) => {
    // Save whatever is currently on screen under the category we're leaving
    draftsRef.current[category] = captureCurrentFields();
    // Restore whatever was previously saved for the category we're entering
    applyFields(draftsRef.current[nextCategory]);
    setCategory(nextCategory);
  };

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
  // Question Code dropdown - control main page extra space
  useEffect(() => {
    const handleQuestionCodeClick = (event) => {
      if (!questionCodeRef.current) return;

      if (questionCodeRef.current.contains(event.target)) {
        setQuestionCodeSpace(true);
      } else {
        setQuestionCodeSpace(false);
      }
    };

    document.addEventListener("mousedown", handleQuestionCodeClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleQuestionCodeClick
      );
    };
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
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleToggleAllCombos = () => {
    setSelectedCombos(
      isAllCombosSelected ? [] : DEPT_SECTION_OPTIONS.map((o) => o.key),
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
      prev.includes(no) ? prev.filter((n) => n !== no) : [...prev, no],
    );
  };

  const handleToggleAllAdmission = () => {
    setSelectedAdmissionNos(
      isAllAdmissionSelected ? [] : [...ADMISSION_NO_OPTIONS],
    );
  };

  const handleRemoveAdmission = (no) => {
    setSelectedAdmissionNos((prev) => prev.filter((n) => n !== no));
  };

  // Clears everything, and doubles as "undo" for the whole selection
  const handleClearAllAdmission = () => setSelectedAdmissionNos([]);

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

  // Converts 12-hour hour/minute/period into 24-hour {h, m}.
  const to24Hour = (hour, minute, period) => {
    let h = parseInt(hour, 10) % 12;
    if (period === "PM") h += 12;
    return { h, m: parseInt(minute, 10) };
  };

  const buildIsoDateTime = (dateStr, hour, minute, period) => {
    if (!dateStr || !hour || !minute) return null;
    const { h, m } = to24Hour(hour, minute, period);
    const pad2 = (n) => String(n).padStart(2, "0");
    return `${dateStr}T${pad2(h)}:${pad2(m)}:00`;
  };

  const toMinutesSinceMidnight = (hour, minute, period) => {
    const { h, m } = to24Hour(hour, minute, period);
    return h * 60 + m;
  };

  const validateForm = () => {
    const problems = [];

    if (!academicYear) problems.push("Academic Year is required");
    if (!semester) problems.push("Semester is required");
    if (category === "Normal" && !cie)
      problems.push("CIE (I, II, or III) is required for Normal category");
    if (!batch) problems.push("Batch is required");
    if (selectedCombos.length === 0)
      problems.push("Select at least one Department & Section");
    if (!questionCode) problems.push("Test Code is required");
    if (!date) problems.push("Date is required");

    const hasStartTime = startHour && startMinute && startPeriod;
    const hasEndTime = endHour && endMinute && endPeriod;
    if (!hasStartTime) problems.push("Start Time is required");
    if (!hasEndTime) problems.push("End Time is required");

    if (hasStartTime && hasEndTime) {
      const startMinutes = toMinutesSinceMidnight(
        startHour,
        startMinute,
        startPeriod,
      );
      const endMinutes = toMinutesSinceMidnight(endHour, endMinute, endPeriod);
      if (endMinutes <= startMinutes) {
        problems.push("End Time must be after Start Time");
      }
    }

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

    const selectedTest = TEST_CODE_OPTIONS.find(
      (t) => t.questionCode === questionCode,
    );
    const questionSetId = selectedTest?.questionSetId;

    if (!questionSetId) {
      setStatusMessage("");
      setErrorMessage("Test Code is required");
      return;
    }

    const startTime = buildIsoDateTime(
      date,
      startHour,
      startMinute,
      startPeriod,
    );
    const endTime = buildIsoDateTime(date, endHour, endMinute, endPeriod);
    const duration =
      toMinutesSinceMidnight(endHour, endMinute, endPeriod) -
      toMinutesSinceMidnight(startHour, startMinute, startPeriod);
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
          category: category.toLowerCase(),
          questionSetId,
          department: combo.dept,
          batch,
          academicYear,
          semester: semester.toLowerCase(),
          section: combo.section,
          admissionNo: selectedAdmissionNos,
          duration,
          startTime,
          endTime,
        };

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
      }),
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
      toast.success(
        `${verb} for ${successCount} section${successCount > 1 ? "s" : ""}.`
      );
      resetFormFields();
    } else if (successCount > 0) {
      toast.success(
        `${successCount} section${successCount > 1 ? "s" : ""} scheduled successfully.`
      );
      setErrorMessage(
        failures.map((f) => f.reason?.message || "Unknown error").join(" • "),
      );
    } else {
      setErrorMessage(
        failures.map((f) => f.reason?.message || "Unknown error").join(" • "),
      );
    }

  };

  // ---------------- RENDER ----------------
  return (
    <div
      className={`relative min-h-screen w-full bg-white px-4 pt-10 md:px-10 ${questionCodeSpace ? "pb-96" : "pb-10"
        }`}
    >      <div className="relative mx-auto max-w-3xl">
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
            <ThemeDropdown
              icon={BadgeCheck}
              value={category}
              options={CATEGORY_OPTIONS}
              onChange={handleCategoryChange}
              placeholder="Select Category"
            />
          </div>

          <div className={cardClasses + " md:p-6"}>
            <h2
              className="mb-5 text-center text-lg font-bold"
              style={{ color: colors.accent }}
            >
              Schedule Details
            </h2>

            <div className="flex flex-col gap-5">
              {/* Academic Year & Semester */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClasses}>Academic Year</label>
                  <ThemeDropdown
                    icon={CalendarRange}
                    value={academicYear}
                    options={ACADEMIC_YEAR_OPTIONS}
                    onChange={setAcademicYear}
                    placeholder="Select Academic Year"
                  />
                </div>

                <div>
                  <label className={labelClasses}>Semester</label>
                  <ThemeDropdown
                    icon={Layers}
                    value={semester}
                    options={SEMESTER_OPTIONS}
                    onChange={setSemester}
                    placeholder="Select Semester"
                  />
                </div>
              </div>

              {/* Batch */}
              <div>
                <label className={labelClasses}>Batch</label>
                <ThemeDropdown
                  icon={GraduationCap}
                  value={batch}
                  options={BATCH_OPTIONS}
                  onChange={setBatch}
                  placeholder="Select Batch"
                  loading={isLoadingScheduleData}
                />
              </div>

              {/* CIE (Normal only) */}
              {category === "Normal" && (
                <div>
                  <label className={labelClasses}>CIE</label>
                  <ThemeDropdown
                    icon={BadgeCheck}
                    value={cie}
                    options={CIE_OPTIONS}
                    onChange={setCie}
                    placeholder="Select CIE"
                  />
                </div>
              )}

              {/* Department & Section */}
              <div ref={pickerRef} className="relative">
                <label className={labelClasses}>Department &amp; Section</label>
                <button
                  type="button"
                  disabled={isLoadingScheduleData}
                  onClick={() => setIsPickerOpen((prev) => !prev)}
                  className={dropdownTriggerClasses(isPickerOpen, isLoadingScheduleData)}
                >
                  <Building2 size={18} strokeWidth={2} className={dropdownIconClasses(isPickerOpen)} />
                  <span
                    className={`flex-1 truncate text-[15px] font-medium ${selectedCombos.length ? "text-black" : "text-black/45"
                      }`}
                  >
                    {selectedCombos.length
                      ? `${selectedCombos.length} Selected`
                      : "Select department & section"}
                  </span>
                  <span className={dropdownArrowClasses(isPickerOpen)}>
                    {isPickerOpen ? (
                      <ChevronUp size={18} strokeWidth={2} />
                    ) : (
                      <ChevronDown size={18} strokeWidth={2} />
                    )}
                  </span>
                </button>

                {isPickerOpen && (
                  <div className={dropdownPanelClasses}>
                    <label className={dropdownAllRowClasses}>
                      <input
                        type="checkbox"
                        checked={isAllCombosSelected}
                        onChange={handleToggleAllCombos}
                        className="h-4 w-4 rounded border-gray-300 accent-[#800000]"
                      />
                      All
                    </label>
                    <div className="max-h-60 overflow-y-auto">
                      {DEPT_SECTION_OPTIONS.map((option) => (
                        <label
                          key={option.key}
                          className={dropdownOptionRowClasses(selectedCombos.includes(option.key))}
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

              {/* Admission Number */}
              <div ref={admissionPickerRef} className="relative">
                <label className={labelClasses}>Admission Number</label>
                <button
                  type="button"
                  onClick={() => setIsAdmissionPickerOpen((prev) => !prev)}
                  className={dropdownTriggerClasses(
                    isAdmissionPickerOpen,
                    false,
                  )}
                >
                  <BadgeCheck
                    size={18}
                    strokeWidth={2}
                    className={dropdownIconClasses(isAdmissionPickerOpen)}
                  />
                  <span
                    className={`flex-1 truncate text-[15px] font-medium ${
                      selectedAdmissionNos.length
                        ? "text-black"
                        : "text-black/45"
                    }`}
                  >
                    {selectedAdmissionNos.length
                      ? `${selectedAdmissionNos.length} Selected`
                      : "Select admission number(s)"}
                  </span>
                  <span className={dropdownArrowClasses(isAdmissionPickerOpen)}>
                    {isAdmissionPickerOpen ? (
                      <ChevronUp size={18} strokeWidth={2} />
                    ) : (
                      <ChevronDown size={18} strokeWidth={2} />
                    )}
                  </span>
                </button>

                {isAdmissionPickerOpen && (
                  <div className={dropdownPanelClasses + " p-0"}>
                    {/* Range picker: select from-number to-number */}
                    <div className="border-b border-black/5 bg-[#FAFAFA] p-3">
                      <p className="mb-2 text-xs font-semibold text-[#000000]">
                        Select Range
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <SearchableSelect
                            value={rangeFrom}
                            options={ADMISSION_NO_OPTIONS}
                            detailsMap={ADMISSION_DETAILS}
                            onChange={setRangeFrom}
                            placeholder="From"
                          />
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-[#9CA3AF]">
                          to
                        </span>
                        <div className="flex-1 min-w-0">
                          <SearchableSelect
                            value={rangeTo}
                            options={ADMISSION_NO_OPTIONS}
                            detailsMap={ADMISSION_DETAILS}
                            onChange={setRangeTo}
                            placeholder="To"
                          />
                        </div>
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

                    {/* Search Bar for Main Checkbox List */}
                    <div className="p-2 border-b border-black/5 bg-white sticky top-0 z-10">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by name or number..."
                          value={admissionSearch}
                          onChange={(e) => setAdmissionSearch(e.target.value)}
                          className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000]"
                        />
                        {admissionSearch && (
                          <button
                            type="button"
                            onClick={() => setAdmissionSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto p-1.5 relative">
                      {!admissionSearch && (
                        <label className={dropdownAllRowClasses}>
                          <input
                            type="checkbox"
                            checked={isAllAdmissionSelected}
                            onChange={handleToggleAllAdmission}
                            className="h-4 w-4 rounded border-gray-300 accent-[#800000]"
                          />
                          All
                        </label>
                      )}

                      {filteredAdmissionOptions.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No students found matching "{admissionSearch}"
                        </div>
                      ) : (
                        filteredAdmissionOptions.map((no) => {
                          const details = ADMISSION_DETAILS.get(no);
                          const label = details
                            ? `${no} - ${details.name} (${details.gender})`
                            : no;

                          return (
                            <label
                              key={no}
                              className={dropdownOptionRowClasses(
                                selectedAdmissionNos.includes(no),
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={selectedAdmissionNos.includes(no)}
                                onChange={() => handleAdmissionToggle(no)}
                                className="h-4 w-4 rounded border-gray-300 accent-[#800000]"
                              />
                              {label}
                            </label>
                          );
                        })
                      )}
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
                      {selectedAdmissionNos.map((no) => {
                        const details = ADMISSION_DETAILS.get(no);
                        const label = details ? `${no} - ${details.name}` : no;

                        return (
                          <div
                            key={no}
                            className="flex items-center justify-between rounded-md bg-white px-3 py-1.5 text-xs text-[#000000] shadow-sm"
                          >
                            <span className="flex items-center gap-2">
                              <BadgeCheck className="h-3.5 w-3.5 text-[#800000]" />
                              {label}
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
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Test Code */}
              <div ref={questionCodeRef} className="relative">
                <label className={labelClasses}>Question Code</label>
                <ThemeDropdown
                  icon={BookOpenCheck}
                  value={questionCode}
                  options={TEST_CODE_LABELS}
                  onChange={setquestionCode}
                  placeholder="Select Test Code"
                  loading={isLoadingScheduleData}
                />
              </div>

              {/* Date / Start Time / End Time */}
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
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FDCC03] px-6 py-3.5 text-sm font-bold text-[#000000] transition-colors duration-200 hover:bg-[#800000] hover:text-white active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
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
                  Couldn't load batches/departments/test codes:{" "}
                  {scheduleDataError}
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
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
      />

    </div>
  );
}