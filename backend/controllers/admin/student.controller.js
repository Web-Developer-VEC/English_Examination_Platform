const bcrypt = require("bcrypt");
const parseStudentExcel = require("../../utils/parseStudentExcel");
const { getDB } = require("../../config/db");

const studentsUpload = async (req, res) => {try {
  // Parse & Validate Excel
  const parsedStudents = parseStudentExcel(req.files.student_data.buffer);

  // Prepare student documents
  const students = await Promise.all(
    parsedStudents.map(async (student) => ({
      ...student,
      studentEditEnabled: false,
      firstlogin: true,
      username: student.admissionNo,
      password: student.dob,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  );

  const db = getDB();

  // Get admission numbers and register numbers from Excel
  const admissionNos = students
    .map((student) => student.admissionNo)
    .filter(Boolean);

  const registerNos = students
    .map((student) => student.registerNo)
    .filter(Boolean);

  // Find already existing students
  const existingStudents = await db
    .collection("students")
    .find({
      $or: [
        { admissionNo: { $in: admissionNos } },
        { registerNo: { $in: registerNos } },
      ],
    })
    .project({
      admissionNo: 1,
      registerNo: 1,
    })
    .toArray();

  // Create sets for faster duplicate checking
  const existingAdmissionNos = new Set(
    existingStudents
      .map((student) => student.admissionNo)
      .filter(Boolean),
  );

  const existingRegisterNos = new Set(
    existingStudents
      .map((student) => student.registerNo)
      .filter(Boolean),
  );

  // Skip already existing students
  const newStudents = students.filter((student) => {
    const admissionExists = existingAdmissionNos.has(student.admissionNo);

    const registerExists =
      student.registerNo && existingRegisterNos.has(student.registerNo);

    return !admissionExists && !registerExists;
  });

  // If everything already exists
  if (newStudents.length === 0) {
    return res.status(200).json({
      success: true,
      message: "All students already exist. Nothing was inserted.",
      totalStudents: students.length,
      insertedStudents: 0,
      skippedStudents: students.length,
    });
  }

  // Insert only new students
  const result = await db
    .collection("students")
    .insertMany(newStudents);

  return res.status(201).json({
    success: true,
    message: "Students uploaded successfully. Existing students were skipped.",
    totalStudents: students.length,
    insertedStudents: result.insertedCount,
    skippedStudents: students.length - result.insertedCount,
    insertedIds: result.insertedIds,
  });
} catch (error) {
  console.error("Student Upload Error:", error);

  const status = error.status || 500;
  const detail = error.message || "Unexpected server error.";

  return res.status(status).json(
    status < 500
      ? {
          success: false,
          message: detail,
          error: detail,
        }
      : {
          success: false,
          message: "Failed to upload students.",
          error: detail,
        },
  );
}};

const updateStudent = async (req, res) => {
  try {
    const parsedStudents = parseStudentExcel(req.files.student_data.buffer);

    const db = getDB();

    let updatedCount = 0;
    const notFound = [];

    for (const student of parsedStudents) {
      const result = await db.collection("students").updateOne(
        {
          admissionNo: student.admissionNo,
        },
        {
          $set: {
            ...student, // Update all Excel fields
            username: student.registerNo, // Username = Register Number
            updatedAt: new Date(),
          },
        },
      );

      if (result.matchedCount > 0) {
        updatedCount++;
      } else {
        notFound.push(student.admissionNo);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Student records updated successfully.",
      updatedStudents: updatedCount,
      notFound,
    });
  } catch (error) {
    console.error("Student Update Error:", error);

    const status = error.status || 500;
    const detail = error.message || "Unexpected server error.";

    return res.status(status).json(
      status < 500
        ? {
            success: false,
            message: detail,
            error: detail,
          }
        : {
            success: false,
            message: "Failed to update students.",
            error: detail,
          },
    );
  }
};

const getStudentByUsername = async (req, res) => {
  try {
    const { username } = req.body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: "Username is required.",
      });
    }

    const db = getDB();

    // =====================================================
    // FIND STUDENT (EXCLUDE PASSWORD)
    // =====================================================

    const student = await db
      .collection("students")
      .findOne({ username: username }, { projection: { password: 0 } });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    student.studentEditEnabled = student?.studentEditEnabled
      ? student.studentEditEnabled
      : false;
    // Get student's exam results with question details
    const exams = await db
      .collection("exam")
      .aggregate([
        // Find exams for this student (exclude university exams)
        {
          $match: {
            admissionNo: student.admissionNo,
            category: { $not: { $regex: /^university$/i } },
            cie: { $not: { $regex: /^university$/i } },
          },
        },

        // Get question details using questionSetId
        {
          $lookup: {
            from: "questions",
            localField: "questionSetId",
            foreignField: "_id",
            as: "questionDetails",
          },
        },

        // Convert questionDetails array into object
        {
          $unwind: {
            path: "$questionDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Format response
        {
          $project: {
            _id: 0,

            // Test ID
            testId: 1,

            // Question Set details
            questionSetId: 1,
            questionCode: "$questionDetails.questionCode",

            // If cie exists → category = cie value
            // Example: cie = "cieI" → category = "cieI"
            category: {
              $cond: [
                {
                  $and: [{ $ne: ["$cie", null] }, { $ne: ["$cie", ""] }],
                },
                "$cie",
                "$category",
              ],
            },

            // CIE value
            cie: 1,

            // Exam type
            type: { $ifNull: ["$questionDetails.type", "audio"] },

            // Marks
            obtainedMarks: 1,
            totalMarks: 1,
          },
        },

        // Sort latest exam first
        {
          $sort: {
            startedAt: -1,
          },
        },
      ])
      .toArray();

    return res.json({
      success: true,
      student,
      totalExams: exams.length,
      exams,
    });
  } catch (error) {
    console.error("GET STUDENT BY USERNAME ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load student.",
      error: error.message || "Unexpected server error.",
    });
  }
};

// deleteStudent by admin/staff
const deleteStudent = async (req, res) => {
  try {
    const { admissionNo } = req.body;

    if (!admissionNo || !admissionNo.trim()) {
      return res.status(400).json({
        success: false,
        message: "Admission number is required.",
      });
    }

    const db = getDB();

    const result = await db.collection("students").deleteOne({
      admissionNo: admissionNo.trim(),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Student ${admissionNo.trim()} deleted successfully.`,
    });
  } catch (error) {
    console.error("DELETE STUDENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete student.",
      error: error.message || "Unexpected server error.",
    });
  }
};

const updateStudentDetailsByAdmin = async (req, res) => {
  try {
    const db = await getDB();
    const {
      originalAdmissionNo,
      admissionNo,
      name,
      registerNo,
      email,
      phone,
      gender,
      dob,
    } = req.body;

    const targetAdmissionNo = String(originalAdmissionNo || admissionNo || "").trim();

    if (!targetAdmissionNo) {
      return res.status(400).json({
        success: false,
        message: "Original admission number is required to locate the student.",
      });
    }

    const student = await db.collection("students").findOne({
      admissionNo: targetAdmissionNo,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const newAdmissionNo = admissionNo ? String(admissionNo).trim() : targetAdmissionNo;
    if (!newAdmissionNo) {
      return res.status(400).json({
        success: false,
        message: "Admission number cannot be empty.",
      });
    }

    // Check if new admission number is already taken by another student
    if (newAdmissionNo !== targetAdmissionNo) {
      const existingAdmission = await db.collection("students").findOne({
        admissionNo: newAdmissionNo,
        _id: { $ne: student._id },
      });
      if (existingAdmission) {
        return res.status(409).json({
          success: false,
          message: `Admission Number '${newAdmissionNo}' is already assigned to another student.`,
        });
      }
    }

    // Register number validation and duplicate check
    const registerNoTrimmed =
      registerNo !== undefined && registerNo !== null
        ? String(registerNo).trim()
        : "";

    if (
      registerNoTrimmed !== "" &&
      registerNoTrimmed.toLowerCase() !== "null"
    ) {
      const existingRegister = await db.collection("students").findOne({
        registerNo: registerNoTrimmed,
        _id: { $ne: student._id },
      });

      if (existingRegister) {
        return res.status(409).json({
          success: false,
          message: `Register Number '${registerNoTrimmed}' already belongs to another student.`,
        });
      }
    }

    // Username follows register number when present, otherwise admission number
    const finalRegisterNo =
      registerNoTrimmed !== "" && registerNoTrimmed.toLowerCase() !== "null"
        ? registerNoTrimmed
        : null;

    const finalUsername = finalRegisterNo ? finalRegisterNo : newAdmissionNo;

    const updateData = {
      admissionNo: newAdmissionNo,
      name: name !== undefined ? String(name).trim() : student.name,
      registerNo: finalRegisterNo,
      username: finalUsername,
      email: email !== undefined ? String(email).trim() : student.email,
      phone: phone !== undefined ? String(phone).trim() : student.phone,
      gender: gender !== undefined ? String(gender).trim() : student.gender,
      dob: dob !== undefined ? String(dob).trim() : student.dob,
      updatedAt: new Date(),
    };

    await db.collection("students").updateOne(
      { _id: student._id },
      { $set: updateData },
    );

    // If admission number was changed, cascade to exams collection to preserve history
    if (newAdmissionNo !== targetAdmissionNo) {
      await db.collection("exam").updateMany(
        { admissionNo: targetAdmissionNo },
        { $set: { admissionNo: newAdmissionNo } },
      );
    }

    const updatedStudent = await db.collection("students").findOne(
      { _id: student._id },
      { projection: { password: 0 } },
    );

    return res.status(200).json({
      success: true,
      message: "Student details updated successfully.",
      data: updatedStudent,
    });
  } catch (error) {
    console.error("ADMIN UPDATE STUDENT DETAILS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update student details.",
      error: error.message || "Unexpected server error.",
    });
  }
};

module.exports = {
  studentsUpload,
  updateStudent,
  updateStudentDetailsByAdmin,
  getStudentByUsername,
  deleteStudent,
};
