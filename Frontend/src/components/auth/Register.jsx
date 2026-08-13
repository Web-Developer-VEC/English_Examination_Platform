import React, { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./StudentRegistration.css";

// Centralize API base so it's easy to swap between environments

const INITIAL_FORM = {
  name: "",
  register_no: "",
  admission_no: "",
  email: "",
  phone: "",
  batch: "",
  year: "",
  department: "",
  section: "",
  dob: "",
  username: "",
  password: "",
};

export default function StudentRegistration() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ============================================================
   TEMPORARY DUMMY DATA
   ------------------------------------------------------------
   NOTE:
   These values are temporary.
   Later they will be fetched from the backend using axios.
============================================================ */

  const departmentOptions = [
    { id: 1, name: "Computer Science and Engineering" },
    { id: 2, name: "Artificial Intelligence & Data Science" },
    { id: 3, name: "Information Technology" },
    { id: 4, name: "Electronics & Communication Engineering" },
    { id: 5, name: "Electrical & Electronics Engineering" },
    { id: 6, name: "Mechanical Engineering" },
    { id: 7, name: "Automobile Engineering" },
    { id: 8, name: "Cyber Security" },
  ];

  const yearOptions = [
    { id: 1, value: "I Year" },
    { id: 2, value: "II Year" },
    { id: 3, value: "III Year" },
    { id: 4, value: "IV Year" },
  ];

  const sectionOptions = [
    { id: 1, value: "A" },
    { id: 2, value: "B" },
    { id: 3, value: "C" },
    { id: 4, value: "D" },
  ];

  const batchOptions = [
    { id: 1, value: "2023 - 2027" },
    { id: 2, value: "2024 - 2028" },
    { id: 3, value: "2025 - 2029" },
  ];

  // ---- Field-level validators ----
  const validators = {
    name: (v) => (!v.trim() ? "Name is required." : ""),
    register_no: (v) => {
      if (!v.trim()) return "Register number is required.";
      if (!/^[a-zA-Z0-9]+$/.test(v))
        return "Register number must be alphanumeric only.";
      return "";
    },
    admission_no: (v) => (!v.trim() ? "Admission number is required." : ""),
    email: (v) => {
      if (!v.trim()) return "Email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
        return "Enter a valid email address.";
      return "";
    },
    phone: (v) => {
      if (!v.trim()) return "Phone number is required.";
      if (!/^\d{10}$/.test(v)) return "Phone number must be exactly 10 digits.";
      return "";
    },
    batch: (v) => (!v ? "Batch is required." : ""),
    year: (v) => (!v ? "Year is required." : ""),
    department: (v) => (!v ? "Department is required." : ""),
    section: (v) => (!v ? "Section is required." : ""),
    dob: (v) => (!v ? "Date of birth is required." : ""),
    username: (v) => (!v.trim() ? "Username is required." : ""),
    password: (v) => {
      if (!v) return "Password is required.";
      if (v.length < 8) return "Password must be at least 8 characters.";
      return "";
    },
  };

  const validateField = useCallback((field, value) => {
    const validator = validators[field];
    return validator ? validator(value) : "";
  }, []);

  const validateAll = () => {
    const newErrors = {};
    Object.keys(form).forEach((field) => {
      const message = validateField(field, form[field]);
      if (message) newErrors[field] = message;
    });
    setErrors(newErrors);
    return newErrors;
  };

  // ---- Handlers ----
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateAll();
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      toast.success("Registration successful!");
      handleReset();
    } catch (err) {
      const message =
        err.response?.data?.message || "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (field) =>
    `form-input${errors[field] ? " form-input--error" : ""}`;

  return (
    <div className="registration-page">
      <div className="registration-container">
        <h1 className="registration-title">Student Registration</h1>

        <div className="registration-card">
          <form onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="form-group">
              <label htmlFor="name">Name (Initial at Last)</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldClass("name")}
                placeholder="e.g. Itachi Uchiha F"
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            {/* Register Number */}
            <div className="form-group">
              <label htmlFor="register_no">Register Number</label>
              <input
                id="register_no"
                name="register_no"
                type="text"
                value={form.register_no}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldClass("register_no")}
                placeholder="e.g. 24VEC-60"
              />
              {errors.register_no && (
                <span className="error-text">{errors.register_no}</span>
              )}
            </div>

            {/* Admission Number */}
            <div className="form-group">
              <label htmlFor="admission_no">Admission Number</label>
              <input
                id="admission_no"
                name="admission_no"
                type="text"
                value={form.admission_no}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldClass("admission_no")}
                placeholder="Enter admission number"
              />
              {errors.admission_no && (
                <span className="error-text">{errors.admission_no}</span>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldClass("email")}
                placeholder="name@example.com"
              />
              {errors.email && (
                <span className="error-text">{errors.email}</span>
              )}
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="number"
                value={form.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldClass("phone")}
                placeholder="10-digit mobile number"
              />
              {errors.phone && (
                <span className="error-text">{errors.phone}</span>
              )}
            </div>

            {/* Batch */}
            <div className="form-group">
              <label htmlFor="batch">Batch</label>
              <select
                id="batch"
                name="batch"
                value={form.batch}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldClass("batch")}
              >
                <option value="">Select batch</option>
                {batchOptions.map((batch) => (
                  <option key={batch.id} value={batch.value}>
                    {batch.value}
                  </option>
                ))}
              </select>
              {errors.batch && (
                <span className="error-text">{errors.batch}</span>
              )}
            </div>

            {/* Year */}
            <div className="form-group">
              <label htmlFor="year">Year</label>
              <select
                id="year"
                name="year"
                value={form.year}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldClass("year")}
              >
                <option value="">Select year</option>
                {yearOptions.map((year) => (
                  <option key={year.id} value={year.value}>
                    {year.value}
                  </option>
                ))}
              </select>
              {errors.year && <span className="error-text">{errors.year}</span>}
            </div>

            {/* Department */}
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <select
                id="department"
                name="department"
                value={form.department}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldClass("department")}
              >
                <option value="">Select department</option>
                {departmentOptions.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.department && (
                <span className="error-text">{errors.department}</span>
              )}
            </div>

            {/* Section */}
            <div className="form-group">
              <label htmlFor="section">Section</label>
              <select
                id="section"
                name="section"
                value={form.section}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldClass("section")}
              >
                <option value="">Select section</option>
                {sectionOptions.map((section) => (
                  <option key={section.id} value={section.value}>
                    {section.value}
                  </option>
                ))}
              </select>
              {errors.section && (
                <span className="error-text">{errors.section}</span>
              )}
            </div>

            {/* Date of Birth */}
            <div className="form-group">
              <label htmlFor="dob">Date of Birth</label>
              <input
                id="dob"
                name="dob"
                type="date"
                value={form.dob}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldClass("dob")}
              />
              {errors.dob && <span className="error-text">{errors.dob}</span>}
            </div>

            {/* Username */}
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldClass("username")}
                placeholder="Choose a username"
              />
              {errors.username && (
                <span className="error-text">{errors.username}</span>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={fieldClass("password")}
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>

            {/* Buttons */}
            <div className="button-row">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="spin" size={16} /> Registering...
                  </>
                ) : (
                  "Register"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}