const { getDB } = require("../../config/db");

const updateStudent = async (req, res) => {
  try {
    const db = await getDB();

    const {
      admissionNo,
      name,
      email,
      registerNo,
      phone,
      gender,
      dob,
      section,
    } = req.body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!admissionNo || !admissionNo.trim()) {
      return res.status(400).json({
        success: false,
        message: "Admission Number is required.",
      });
    }

    // =====================================================
    // FIND STUDENT
    // =====================================================

    const student = await db.collection("students").findOne({
      admissionNo: admissionNo.trim(),
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const isFirstLogin = Boolean(student.firstlogin);
    const editType =
      student.editType || (student.studentEditEnabled ? "regno" : "none");

    if (!student.studentEditEnabled && !isFirstLogin) {
      return res.status(403).json({
        success: false,
        message: "Student editing is currently disabled by admin.",
      });
    }

    // =====================================================
    // BUILD UPDATE DATA
    // =====================================================

    const updateData = {};

    if (isFirstLogin) {
      // ---------------------------------------------
      // FIRST LOGIN: Update full profile fields
      // ---------------------------------------------
      if (name !== undefined) updateData.name = String(name).trim();
      if (email !== undefined) updateData.email = String(email).trim();
      if (phone !== undefined) updateData.phone = String(phone).trim();
      if (gender !== undefined) updateData.gender = String(gender).trim();
      if (dob !== undefined) updateData.dob = String(dob).trim();
      if (section !== undefined) updateData.section = String(section).trim();

      const registerNoProvided = registerNo !== undefined;
      const registerNoTrimmed =
        registerNo !== null && registerNo !== undefined
          ? String(registerNo).trim()
          : "";

      if (
        registerNoProvided &&
        registerNoTrimmed !== "" &&
        registerNoTrimmed.toLowerCase() !== "null"
      ) {
        const newRegisterNo = registerNoTrimmed;
        const existingStudent = await db.collection("students").findOne({
          registerNo: newRegisterNo,
          admissionNo: { $ne: admissionNo.trim() },
        });

        if (existingStudent) {
          return res.status(409).json({
            success: false,
            message: "Register Number already belongs to another student.",
          });
        }

        updateData.registerNo = newRegisterNo;
        updateData.username = newRegisterNo;
      } else if (registerNoProvided) {
        updateData.registerNo = null;
        updateData.username = admissionNo.trim();
      }

      updateData.firstlogin = false;
    } else if (editType === "dob_email") {
      // ---------------------------------------------
      // TYPE 2: DATE (DOB) AND EMAIL ONLY EDIT
      // ---------------------------------------------
      if (email !== undefined && email !== null) {
        updateData.email = String(email).trim();
      }
      if (dob !== undefined && dob !== null) {
        updateData.dob = String(dob).trim();
      }
    } else if (editType === "regno") {
      // ---------------------------------------------
      // TYPE 1: REGISTER NUMBER ONLY EDIT
      // ---------------------------------------------
      const registerNoProvided = registerNo !== undefined;
      const registerNoTrimmed =
        registerNo !== null && registerNo !== undefined
          ? String(registerNo).trim()
          : "";

      if (
        registerNoProvided &&
        registerNoTrimmed !== "" &&
        registerNoTrimmed.toLowerCase() !== "null"
      ) {
        const newRegisterNo = registerNoTrimmed;
        const existingStudent = await db.collection("students").findOne({
          registerNo: newRegisterNo,
          admissionNo: { $ne: admissionNo.trim() },
        });

        if (existingStudent) {
          return res.status(409).json({
            success: false,
            message: "Register Number already belongs to another student.",
          });
        }

        updateData.registerNo = newRegisterNo;
        updateData.username = newRegisterNo;
      } else if (registerNoProvided) {
        updateData.registerNo = null;
        updateData.username = admissionNo.trim();
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "No active edit permission found.",
      });
    }

    // =====================================================
    // UPDATED TIME & RESET EDIT PERMISSION
    // =====================================================

    updateData.updatedAt = new Date();
    updateData.studentEditEnabled = false;
    updateData.editType = "none";

    // =====================================================
    // UPDATE
    // =====================================================

    const result = await db.collection("students").updateOne(
      {
        admissionNo: admissionNo.trim(),
      },
      {
        $set: updateData,
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // =====================================================
    // GET UPDATED STUDENT
    // =====================================================

    const updatedStudent = await db.collection("students").findOne({
      admissionNo: admissionNo.trim(),
    });

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,
      message: "Student updated successfully.",
      data: updatedStudent,
    });
  } catch (error) {
    console.error("UPDATE STUDENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update student.",
      error: error.message || "Unexpected server error.",
    });
  }
};

module.exports = {
  updateStudent,
};
