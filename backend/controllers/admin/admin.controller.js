const { getDB } = require("../../config/db");

const DEFAULT_SUBJECTS = [
  {
    subjectCode: "23EN102L",
    subjectName: "COMMUNICATIVE ENGLISH LABORATORY",
  },
  {
    subjectCode: "23EN104L",
    subjectName: "TECHNICAL ENGLISH LABORATORY",
  },
];

// =====================================================
// UPDATE ACADEMIC YEAR
// =====================================================

const updateAcademicYear = async (req, res) => {
  try {
    const db = getDB();

    const { academicYear } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!academicYear || !academicYear.trim()) {
      return res.status(400).json({
        success: false,
        message: "Academic year is required.",
      });
    }

    const cleanAcademicYear = academicYear.trim();

    // =================================================
    // UPDATE ADMIN SETTINGS
    // =================================================

    await db.collection("admin_settings").updateOne(
      {
        type: "academic_year",
      },
      {
        $set: {
          academicYear: cleanAcademicYear,
          updatedAt: new Date(),
        },
      },
      {
        upsert: true,
      },
    );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      message: "Academic year updated successfully.",
      data: {
        current_academic_year: cleanAcademicYear,
      },
    });
  } catch (error) {
    console.error("UPDATE ACADEMIC YEAR ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update academic year.",
      error: error.message || "Unexpected server error.",
    });
  }
};

// =====================================================
// ENABLE / DISABLE STUDENT EDIT
// =====================================================

// =====================================================
// GET ADMIN SETTINGS
// =====================================================

const getAdminSettings = async (req, res) => {
  try {
    const db = getDB();

    // =================================================
    // GET ACADEMIC YEAR
    // =================================================

    const academic = await db.collection("admin_settings").findOne({
      type: "academic_year",
    });

    // =================================================
    // GET STUDENT EDIT SETTING
    // =================================================

    const studentEdit = await db.collection("admin_settings").findOne({
      type: "student_edit",
    });

    // =================================================
    // GET SUBJECTS SETTING
    // =================================================

    const subjectSettings = await db.collection("admin_settings").findOne({
      type: "subjects",
    });

    const subjects =
      Array.isArray(subjectSettings?.subjects) && subjectSettings.subjects.length > 0
        ? subjectSettings.subjects
        : DEFAULT_SUBJECTS;

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      data: {
        academicYear: academic?.academicYear || null,

        studentEditEnabled: studentEdit?.enabled || false,

        subjects,
      },
    });
  } catch (error) {
    console.error("GET ADMIN SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load admin settings.",
      error: error.message || "Unexpected server error.",
    });
  }
};

// =====================================================
// GET SUBJECTS
// =====================================================

const getSubjects = async (req, res) => {
  try {
    const db = getDB();

    const subjectSettings = await db.collection("admin_settings").findOne({
      type: "subjects",
    });

    const subjects =
      Array.isArray(subjectSettings?.subjects) && subjectSettings.subjects.length > 0
        ? subjectSettings.subjects
        : DEFAULT_SUBJECTS;

    return res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    console.error("GET SUBJECTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load subjects.",
      error: error.message || "Unexpected server error.",
    });
  }
};

// =====================================================
// UPDATE SUBJECTS
// =====================================================

const updateSubjects = async (req, res) => {
  try {
    const db = getDB();
    const { subjects } = req.body;

    if (!Array.isArray(subjects)) {
      return res.status(400).json({
        success: false,
        message: "Subjects must be an array.",
      });
    }

    const cleaned = subjects
      .map((s) => ({
        subjectName: String(s.subjectName || "").trim().toUpperCase(),
        subjectCode: String(s.subjectCode || "").trim().toUpperCase(),
      }))
      .filter((s) => s.subjectName && s.subjectCode);

    if (cleaned.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one valid subject with name and code is required.",
      });
    }

    await db.collection("admin_settings").updateOne(
      {
        type: "subjects",
      },
      {
        $set: {
          subjects: cleaned,
          updatedAt: new Date(),
        },
      },
      {
        upsert: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Subjects updated successfully.",
      data: cleaned,
    });
  } catch (error) {
    console.error("UPDATE SUBJECTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update subjects.",
      error: error.message || "Unexpected server error.",
    });
  }
};

