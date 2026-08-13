import React, { useState, useRef, useEffect } from "react";
import {
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
} from "lucide-react";

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
// DUMMY BACKEND DATA
// -----------------------------------------------------
const CATEGORY_OPTIONS = ["Normal", "Retest"];

const BATCH_OPTIONS = ["2023-2027", "2024-2028", "2025-2029"];

const DEPARTMENT_OPTIONS = ["AI & DS", "CSE", "IT", "ECE", "EEE"];

const SECTION_MAP = {
  "AI & DS": ["A", "B"],
  CSE: ["A", "B", "C"],
  IT: ["A"],
  ECE: ["A", "B"],
  EEE: ["A"],
};

const TEST_CODE_OPTIONS = ["ENG001", "ENG002", "ENG003", "ENG004"];

const ADMISSION_NO_OPTIONS = [
  "113224072054",
  "113224072087",
  "113224072060",
  "113224072005",
];

// Flat list of every Department + Section combination — built from
// whatever DEPARTMENT_OPTIONS / SECTION_MAP contain, so it keeps working
// no matter how many departments/sections a real backend sends.
const DEPT_SECTION_OPTIONS = DEPARTMENT_OPTIONS.flatMap((dept) => {
  const sections = SECTION_MAP[dept] || [];
  if (sections.length === 0) {
    return [{ key: dept, dept, section: null, label: dept }];
  }
  return sections.map((sec) => ({
    key: `${dept}__${sec}`,
    dept,
    section: sec,
    label: `${dept} - Section ${sec}`,
  }));
});

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
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] transition-transform ${
            isOpen ? "rotate-180" : ""
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
  const [batch, setBatch] = useState("");
  const [testCode, setTestCode] = useState("");

  // Department & Section (multi-select combo picker)
  const [selectedCombos, setSelectedCombos] = useState([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  // Admission Numbers (multi-select, only relevant when category = Retest,
  // but lives in the SAME form as everything else)
  const [selectedAdmissionNos, setSelectedAdmissionNos] = useState([]);
  const [isAdmissionPickerOpen, setIsAdmissionPickerOpen] = useState(false);
  const admissionPickerRef = useRef(null);

  const [date, setDate] = useState("");

  // 12-hour Start / End time
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");
  const [endPeriod, setEndPeriod] = useState("AM");

  const [statusMessage, setStatusMessage] = useState("");

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

  // ---------------- SUBMIT ----------------
  const buildTimeString = (hour, minute, period) =>
    hour && minute && period ? `${hour}:${minute} ${period}` : "";

  const handleSubmit = (e) => {
    e.preventDefault();

    const departmentPayload = selectedCombos.map((key) => {
      const option = DEPT_SECTION_OPTIONS.find((o) => o.key === key);
      return { department: option?.dept, section: option?.section };
    });

    const payload = {
      category,
      batch,
      departments: departmentPayload,
      testCode,
      date,
      startTime: buildTimeString(startHour, startMinute, startPeriod),
      endTime: buildTimeString(endHour, endMinute, endPeriod),
      ...(category === "Retest" && { admissionNumbers: selectedAdmissionNos }),
    };

    console.log(payload);
    setStatusMessage(
      category === "Normal" ? "Dummy Schedule Created" : "Dummy Retest Assigned"
    );
  };

  // ---------------- RENDER ----------------
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#EEF0F2] px-4 py-10 md:px-10">
      {/* ---------------- PAGE CONTENT ---------------- */}
      <div className="relative mx-auto max-w-3xl">
        {/* ---------------- HEADER (SAME FOR BOTH CATEGORIES) ---------------- */}
        <div className="mb-8 flex items-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#FDCC03]/40 bg-[#800000] shadow-md shadow-[#800000]/20">
            <GraduationCap className="h-7 w-7 text-[#FDCC03]" strokeWidth={2} />
            <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#FDCC03] shadow-sm">
              <ShieldCheck className="h-3 w-3 text-[#800000]" strokeWidth={3} />
            </span>
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
                onChange={(e) => setCategory(e.target.value)}
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

          {/* Main card — same fields always; Retest only ADDS Admission Number */}
          <div className={cardClasses + " md:p-6"}>
            <h2
              className="mb-5 text-center text-lg font-bold"
              style={{ color: colors.accent }}
            >
              Schedule Details
            </h2>

            <div className="flex flex-col gap-5">
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
                    className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] transition-transform ${
                      isPickerOpen ? "rotate-180" : ""
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

              {/* Admission Number — added into the SAME form only for Retest */}
              {category === "Retest" && (
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
                      className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] transition-transform ${
                        isAdmissionPickerOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {isAdmissionPickerOpen && (
                    <div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
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
              )}

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
                    {TEST_CODE_OPTIONS.map((code) => (
                      <option key={code} value={code}>
                        {code}
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
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FDCC03] px-6 py-3.5 text-sm font-bold text-[#000000] shadow-md shadow-[#FDCC03]/30 transition-colors duration-200 hover:bg-[#800000] hover:text-white active:scale-[0.99]"
            >
              <CheckCircle2 className="h-5 w-5" />
              {category === "Normal" ? "Confirm Schedule" : "Assign Retest"}
            </button>

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