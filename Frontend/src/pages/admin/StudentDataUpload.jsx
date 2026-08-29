import { useEffect, useMemo, useRef, useState } from "react";
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
  Download,
  ChevronDown,
} from "lucide-react";
import ThemeDropdown from "../../components/common/ThemeDropDown";
import {
  uploadStudentData,
  getExistingStudents,
  getScheduleFormData,
} from "../../services/adminService";
import "./StudentDataUpload.css";

const TEMPLATE_URL = `${import.meta.env.VITE_BASE_URL}/STUDENT_DATA_UPLOAD_TEMPLATE.xlsx`;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const STUDENTS_PER_PAGE = 50;

const getValue = (object, keys) => {
  for (const key of keys) {
    if (
      object &&
      Object.prototype.hasOwnProperty.call(object, key) &&
      object[key] !== null &&
      object[key] !== undefined
    ) {
      return object[key];
    }
  }

  return "";
};

const normalizeStudent = (student = {}) => ({
  id: getValue(student, ["_id"]),
  name: getValue(student, ["name"]),
  registerNo: getValue(student, ["registerNo"]),
  admissionNo: getValue(student, ["admissionNo",]),
  email: getValue(student, ["email"]),
  phone: getValue(student, ["phone"]),
  department: getValue(student, ["department"]),
  year: getValue(student, ["year"]),
  section: getValue(student, ["section"]),
  batch: getValue(student, ["batch"]),
  dob: getValue(student, ["dob"]),
});

const uploadInstructions = [
  {
    id: "01",
    title: "Use the correct Excel file",
    description: (
      <>
        Upload only Excel files with <strong>.xlsx</strong> extension. The file must be less than <strong>10 MB</strong> and cannot be empty.
      </>
    )
  },
  {
    id: "02",
    title: "Keep the column names unchanged",
    description: "Use the exact template headers: Name, Reg_no, Admission_no, Email, Phone, Department, Year, Section, Batch, DOB."
  },
  {
    id: "03",
    title: "Follow strict data formatting",
    description: (
      <>
        <strong>DOB</strong> must be exactly <strong>DD-MM-YYYY</strong>. <strong>Phone numbers</strong> must be exactly <strong>10 digits</strong>.
      </>
    )
  },
  {
    id: "04",
    title: "Ensure unique records",
    description: (
      <>
        <strong>Admission_no</strong> must be unique. Duplicate records will cause the upload to fail.
      </>
    )
  },
  {
    id: "05",
    title: "Valid values required",
    description: "Year must be 1-4. Departments must match approved courses. Remove empty rows before uploading."
  }
];


const toArray = (value) => {
  if (Array.isArray(value)) return value;

  if (Array.isArray(value?.students)) return value.students;
  if (Array.isArray(value?.student_data)) return value.student_data;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.records)) return value.records;

  return [];
};

const readApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: response.ok,
      message: text || "",
    };
  }
};

const getErrorMessage = (data, fallback) =>
  data?.message ||
  data?.error ||
  data?.detail ||
  data?.errors?.[0]?.message ||
  fallback;

