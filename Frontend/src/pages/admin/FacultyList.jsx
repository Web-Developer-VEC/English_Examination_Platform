import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

import ThemeDropdown from "../../components/common/ThemeDropDown";

import api from "../../services/api";

import "./FacultyList.css";

const GET_SCHEDULE_DATA_ENDPOINT =
  "/staff/schedule/getformdata";

const GET_STAFF_ENDPOINT =
  "/staff/getstaff";

const STAFF_UPDATE_ENDPOINT =
  "/staff/updatestaff";

const MAX_ORIGINAL_IMAGE_SIZE = 1024 * 1024;

const TARGET_BASE64_SIZE = 70 * 1024;

const MAX_IMAGE_WIDTH = 420;

const MAX_IMAGE_HEIGHT = 420;

const EMPTY_FORM = {
  name: "",
  photo: "",
  assignments: [],
  department: "",
  section: "",
  academicYear: "2023-2027",
  semester: "1",
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

  const [toast, setToast] = useState({
    show: false,
    type: "",
    message: "",
  });


  const showToast = (type, message) => {
    setToast({
      show: true,
      type,
      message,
    });

    window.setTimeout(() => {
      setToast({
        show: false,
        type: "",
        message: "",
      });
    }, 3000);
  };


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

      const response = await api.get(
        GET_SCHEDULE_DATA_ENDPOINT
      );

      const result = response.data;

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

      showToast(
        "error",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load department and section"
      );

      setBatchDepartmentSections([]);
    } finally {
      setLoadingScheduleData(false);
    }
  };

 

  const fetchStaff = async () => {
    try {
      const response = await api.get(
        GET_STAFF_ENDPOINT
      );

      const result = response.data;

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

      showToast(
        "error",
        error?.response?.data?.message ||
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
      academicYear: "2023-2027",
      semester: "1",
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
        member?.academicYear ||
        "2023-2027",

      semester:
        member?.semester || "1",

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
      academicYear: "2023-2027",
      semester: "1",
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

  // ============================================================
  // PHONE CHANGE
  // ============================================================

  const handlePhoneChange = (
    event
  ) => {
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

  // ============================================================
  // DEPARTMENT / SECTION CHANGE
  // ============================================================

  const handleDepartmentSectionChange = (
    value
  ) => {
    const parsed =
      parseDepartmentSectionOption(
        value
      );

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

  // ============================================================
  // PHOTO CHANGE
  // ============================================================

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
        showToast(
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
        showToast(
          "error",
          "Photo must be less than 1MB"
        );

        event.target.value =
          "";

        return;
      }

      try {
        showToast(
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

        showToast(
          "success",
          "Photo compressed successfully"
        );
      } catch (error) {
        console.error(
          "Image compression error:",
          error
        );

        showToast(
          "error",
          error?.message ||
            "Unable to compress photo"
        );
      } finally {
        event.target.value =
          "";
      }
    };

  // ============================================================
  // VALIDATE
  // ============================================================

  const validateForm = () => {
    if (!form.name.trim()) {
      showToast(
        "error",
        "Staff name is required"
      );

      return false;
    }

    if (!form.email.trim()) {
      showToast(
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
      showToast(
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
      showToast(
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
      showToast(
        "error",
        "Please select at least one department & section"
      );

      return false;
    }

    if (
      !form.academicYear.trim()
    ) {
      showToast(
        "error",
        "Academic year is required"
      );

      return false;
    }

    if (
      !form.semester.trim()
    ) {
      showToast(
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

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const isEditing =
        Boolean(editingFaculty);

      const staffData = {
        name: form.name.trim(),

        assignments:
          form.assignments.map(
            (item) => ({
              department:
                item.department.trim(),

              section:
                item.section.trim(),
            })
          ),

        department:
          form.assignments
            .map(
              (item) =>
                item.department.trim()
            )
            .join(", "),

        section:
          form.assignments
            .map(
              (item) =>
                item.section.trim()
            )
            .join(", "),

        academicYear:
          form.academicYear.trim(),

        semester:
          form.semester.trim(),

        email:
          form.email.trim(),

        phoneNo:
          form.phoneNo.trim(),
      };

      const id =
        editingFaculty?.id ||
        editingFaculty?._id;

      const staffRecord = {
        ...(isEditing && id
          ? { id }
          : {}),

        ...staffData,

        role: "staff",
      };

      const payload = {
        action: "update",

        operation:
          isEditing
            ? "update"
            : "insert",

        data: [
          staffRecord,
        ],
      };

      console.log(
        "STAFF UPDATE PAYLOAD:",
        payload
      );

      // ========================================================
      // IMPORTANT CHANGE:
      //
      // OLD:
      // fetch(STAFF_UPDATE_ENDPOINT, ...)
      //
      // NEW:
      // api.post(STAFF_UPDATE_ENDPOINT, payload)
      //
      // Axios interceptor automatically adds JWT token.
      // ========================================================

      let response;

      try {
        response =
          await api.post(
            STAFF_UPDATE_ENDPOINT,
            payload
          );
      } catch (error) {
        if (
          error?.response?.status ===
          413
        ) {
          throw new Error(
            "Request payload is too large."
          );
        }

        throw new Error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Unable to save staff"
        );
      }

      const result =
        response.data;

      if (
        result?.success ===
        false
      ) {
        throw new Error(
          result?.message ||
            "Unable to save staff"
        );
      }

      // ========================================================
      // UPDATE LOCAL STATE
      // ========================================================

      if (isEditing) {
        setFaculty(
          (previous) =>
            previous.map(
              (member) => {
                const memberId =
                  member?.id ||
                  member?._id;

                return memberId ===
                  id
                  ? {
                      ...member,
                      ...staffData,
                    }
                  : member;
              }
            )
        );
      } else {
        const returnedData =
          result?.data?.staff ||
          result?.data?.faculty ||
          result?.staff ||
          result?.data;

        const returned =
          Array.isArray(
            returnedData
          )
            ? returnedData[0]
            : returnedData;

        setFaculty(
          (previous) => [
            ...previous,

            {
              ...staffData,

              id:
                result?.data?.id ||
                result?.data?._id ||
                returned?.id ||
                returned?._id ||
                `staff-${Date.now()}`,

              role: "staff",

              photo:
                returned?.photo ||
                "",
            },
          ]
        );
      }

      showToast(
        "success",
        isEditing
          ? "Staff updated successfully"
          : "Staff added successfully"
      );

      closeModal();
    } catch (error) {
      console.error(
        "Staff save error:",
        error
      );

      showToast(
        "error",
        error?.response?.data
          ?.message ||
          error?.message ||
          "Unable to save staff"
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE CLICK
  // ============================================================

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

      const staffData = {
        name:
          facultyToDelete?.name ||
          "",

        department:
          facultyToDelete?.department ||
          "",

        section:
          facultyToDelete?.section ||
          "",

        academicYear:
          facultyToDelete?.academicYear ||
          "",

        semester:
          facultyToDelete?.semester ||
          "",

        email:
          facultyToDelete?.email ||
          "",

        phoneNo:
          facultyToDelete?.phoneNo ||
          facultyToDelete?.phone ||
          "",
      };

      const staffRecord = {
        ...(id
          ? { id }
          : {}),

        ...staffData,

        role: "staff",
      };

      const payload = {
        action: "update",

        operation: "delete",

        data: [
          staffRecord,
        ],
      };

      console.log(
        "STAFF DELETE PAYLOAD:",
        payload
      );

      // ========================================================
      // IMPORTANT CHANGE:
      //
      // OLD:
      // fetch(STAFF_UPDATE_ENDPOINT, ...)
      //
      // NEW:
      // api.post(STAFF_UPDATE_ENDPOINT, payload)
      //
      // Axios interceptor automatically adds JWT token.
      // ========================================================

      const response =
        await api.post(
          STAFF_UPDATE_ENDPOINT,
          payload
        );

      const result =
        response.data;

      if (
        result?.success ===
        false
      ) {
        throw new Error(
          result?.message ||
            "Unable to delete staff"
        );
      }

      setFaculty(
        (previous) =>
          previous.filter(
            (member) => {
              const memberId =
                member?.id ||
                member?._id;

              if (id) {
                return (
                  memberId !== id
                );
              }

              return !(
                member?.name ===
                  facultyToDelete?.name &&
                member?.email ===
                  facultyToDelete?.email
              );
            }
          )
      );

      setDeleteModalOpen(
        false
      );

      setFacultyToDelete(
        null
      );

      showToast(
        "success",
        "Staff deleted successfully"
      );
    } catch (error) {
      console.error(
        "Staff delete error:",
        error
      );

      showToast(
        "error",
        error?.response?.data
          ?.message ||
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
              FACULTY
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

                {/* PHOTO */}

                <div className="photo-upload-area">

                  <div className="form-photo-preview">

                    {form.photo ? (
                      <img
                        src={
                          form.photo
                        }
                        alt="Faculty preview"
                      />
                    ) : (
                      <UserRound
                        size={35}
                      />
                    )}

                  </div>

                  <div className="photo-upload-content">

                    <h4>
                      Faculty Photo
                    </h4>

                    <p>
                      JPG, PNG or WEBP
                      · Less than 1MB
                    </p>

                    <label className="upload-photo-btn">

                      <ImageIcon
                        size={16}
                      />

                      Choose Photo

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={
                          handlePhotoChange
                        }
                      />

                    </label>

                  </div>

                </div>

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

                <div className="form-row">

                  <div className="form-group">

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

                  <div className="form-group">

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
                    form.assignments
                      .length === 0
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
          TOAST
          ====================================================== */}

      {toast.show && (
        <div
          className={`faculty-toast ${toast.type}`}
        >

          <div className="toast-dot" />

          <span>
            {
              toast.message
            }
          </span>

          <button
            type="button"
            onClick={() =>
              setToast({
                show: false,
                type: "",
                message: "",
              })
            }
          >
            <X
              size={16}
            />
          </button>

        </div>
      )}

    </div>
  );
};

export default FacultyList;
