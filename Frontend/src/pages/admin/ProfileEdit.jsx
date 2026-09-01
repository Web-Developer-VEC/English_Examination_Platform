import { useEffect, useMemo, useState } from "react";
import {
  getScheduleFormData,
  getExistingStudents,
  updateStudentProfileAccess,
  getAcademicYear,
  updateAcademicYear,
} from "../../services/adminService";
import {
  ShieldCheck,
  Users,
  GraduationCap,
  Building2,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  CalendarDays,
  Pencil,
  Power,
  UserCheck,
  AlertCircle,
  X,
} from "lucide-react";

import ThemeDropdown from "../../components/common/ThemeDropDown";

import "./ProfileEdit.css";

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


const toArray = (value) => {
  if (Array.isArray(value)) return value;

  if (Array.isArray(value?.students)) {
    return value.students;
  }

  if (Array.isArray(value?.student_data)) {
    return value.student_data;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.records)) {
    return value.reco 
  }

  if (Array.isArray(value?.academicYears)) {
    return value.academicYears;
  }

  return [];
};



const readApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  const text = await response.text();
  try { return JSON.parse(text); }
  catch { return { success: response.ok, message: text || "" }; }
};

const getErrorMessage = (data, fallback) =>
  data?.message ||
  data?.error ||
  data?.detail ||
  data?.errors?.[0]?.message ||
  fallback;


const normalizeStudent = (student = {}) => ({
  id: getValue(student, ["_id", "id"]),

  name: getValue(student, ["name"]),

  registerNo: getValue(student, [
    "registerNo",
    "register_no",
    "regNo",
  ]),

  admissionNo: getValue(student, [
    "admissionNo",
    "admission_no",
  ]),

  email: getValue(student, ["email"]),

  phone: getValue(student, ["phone"]),

  department: getValue(student, ["branch"]),

  year: getValue(student, ["year"]),

  section: getValue(student, ["section"]),

  batch: getValue(student, ["batch"]),

  dob: getValue(student, ["dob"]),

  // This should come from backend
  editProfileEnabled: Boolean(
    getValue(student, [
      "editProfileEnabled",
      "profileEditEnabled",
      "isProfileEditEnabled",
      "allowProfileEdit",
    ])
  ),
});

const getNextAcademicYear = (academicYears) => {
  if (!academicYears.length) {
    const now = new Date();

    const startYear =
      now.getMonth() >= 5
        ? now.getFullYear()
        : now.getFullYear() - 1;

    return `${startYear + 1}-${startYear + 2}`;
  }

  const parsedYears = academicYears
    .map((item) => {
      const value =
        typeof item === "string"
          ? item
          : item?.year || item?.academicYear;

      const match = String(value || "").match(
        /^(\d{4})-(\d{4})$/
      );

      if (!match) return null;

      return {
        value,
        start: Number(match[1]),
        end: Number(match[2]),
      };
    })
    .filter(Boolean);

  if (!parsedYears.length) {
    return "";
  }

  const latest = parsedYears.reduce((latest, current) =>
    current.start > latest.start
      ? current
      : latest
  );

  return `${latest.start + 1}-${latest.end + 1}`;
};