const StudentDataUpload = () => {
  const fileInputRef = useRef(null);

  const [activeMode, setActiveMode] = useState("upload");

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [showInstructions, setShowInstructions] = useState(false);

  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  // These values are populated only from the schedule API.
  const [batchDepartmentSections, setBatchDepartmentSections] = useState([]);
  const [loadingScheduleData, setLoadingScheduleData] = useState(false);

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [existingMessage, setExistingMessage] = useState("");
  const [existingMessageType, setExistingMessageType] = useState("");

  const [studentSearch, setStudentSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
  };

  const showExistingError = (text) => {
    setExistingMessage(text);
    setExistingMessageType("error");
  };

  const isExcelFile = (file) => {
    if (!file) return false;

    const name = file.name.toLowerCase();
    return name.endsWith(".xlsx") || name.endsWith(".xls");
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

    if (file.size > MAX_FILE_SIZE) {
      showMessage("File size must be less than 10 MB.", "error");
      return false;
    }

    return true;
  };

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

  const fetchScheduleData = async () => {
    setLoadingScheduleData(true);
    setExistingMessage("");
    setExistingMessageType("");

    try {
      const data = await getScheduleFormData();

      if (data?.success === false) {
        throw new Error(
          getErrorMessage(
            data,
            "Unable to load batch, department and section data."
          )
        );
      }

      const rows = Array.isArray(data?.data?.batchDepartmentSections)
        ? data.data.batchDepartmentSections
        : [];

      const normalizedRows = rows
        .map((item) => ({
          batch: String(item?.batch ?? "").trim(),
          department: String(item?.department ?? "").trim(),
          section: String(item?.section ?? "").trim(),
        }))
        .filter(
          (item) => item.batch && item.department && item.section
        );

      setBatchDepartmentSections(normalizedRows);

      // Reset selections whenever the backend group list is refreshed.
      setSelectedBatch("");
      setSelectedDepartment("");
      setSelectedSection("");
      setStudents([]);
      setCurrentPage(1);
      setStudentSearch("");
    } catch (error) {
      console.error("Schedule data fetch error:", error);

      setBatchDepartmentSections([]);
      setSelectedBatch("");
      setSelectedDepartment("");
      setSelectedSection("");
      setStudents([]);

      showExistingError(
        "Unable to load batch, department and section data."
      );
    } finally {
      setLoadingScheduleData(false);
    }
  };

  const batchOptions = useMemo(
    () =>
      [...new Set(batchDepartmentSections.map((item) => item.batch))].sort(),
    [batchDepartmentSections]
  );

  const departmentOptions = useMemo(() => {
    const rows = selectedBatch
      ? batchDepartmentSections.filter(
        (item) => item.batch === selectedBatch
      )
      : batchDepartmentSections;

    return [...new Set(rows.map((item) => item.department))].sort();
  }, [batchDepartmentSections, selectedBatch]);

  const sectionOptions = useMemo(() => {
    const rows = batchDepartmentSections.filter(
      (item) =>
        (!selectedBatch || item.batch === selectedBatch) &&
        (!selectedDepartment || item.department === selectedDepartment)
    );

    return [...new Set(rows.map((item) => item.section))].sort();
  }, [batchDepartmentSections, selectedBatch, selectedDepartment]);

  useEffect(() => {
    fetchScheduleData();
  }, []);

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
      const data = await uploadStudentData(
        selectedFile
      );

      if (data?.success === false) {
        throw new Error(
          getErrorMessage(
            data,
            "Student data upload failed."
          )
        );
      }

      showMessage(
        getErrorMessage(data, "Student data uploaded successfully."),
        "success"
      );

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }


      if (selectedBatch && selectedDepartment && selectedSection) {
        await fetchExistingStudents({
          keepMessage: true,
          resetSearch: false,
        });
      }
    } catch (error) {
      console.error("Student upload error:", error);

      showMessage(
        "Something went wrong while uploading.",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  const fetchExistingStudents = async ({
    keepMessage = false,
    resetSearch = true,
  } = {}) => {
    if (!selectedBatch || !selectedDepartment || !selectedSection) {
      showExistingError(
        "Please select batch, department and section."
      );
      return;
    }

    setLoadingStudents(true);
    setCurrentPage(1);

    if (resetSearch) {
      setStudentSearch("");
    }

    if (!keepMessage) {
      setExistingMessage("");
      setExistingMessageType("");
    }

    try {
      const data = await getExistingStudents({
        batch: selectedBatch,
        department: selectedDepartment,
        section: selectedSection,
      });

      console.log("Existing student data API response:",data);

      if (data?.success === false) {
        throw new Error(
          getErrorMessage(
            data,
            "Unable to load student data."
          )
        );
      }
      const rawStudents = toArray(data);
      const normalizedStudents = rawStudents.map(normalizeStudent);

      setStudents(normalizedStudents);

      // No green "X students loaded successfully" message is shown.
      setExistingMessage("");
      setExistingMessageType("");
    } catch (error) {
      console.error("Fetch students error:", error);

      setStudents([]);
      showExistingError(
        "Unable to load existing student data."
      );
    } finally {
      setLoadingStudents(false);
    }
  };

  const filteredStudents = useMemo(() => {
    const search = studentSearch.trim().toLowerCase();

    if (!search) {
      return students;
    }

    return students.filter((student) =>
      String(student.name || "")
        .toLowerCase()
        .includes(search)
    );
  }, [students, studentSearch]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE)
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

  const handleModeChange = (mode) => {
    setActiveMode(mode);
    setMessage("");
    setExistingMessage("");
    setExistingMessageType("");

    if (mode === "existing") {
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownloadTemplate = () => {
    if (!TEMPLATE_URL) {
      showMessage(
        "Student data template URL is not configured.",
        "error"
      );
      return;
    }

    const link = document.createElement("a");
    link.href = TEMPLATE_URL;
    link.download = "STUDENT_DATA_UPLOAD_TEMPLATE.xlsx";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleBatchChange = (batch) => {
    setSelectedBatch(batch);
    setSelectedDepartment("");
    setSelectedSection("");
    setStudents([]);
    setCurrentPage(1);
    setStudentSearch("");
    setExistingMessage("");
    setExistingMessageType("");
  };

  const handleDepartmentChange = (department) => {

    setSelectedDepartment(department);
    setSelectedSection("");
    setStudents([]);
    setCurrentPage(1);
    setStudentSearch("");
    setExistingMessage("");
    setExistingMessageType("");
  };

  const handleSectionChange = (section) => {
    setSelectedSection(section);
    setStudents([]);
    setCurrentPage(1);
    setStudentSearch("");
    setExistingMessage("");
    setExistingMessageType("");
  };

  return (
    <div className="student-upload-page">
      <div className="student-upload-container">
        <div className="student-upload-header">
          <div className="header-icon">
            <UserRound size={29} strokeWidth={2.2} />
          </div>

          <div className="student-upload-title">
            <h1>Student Data Management</h1>
            <p>
              Upload new student records or view existing student
              information
            </p>
          </div>
        </div>

        <div className="student-mode-switch">
          <button
            type="button"
            className={`mode-button ${activeMode === "upload" ? "active" : ""
              }`}
            onClick={() => handleModeChange("upload")}
          >
            <Upload size={17} />
            <span>Upload New Data</span>
          </button>

          <button
            type="button"
            className={`mode-button ${activeMode === "existing" ? "active" : ""
              }`}
            onClick={() => handleModeChange("existing")}
          >
            <Database size={17} />
            <span>Existing Data</span>
          </button>
        </div>

        {activeMode === "upload" && (
          <div className="student-upload-card">
            <div className="upload-tools">
              <button
                type="button"
                className="upload-tool-button"
                onClick={() => setShowInstructions(true)}
              >
                <Info size={17} />
                <span>Instructions</span>
              </button>

              <button
                type="button"
                className="upload-tool-button template-button"
                onClick={handleDownloadTemplate}
              >
                <Download size={17} />
                <span>Download Template</span>
              </button>
            </div>

            <div
              className={`student-drop-zone ${isDragging ? "dragging" : ""
                } ${selectedFile ? "has-file" : ""}`}
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
                      <CloudUpload size={34} strokeWidth={2} />
                    </div>
                  </div>

                  <h2>Upload Student Excel File</h2>

                  <p className="drop-text">
                    Drag &amp; drop your Excel file here
                  </p>

                  <span className="or-text">OR</span>

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
                    Supported formats: <strong>.xlsx</strong> and{" "}
                    <strong>.xls</strong>
                  </p>

                  <p className="size-text">
                    Maximum file size: 10 MB
                  </p>
                </>
              ) : (
                <div
                  className="selected-file-wrapper"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="excel-file-icon">
                    <FileSpreadsheet size={27} strokeWidth={2} />
                  </div>

                  <div className="selected-file-info">
                    <h3>{selectedFile.name}</h3>

                    <p>{formatFileSize(selectedFile.size)}</p>


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

            <button
              type="button"
              className={`upload-submit-button ${uploading ? "uploading" : ""
                }`}
              disabled={!selectedFile || uploading}
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
                Your student data is securely uploaded to the server.
              </span>
            </div>
          </div>
        )}

        {activeMode === "existing" && (
          <div className="existing-data-card">
            <div className="existing-data-header">
              <div className="existing-heading">
                <div className="existing-icon">
                  <Database size={22} strokeWidth={2} />
                </div>

                <div>
                  <h2>Existing Student Data</h2>
                  <p>
                    Select a batch, department and section to view uploaded
                    students
                  </p>
                </div>
              </div>

              <div className="record-badge">
                <Table2 size={15} />
                Student Records
              </div>
            </div>

            <div className="existing-filter-section">
              <div className="filter-heading">
                <Filter size={17} />
                <span>Select Student Group</span>
              </div>

              <div className="filter-grid">
                <div className="filter-field">
                  <label htmlFor="student-batch">Batch</label>

                  <ThemeDropdown
                    icon={GraduationCap}
                    value={selectedBatch}
                    options={batchOptions}
                    onChange={handleBatchChange}
                    placeholder="Select Batch"
                    loading={loadingScheduleData}
                    disabled={loadingScheduleData}
                  />
                </div>

                <div className="filter-field">
                  <label htmlFor="student-department">Department</label>

                  <ThemeDropdown
                    icon={Building2}
                    value={selectedDepartment}
                    options={departmentOptions}
                    onChange={handleDepartmentChange}
                    placeholder="Select Department"
                    disabled={!selectedBatch || loadingScheduleData}
                    loading={loadingScheduleData}
                  />
                </div>

                <div className="filter-field">
                  <label htmlFor="student-section">Section</label>

                  <ThemeDropdown
                    icon={Users}
                    value={selectedSection}
                    options={sectionOptions}
                    onChange={handleSectionChange}
                    placeholder="Select Section"
                    disabled={
                      !selectedBatch ||
                      !selectedDepartment ||
                      loadingScheduleData
                    }
                    loading={loadingScheduleData}
                  />
                </div>

                <button
                  type="button"
                  className="view-students-button"
                  onClick={() => fetchExistingStudents()}
                  disabled={
                    loadingStudents ||
                    loadingScheduleData ||
                    !selectedBatch ||
                    !selectedDepartment ||
                    !selectedSection
                  }
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

            {students.length > 0 && (
              <div className="student-results-section">
                <div className="results-toolbar">
                  <div className="results-title">
                    <div className="results-title-icon">
                      <Users size={18} />
                    </div>

                    <div>
                      <h3>
                        {selectedDepartment} · Section {selectedSection} Students
                      </h3>
                      <p>
                        Batch {selectedBatch} · Section {selectedSection}
                      </p>
                    </div>
                  </div>

                  <div className="results-actions">
                    <div className="student-count">
                      <Users size={15} />
                      {filteredStudents.length} Students
                    </div>

                    <button
                      type="button"
                      className="refresh-button"
                      onClick={() =>
                        fetchExistingStudents({
                          keepMessage: false,
                          resetSearch: false,
                        })
                      }
                      disabled={loadingStudents}
                      title="Refresh"
                    >
                      <RefreshCw
                        size={17}
                        className={
                          loadingStudents ? "refresh-spin" : ""
                        }
                      />
                    </button>
                  </div>
                </div>

                <div className="student-search-wrapper">
                  <Search size={17} />

                  <input
                    type="text"
                    placeholder="Search by student name..."
                    value={studentSearch}
                    onChange={(event) => {
                      setStudentSearch(event.target.value);
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

                <div className="student-table-container">
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>SI No</th>
                        <th>Name</th>
                        <th>Register No.</th>
                        <th>Admission No.</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Department</th>
                        <th>Year</th>
                        <th>Section</th>
                        <th>Batch</th>
                        <th>DOB</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedStudents.length > 0 ? (
                        paginatedStudents.map((student, index) => (
                          <tr
                            key={
                              student.id ||
                              student.registerNo ||
                              student.admissionNo ||
                              `${student.name}-${index}`
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
                              <span className="student-name-only">
                                {student.name || "-"}
                              </span>
                            </td>

                            <td>
                              <span className="register-number">
                                {student.registerNo || "-"}
                              </span>
                            </td>

                            <td>
                              {student.admissionNo || "-"}
                            </td>

                            <td>
                              <span className="email-text">
                                {student.email || "-"}
                              </span>
                            </td>

                            <td>{student.phone || "-"}</td>

                            <td>
                              <span className="department-badge">
                                {student.department ||
                                  selectedDepartment ||
                                  "-"}
                              </span>
                            </td>

                            <td>{student.year || "-"}</td>

                            <td>
                              <span className="section-badge">
                                {student.section || "-"}
                              </span>
                            </td>

                            <td>
                              {student.batch || selectedBatch || "-"}
                            </td>

                            <td>{student.dob || "-"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="11"
                            className="empty-search"
                          >
                            <Search size={30} />
                            <strong>No students found</strong>
                            <span>
                              Try another student name.
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredStudents.length > 0 && (
                  <div className="pagination">
                    <div className="pagination-info">
                      Showing{" "}
                      <strong>
                        {(currentPage - 1) *
                          STUDENTS_PER_PAGE +
                          1}
                      </strong>{" "}
                      -{" "}
                      <strong>
                        {Math.min(
                          currentPage * STUDENTS_PER_PAGE,
                          filteredStudents.length
                        )}
                      </strong>{" "}
                      of{" "}
                      <strong>{filteredStudents.length}</strong>
                    </div>

                    <div className="pagination-controls">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage((page) =>
                            Math.max(1, page - 1)
                          )
                        }
                      >
                        <ChevronLeft size={17} />
                        Previous
                      </button>

                      <span className="page-number">
                        {currentPage}
                        <span>/</span>
                        {totalPages}
                      </span>

                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() =>
                          setCurrentPage((page) =>
                            Math.min(totalPages, page + 1)
                          )
                        }
                      >
                        Next
                        <ChevronRight size={17} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loadingStudents &&
              !loadingScheduleData &&
              students.length === 0 &&
              !existingMessage && (
                <div className="existing-empty-state">
                  <div className="empty-database-icon">
                    <Database size={34} />
                  </div>

                  <h3>Select Batch, Department &amp; Section</h3>

                  <p>
                    Choose the batch, department and section above
                    to view the existing records.
                  </p>
                </div>
              )}
          </div>
        )}
      </div>

      {(message || existingMessage) && (
        <div
          className="student-message-overlay"
          role="alert"
          aria-live="assertive"
          onClick={() => {
            setMessage("");
            setMessageType("");
            setExistingMessage("");
            setExistingMessageType("");
          }}
        >
          <div
            className={`student-message-popup ${(message ? messageType : existingMessageType) === "success"
              ? "success"
              : "error"
              }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="student-message-icon-wrap">
              {(message ? messageType : existingMessageType) === "success" ? (
                <CheckCircle2 size={30} strokeWidth={2.2} />
              ) : (
                <AlertCircle size={30} strokeWidth={2.2} />
              )}
            </div>

            <div className="student-message-content">
              <span className="student-message-label">
                {(message ? messageType : existingMessageType) === "success"
                  ? "Success"
                  : "Something went wrong"}
              </span>
              <p>{message || existingMessage}</p>
            </div>

            <button
              type="button"
              className="student-message-close"
              aria-label="Close message"
              onClick={() => {
                setMessage("");
                setMessageType("");
                setExistingMessage("");
                setExistingMessageType("");
              }}
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .student-message-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(8, 12, 20, 0.38);
          backdrop-filter: blur(9px);
          -webkit-backdrop-filter: blur(9px);
          animation: studentMessageFadeIn 0.22s ease-out;
        }

        .student-message-popup {
          position: relative;
          display: flex;
          align-items: center;
          gap: 18px;
          width: min(500px, 100%);
          padding: 22px 48px 22px 22px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.22),
            0 8px 25px rgba(0, 0, 0, 0.10);
          animation: studentMessagePopIn 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .student-message-icon-wrap {
          flex: 0 0 58px;
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 17px;
        }

        .student-message-popup.success .student-message-icon-wrap {
          color: #15803d;
          background: rgba(34, 197, 94, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.16);
        }

        .student-message-popup.error .student-message-icon-wrap {
          color: #dc2626;
          background: rgba(239, 68, 68, 0.11);
          box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.15);
        }

        .student-message-content {
          min-width: 0;
          flex: 1;
        }

        .student-message-label {
          display: block;
          margin-bottom: 4px;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .student-message-popup.success .student-message-label {
          color: #166534;
        }

        .student-message-popup.error .student-message-label {
          color: #b91c1c;
        }

        .student-message-content p {
          margin: 0;
          color: #4b5563;
          font-size: 14px;
          line-height: 1.55;
          overflow-wrap: anywhere;
        }

        .student-message-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          transition: 0.18s ease;
        }

        .student-message-close:hover {
          background: rgba(107, 114, 128, 0.10);
          color: #111827;
        }

        @keyframes studentMessageFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes studentMessagePopIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 560px) {
          .student-message-overlay {
            padding: 16px;
          }

          .student-message-popup {
            gap: 13px;
            padding: 18px 42px 18px 16px;
            border-radius: 17px;
          }

          .student-message-icon-wrap {
            flex-basis: 50px;
            width: 50px;
            height: 50px;
            border-radius: 14px;
          }

          .student-message-content p {
            font-size: 13px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .student-message-overlay,
          .student-message-popup {
            animation: none;
          }
        }
      `}</style>

      {showInstructions && (
        <div
          className="instruction-overlay"
          onClick={() => setShowInstructions(false)}
        >
          <div
            className="instruction-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="instruction-modal-header">
              <div className="instruction-heading">
                <div className="instruction-icon">
                  <Info size={21} />
                </div>

                <div>
                  <h2>Upload Instructions</h2>
                  <p>Please check these before uploading</p>
                </div>
              </div>

              <button
                type="button"
                className="instruction-close"
                onClick={() => setShowInstructions(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Using the variable here */}
            <div className="instruction-content">
              {uploadInstructions.map((item) => (
                <div key={item.id} className="instruction-item">
                  <span className="instruction-number">{item.id}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="got-it-button"
              onClick={() => setShowInstructions(false)}
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