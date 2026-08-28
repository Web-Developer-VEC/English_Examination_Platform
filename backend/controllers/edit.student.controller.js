const { getDB } = require("../config/db");

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
            dob
        } = req.body;

        // =====================================================
        // VALIDATION
        // =====================================================

        if (!admissionNo || !admissionNo.trim()) {
            return res.status(400).json({
                success: false,
                message: "Admission Number is required."
            });
        }

        // =====================================================
        // FIND STUDENT
        // =====================================================

        const student = await db.collection("students").findOne({
            admissionNo: admissionNo.trim()
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }
        if(!student.studentEditEnabled){
            return res.status(403).json({
                success: false,
                message: "Student editing is currently disabled by admin."
            });
        }
        // =====================================================
        // BUILD UPDATE DATA
        // =====================================================

        const updateData = {};

        if (name !== undefined) {
            updateData.name = String(name).trim();
        }

        if (email !== undefined) {
            updateData.email = String(email).trim();
        }

        if (phone !== undefined) {
            updateData.phone = String(phone).trim();
        }

        if (gender !== undefined) {
            updateData.gender = String(gender).trim();
        }

        if (dob !== undefined) {
            updateData.dob = String(dob).trim();
        }

        // =====================================================
// REGISTER NUMBER
// =====================================================

        // =====================================================
// REGISTER NUMBER
// =====================================================

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

    // ---------------------------------------------
    // CHECK DUPLICATE REGISTER NUMBER
    // ---------------------------------------------

    const existingStudent = await db.collection("students").findOne({
        registerNo: newRegisterNo,
        admissionNo: {
            $ne: admissionNo.trim()
        }
    });

    if (existingStudent) {
        return res.status(409).json({
            success: false,
            message:
                "Register Number already belongs to another student."
        });
    }

    // ---------------------------------------------
    // UPDATE REGISTER NUMBER
    // ---------------------------------------------

    updateData.registerNo = newRegisterNo;

    // Username follows register number
    updateData.username = newRegisterNo;

} else if (registerNoProvided) {

    // registerNo was explicitly sent but empty/null/"null" —
    // clear it back to a real null, username falls back to admissionNo.

    updateData.registerNo = null;
    updateData.username = admissionNo.trim();
}
        // =====================================================
        // UPDATED TIME
        // =====================================================

        updateData.updatedAt = new Date();

        // =====================================================
        // UPDATE
        // =====================================================

        const result =
            await db.collection("students").updateOne(
                {
                    admissionNo: admissionNo.trim()
                },
                {
                    $set: updateData
                }
            );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        // =====================================================
        // GET UPDATED STUDENT
        // =====================================================

        const updatedStudent =
            await db.collection("students").findOne({
                admissionNo: admissionNo.trim()
            });

        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({
            success: true,
            message: "Student updated successfully.",
            data: updatedStudent
        });

    } catch (error) {

        console.error(
            "UPDATE STUDENT ERROR:",
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

module.exports = {
    updateStudent
};