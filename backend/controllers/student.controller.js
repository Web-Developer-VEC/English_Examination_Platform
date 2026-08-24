const bcrypt = require("bcrypt");
const parseStudentExcel = require("../utils/parseStudentExcel");
const { getDB } = require("../config/db");

const studentsUpload = async (req, res) => {
    try {

     

        // Parse & Validate Excel
        const parsedStudents = parseStudentExcel(
            req.files.student_data.buffer
        );

        // Prepare student documents
        const students = await Promise.all(
            parsedStudents.map(async (student) => ({
                ...student,
                username: student.admissionNo,
                password: student.dob,
                createdAt: new Date(),
                updatedAt: new Date()
            }))
        );

        const db = getDB();

        // Check for existing Admission Numbers or Register Numbers
        const existingStudents = await db
            .collection("students")
            .find({
                $or: [
                    {
                        admissionNo: {
                            $in: students.map(student => student.admissionNo)
                        }
                    },
                    {
                        registerNo: {
                            $in: students
                                .filter(student => student.registerNo)
                                .map(student => student.registerNo)
                        }
                    }
                ]
            })
            .toArray();

        if (existingStudents.length > 0) {

            const duplicateAdmissions = existingStudents
                .map(student => student.admissionNo)
                .filter(Boolean);

            const duplicateRegisters = existingStudents
                .map(student => student.registerNo)
                .filter(Boolean);

            return res.status(400).json({
                success: false,
                message: "Some students already exist.",
                duplicates: {
                    admissionNo: duplicateAdmissions,
                    registerNo: duplicateRegisters
                }
            });

        }

        // Insert students
        const result = await db
            .collection("students")
            .insertMany(students);

        return res.status(201).json({
            success: true,
            message: "Students uploaded successfully.",
            totalStudents: result.insertedCount,
            insertedIds: result.insertedIds
        });

    } catch (error) {

        console.error("Student Upload Error:", error);

        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });

    }
};

const updateStudent = async (req, res) => {
    try {

    

        const parsedStudents = parseStudentExcel(
            req.files.student_data.buffer
        );

        const db = getDB();

        let updatedCount = 0;
        const notFound = [];

        for (const student of parsedStudents) {
console.log(student);

            const result = await db.collection("students").updateOne(
                {
                    admissionNo: student.admissionNo
                },
                {
                    $set: {
                        ...student,                      // Update all Excel fields
                        username: student.registerNo,    // Username = Register Number
                        updatedAt: new Date()
                    }
                }
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
            notFound
        });

    } catch (error) {

        console.error("Student Update Error:", error);

        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });

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
                message: "Username is required."
            });
        }



        const db = getDB();

        // =====================================================
        // FIND STUDENT (EXCLUDE PASSWORD)
        // =====================================================

        const student = await db.collection("students").findOne(
            { username: username },
            { projection: { password: 0 } }
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({
            success: true,
            data: student
        });

    } catch (error) {

        console.error(
            "GET STUDENT BY USERNAME ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    studentsUpload,
    updateStudent,
    getStudentByUsername
};