const StudentProfileAccess = () => {
  const [selectedBatch, setSelectedBatch] =
    useState("");

  const [selectedDepartment, setSelectedDepartment] =
    useState("");

  const [selectedSection, setSelectedSection] =
    useState("");
  const [
    batchDepartmentSections,
    setBatchDepartmentSections,
  ] = useState([]);

  const [loadingScheduleData, setLoadingScheduleData] =
    useState(false);

  const [students, setStudents] =
    useState([]);

  const [loadingStudents, setLoadingStudents] =
    useState(false);

  const [studentSearch, setStudentSearch] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);


  const [updatingStudentId, setUpdatingStudentId] =
    useState(null);


  const [academicYears, setAcademicYears] =
    useState([]);

  const [loadingAcademicYears, setLoadingAcademicYears] =
    useState(false);

  const [addingAcademicYear, setAddingAcademicYear] =
    useState(false);

  const [newAcademicYear, setNewAcademicYear] =
    useState("");

  const [editingAcademicYear, setEditingAcademicYear] =
    useState(false);

  const [deletingAcademicYear, setDeletingAcademicYear] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("");


  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };


  const closeMessage = () => {
    setMessage("");
    setMessageType("");
  };



  const fetchScheduleData = async () => {
    setLoadingScheduleData(true);

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
        .filter((item) => item.batch && item.department && item.section);

      setBatchDepartmentSections(normalizedRows);
    } catch (error) {
      console.error("Schedule data error:", error);
      showMessage(
        "Unable to load filter data.",
        "error"
      );
    } finally {
      setLoadingScheduleData(false);
    }
  };


  const batchOptions = useMemo(
    () => [
      ...new Set(
        batchDepartmentSections
          .map((item) => item.batch)
          .filter(Boolean)
      ),
    ],
    [batchDepartmentSections]
  );


  const departmentOptions = useMemo(() => {

    const rows =
      selectedBatch
        ? batchDepartmentSections.filter(
          (item) => item.batch === selectedBatch
        )
        : batchDepartmentSections;

    return [
      ...new Set(
        rows
          .map((item) => item.department)
          .filter(Boolean)
      ),
    ];

  }, [
    batchDepartmentSections,
    selectedBatch,
  ]);


  const sectionOptions = useMemo(() => {

    const rows =
      batchDepartmentSections.filter(
        (item) =>
          (!selectedBatch ||
            item.batch === selectedBatch) &&
          (!selectedDepartment ||
            item.department === selectedDepartment)
      );

    return [
      ...new Set(
        rows
          .map((item) => item.section)
          .filter(Boolean)
      ),
    ];

  }, [
    batchDepartmentSections,
    selectedBatch,
    selectedDepartment,
  ]);



  const fetchStudents = async ({ silent = false } = {}) => {
    if (!selectedBatch || !selectedDepartment || !selectedSection) {
      showMessage(
        "Please select batch, department and section.",
        "error"
      );
      return;
    }

    setLoadingStudents(true);
    setCurrentPage(1);

    try {
      const payload = {
        // "All" is represented by null so the backend can omit that filter.
        batch: selectedBatch,
        department: selectedDepartment,
        section: selectedSection,
      };

      const data = await getExistingStudents(payload);

      if (data?.success === false) {
        throw new Error(
          getErrorMessage(data, "Unable to load student data.")
        );
      }

      const normalizedStudents = toArray(data).map(normalizeStudent);

      setStudents(normalizedStudents);

      if (!silent && normalizedStudents.length === 0) {
        showMessage(
          "No students found for the selected group.",
          "error"
        );
      }
    } catch (error) {
      console.error("Student fetch error:", error);
      setStudents([]);
      showMessage(
        "Unable to load student data.",
        "error"
      );
    } finally {
      setLoadingStudents(false);
    }
  };


  const handleProfileAccessToggle = async (student) => {
    if (!student?.admissionNo) {
      showMessage(
        "Admission number is missing. Cannot update profile access.",
        "error"
      );
      return;
    }

    const nextValue = !student.editProfileEnabled;
    setUpdatingStudentId(student.id || student.admissionNo);

    try {
      // Backend contract:
      // { students: [{ admissionNo, studentEditEnabled }] }
      const data = await updateStudentProfileAccess([
        {
          admissionNo: String(
            student.admissionNo
          ).trim(),
          studentEditEnabled: nextValue,
        },
      ]);

      if (data?.success === false) {
        throw new Error(
          getErrorMessage(data, "Unable to update profile access.")
        );
      }

      setStudents((previous) =>
        previous.map((item) =>
          item.admissionNo === student.admissionNo
            ? { ...item, editProfileEnabled: nextValue }
            : item
        )
      );
    } catch (error) {
      console.error("Profile access update error:", error);
      showMessage(
        "Unable to update profile access.",
        "error"
      );
    } finally {
      setUpdatingStudentId(null);
    }
  };

  const handleAllStudentsAccess = async (enabled) => {
    if (!students.length) return;

    const permissionList = students
      .filter((student) => student?.admissionNo)
      .map((student) => ({
        admissionNo: String(student.admissionNo).trim(),
        studentEditEnabled: enabled,
      }));

    if (!permissionList.length) {
      showMessage(
        "No students with admission numbers are available.",
        "error"
      );
      return;
    }

    setUpdatingStudentId("ALL");

    try {
      const data =
    await updateStudentProfileAccess(
        permissionList
    );

      if (data?.success === false) {
        throw new Error(
          getErrorMessage(data, "Unable to update student permissions.")
        );
      }

      const updatedAdmissions = new Set(
        permissionList.map((item) => item.admissionNo)
      );

      setStudents((previous) =>
        previous.map((student) =>
          updatedAdmissions.has(student.admissionNo)
            ? { ...student, editProfileEnabled: enabled }
            : student
        )
      );
    } catch (error) {
      console.error("Bulk profile access update error:", error);
      showMessage(
        "Unable to update student permissions.",
        "error"
      );
    } finally {
      setUpdatingStudentId(null);
    }
  };


  const fetchAcademicYears = async () => {
    setLoadingAcademicYears(true);

    try {
      const data = await getAcademicYear();

      if (data?.success === false) {
        throw new Error(
          getErrorMessage(data, "Unable to load academic year.")
        );
      }

      const currentYear =
        data?.data?.academicYear ||
        data?.academicYear ||
        data?.data?.year ||
        data?.year ||
        (Array.isArray(data?.data)
          ? data.data[0]?.academicYear || data.data[0]?.year
          : "") ||
        "";

      const normalizedYear = String(currentYear || "").trim();

      if (normalizedYear) {
        setAcademicYears([
          {
            id: "current",
            year: normalizedYear,
          },
        ]);

        // Always show the value stored in the backend.
        setNewAcademicYear(normalizedYear);
      } else {
        setAcademicYears([]);
        setNewAcademicYear(getNextAcademicYear([]));
      }
    } catch (error) {
      console.error("Academic year fetch error:", error);

      showMessage(
        "Unable to load academic year.",
        "error"
      );
    } finally {
      setLoadingAcademicYears(false);
    }
  };

  const handleAddAcademicYear = async () => {
    const value = newAcademicYear.trim();

    if (!/^\d{4}-\d{4}$/.test(value)) {
      showMessage(
        "Academic year must be in YYYY-YYYY format.",
        "error"
      );
      return;
    }

    const [startYear, endYear] = value.split("-").map(Number);

    if (endYear !== startYear + 1) {
      showMessage(
        "Invalid academic year. Example: 2026-2027.",
        "error"
      );
      return;
    }

    setAddingAcademicYear(true);

    try {

      const data =
    await updateAcademicYear(value);

      if (data?.success === false) {
        throw new Error(
          getErrorMessage(
            data,
            "Unable to update academic year."
          )
        );
      }

      const updatedYear =
        data?.data?.academicYear ||
        data?.academicYear ||
        value;

      // Immediately update the UI with backend response.
      setAcademicYears([
        {
          id: "current",
          year: String(updatedYear).trim(),
        },
      ]);

      setNewAcademicYear(String(updatedYear).trim());

      showMessage(
        `Academic year updated to ${String(updatedYear).trim()}.`,
        "success"
      );

      setEditingAcademicYear(false);
    } catch (error) {
      console.error("Academic year update error:", error);

      showMessage(
        "Unable to update academic year.",
        "error"
      );
    } finally {
      setAddingAcademicYear(false);
    }
  };

  useEffect(() => {

    fetchScheduleData();

    fetchAcademicYears();

  }, []);


  const handleBatchChange = (
    batch
  ) => {

    setSelectedBatch(batch);

    setSelectedDepartment("");

    setSelectedSection("");

    setStudents([]);

    setStudentSearch("");

    setCurrentPage(1);
  };


  const handleDepartmentChange = (
    department
  ) => {

    setSelectedDepartment(
      department
    );

    setSelectedSection("");

    setStudents([]);

    setStudentSearch("");

    setCurrentPage(1);
  };


  const handleSectionChange = (
    section
  ) => {

    setSelectedSection(section);

    setStudents([]);

    setStudentSearch("");

    setCurrentPage(1);
  };


  const filteredStudents = useMemo(() => {

    const search =
      studentSearch
        .trim()
        .toLowerCase();


    if (!search) {
      return students;
    }


    return students.filter(
      (student) =>
        String(
          student.name || ""
        )
          .toLowerCase()
          .includes(search) ||

        String(
          student.registerNo || ""
        )
          .toLowerCase()
          .includes(search) ||

        String(
          student.admissionNo || ""
        )
          .toLowerCase()
          .includes(search) ||

        String(
          student.email || ""
        )
          .toLowerCase()
          .includes(search)
    );

  }, [
    students,
    studentSearch,
  ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredStudents.length /
        STUDENTS_PER_PAGE
      )
    );


  const paginatedStudents =
    filteredStudents.slice(
      (currentPage - 1) *
      STUDENTS_PER_PAGE,

      currentPage *
      STUDENTS_PER_PAGE
    );


  useEffect(() => {

    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }

  }, [
    currentPage,
    totalPages,
  ]);


  return (
    <div className="profile-access-page">

      <div className="profile-access-container">

        <header className="profile-access-header">

          <div className="header-brand">

            <div className="header-icon-box">
              <ShieldCheck
                size={27}
                strokeWidth={2.1}
              />
            </div>


            <div>

              <h1>
                Student Profile Access
              </h1>

              <p>
                Control student Edit Profile access
                from one secure admin panel.
              </p>

            </div>

          </div>

        </header>

        <section className="access-card filter-card">

          <div className="section-heading">

            <div className="section-heading-icon">
              <Filter size={19} />
            </div>

            <div>

              <h2>
                Select Student Details
              </h2>

              <p>
                Choose batch, department and section
                to manage student profile access.
              </p>

            </div>

          </div>


          <div className="filter-grid">


            {/* BATCH */}

            <div className="filter-field">

              <label>
                Batch
              </label>

              <ThemeDropdown
                icon={GraduationCap}
                value={selectedBatch}
                options={batchOptions}
                onChange={handleBatchChange}
                placeholder="Select Batch"
                loading={
                  loadingScheduleData
                }
                disabled={
                  loadingScheduleData
                }
              />

            </div>


            {/* DEPARTMENT */}

            <div className="filter-field">

              <label>
                Department
              </label>

              <ThemeDropdown
                icon={Building2}
                value={
                  selectedDepartment
                }
                options={
                  departmentOptions
                }
                onChange={
                  handleDepartmentChange
                }
                placeholder="Select Branch"
                loading={
                  loadingScheduleData
                }
                disabled={
                  !selectedBatch ||
                  loadingScheduleData
                }
              />

            </div>


            {/* SECTION */}

            <div className="filter-field">

              <label>
                Section
              </label>

              <ThemeDropdown
                icon={Users}
                value={
                  selectedSection
                }
                options={
                  sectionOptions
                }
                onChange={
                  handleSectionChange
                }
                placeholder="Select Section"
                loading={
                  loadingScheduleData
                }
                disabled={
                  !selectedBatch ||
                  !selectedDepartment ||
                  loadingScheduleData
                }
              />

            </div>


            {/* VIEW BUTTON */}

            <button
              type="button"
              className="load-students-button"
              disabled={
                loadingStudents ||
                loadingScheduleData ||
                !selectedBatch ||
                !selectedDepartment ||
                !selectedSection
              }
              onClick={() =>
                fetchStudents()
              }
            >

              {loadingStudents ? (
                <>
                  <span className="button-spinner" />
                  Loading...
                </>
              ) : (
                <>
                  <UserCheck size={18} />
                  Manage Students
                </>
              )}

            </button>

          </div>

        </section>

        <section className="access-card student-card">


          <div className="student-card-header">

            <div className="section-heading">

              <div className="section-heading-icon">
                <Users size={19} />
              </div>

              <div>

                <h2>
                  Student Profile Management
                </h2>

                <p>
                  Enable or disable Edit Profile
                  for individual students.
                </p>

              </div>

            </div>


            {students.length > 0 && (

              <button
                type="button"
                className="refresh-button"
                onClick={() =>
                  fetchStudents({
                    silent: true,
                  })
                }
                disabled={
                  loadingStudents
                }
                title="Refresh students"
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

            )}

          </div>



          {/* SEARCH */}

          {students.length > 0 && (

            <div className="student-toolbar">

              <div className="student-search">

                <Search
                  size={18}
                />

                <input
                  type="text"
                  value={
                    studentSearch
                  }
                  placeholder="Search name, register no, admission no or email..."
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


              <div className="student-bulk-actions">
                <button
                  type="button"
                  className="bulk-access-button enable-all"
                  disabled={
                    loadingStudents ||
                    updatingStudentId !== null ||
                    students.length === 0
                  }
                  onClick={() => handleAllStudentsAccess(true)}
                >
                  <CheckCircle2 size={15} />
                  ENABLE ALL
                </button>

                <button
                  type="button"
                  className="bulk-access-button disable-all"
                  disabled={
                    loadingStudents ||
                    updatingStudentId !== null ||
                    students.length === 0
                  }
                  onClick={() => handleAllStudentsAccess(false)}
                >
                  <XCircle size={15} />
                  DISABLE ALL
                </button>
              </div>

              <div className="student-summary">

                <Users size={15} />

                <strong>
                  {filteredStudents.length}
                </strong>

                <span>
                  Students
                </span>

              </div>

            </div>

          )}



          {/* TABLE */}

          {students.length > 0 ? (

            <>

              <div className="student-table-wrapper">

                <table className="access-table">

                  <thead>

                    <tr>

                      <th>
                        S.NO
                      </th>

                      <th>
                        STUDENT
                      </th>

                      <th>
                        REGISTER NO.
                      </th>

                      <th>
                        ADMISSION NO.
                      </th>

                      <th>
                        DEPARTMENT
                      </th>

                      <th>
                        SECTION
                      </th>

                      <th>
                        BATCH
                      </th>

                      <th>
                        PROFILE ACCESS
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {paginatedStudents.length >
                      0 ? (

                      paginatedStudents.map(
                        (
                          student,
                          index
                        ) => {

                          const updating =
                            updatingStudentId ===
                            student.id;


                          return (

                            <tr
                              key={
                                student.id ||
                                student.admissionNo ||
                                `${student.name}-${index}`
                              }
                            >

                              {/* S.NO */}

                              <td>

                                <span className="serial-number">

                                  {(
                                    currentPage -
                                    1
                                  ) *
                                    STUDENTS_PER_PAGE +
                                    index +
                                    1}

                                </span>

                              </td>


                              {/* STUDENT */}

                              <td>

                                <div className="student-identity">




                                  <div className="student-info">

                                    <strong>
                                      {student.name ||
                                        "-"}
                                    </strong>

                                    <span>
                                      {student.email ||
                                        "No email"}
                                    </span>

                                  </div>

                                </div>

                              </td>


                              {/* REGISTER */}

                              <td>

                                <span className="register-chip">

                                  {student.registerNo ||
                                    "-"}

                                </span>

                              </td>


                              {/* ADMISSION */}

                              <td>

                                <span className="normal-cell">

                                  {student.admissionNo ||
                                    "-"}

                                </span>

                              </td>


                              {/* DEPARTMENT */}

                              <td>

                                <span className="department-chip">

                                  {student.department ||
                                    selectedDepartment ||
                                    "-"}

                                </span>

                              </td>


                              {/* SECTION */}

                              <td>

                                <span className="section-chip">

                                  {student.section ||
                                    selectedSection ||
                                    "-"}

                                </span>

                              </td>


                              {/* BATCH */}

                              <td>

                                <span className="batch-chip">

                                  {student.batch ||
                                    selectedBatch ||
                                    "-"}

                                </span>

                              </td>


                              {/* ACCESS */}

                              <td>

                                <div className="access-control">

                                  <div
                                    className={`access-status ${student.editProfileEnabled
                                        ? "enabled"
                                        : "disabled"
                                      }`}
                                  >

                                    {student.editProfileEnabled ? (
                                      <>
                                        <CheckCircle2
                                          size={15}
                                        />

                                        <span>
                                          Enabled
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle
                                          size={15}
                                        />

                                        <span>
                                          Disabled
                                        </span>
                                      </>
                                    )}

                                  </div>


                                  <button
                                    type="button"
                                    className={`profile-toggle ${student.editProfileEnabled
                                        ? "active"
                                        : ""
                                      } ${updating
                                        ? "updating"
                                        : ""
                                      }`}
                                    disabled={
                                      updating
                                    }
                                    onClick={() =>
                                      handleProfileAccessToggle(
                                        student
                                      )
                                    }
                                    aria-label={
                                      student.editProfileEnabled
                                        ? "Disable Edit Profile"
                                        : "Enable Edit Profile"
                                    }
                                  >

                                    <span className="toggle-track">

                                      <span className="toggle-thumb">

                                        {updating ? (
                                          <span className="mini-spinner" />
                                        ) : student.editProfileEnabled ? (
                                          <CheckCircle2
                                            size={13}
                                          />
                                        ) : (
                                          <Power
                                            size={13}
                                          />
                                        )}

                                      </span>

                                    </span>

                                  </button>

                                </div>

                              </td>

                            </tr>

                          );

                        }
                      )

                    ) : (

                      <tr>

                        <td
                          colSpan="8"
                          className="no-results"
                        >

                          <Search
                            size={32}
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

              {filteredStudents.length >
                0 && (

                  <div className="pagination">

                    <div className="pagination-info">

                      Showing{" "}

                      <strong>
                        {(currentPage - 1) *
                          STUDENTS_PER_PAGE +
                          1}
                      </strong>

                      {" - "}

                      <strong>
                        {Math.min(
                          currentPage *
                          STUDENTS_PER_PAGE,
                          filteredStudents.length
                        )}
                      </strong>

                      {" of "}

                      <strong>
                        {filteredStudents.length}
                      </strong>

                    </div>


                    <div className="pagination-controls">

                      <button
                        type="button"
                        disabled={
                          currentPage ===
                          1
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

            </>

          ) : (

            <div className="student-empty-state">

              <div className="empty-icon">

                <UserCheck
                  size={34}
                />

              </div>

              <h3>
                Select a Student Group
              </h3>

              <p>
                Select batch, department and
                section above, then click
                Manage Students.
              </p>

            </div>

          )}

        </section>

        <section className="access-card academic-card">

          <div className="academic-header">

            <div className="section-heading">

              <div className="section-heading-icon academic-icon">
                <CalendarDays size={19} />
              </div>

              <div>
                <h2>
                  Academic Year Management
                </h2>

                <p>
                  Update the current academic year used by the portal.
                </p>
              </div>

            </div>

          </div>


          <div className="academic-direct-edit">

            {loadingAcademicYears ? (

              <div className="academic-direct-loading">
                <span className="button-spinner" />
                Loading academic year...
              </div>

            ) : !editingAcademicYear ? (

              <div className="academic-direct-view">

                <div className="academic-direct-left">

                  <div className="academic-direct-icon">
                    <CalendarDays size={19} />
                  </div>

                  <div className="academic-direct-content">

                    <span className="academic-direct-label">
                      Current Academic Year
                    </span>

                    <strong className="academic-direct-value">
                      {newAcademicYear || "Not configured"}
                    </strong>

                  </div>

                </div>

                <button
                  type="button"
                  className="academic-direct-edit-button"
                  onClick={() => {
                    setEditingAcademicYear(true);
                  }}
                  disabled={addingAcademicYear}
                  title="Edit academic year"
                  aria-label="Edit academic year"
                >
                  <Pencil size={16} />
                </button>

              </div>

            ) : (

              <div className="academic-direct-edit">

                <div className="academic-direct-left">

                  <div className="academic-direct-icon">
                    <CalendarDays size={19} />
                  </div>

                  <div className="academic-direct-content">

                    <span className="academic-direct-label">
                      Edit Academic Year
                    </span>

                    <div className="academic-direct-input-wrapper">

                      <input
                        autoFocus
                        type="text"
                        value={newAcademicYear}
                        placeholder="2026-2027"
                        maxLength={9}
                        inputMode="numeric"
                        aria-label="Academic year"
                        onChange={(event) => {
                          const value =
                            event.target.value.replace(
                              /[^0-9-]/g,
                              ""
                            );

                          setNewAcademicYear(value);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            handleAddAcademicYear();
                          }

                          if (event.key === "Escape") {
                            setEditingAcademicYear(false);
                            fetchAcademicYears();
                          }
                        }}
                      />

                    </div>

                    <small>
                      Format: YYYY-YYYY
                    </small>

                  </div>

                </div>

                <div className="academic-direct-actions">

                  <button
                    type="button"
                    className="academic-direct-cancel"
                    onClick={() => {
                      setEditingAcademicYear(false);
                      fetchAcademicYears();
                    }}
                    disabled={addingAcademicYear}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="academic-direct-update"
                    disabled={
                      addingAcademicYear ||
                      !newAcademicYear.trim()
                    }
                    onClick={handleAddAcademicYear}
                  >
                    {addingAcademicYear ? (
                      <>
                        <span className="button-spinner" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        Update Academic Year
                      </>
                    )}
                  </button>

                </div>

              </div>

            )}

          </div>

        </section>

        <div className="security-footer">

          <ShieldCheck
            size={16}
          />

          <span>
            Only administrators can change
            student profile access permissions.
          </span>

        </div>

      </div>

      {message && (

        <div
          className="access-message-overlay"
          onClick={
            closeMessage
          }
        >

          <div
            className={`access-message ${messageType ===
                "success"
                ? "success"
                : "error"
              }`}
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="message-icon">

              {messageType ===
                "success" ? (
                <CheckCircle2
                  size={27}
                />
              ) : (
                <AlertCircle
                  size={27}
                />
              )}

            </div>


            <div className="message-content">

              <strong>
                {messageType ===
                  "success"
                  ? "Success"
                  : "Something went wrong"}
              </strong>

              <p>
                {message}
              </p>

            </div>


            <button
              type="button"
              onClick={
                closeMessage
              }
              className="message-close"
            >

              <X size={18} />

            </button>

          </div>

        </div>

      )}

    </div>
  );
};

export default StudentProfileAccess;