import React, { useEffect, useMemo, useState } from "react";
import {
  getScheduleFormData,
  getStaff,
  updateStaff,
} from "../../services/adminService";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Mail,
  Phone,
  UserRound,
  GraduationCap,
  Search,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import ThemeDropdown from "../../components/common/ThemeDropDown";

import "./FacultyList.css";

const EMPTY_FORM = {
  name: "",
  photo: "",
  assignments: [],
  department: "",
  section: "",
  academicYear: "",
  semester: "",
  email: "",
  phoneNo: "",
  role: "staff",
};

const FacultyList = () => {
  const [faculty, setFaculty] = useState([]);

  const [batchDepartmentSections, setBatchDepartmentSections] =
    useState([]);

  const [loadingScheduleData, setLoadingScheduleData] =
    useState(true);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [editingFaculty, setEditingFaculty] =
    useState(null);

  const [facultyToDelete, setFacultyToDelete] =
    useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [assignmentSelection, setAssignmentSelection] =
    useState("");

  const [popup, setPopup] = useState({
    show: false,
    type: "",
    message: "",
  });

  const popupTimerRef = React.useRef(null);

  const showPopup = (type, message) => {
    if (popupTimerRef.current) {
      window.clearTimeout(popupTimerRef.current);
    }

    setPopup({
      show: true,
      type,
      message,
    });

    popupTimerRef.current = window.setTimeout(() => {
      setPopup({
        show: false,
        type: "",
        message: "",
      });
    }, 3500);
  };

  const closePopup = () => {
    if (popupTimerRef.current) {
      window.clearTimeout(popupTimerRef.current);
      popupTimerRef.current = null;
    }

    setPopup({
      show: false,
      type: "",
      message: "",
    });
  };

  useEffect(() => {
    return () => {
      if (popupTimerRef.current) {
        window.clearTimeout(popupTimerRef.current);
      }
    };
  }, []);


  const normalize = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase();
  };

  const getDepartmentSectionKey = (
    department,
    section
  ) => {
    return `${normalize(department)}|${normalize(section)}`;
  };

  const makeDepartmentSectionLabel = (
    department,
    section
  ) => {
    return `${department} – Section ${section}`;
  };

  const parseDepartmentSectionOption = (value) => {
    const separator = " – Section ";

    const index = value.lastIndexOf(separator);

    if (index === -1) return null;

    return {
      department: value
        .substring(0, index)
        .trim(),

      section: value
        .substring(index + separator.length)
        .trim(),
    };
  };

  // ============================================================
  // GET ASSIGNMENTS
  // ============================================================

  const getAssignments = (member) => {
    if (Array.isArray(member?.assignments)) {
      return member.assignments
        .filter(
          (item) =>
            item?.department &&
            item?.section
        )
        .map((item) => ({
          department: String(
            item.department
          ).trim(),

          section: String(
            item.section
          ).trim(),
        }));
    }

    if (
      member?.department &&
      member?.section
    ) {
      const departments = String(
        member.department
      )
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const sections = String(
        member.section
      )
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      if (
        departments.length ===
          sections.length &&
        departments.length > 1
      ) {
        return departments.map(
          (department, index) => ({
            department,
            section: sections[index],
          })
        );
      }

      return [
        {
          department: String(
            member.department
          ).trim(),

          section: String(
            member.section
          ).trim(),
        },
      ];
    }

    return [];
  };

  const getAssignmentLabels = (member) =>
    getAssignments(member).map((item) =>
      makeDepartmentSectionLabel(
        item.department,
        item.section
      )
    );


  const fetchScheduleData = async () => {
    try {
      setLoadingScheduleData(true);

      const result = await getScheduleFormData();

      if (result?.success === false) {
        throw new Error(
          result?.message ||
          "Unable to load department and section data"
        );
      }

      console.log(
        "SCHEDULE DATA:",
        result
      );

      const rows =
        result?.data
          ?.batchDepartmentSections ||
        result?.data
          ?.departmentSections ||
        result?.data?.sections ||
        result?.data ||
        [];

      setBatchDepartmentSections(
        Array.isArray(rows)
          ? rows
          : []
      );

    } catch (error) {
      console.error(
        "Schedule data error:",
        error
      );

      showPopup(
        "error",
        error?.message ||
        "Unable to load department and section"
      );

      setBatchDepartmentSections([]);

    } finally {
      setLoadingScheduleData(false);
    }
  };
  
  const extractArray = (result, keys = []) => {
    const candidates = [
      ...keys.map((key) => result?.data?.[key]),
      result?.data,
      result?.staff,
      result?.students,
    ];

    for (const value of candidates) {
      if (Array.isArray(value)) {
        return value;
      }
    }

    return [];
  };

  const fetchStaff = async () => {
    try {

      const result = await getStaff();

      if (result?.success === false) {
        throw new Error(
          result?.message ||
          "Unable to load staff"
        );
      }

      console.log(
        "STAFF DATA:",
        result
      );

      const rows =
        result?.data?.staff ||
        result?.data?.faculty ||
        result?.data?.faculties ||
        result?.staff ||
        result?.data ||
        [];

      setFaculty(
        (
          Array.isArray(rows)
            ? rows
            : []
        ).map(
          (member, index) => ({
            ...member,

            id:
              member?.id ||
              member?._id ||
              `staff-${index}-${Date.now()}`,

            phoneNo:
              member?.phoneNo ||
              member?.phone ||
              "",

            role: "staff",
          })
        )
      );

    } catch (error) {
      console.error(
        "Get staff error:",
        error
      );

      showPopup(
        "error",
        error?.message ||
        "Unable to load staff"
      );

      setFaculty([]);

    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchScheduleData();
    fetchStaff();
  }, []);

  // ============================================================
  // ALL DEPARTMENT / SECTION OPTIONS
  // ============================================================

  const allDepartmentSectionOptions =
    useMemo(() => {
      const unique = new Map();

      batchDepartmentSections.forEach(
        (item) => {
          const department =
            String(
              item?.department || ""
            ).trim();

          const section =
            String(
              item?.section || ""
            ).trim();

          if (
            !department ||
            !section
          ) {
            return;
          }

          const key =
            getDepartmentSectionKey(
              department,
              section
            );

          if (!unique.has(key)) {
            unique.set(
              key,
              makeDepartmentSectionLabel(
                department,
                section
              )
            );
          }
        }
      );

      return Array.from(
        unique.values()
      ).sort((a, b) =>
        a.localeCompare(b)
      );
    }, [
      batchDepartmentSections,
    ]);

  // ============================================================
  // ASSIGNED DEPARTMENT / SECTION
  // ============================================================

  const assignedDepartmentSections =
    useMemo(() => {
      const assigned = new Set();

      faculty.forEach((member) => {
        getAssignments(member).forEach(
          (item) => {
            assigned.add(
              getDepartmentSectionKey(
                item.department,
                item.section
              )
            );
          }
        );
      });

      return assigned;
    }, [faculty]);

  // ============================================================
  // AVAILABLE DEPARTMENT / SECTION
  // ============================================================

  const availableDepartmentSectionOptions =
    useMemo(() => {
      return allDepartmentSectionOptions.filter(
        (option) => {
          const parsed =
            parseDepartmentSectionOption(
              option
            );

          if (!parsed) return false;

          const key =
            getDepartmentSectionKey(
              parsed.department,
              parsed.section
            );

          const isAlreadySelected =
            form.assignments.some(
              (item) =>
                getDepartmentSectionKey(
                  item.department,
                  item.section
                ) === key
            );

          if (isAlreadySelected) {
            return true;
          }

          return !assignedDepartmentSections.has(
            key
          );
        }
      );
    }, [
      allDepartmentSectionOptions,
      assignedDepartmentSections,
      form.assignments,
    ]);

  // ============================================================
  // FILTER FACULTY
  // ============================================================

  const filteredFaculty =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return faculty;
      }

      return faculty.filter(
        (member) => {
          return [
            member?.name,
            member?.department,
            member?.section,
            member?.email,
            member?.phoneNo,
          ]
            .filter(Boolean)
            .some((field) =>
              String(field)
                .toLowerCase()
                .includes(value)
            );
        }
      );
    }, [
      faculty,
      search,
    ]);

  const staff = filteredFaculty;

  // ============================================================
  // ADD
  // ============================================================

  const handleAdd = () => {
    setEditingFaculty(null);

    setAssignmentSelection("");

    setForm({
      ...EMPTY_FORM,
      role: "staff",
      academicYear: "",
      semester: "",
    });

    setModalOpen(true);
  };

  // ============================================================
  // EDIT
  // ============================================================

  const handleEdit = (member) => {
    setEditingFaculty(member);

    setAssignmentSelection("");

    setForm({
      name: member?.name || "",

      photo: member?.photo || "",

      assignments:
        getAssignments(member),

      department:
        member?.department || "",

      section:
        member?.section || "",

      academicYear:
        member?.academicYear || "",

      semester:
        member?.semester || "",

      email:
        member?.email || "",

      phoneNo:
        member?.phoneNo ||
        member?.phone ||
        "",

      role: "staff",
    });

    setModalOpen(true);
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);

    setEditingFaculty(null);

    setAssignmentSelection("");

    setForm({
      ...EMPTY_FORM,
      academicYear: "",
      semester: "",
      role: "staff",
    });
  };

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };


  const handlePhoneChange = (event) => {
    const value =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 10);

    setForm(
      (previous) => ({
        ...previous,
        phoneNo: value,
      })
    );
  };

  // ============================================================
  // ROLE
  // ============================================================

  const handleRoleChange = () => {
    setForm(
      (previous) => ({
        ...previous,
        role: "staff",
      })
    );
  };


  const handleDepartmentSectionChange = (value) => {
    const parsed = parseDepartmentSectionOption(value);

    if (!parsed) {
      return;
    }

    const key =
      getDepartmentSectionKey(
        parsed.department,
        parsed.section
      );

    setForm(
      (previous) => {
        const exists =
          previous.assignments.some(
            (item) =>
              getDepartmentSectionKey(
                item.department,
                item.section
              ) === key
          );

        if (exists) {
          return previous;
        }

        const assignments = [
          ...previous.assignments,
          parsed,
        ];

        return {
          ...previous,

          assignments,

          department:
            assignments
              .map(
                (item) =>
                  item.department
              )
              .join(", "),

          section:
            assignments
              .map(
                (item) =>
                  item.section
              )
              .join(", "),
        };
      }
    );

    setAssignmentSelection("");
  };

  // ============================================================
  // REMOVE DEPARTMENT / SECTION
  // ============================================================

  const removeDepartmentSection = (
    department,
    section
  ) => {
    setForm(
      (previous) => {
        const key =
          getDepartmentSectionKey(
            department,
            section
          );

        const assignments =
          previous.assignments.filter(
            (item) =>
              getDepartmentSectionKey(
                item.department,
                item.section
              ) !== key
          );

        return {
          ...previous,

          assignments,

          department:
            assignments
              .map(
                (item) =>
                  item.department
              )
              .join(", "),

          section:
            assignments
              .map(
                (item) =>
                  item.section
              )
              .join(", "),
        };
      }
    );
  };

  // ============================================================
  // BLOB TO DATA URL
  // ============================================================

  const blobToDataURL = (
    blob
  ) => {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onloadend = () => {
          resolve(
            reader.result
          );
        };

        reader.onerror =
          reject;

        reader.readAsDataURL(
          blob
        );
      }
    );
  };

  // ============================================================
  // LOAD IMAGE
  // ============================================================

  const loadImage = (
    file
  ) => {
    return new Promise(
      (resolve, reject) => {
        const url =
          URL.createObjectURL(
            file
          );

        const image =
          new Image();

        image.onload = () => {
          URL.revokeObjectURL(
            url
          );

          resolve(image);
        };

        image.onerror = () => {
          URL.revokeObjectURL(
            url
          );

          reject(
            new Error(
              "Unable to read image"
            )
          );
        };

        image.src = url;
      }
    );
  };

  // ============================================================
  // COMPRESS IMAGE
  // ============================================================

  const compressImage = async (
    file
  ) => {
    const image =
      await loadImage(file);

    let width =
      image.naturalWidth ||
      image.width;

    let height =
      image.naturalHeight ||
      image.height;



    const scale =
      Math.min(
        MAX_IMAGE_WIDTH /
        width,

        MAX_IMAGE_HEIGHT /
        height,

        1
      );

    width =
      Math.max(
        1,
        Math.round(
          width * scale
        )
      );

    height =
      Math.max(
        1,
        Math.round(
          height * scale
        )
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    const context =
      canvas.getContext(
        "2d"
      );

    if (!context) {
      throw new Error(
        "Canvas is not supported"
      );
    }

    const qualities = [
      0.8,
      0.7,
      0.6,
      0.5,
      0.4,
      0.3,
    ];

    let currentWidth =
      width;

    let currentHeight =
      height;

    for (
      let sizeAttempt = 0;
      sizeAttempt < 6;
      sizeAttempt++
    ) {
      canvas.width =
        currentWidth;

      canvas.height =
        currentHeight;

      context.clearRect(
        0,
        0,
        currentWidth,
        currentHeight
      );



      context.fillStyle =
        "#ffffff";

      context.fillRect(
        0,
        0,
        currentWidth,
        currentHeight
      );

      context.drawImage(
        image,
        0,
        0,
        currentWidth,
        currentHeight
      );

      for (
        const quality of qualities
      ) {
        const blob =
          await new Promise(
            (resolve) => {
              canvas.toBlob(
                resolve,
                "image/jpeg",
                quality
              );
            }
          );

        if (!blob) {
          continue;
        }

        const dataURL =
          await blobToDataURL(
            blob
          );

        if (
          dataURL.length <=
          TARGET_BASE64_SIZE
        ) {
          return dataURL;
        }
      }

      currentWidth =
        Math.max(
          120,
          Math.round(
            currentWidth *
            0.75
          )
        );

      currentHeight =
        Math.max(
          120,
          Math.round(
            currentHeight *
            0.75
          )
        );
    }

    throw new Error(
      "Unable to compress photo enough. Please choose another photo."
    );
  };


  const handlePhotoChange =
    async (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        showPopup(
          "error",
          "Please select a valid image"
        );

        event.target.value =
          "";

        return;
      }

      if (
        file.size >=
        MAX_ORIGINAL_IMAGE_SIZE
      ) {
        showPopup(
          "error",
          "Photo must be less than 1MB"
        );

        event.target.value =
          "";

        return;
      }

      try {
        showPopup(
          "success",
          "Compressing photo..."
        );

        const compressed =
          await compressImage(
            file
          );

        setForm(
          (previous) => ({
            ...previous,
            photo: compressed,
          })
        );

        showPopup(
          "success",
          "Photo compressed successfully"
        );
      } catch (error) {
        console.error(
          "Image compression error:",
          error
        );

        showPopup(
          "error",
          error?.message ||
          "Unable to compress photo"
        );
      } finally {
        event.target.value =
          "";
      }
    };


  const validateForm = () => {
    if (!form.name.trim()) {
      showPopup(
        "error",
        "Staff name is required"
      );

      return false;
    }

    if (!form.email.trim()) {
      showPopup(
        "error",
        "Email is required"
      );

      return false;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      showPopup(
        "error",
        "Enter a valid email address"
      );

      return false;
    }

    if (
      !/^[0-9]{10}$/.test(
        form.phoneNo
      )
    ) {
      showPopup(
        "error",
        "Enter a valid 10 digit phone number"
      );

      return false;
    }

    if (
      !Array.isArray(
        form.assignments
      ) ||
      form.assignments.length ===
        0
    ) {
      showPopup(
        "error",
        "Please select at least one department & section"
      );

      return false;
    }

    if (
      !form.academicYear.trim()
    ) {
      showPopup(
        "error",
        "Academic year is required"
      );

      return false;
    }

    if (
      !form.semester.trim()
    ) {
      showPopup(
        "error",
        "Semester is required"
      );

      return false;
    }

    return true;
  };

  // ============================================================
  // BUILD PAYLOAD
  // ============================================================

  const buildPayload = (
    operation,
    data
  ) => {
    return {
      action: "update",
      operation,
      data,
    };
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const isEditing = Boolean(editingFaculty);

      const id =
        editingFaculty?.id ||
        editingFaculty?._id ||
        null;

      const staffData = {
        name: form.name.trim(),

        assignments: form.assignments.map((item) => ({
          department: String(item.department || "").trim(),
          section: String(item.section || "").trim(),
        })),

        department: form.assignments
          .map((item) => String(item.department || "").trim())
          .filter(Boolean)
          .join(", "),

        section: form.assignments
          .map((item) => String(item.section || "").trim())
          .filter(Boolean)
          .join(", "),

        academicYear: form.academicYear.trim(),
        semester: form.semester.trim(),
        email: form.email.trim(),
        phoneNo: form.phoneNo.trim(),
        role: "staff",

        // Keep the old photo when editing unless a new photo was selected.
        photo:
          form.photo ||
          editingFaculty?.photo ||
          "",
      };

      const staffRecord = {
        ...(isEditing && id ? { id } : {}),
        ...staffData,
      };

      /*
       * IMPORTANT:
       * updateStaff is treated as a collection update by the backend.
       * Therefore ADD/UPDATE must send the complete faculty list, not
       * only the one newly-created/edited record.
       */
      let completeStaffList;

      if (isEditing) {
        completeStaffList = faculty.map((member) => {
          const memberId = member?.id || member?._id;

          return memberId === id
            ? {
                ...member,
                ...staffRecord,
                id: memberId,
                role: "staff",
              }
            : {
                ...member,
                role: "staff",
              };
        });
      } else {
        completeStaffList = [
          ...faculty.map((member) => ({
            ...member,
            role: "staff",
          })),
          {
            ...staffRecord,
            id: staffRecord.id || `staff-${Date.now()}`,
          },
        ];
      }

      const payload = {
        action: "update",
        operation: isEditing ? "update" : "insert",
        data: completeStaffList,
      };

      console.log(
        "STAFF COLLECTION PAYLOAD:",
        JSON.stringify(payload, null, 2)
      );

      const result = await updateStaff(payload);

      if (result?.success === false) {
        throw new Error(
          result?.message || "Unable to save staff"
        );
      }

      /*
       * Reload from DB after every successful save.
       * This guarantees that the UI displays exactly what the database
       * contains and prevents local state from becoming different from DB.
       */
      await fetchStaff();

      showPopup(
        "success",
        isEditing
          ? "Staff updated successfully"
          : "Staff added successfully"
      );

      closeModal();
    } catch (error) {
      console.error("Staff save error:", error);

      const status =
        error?.response?.status ||
        error?.status;

      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error;

      showPopup(
        "error",
        status === 413
          ? serverMessage ||
            "Photo/data is too large. Please choose a smaller photo."
          : serverMessage ||
            error?.message ||
            "Unable to save staff"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick =
    (member) => {
      setFacultyToDelete(
        member
      );

      setDeleteModalOpen(
        true
      );
    };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async () => {
    if (!facultyToDelete) {
      return;
    }

    try {
      setSaving(true);

      const id =
        facultyToDelete?.id ||
        facultyToDelete?._id;

      /*
       * Remove only the selected faculty locally first, then send the
       * COMPLETE remaining collection to the backend.
       */
      const remainingStaff = faculty
        .filter((member) => {
          const memberId =
            member?.id ||
            member?._id;

          if (id) {
            return memberId !== id;
          }

          return !(
            member?.name === facultyToDelete?.name &&
            member?.email === facultyToDelete?.email
          );
        })
        .map((member) => ({
          ...member,
          role: "staff",
        }));

      const payload = {
        action: "update",
        operation: "delete",
        data: remainingStaff,
      };

      console.log(
        "STAFF DELETE COLLECTION PAYLOAD:",
        JSON.stringify(payload, null, 2)
      );

      const result = await updateStaff(payload);

      if (result?.success === false) {
        throw new Error(
          result?.message ||
            "Unable to delete staff"
        );
      }

      // Always synchronize the UI with the database.
      await fetchStaff();

      setDeleteModalOpen(false);
      setFacultyToDelete(null);

      showPopup(
        "success",
        "Staff deleted successfully"
      );
    } catch (error) {
      console.error(
        "Staff delete error:",
        error
      );

      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error;

      showPopup(
        "error",
        serverMessage ||
          error?.message ||
          "Unable to delete staff"
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // SECTION DISPLAY
  // ============================================================

  const getSectionDisplay = (
    member
  ) => {
    const assignments =
      getAssignments(member);

    if (
      assignments.length ===
      0
    ) {
      return "Not Assigned";
    }

    return assignments
      .map(
        (item) =>
          `${item.department} • Section ${item.section}`
      )
      .join("  |  ");
  };

  // ============================================================
  // FACULTY CARD
  // ============================================================

  const FacultyCard =
    ({ member }) => {
      return (
        <article className="faculty-card">

          {/* CARD TOP */}

          <div className="faculty-card-top">

            <div className="faculty-photo-wrapper">

              {member?.photo ? (
                <img
                  src={
                    member.photo
                  }
                  alt={
                    member?.name ||
                    "Faculty"
                  }
                  className="faculty-photo"
                />
              ) : (
                <div className="faculty-photo-placeholder">
                  <UserRound
                    size={32}
                  />
                </div>
              )}

            </div>

            <div className="faculty-card-actions">

              <button
                type="button"
                className="faculty-icon-btn edit"
                onClick={() =>
                  handleEdit(
                    member
                  )
                }
                title="Edit faculty"
              >
                <Pencil
                  size={16}
                />
              </button>

              <button
                type="button"
                className="faculty-icon-btn delete"
                onClick={() =>
                  handleDeleteClick(
                    member
                  )
                }
                title="Delete faculty"
              >
                <Trash2
                  size={16}
                />
              </button>

            </div>

          </div>

          {/* CARD CONTENT */}

          <div className="faculty-card-content">

            <span className="faculty-role">
              {"FACULTY"}
            </span>

            <h3>
              {member?.name ||
                "Faculty"}
            </h3>

            <div className="faculty-section">

              <GraduationCap
                size={16}
              />

              <span>
                {getSectionDisplay(
                  member
                )}
              </span>

            </div>

          </div>

        </article>
      );
    };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="faculty-page">

      <header className="faculty-header">

        <div className="faculty-header-left">

          <div className="faculty-title-icon">
            <Users
              size={25}
            />
          </div>

          <div>

            <p className="faculty-eyebrow">
              ACADEMIC MANAGEMENT
            </p>

            <h1>
              Faculty Incharge
            </h1>

            <p className="faculty-subtitle">
              Manage faculty members
              and their assigned sections.
            </p>

          </div>

        </div>

        <button
          type="button"
          className="add-faculty-btn"
          onClick={
            handleAdd
          }
          disabled={
            loadingScheduleData
          }
        >
          <Plus
            size={20}
          />

          <span>
            Add Faculty
          </span>
        </button>

      </header>

      <section className="faculty-summary">

        <div className="summary-card">

          <div className="summary-icon">
            <Users
              size={21}
            />
          </div>

          <div>

            <span>
              Total Faculty
            </span>

            <strong>
              {faculty.length}
            </strong>

          </div>

        </div>

        <div className="summary-card">

          <div className="summary-icon">
            <GraduationCap
              size={21}
            />
          </div>

          <div>

            <span>
              Assigned Sections
            </span>

            <strong>
              {
                assignedDepartmentSections.size
              }
            </strong>

          </div>

        </div>

        <div className="summary-card">

          <div className="summary-icon">
            <UserRound
              size={21}
            />
          </div>

          <div>

            <span>
              Staff
            </span>

            <strong>
              {staff.length}
            </strong>

          </div>

        </div>

        <div className="summary-card">

          <div className="summary-icon">

            <Plus
              size={21}
            />

          </div>

          <div>

            <span>
              Available Sections
            </span>

            <strong>
              {
                availableDepartmentSectionOptions.length
              }
            </strong>

          </div>

        </div>

      </section>

      <div className="faculty-toolbar">

        <div className="faculty-search">

          <Search
            size={18}
          />

          <input
            type="text"
            placeholder="Search faculty, department or section..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

          {search && (
            <button
              type="button"
              className="clear-search"
              onClick={() =>
                setSearch("")
              }
            >
              <X
                size={16}
              />
            </button>
          )}

        </div>

      </div>

      <section className="faculty-section-group">

        <div className="group-heading">

          <div>

            <span className="group-label">
              ACADEMIC TEAM
            </span>

            <h2>
              Staff Members
            </h2>

          </div>

          <span className="group-count">
            {staff.length}
          </span>

        </div>

        {staff.length > 0 ? (
          <div className="faculty-grid">

            {staff.map(
              (member) => (
                <FacultyCard
                  key={
                    member.id
                  }
                  member={
                    member
                  }
                />
              )
            )}

          </div>
        ) : (
          <div className="faculty-empty">

            <div className="empty-icon">

              <Users
                size={28}
              />

            </div>

            <h3>
              No faculty members found
            </h3>

            <p>
              {search
                ? "Try changing your search."
                : "Add your first faculty member to get started."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={
                  handleAdd
                }
                className="empty-add-btn"
              >
                <Plus
                  size={18}
                />

                Add Faculty
              </button>
            )}

          </div>
        )}

      </section>

      {/* ======================================================
          ADD / EDIT MODAL
          ====================================================== */}

      {modalOpen && (
        <div
          className="faculty-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="faculty-modal">

            {/* MODAL HEADER */}

            <div className="modal-header">

              <div>

                <span className="modal-eyebrow">
                  FACULTY MANAGEMENT
                </span>

                <h2>
                  {editingFaculty
                    ? "Edit Faculty"
                    : "Add Faculty"}
                </h2>

                <p>
                  Enter faculty details
                  and assign a section.
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
              >
                <X
                  size={21}
                />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="modal-body">

            

                {/* NAME */}

                <div className="input-wrapper">

                  <UserRound
                    size={17}
                  />

                  <input
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Faculty name"
                    autoComplete="name"
                  />

                </div>

                {/* EMAIL / PHONE */}

                <div className="form-row">

                  <div className="input-wrapper">

                    <Mail
                      size={17}
                    />

                    <input
                      type="email"
                      name="email"
                      value={
                        form.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Faculty email"
                      autoComplete="email"
                    />

                  </div>

                  <div className="input-wrapper">

                    <Phone
                      size={17}
                    />

                    <input
                      name="phoneNo"
                      value={
                        form.phoneNo
                      }
                      onChange={
                        handlePhoneChange
                      }
                      placeholder="10 digit phone number"
                      maxLength={10}
                      inputMode="numeric"
                      autoComplete="tel"
                    />

                  </div>

                </div>

                {/* ROLE */}

                <div className="form-group">

                  <label className="static-field-label">
                    Role
                  </label>

                  <div className="static-role-field">

                    <div className="static-role-icon">

                      <UserRound
                        size={17}
                      />

                    </div>

                    <div className="static-role-content">

                      <span className="static-role-value">
                        Staff
                      </span>

                    </div>

                  </div>

                </div>

                {/* ASSIGNMENT */}

                <div className="form-group faculty-assignment-group">

                  <div className="assignment-selector-card">

                    <div className="assignment-selector-header">

                      <div>

                        <label className="assignment-label">
                          Department & Section
                        </label>

                        <p className="assignment-selector-hint">
                          Select any remaining Department & Section classes
                        </p>

                      </div>

                      <span className="assignment-count-badge">

                        {form.assignments.length}{" "}

                        {form.assignments.length ===
                        1
                          ? "Class"
                          : "Classes"}

                      </span>

                    </div>

                    <ThemeDropdown
                      icon={
                        GraduationCap
                      }
                      value={
                        assignmentSelection
                      }
                      options={availableDepartmentSectionOptions.filter(
                        (option) => {
                          const parsed =
                            parseDepartmentSectionOption(
                              option
                            );

                          if (!parsed) {
                            return false;
                          }

                          return !form.assignments.some(
                            (item) =>
                              getDepartmentSectionKey(
                                item.department,
                                item.section
                              ) ===
                              getDepartmentSectionKey(
                                parsed.department,
                                parsed.section
                              )
                          );
                        }
                      )}
                      onChange={(value) => {
                        setAssignmentSelection(
                          value
                        );

                        handleDepartmentSectionChange(
                          value
                        );
                      }}
                      placeholder={
                        loadingScheduleData
                          ? "Loading Department & Section..."
                          : "Select Department & Section"
                      }
                      loading={
                        loadingScheduleData
                      }
                      disabled={
                        loadingScheduleData ||
                        saving ||
                        !availableDepartmentSectionOptions.some(
                          (option) => {
                            const parsed =
                              parseDepartmentSectionOption(
                                option
                              );

                            if (!parsed) {
                              return false;
                            }

                            return !form.assignments.some(
                              (item) =>
                                getDepartmentSectionKey(
                                  item.department,
                                  item.section
                                ) ===
                                getDepartmentSectionKey(
                                  parsed.department,
                                  parsed.section
                                )
                            );
                          }
                        )
                      }
                    />

                    {form.assignments.length >
                    0 ? (
                      <div className="selected-assignments">

                        <div className="selected-assignments-title">

                          <span>
                            Assigned Classes
                          </span>

                          <span>
                            {
                              form
                                .assignments
                                .length
                            }{" "}
                            selected
                          </span>

                        </div>

                        <div className="selected-assignment-chips">

                          {form.assignments.map(
                            (item) => (
                              <div
                                className="assignment-chip"
                                key={getDepartmentSectionKey(
                                  item.department,
                                  item.section
                                )}
                              >

                                <div className="assignment-chip-icon">

                                  <GraduationCap
                                    size={14}
                                  />

                                </div>

                                <div className="assignment-chip-content">

                                  <span className="assignment-chip-department">
                                    {
                                      item.department
                                    }
                                  </span>

                                  <span className="assignment-chip-section">
                                    Section{" "}
                                    {
                                      item.section
                                    }
                                  </span>

                                </div>

                                <button
                                  type="button"
                                  className="assignment-chip-remove"
                                  onClick={() =>
                                    removeDepartmentSection(
                                      item.department,
                                      item.section
                                    )
                                  }
                                  disabled={
                                    saving
                                  }
                                  title="Remove class"
                                  aria-label={`Remove ${item.department} Section ${item.section}`}
                                >
                                  <X
                                    size={14}
                                  />
                                </button>

                              </div>
                            )
                          )}

                        </div>

                      </div>
                    ) : (
                      <div className="assignment-empty-state">

                        <div className="assignment-empty-icon">

                          <Plus
                            size={16}
                          />

                        </div>

                        <div>

                          <strong>
                            No classes assigned
                          </strong>

                          <span>
                            Use the dropdown above to add one or more classes.
                          </span>

                        </div>

                      </div>
                    )}

                  </div>

                </div>

                {/* ACADEMIC YEAR / SEMESTER */}

                <div className="form-row academic-details-row">

                  {/* ACADEMIC YEAR */}

                  <div className="form-group academic-detail-group">

                    <label className="static-field-label">
                      Academic Year
                    </label>

                    <ThemeDropdown
                      icon={
                        GraduationCap
                      }
                      value={
                        form.academicYear
                      }
                      options={[
                        "2023-2027",
                        "2024-2028",
                      ]}
                      onChange={(value) =>
                        setForm(
                          (previous) => ({
                            ...previous,
                            academicYear:
                              value,
                          })
                        )
                      }
                      placeholder="Select Academic Year"
                      loading={false}
                      disabled={
                        saving
                      }
                    />

                  </div>

                  {/* SEMESTER */}

                  <div className="form-group academic-detail-group">

                    <label className="static-field-label">
                      Semester
                    </label>

                    <ThemeDropdown
                      icon={
                        GraduationCap
                      }
                      value={
                        form.semester
                      }
                      options={[
                        "1",
                        "2",
                      ]}
                      onChange={(value) =>
                        setForm(
                          (previous) => ({
                            ...previous,
                            semester:
                              value,
                          })
                        )
                      }
                      placeholder="Select Semester"
                      loading={false}
                      disabled={
                        saving
                      }
                    />

                  </div>

                </div>

              </div>

              {/* MODAL FOOTER */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                  disabled={
                    saving ||
                    loadingScheduleData ||
                    form.assignments.length === 0
                  }
                >

                  {saving ? (
                    <>
                      <span className="button-spinner" />

                      Saving...
                    </>
                  ) : (
                    editingFaculty
                      ? "Update Faculty"
                      : "Add Faculty"
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ======================================================
          DELETE MODAL
          ====================================================== */}

      {deleteModalOpen &&
        facultyToDelete && (
          <div
            className="faculty-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                if (!saving) {
                  setDeleteModalOpen(
                    false
                  );

                  setFacultyToDelete(
                    null
                  );
                }
              }
            }}
          >

            <div className="delete-modal">

              <div className="delete-icon">

                <Trash2
                  size={25}
                />

              </div>

              <h2>
                Delete Faculty?
              </h2>

              <p>
                Are you sure you want
                to delete{" "}

                <strong>
                  {
                    facultyToDelete.name
                  }
                </strong>
                ?
              </p>

              <div className="delete-modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    if (saving) {
                      return;
                    }

                    setDeleteModalOpen(
                      false
                    );

                    setFacultyToDelete(
                      null
                    );
                  }}
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="confirm-delete-btn"
                  onClick={
                    handleDelete
                  }
                  disabled={
                    saving
                  }
                >

                  {saving ? (
                    <>
                      <span className="button-spinner" />

                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2
                        size={17}
                      />

                      Delete
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>
        )}

      {/* ======================================================
          MESSAGE / ERROR POPUP
          ====================================================== */}

      {popup.show && (
        <div
          className="faculty-popup-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closePopup();
            }
          }}
        >
          <div
            className={`faculty-popup-card ${popup.type}`}
            role="alert"
            aria-live="polite"
          >
            <div className="faculty-popup-icon">
              {popup.type === "success" ? (
                <CheckCircle2 size={28} />
              ) : (
                <AlertCircle size={28} />
              )}
            </div>

            <div className="faculty-popup-content">
              <h3>
                {popup.type === "success"
                  ? "Success"
                  : "Something went wrong"}
              </h3>

              <p>{popup.message}</p>
            </div>

            <button
              type="button"
              className="faculty-popup-close"
              onClick={closePopup}
              aria-label="Close message"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default FacultyList;