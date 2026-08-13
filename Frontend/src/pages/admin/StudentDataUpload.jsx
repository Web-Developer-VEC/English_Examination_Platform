import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  UserRound,
  CloudUpload,
  Info,
  CheckCircle2,
  X,
  ShieldCheck,
  FileSpreadsheet,
  Database,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  GraduationCap,
  Building2,
  Filter,
  Eye,
  Upload,
  Table2,
  AlertCircle,
} from "lucide-react";

import "./StudentDataUpload.css";

const StudentDataUpload = () => {
  const fileInputRef = useRef(null);

  /* =========================================================
     API CONFIGURATION
     ========================================================= */

  const API_BASE_URL = "http://localhost:5000/api";

  const UPLOAD_URL = `${API_BASE_URL}/students/upload`;

  /*
    Future backend endpoint:

    GET /api/students?batch=2025&department=AI%20%26%20DS

    Expected response:

    {
      "success": true,
      "students": [
        {
          "registerNo": "23AD001",
          "name": "Arun Kumar",
          "batch": "2025",
          "department": "AI & DS",
          "section": "A",
          "email": "arun@gmail.com",
          "phone": "9876543210"
        }
      ]
    }
  */

  const EXISTING_DATA_URL = `${API_BASE_URL}/students`;

  /* =========================================================
     UPLOAD STATE
     ========================================================= */

  const [activeMode, setActiveMode] = useState("upload");

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [showInstructions, setShowInstructions] = useState(false);

  /* =========================================================
     EXISTING DATA STATE
     ========================================================= */

  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const [students, setStudents] = useState([]);

  const [loadingStudents, setLoadingStudents] = useState(false);

  const [existingMessage, setExistingMessage] = useState("");
  const [existingMessageType, setExistingMessageType] = useState("");

  const [studentSearch, setStudentSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const STUDENTS_PER_PAGE = 8;

  /* =========================================================
     FILTER OPTIONS
     ========================================================= */

  const batchOptions = [
    "2023",
    "2024",
    "2025",
    "2026",
  ];

  const departmentOptions = [
    "AI & DS",
    "CSE",
    "ECE",
    "EEE",
    "MECH",
    "CIVIL",
    "IT",
  ];

  /* =========================================================
     DEMO DATA
     =========================================================
     This is ONLY for frontend development.

     Later remove this and use the backend response.
  */

  const demoStudents = [
    {
      id: 1,
      registerNo: "23AD001",
      name: "Arun Kumar",
      batch: "2025",
      department: "AI & DS",
      section: "A",
      email: "arun.kumar@gmail.com",
      phone: "9876543210",
    },
    {
      id: 2,
      registerNo: "23AD002",
      name: "Barath Raj",
      batch: "2025",
      department: "AI & DS",
      section: "A",
      email: "barath.raj@gmail.com",
      phone: "9876543211",
    },
    {
      id: 3,
      registerNo: "23AD003",
      name: "Dharshan S",
      batch: "2025",
      department: "AI & DS",
      section: "A",
      email: "dharshan@gmail.com",
      phone: "9876543212",
    },
    {
      id: 4,
      registerNo: "23AD004",
      name: "Gokul M",
      batch: "2025",
      department: "AI & DS",
      section: "A",
      email: "gokul@gmail.com",
      phone: "9876543213",
    },
    {
      id: 5,
      registerNo: "23AD005",
      name: "Harish Kumar",
      batch: "2025",
      department: "AI & DS",
      section: "A",
      email: "harish@gmail.com",
      phone: "9876543214",
    },
    {
      id: 6,
      registerNo: "23AD006",
      name: "Karthik S",
      batch: "2025",
      department: "AI & DS",
      section: "B",
      email: "karthik@gmail.com",
      phone: "9876543215",
    },
    {
      id: 7,
      registerNo: "23AD007",
      name: "Lokesh P",
      batch: "2025",
      department: "AI & DS",
      section: "B",
      email: "lokesh@gmail.com",
      phone: "9876543216",
    },
    {
      id: 8,
      registerNo: "23AD008",
      name: "Manoj R",
      batch: "2025",
      department: "AI & DS",
      section: "B",
      email: "manoj@gmail.com",
      phone: "9876543217",
    },
    {
      id: 9,
      registerNo: "23AD009",
      name: "Naveen Kumar",
      batch: "2025",
      department: "AI & DS",
      section: "B",
      email: "naveen@gmail.com",
      phone: "9876543218",
    },
    {
      id: 10,
      registerNo: "23AD010",
      name: "Praveen S",
      batch: "2025",
      department: "AI & DS",
      section: "B",
      email: "praveen@gmail.com",
      phone: "9876543219",
    },
    {
      id: 11,
      registerNo: "23CS001",
      name: "Ajay Kumar",
      batch: "2025",
      department: "CSE",
      section: "A",
      email: "ajay@gmail.com",
      phone: "9876543220",
    },
    {
      id: 12,
      registerNo: "23CS002",
      name: "Rahul S",
      batch: "2025",
      department: "CSE",
      section: "A",
      email: "rahul@gmail.com",
      phone: "9876543221",
    },
    {
      id: 13,
      registerNo: "24AD001",
      name: "Vignesh R",
      batch: "2026",
      department: "AI & DS",
      section: "A",
      email: "vignesh@gmail.com",
      phone: "9876543222",
    },
  ];

  /* =========================================================
     COMMON MESSAGE
     ========================================================= */

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
  };

  const showExistingMessage = (text, type) => {
    setExistingMessage(text);
    setExistingMessageType(type);
  };

  /* =========================================================
     FILE VALIDATION
     ========================================================= */

  const allowedExtensions = [".xlsx", ".xls"];

  const isExcelFile = (file) => {
    if (!file) return false;

    const fileName = file.name.toLowerCase();

    return allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    );
  };

  const validateFile = (file) => {
    if (!file) {
      showMessage("Please select an Excel file.", "error");
      return false;
    }

    if (!isExcelFile(file)) {
      showMessage(
        "Only Excel files (.xlsx or .xls) are allowed.",
        "error"
      );
      return false;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      showMessage("File size must be less than 10 MB.", "error");
      return false;
    }

    return true;
  };

  /* =========================================================
     FILE HANDLING
     ========================================================= */

  const handleFileSelect = (file) => {
    setMessage("");

    if (!validateFile(file)) {
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setSelectedFile(file);
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      handleFileSelect(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleFileSelect(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";

    const kb = bytes / 1024;

    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    return `${(kb / 1024).toFixed(2)} MB`;
  };

  /* =========================================================
     UPLOAD STUDENT DATA
     ========================================================= */

  const handleUpload = async () => {
    if (!selectedFile) {
      showMessage("Please select an Excel file first.", "error");
      return;
    }

    if (!validateFile(selectedFile)) {
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("student_data", selectedFile);

      const response = await fetch(UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Student data upload failed."
        );
      }

      showMessage(
        data?.message ||
          "Student data uploaded successfully!",
        "success"
      );

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Student upload error:", error);

      showMessage(
        error.message ||
          "Something went wrong while uploading.",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  /* =========================================================
     FETCH EXISTING STUDENTS
     ========================================================= */

  const fetchExistingStudents = async () => {
    if (!selectedBatch || !selectedDepartment) {
      showExistingMessage(
        "Please select both batch and department.",
        "error"
      );
      return;
    }

    setLoadingStudents(true);
    setCurrentPage(1);
    setStudentSearch("");
    setExistingMessage("");

    try {
      /*
        ======================================================
        FUTURE BACKEND VERSION
        ======================================================

        const params = new URLSearchParams({
          batch: selectedBatch,
          department: selectedDepartment,
        });

        const response = await fetch(
          `${EXISTING_DATA_URL}?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Unable to load student data."
          );
        }

        setStudents(data.students || []);
      */

      /*
        ------------------------------------------------------
        TEMPORARY DEMO VERSION
        ------------------------------------------------------
        This simulates your backend response.
      */

      await new Promise((resolve) =>
        setTimeout(resolve, 600)
      );

      const filteredDemoData = demoStudents.filter(
        (student) =>
          student.batch === selectedBatch &&
          student.department === selectedDepartment
      );

      setStudents(filteredDemoData);

      if (filteredDemoData.length === 0) {
        showExistingMessage(
          "No students found for the selected batch and department.",
          "error"
        );
      } else {
        showExistingMessage(
          `${filteredDemoData.length} student(s) loaded successfully.`,
          "success"
        );
      }
    } catch (error) {
      console.error("Fetch students error:", error);

      setStudents([]);

      showExistingMessage(
        error.message ||
          "Unable to load existing student data.",
        "error"
      );
    } finally {
      setLoadingStudents(false);
    }
  };

  /* =========================================================
     SEARCH
     ========================================================= */

  const filteredStudents = useMemo(() => {
    const search = studentSearch.trim().toLowerCase();

    if (!search) {
      return students;
    }

    return students.filter((student) =>
      [
        student.registerNo,
        student.name,
        student.email,
        student.phone,
        student.section,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(search)
        )
    );
  }, [students, studentSearch]);

  /* =========================================================
     PAGINATION
     ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredStudents.length / STUDENTS_PER_PAGE
    )
  );

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * STUDENTS_PER_PAGE,
    currentPage * STUDENTS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* =========================================================
     MODE SWITCH
     ========================================================= */

  const handleModeChange = (mode) => {
    setActiveMode(mode);

    setMessage("");
    setExistingMessage("");

    if (mode === "existing") {
      setSelectedFile(null);
    }
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="student-upload-page">

      <div className="student-upload-container">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="student-upload-header">

          <div className="header-icon">
            <UserRound
              size={29}
              strokeWidth={2.2}
            />
          </div>

          <div className="student-upload-title">

            <h1>Student Data Management</h1>

            <p>
              Upload new student records or view existing
              student information
            </p>

          </div>

        </div>

        {/* =====================================================
            MODE SWITCH
        ===================================================== */}

        <div className="student-mode-switch">

          <button
            type="button"
            className={`mode-button ${
              activeMode === "upload"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleModeChange("upload")
            }
          >
            <Upload size={17} />

            <span>Upload New Data</span>
          </button>

          <button
            type="button"
            className={`mode-button ${
              activeMode === "existing"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleModeChange("existing")
            }
          >
            <Database size={17} />

            <span>Existing Data</span>
          </button>

        </div>

        {/* =====================================================
            UPLOAD MODE
        ===================================================== */}

        {activeMode === "upload" && (
          <div className="student-upload-card">

            <button
              type="button"
              className="instruction-button"
              onClick={() =>
                setShowInstructions(true)
              }
              title="Upload instructions"
              aria-label="Upload instructions"
            >
              <Info
                size={19}
                strokeWidth={2.5}
              />
            </button>

            <div
              className={`student-drop-zone ${
                isDragging ? "dragging" : ""
              } ${
                selectedFile ? "has-file" : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
            >

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleInputChange}
                hidden
              />

              {!selectedFile ? (
                <>

                  <div className="upload-icon-wrapper">

                    <div className="upload-icon">

                      <CloudUpload
                        size={34}
                        strokeWidth={2}
                      />

                    </div>

                  </div>

                  <h2>
                    Upload Student Excel File
                  </h2>

                  <p className="drop-text">
                    Drag & drop your Excel file here
                  </p>

                  <span className="or-text">
                    OR
                  </span>

                  <button
                    type="button"
                    className="browse-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleBrowseClick();
                    }}
                  >
                    Browse File
                  </button>

                  <p className="supported-text">
                    Supported formats:{" "}
                    <strong>.xlsx</strong>{" "}
                    and{" "}
                    <strong>.xls</strong>
                  </p>

                  <p className="size-text">
                    Maximum file size: 10 MB
                  </p>

                </>
              ) : (

                <div
                  className="selected-file-wrapper"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >

                  <div className="excel-file-icon">

                    <FileSpreadsheet
                      size={27}
                      strokeWidth={2}
                    />

                  </div>

                  <div className="selected-file-info">

                    <h3>
                      {selectedFile.name}
                    </h3>

                    <p>
                      {formatFileSize(
                        selectedFile.size
                      )}
                    </p>

                    <div className="file-valid">

                      <CheckCircle2 size={15} />

                      Valid Excel file

                    </div>

                  </div>

                  <button
                    type="button"
                    className="remove-file-button"
                    onClick={removeFile}
                    title="Remove file"
                    aria-label="Remove selected file"
                  >
                    <X size={18} />
                  </button>

                </div>

              )}

            </div>

            {message && (
              <div
                className={`upload-message ${messageType}`}
              >

                <span className="message-icon">

                  {messageType === "success" ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Info size={16} />
                  )}

                </span>

                <span>{message}</span>

              </div>
            )}

            <button
              type="button"
              className={`upload-submit-button ${
                uploading ? "uploading" : ""
              }`}
              disabled={
                !selectedFile || uploading
              }
              onClick={handleUpload}
            >

              {uploading ? (
                <>
                  <span className="loading-spinner"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <CloudUpload size={19} />
                  Upload Student Data
                </>
              )}

            </button>

            <div className="upload-security-note">

              <ShieldCheck size={14} />

              <span>
                Your student data is securely uploaded
                to the server.
              </span>

            </div>

          </div>
        )}

        {/* =====================================================
            EXISTING DATA MODE
        ===================================================== */}

        {activeMode === "existing" && (
          <div className="existing-data-card">

            {/* HEADER */}

            <div className="existing-data-header">

              <div className="existing-heading">

                <div className="existing-icon">

                  <Database
                    size={22}
                    strokeWidth={2}
                  />

                </div>

                <div>

                  <h2>
                    Existing Student Data
                  </h2>

                  <p>
                    Select a batch and department
                    to view uploaded students
                  </p>

                </div>

              </div>

              <div className="record-badge">

                <Table2 size={15} />

                Student Records

              </div>

            </div>

            {/* FILTER AREA */}

            <div className="existing-filter-section">

              <div className="filter-heading">

                <Filter size={17} />

                <span>
                  Select Student Group
                </span>

              </div>

              <div className="filter-grid">

                {/* BATCH */}

                <div className="filter-field">

                  <label>
                    Batch
                  </label>

                  <div className="select-wrapper">

                    <GraduationCap
                      size={17}
                    />

                    <select
                      value={selectedBatch}
                      onChange={(event) => {
                        setSelectedBatch(
                          event.target.value
                        );
                        setStudents([]);
                        setExistingMessage("");
                      }}
                    >

                      <option value="">
                        Select Batch
                      </option>

                      {batchOptions.map(
                        (batch) => (
                          <option
                            key={batch}
                            value={batch}
                          >
                            {batch}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

                {/* DEPARTMENT */}

                <div className="filter-field">

                  <label>
                    Department
                  </label>

                  <div className="select-wrapper">

                    <Building2
                      size={17}
                    />

                    <select
                      value={
                        selectedDepartment
                      }
                      onChange={(event) => {
                        setSelectedDepartment(
                          event.target.value
                        );
                        setStudents([]);
                        setExistingMessage("");
                      }}
                    >

                      <option value="">
                        Select Department
                      </option>

                      {departmentOptions.map(
                        (department) => (
                          <option
                            key={department}
                            value={department}
                          >
                            {department}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

                {/* SEARCH BUTTON */}

                <button
                  type="button"
                  className="view-students-button"
                  onClick={
                    fetchExistingStudents
                  }
                  disabled={loadingStudents}
                >

                  {loadingStudents ? (
                    <>
                      <span className="button-spinner"></span>
                      Loading...
                    </>
                  ) : (
                    <>
                      <Eye size={18} />
                      View Students
                    </>
                  )}

                </button>

              </div>

            </div>

            {/* MESSAGE */}

            {existingMessage && (
              <div
                className={`existing-message ${existingMessageType}`}
              >

                {existingMessageType ===
                "success" ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <AlertCircle size={17} />
                )}

                <span>
                  {existingMessage}
                </span>

              </div>
            )}

            {/* RESULTS */}

            {students.length > 0 && (
              <div className="student-results-section">

                {/* RESULTS TOP */}

                <div className="results-toolbar">

                  <div className="results-title">

                    <div className="results-title-icon">
                      <Users size={18} />
                    </div>

                    <div>

                      <h3>
                        {selectedDepartment}
                        {" "}
                        Students
                      </h3>

                      <p>
                        Batch {selectedBatch}
                      </p>

                    </div>

                  </div>

                  <div className="results-actions">

                    <div className="student-count">

                      <Users size={15} />

                      {filteredStudents.length}
                      {" "}
                      Students

                    </div>

                    <button
                      type="button"
                      className="refresh-button"
                      onClick={
                        fetchExistingStudents
                      }
                      disabled={
                        loadingStudents
                      }
                      title="Refresh"
                    >

                      <RefreshCw
                        size={17}
                        className={
                          loadingStudents
                            ? "refresh-spin"
                            : ""
                        }
                      />

                    </button>

                  </div>

                </div>

                {/* SEARCH */}

                <div className="student-search-wrapper">

                  <Search size={17} />

                  <input
                    type="text"
                    placeholder="Search by register number, name, email, phone..."
                    value={studentSearch}
                    onChange={(event) => {
                      setStudentSearch(
                        event.target.value
                      );
                      setCurrentPage(1);
                    }}
                  />

                  {studentSearch && (
                    <button
                      type="button"
                      className="clear-search"
                      onClick={() => {
                        setStudentSearch("");
                        setCurrentPage(1);
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}

                </div>

                {/* TABLE */}

                <div className="student-table-container">

                  <table className="student-table">

                    <thead>

                      <tr>

                        <th>
                          #
                        </th>

                        <th>
                          Register No.
                        </th>

                        <th>
                          Student Name
                        </th>

                        <th>
                          Section
                        </th>

                        <th>
                          Email
                        </th>

                        <th>
                          Phone
                        </th>

                        <th>
                          Batch
                        </th>

                        <th>
                          Department
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {paginatedStudents.length >
                      0 ? (
                        paginatedStudents.map(
                          (student, index) => (
                            <tr
                              key={
                                student.id ||
                                student.registerNo ||
                                index
                              }
                            >

                              <td>
                                <span className="row-number">
                                  {(currentPage - 1) *
                                    STUDENTS_PER_PAGE +
                                    index +
                                    1}
                                </span>
                              </td>

                              <td>

                                <span className="register-number">
                                  {
                                    student.registerNo
                                  }
                                </span>

                              </td>

                              <td>

                                <div className="student-name-cell">

                                  <div className="student-avatar">

                                    {student.name
                                      ?.charAt(0)
                                      ?.toUpperCase() ||
                                      "S"}

                                  </div>

                                  <span>
                                    {student.name}
                                  </span>

                                </div>

                              </td>

                              <td>

                                <span className="section-badge">
                                  {
                                    student.section ||
                                    "-"
                                  }
                                </span>

                              </td>

                              <td>
                                <span className="email-text">
                                  {
                                    student.email ||
                                    "-"
                                  }
                                </span>
                              </td>

                              <td>
                                {
                                  student.phone ||
                                  "-"
                                }
                              </td>

                              <td>
                                {
                                  student.batch ||
                                  selectedBatch
                                }
                              </td>

                              <td>

                                <span className="department-badge">
                                  {
                                    student.department ||
                                    selectedDepartment
                                  }
                                </span>

                              </td>

                            </tr>
                          )
                        )
                      ) : (
                        <tr>

                          <td
                            colSpan="8"
                            className="empty-search"
                          >

                            <Search
                              size={30}
                            />

                            <strong>
                              No students found
                            </strong>

                            <span>
                              Try another search term.
                            </span>

                          </td>

                        </tr>
                      )}

                    </tbody>

                  </table>

                </div>

                {/* PAGINATION */}

                {filteredStudents.length > 0 && (
                  <div className="pagination">

                    <div className="pagination-info">

                      Showing{" "}
                      <strong>
                        {(currentPage - 1) *
                          STUDENTS_PER_PAGE +
                          1}
                      </strong>{" "}
                      -
                      {" "}
                      <strong>
                        {Math.min(
                          currentPage *
                            STUDENTS_PER_PAGE,
                          filteredStudents.length
                        )}
                      </strong>{" "}
                      of{" "}
                      <strong>
                        {filteredStudents.length}
                      </strong>

                    </div>

                    <div className="pagination-controls">

                      <button
                        type="button"
                        disabled={
                          currentPage === 1
                        }
                        onClick={() =>
                          setCurrentPage(
                            (page) =>
                              Math.max(
                                1,
                                page - 1
                              )
                          )
                        }
                      >

                        <ChevronLeft
                          size={17}
                        />

                        Previous

                      </button>

                      <span className="page-number">

                        {currentPage}

                        <span>
                          /
                        </span>

                        {totalPages}

                      </span>

                      <button
                        type="button"
                        disabled={
                          currentPage ===
                          totalPages
                        }
                        onClick={() =>
                          setCurrentPage(
                            (page) =>
                              Math.min(
                                totalPages,
                                page + 1
                              )
                          )
                        }
                      >

                        Next

                        <ChevronRight
                          size={17}
                        />

                      </button>

                    </div>

                  </div>
                )}

              </div>
            )}

            {/* INITIAL STATE */}

            {!loadingStudents &&
              students.length === 0 &&
              !existingMessage && (
                <div className="existing-empty-state">

                  <div className="empty-database-icon">

                    <Database size={34} />

                  </div>

                  <h3>
                    Select a Batch & Department
                  </h3>

                  <p>
                    Choose the student batch and
                    department above to view the
                    existing records.
                  </p>

                </div>
              )}

          </div>
        )}

      </div>

      {/* =====================================================
          INSTRUCTION MODAL
      ===================================================== */}

      {showInstructions && (
        <div
          className="instruction-overlay"
          onClick={() =>
            setShowInstructions(false)
          }
        >

          <div
            className="instruction-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="instruction-modal-header">

              <div className="instruction-heading">

                <div className="instruction-icon">

                  <Info size={21} />

                </div>

                <div>

                  <h2>
                    Upload Instructions
                  </h2>

                  <p>
                    Please check these before
                    uploading
                  </p>

                </div>

              </div>

              <button
                type="button"
                className="instruction-close"
                onClick={() =>
                  setShowInstructions(false)
                }
              >
                <X size={20} />
              </button>

            </div>

            <div className="instruction-content">

              <div className="instruction-item">

                <span className="instruction-number">
                  01
                </span>

                <div>

                  <h3>
                    Use the correct Excel file
                  </h3>

                  <p>
                    Upload only Excel files with
                    <strong> .xlsx </strong>
                    or
                    <strong> .xls </strong>
                    extension.
                  </p>

                </div>

              </div>

              <div className="instruction-item">

                <span className="instruction-number">
                  02
                </span>

                <div>

                  <h3>
                    Check the column names
                  </h3>

                  <p>
                    Make sure all required student
                    data columns are present and
                    the column names are not changed.
                  </p>

                </div>

              </div>

              <div className="instruction-item">

                <span className="instruction-number">
                  03
                </span>

                <div>

                  <h3>
                    Remove unnecessary rows
                  </h3>

                  <p>
                    Remove empty rows or unnecessary
                    data before uploading the file.
                  </p>

                </div>

              </div>

              <div className="instruction-item">

                <span className="instruction-number">
                  04
                </span>

                <div>

                  <h3>
                    Check the file size
                  </h3>

                  <p>
                    The Excel file must be less than
                    <strong> 10 MB</strong>.
                  </p>

                </div>

              </div>

            </div>

            <button
              type="button"
              className="got-it-button"
              onClick={() =>
                setShowInstructions(false)
              }
            >

              <CheckCircle2 size={18} />

              Got it

            </button>

          </div>

        </div>
      )}

    </div>
  );
};

export default StudentDataUpload;