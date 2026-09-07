const { getDB } = require("../../config/db");

const getformdata = async (req, res) => {
  try {
    const db = getDB();
    const user = req.user; // Get the user from the request (assuming your auth middleware adds this)

    // ==========================================
    // Get current academic year
    // ==========================================

    const academicYearSettings = await db.collection("admin_settings").findOne({
      type: "academic_year",
    });

    const current_academic_year = academicYearSettings?.academicYear || null;

    // ==========================================
    // Get required student fields
    // ==========================================

    const students = await db
      .collection("students")
      .find({})
      .sort({
        batch: 1,
        academicYear: 1,
        department: 1,
        section: 1,
        gender: 1,
        name: 1,
      })
      .toArray();

    const groupMap = new Map();

    students
      .filter(
        (student) => student.batch && student.department && student.section,
      )
      .forEach((student) => {
        const key = `${student.batch}_${student.department}_${student.section}`;

        if (!groupMap.has(key)) {
          groupMap.set(key, {
            batch: student.batch,
            academicYear: student.academicYear,
            department: student.department,
            section: student.section,
            students: [],
          });
        }

        if (student.username) {
          groupMap.get(key).students.push({
            username: student.username,
            name: student.name,
            gender: student.gender || "Unknown",
          });
        }
      });

    let batchDepartmentSections = [...groupMap.values()];

    // ==========================================
    // FILTER ALLOWDEPT FOR STAFF
    // ==========================================

    if (user && user.role === "staff") {
      // Find the specific staff member using their username (or email)
      const staffMember = await db.collection("staff").findOne({
        username: user.username,
        role: "staff",
      });

      if (staffMember && Array.isArray(staffMember.allowdept)) {
        // Filter the batchDepartmentSections to only include what is in allowdept
        batchDepartmentSections = batchDepartmentSections.filter((group) => {
          return staffMember.allowdept.some(
            (allowed) =>
              String(allowed.dept).toLowerCase() ===
                String(group.department).toLowerCase() &&
              String(allowed.sec).toLowerCase() ===
                String(group.section).toLowerCase(),
          );
        });
      } else {
        // If staff member has no assigned departments, return an empty array
        batchDepartmentSections = [];
      }

      const data = {
        batchDepartmentSections
      };

      // ==========================================
      // Response
      // ==========================================

      return res.status(200).json({
        success: true,
        data,
      });
    }

    // ==========================================
    // Get Tests / Questions
    // ==========================================

    const questions = await db
      .collection("questions")
      .find(
        {},
        {
          projection: {
            _id: 1,
            questionCode: 1,
          },
        },
      )
      .toArray();

    const tests = questions.map((question) => ({
      questionSetId: question._id,
      questionCode: question.questionCode,
    }));

    // ==========================================
    // Prepare response
    // ==========================================

    const data = {
      current_academic_year,
      batchDepartmentSections,
      tests,
    };

    // ==========================================
    // Response
    // ==========================================

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get Schedule Data Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getScheduledExams = async (req, res) => {
  try {
    const db = getDB();

    const exams = await db
      .collection("schedule")
      .find({})
      .sort({ startTime: 1 })
      .toArray();

    const scheduledExams = await Promise.all(
      exams.map(async (exam) => {
        const questionSet = await db.collection("questions").findOne(
          {
            _id: exam.questionSetId,
          },
          {
            projection: {
              testcode: 1,
            },
          },
        );

        return {
          examId: exam._id,
          category: exam.category,
          questionSetId: exam.questionSetId,
          testcode: exam?.testcode !== undefined ? exam.testcode : null,
          department: exam.eligibility.department,
          batch: exam.eligibility.batch,
          section: exam.eligibility.section,
          admissionNo: exam.eligibility.admissionNo || [],
          duration: exam.duration,
          startTime: exam.startTime,
          endTime: exam.endTime,
          status: exam.status,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: scheduledExams,
    });
  } catch (error) {
    console.error("Get Scheduled Exams Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getStudentsByDepartmentAndBatch = async (req, res) => {
  try {
    const { department, batch } = req.body;

    // ==========================================
    // Validate input
    // ==========================================

    if (!department || !department.trim()) {
      return res.status(400).json({
        success: false,
        message: "Department is required",
      });
    }

    if (!batch || !batch.trim()) {
      return res.status(400).json({
        success: false,
        message: "Batch is required",
      });
    }

    const db = getDB();

    // ==========================================
    // Get students
    // ==========================================

    const students = await db
      .collection("students")
      .find({
        department: department.trim(),
        batch: batch.trim(),
      })
      .sort({
        section: 1,
        name: 1,
      })
      .toArray();

    // ==========================================
    // Response
    // ==========================================

    return res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("Get Students By Department And Batch Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  getformdata,
  getScheduledExams,
  getStudentsByDepartmentAndBatch,
};
