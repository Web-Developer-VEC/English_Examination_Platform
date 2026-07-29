const bcrypt = require("bcrypt");
const parseStudentExcel = require("../utils/parseStudentExcel");
const { getDB } = require("../config/db");

const studentsUpload = async (req, res) => {
    try {

        // Validate middleware execution
        if (!req.uploadedData) {
            return res.status(400).json({
                success: false,
                message: "Upload failed. Please upload the student Excel file."
            });
        }

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

module.exports = {
    studentsUpload
};