const { getDB } = require("../config/db");

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
                message: "Academic year is required."
            });
        }

        const cleanAcademicYear = academicYear.trim();

        // =================================================
        // UPDATE ADMIN SETTINGS
        // =================================================

        await db.collection("admin_settings").updateOne(
            {
                type: "academic_year"
            },
            {
                $set: {
                    academicYear: cleanAcademicYear,
                    updatedAt: new Date()
                }
            },
            {
                upsert: true
            }
        );

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,
            message: "Academic year updated successfully.",
            data: {
                current_academic_year: cleanAcademicYear
            }
        });

    } catch (error) {

        console.error(
            "UPDATE ACADEMIC YEAR ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
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
            type: "academic_year"
        });

        // =================================================
        // GET STUDENT EDIT SETTING
        // =================================================

        const studentEdit = await db.collection("admin_settings").findOne({
            type: "student_edit"
        });

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({

            success: true,

            data: {

                academicYear:
                    academic?.academicYear || null,

                studentEditEnabled:
                    studentEdit?.enabled || false

            }

        });

    } catch (error) {

        console.error(
            "GET ADMIN SETTINGS ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Internal Server Error"

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
                message: "students must be a non-empty array."
            });
        }

        // =================================================
        // VALIDATE EACH STUDENT
        // =================================================

        for (const student of students) {

            if (
                !student.admissionNo ||
                !String(student.admissionNo).trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Every student must have an admissionNo."
                });
            }

            if (typeof student.studentEditEnabled !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message:
                        `studentEditEnabled must be true or false for admissionNo ${student.admissionNo}.`
                });
            }
        }

        // =================================================
        // UPDATE EACH STUDENT
        // =================================================

        const updatedStudents = [];
        const notFoundStudents = [];

        for (const student of students) {

            const admissionNo =
                String(student.admissionNo).trim();

            const studentEditEnabled =
                student.studentEditEnabled;

            // ---------------------------------------------
            // UPDATE STUDENT DOCUMENT
            // ---------------------------------------------

            const result = await db.collection("students").updateOne(

                {
                    admissionNo
                },

                {
                    $set: {
                        studentEditEnabled,
                        updatedAt: new Date()
                    }
                }

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
                studentEditEnabled
            });
        }

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({

            success: true,

            message:
                "Student edit permissions updated successfully.",

            data: {

                updated: updatedStudents,

                notFound: notFoundStudents,

                updatedCount: updatedStudents.length,

                notFoundCount: notFoundStudents.length

            }

        });

    } catch (error) {

        console.error(
            "UPDATE STUDENT EDIT PERMISSION ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Internal Server Error"

        });
    }
};






// =====================================================
// CHECK EDIT PERMISSION
// =====================================================

const getStudentEditPermission = async (req, res) => {

    try {

        const db = getDB();

        const {
            admissionNo
        } = req.params;

        if (!admissionNo || !admissionNo.trim()) {

            return res.status(400).json({
                success: false,
                message: "Admission Number is required."
            });

        }

        const settings =
            await db.collection("admin_settings").findOne({
                type: "student_edit_permission"
            });

        if (!settings) {

            return res.status(200).json({
                success: true,
                admissionNo: admissionNo.trim(),
                studentEditEnabled: false
            });

        }

        const studentPermission =
            settings.students?.find(
                student =>
                    student.admissionNo === admissionNo.trim()
            );

        return res.status(200).json({

            success: true,

            admissionNo: admissionNo.trim(),

            studentEditEnabled:
                studentPermission
                    ? studentPermission.studentEditEnabled
                    : false

        });

    } catch (error) {

        console.error(
            "GET STUDENT EDIT PERMISSION ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};





module.exports = {
    updateAcademicYear,
    updateStudentEditPermission,
    getStudentEditPermission,
    getAdminSettings
};