// =====================================================
// ENABLE / DISABLE EDIT FOR SPECIFIC STUDENT
// =====================================================

const updateStudentEditPermission = async (req, res) => {
  try {
    const db = getDB();

    const { students } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "students must be a non-empty array.",
      });
    }

    // =================================================
    // VALIDATE EACH STUDENT
    // =================================================

    for (const student of students) {
      if (!student.admissionNo || !String(student.admissionNo).trim()) {
        return res.status(400).json({
          success: false,
          message: "Every student must have an admissionNo.",
        });
      }

      if (
        student.editType !== undefined &&
        !["regno", "dob_email", "none"].includes(student.editType)
      ) {
        return res.status(400).json({
          success: false,
          message: `editType must be 'regno', 'dob_email', or 'none' for admissionNo ${student.admissionNo}.`,
        });
      }

      if (
        student.editType === undefined &&
        typeof student.studentEditEnabled !== "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message: `studentEditEnabled must be true or false for admissionNo ${student.admissionNo}.`,
        });
      }
    }

    // =================================================
    // UPDATE EACH STUDENT
    // =================================================

    const updatedStudents = [];
    const notFoundStudents = [];

    for (const student of students) {
      const admissionNo = String(student.admissionNo).trim();

      let finalEditType = "none";
      let finalEnabled = false;

      if (student.editType !== undefined) {
        finalEditType = student.editType;
        finalEnabled = finalEditType === "regno" || finalEditType === "dob_email";
      } else {
        finalEnabled = Boolean(student.studentEditEnabled);
        finalEditType = finalEnabled ? "regno" : "none";
      }

      // ---------------------------------------------
      // UPDATE STUDENT DOCUMENT
      // ---------------------------------------------

      const result = await db.collection("students").updateOne(
        {
          admissionNo,
        },

        {
          $set: {
            studentEditEnabled: finalEnabled,
            editType: finalEditType,
            updatedAt: new Date(),
          },
        },
      );

      // ---------------------------------------------
      // STUDENT NOT FOUND
      // ---------------------------------------------

      if (result.matchedCount === 0) {
        notFoundStudents.push(admissionNo);

        continue;
      }

      // ---------------------------------------------
      // STORE UPDATED STUDENT
      // ---------------------------------------------

      updatedStudents.push({
        admissionNo,
        studentEditEnabled: finalEnabled,
        editType: finalEditType,
      });
    }

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      message: "Student edit permissions updated successfully.",

      data: {
        updated: updatedStudents,

        notFound: notFoundStudents,

        updatedCount: updatedStudents.length,

        notFoundCount: notFoundStudents.length,
      },
    });
  } catch (error) {
    console.error("UPDATE STUDENT EDIT PERMISSION ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to update student edit permissions.",
      error: error.message || "Unexpected server error.",
    });
  }
};

// =====================================================
// CHECK EDIT PERMISSION
// =====================================================

const getStudentEditPermission = async (req, res) => {
  try {
    const db = getDB();

    const { admissionNo } = req.params;

    if (!admissionNo || !admissionNo.trim()) {
      return res.status(400).json({
        success: false,
        message: "Admission Number is required.",
      });
    }

    const settings = await db.collection("admin_settings").findOne({
      type: "student_edit_permission",
    });

    if (!settings) {
      return res.status(200).json({
        success: true,
        admissionNo: admissionNo.trim(),
        studentEditEnabled: false,
      });
    }

    const studentPermission = settings.students?.find(
      (student) => student.admissionNo === admissionNo.trim(),
    );

    return res.status(200).json({
      success: true,

      admissionNo: admissionNo.trim(),

      studentEditEnabled: studentPermission
        ? studentPermission.studentEditEnabled
        : false,
    });
  } catch (error) {
    console.error("GET STUDENT EDIT PERMISSION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin data.",
      error: error.message || "Unexpected server error.",
    });
  }
};

module.exports = {
  updateAcademicYear,
  updateStudentEditPermission,
  getStudentEditPermission,
  getAdminSettings,
  getSubjects,
  updateSubjects,
};
