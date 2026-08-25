const { getDB } = require("../config/db");

// =====================================================
// UPDATE ACADEMIC YEAR
// =====================================================

const updateAcademicYear = async (req, res) => {
    try {

        const db = getDB();

        const { academicYear } = req.body;

        if (!academicYear || !academicYear.trim()) {
            return res.status(400).json({
                success: false,
                message: "Academic year is required."
            });
        }

        const result = await db.collection("settings").updateOne(
            {
                type: "academic"
            },
            {
                $set: {
                    academicYear: academicYear.trim(),
                    updatedAt: new Date()
                }
            },
            {
                upsert: true
            }
        );

        return res.status(200).json({
            success: true,
            message: "Academic year updated successfully.",
            data: {
                academicYear: academicYear.trim()
            }
        });

    } catch (error) {

        console.error("UPDATE ACADEMIC YEAR ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
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

        const academic = await db.collection("settings").findOne({
            type: "academic"
        });

        const studentEdit = await db.collection("settings").findOne({
            type: "studentEdit"
        });

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

        console.error("GET ADMIN SETTINGS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
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

            if (typeof student.editEnabled !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message:
                        `editEnabled must be true or false for admissionNo ${student.admissionNo}.`
                });
            }
        }

        // =================================================
        // FIND / CREATE SETTINGS
        // =================================================

        let settings = await db.collection("admin_settings").findOne({
            type: "student_edit_permission"
        });

        // =================================================
        // CREATE SETTINGS IF NOT EXISTS
        // =================================================

        if (!settings) {

            const studentPermissions = [];

            for (const student of students) {

                const admissionNo =
                    String(student.admissionNo).trim();

                // Check student exists
                const existingStudent =
                    await db.collection("students").findOne({
                        admissionNo
                    });

                if (!existingStudent) {
                    return res.status(404).json({
                        success: false,
                        message:
                            `Student not found: ${admissionNo}`
                    });
                }

                studentPermissions.push({
                    admissionNo,
                    editEnabled: student.editEnabled
                });
            }

            await db.collection("admin_settings").insertOne({

                type: "student_edit_permission",

                students: studentPermissions,

                updatedAt: new Date()

            });

        }

        // =================================================
        // UPDATE EXISTING SETTINGS
        // =================================================

        else {

            const existingPermissions =
                Array.isArray(settings.students)
                    ? settings.students
                    : [];

            for (const student of students) {

                const admissionNo =
                    String(student.admissionNo).trim();

                const editEnabled =
                    student.editEnabled;

                // -----------------------------------------
                // CHECK STUDENT EXISTS
                // -----------------------------------------

                const existingStudent =
                    await db.collection("students").findOne({
                        admissionNo
                    });

                if (!existingStudent) {
                    return res.status(404).json({
                        success: false,
                        message:
                            `Student not found: ${admissionNo}`
                    });
                }

                // -----------------------------------------
                // FIND EXISTING PERMISSION
                // -----------------------------------------

                const permissionIndex =
                    existingPermissions.findIndex(
                        item =>
                            item.admissionNo === admissionNo
                    );

                // -----------------------------------------
                // UPDATE EXISTING
                // -----------------------------------------

                if (permissionIndex !== -1) {

                    await db.collection("admin_settings").updateOne(

                        {
                            _id: settings._id
                        },

                        {
                            $set: {
                                [`students.${permissionIndex}.editEnabled`]:
                                    editEnabled,

                                updatedAt: new Date()
                            }
                        }

                    );

                }

                // -----------------------------------------
                // ADD NEW STUDENT
                // -----------------------------------------

                else {

                    await db.collection("admin_settings").updateOne(

                        {
                            _id: settings._id
                        },

                        {
                            $push: {
                                students: {
                                    admissionNo,
                                    editEnabled
                                }
                            },

                            $set: {
                                updatedAt: new Date()
                            }
                        }

                    );

                    // Keep local array updated so multiple
                    // new students in the same request work
                    existingPermissions.push({
                        admissionNo,
                        editEnabled
                    });
                }
            }
        }

        // =================================================
        // GET UPDATED SETTINGS
        // =================================================

        const updatedSettings =
            await db.collection("admin_settings").findOne({
                type: "student_edit_permission"
            });

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({

            success: true,

            message:
                "Student edit permissions updated successfully.",

            data: students.map(student => ({
                admissionNo:
                    String(student.admissionNo).trim(),

                editEnabled:
                    student.editEnabled
            })),

            settings: updatedSettings

        });

    } catch (error) {

        console.error(
            "UPDATE STUDENT EDIT PERMISSION ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message || "Internal Server Error"
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
                editEnabled: false
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

            editEnabled:
                studentPermission
                    ? studentPermission.editEnabled
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