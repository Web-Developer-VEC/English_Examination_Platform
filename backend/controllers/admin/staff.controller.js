const bcrypt = require("bcryptjs"); // npm install bcryptjs
const { getDB } = require("../../config/db");

const SALT_ROUNDS = 10;


const updateStaff = async (req, res) => {
    try {

        const { data } = req.body;
        const staffList = data;

        // =====================================================
        // VALIDATION
        // =====================================================

        if (!Array.isArray(staffList) || staffList.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Request body must be a non-empty array of staff details."
            });
        }

        const db = getDB();
        const now = new Date();

        // =====================================================
        // FIND THE ADMIN (SO WE CAN PROTECT IT)
        // =====================================================

        const admin = await db.collection("staff").findOne({
            role: "admin"
        });

        const adminEmail = admin ? admin.email : null;

        const staffDocs = [];
        const errors = [];
        const seenEmails = new Set();

        // =====================================================
        // BUILD STAFF DOCUMENTS
        // =====================================================

        for (const staff of staffList) {

            const {
                name,
                department,
                section,
                academicYear,
                semester,
                email,
                phoneNo
            } = staff;

            if (
                !name ||
                !department ||
                !section ||
                !academicYear ||
                !semester ||
                !email ||
                !phoneNo
            ) {
                errors.push({
                    email: email || null,
                    message:
                        "name, department, section, academicYear, semester, email and phoneNo are required."
                });
                continue;
            }

            const normalizedEmail = email.trim().toLowerCase();
            const normalizedPhone = String(phoneNo).trim();

            // ----------------------------
            // Never allow this endpoint to touch the admin account
            // ----------------------------
            if (adminEmail && normalizedEmail === adminEmail) {
                errors.push({
                    email: normalizedEmail,
                    message: "This email belongs to the admin account and cannot be modified here."
                });
                continue;
            }

            // ----------------------------
            // Skip duplicate emails within the same payload
            // ----------------------------
            if (seenEmails.has(normalizedEmail)) {
                errors.push({
                    email: normalizedEmail,
                    message: "Duplicate email within the submitted list."
                });
                continue;
            }
            seenEmails.add(normalizedEmail);

            const hashedPassword = await bcrypt.hash(
                normalizedPhone,
                SALT_ROUNDS
            );

            staffDocs.push({
                name: name.trim(),
                department: department.trim(),
                section: section.trim(),
                academicYear: academicYear.trim(),
                semester: semester.trim(),
                email: normalizedEmail,
                phoneNo: normalizedPhone,
                username: normalizedEmail,
                password: hashedPassword,
                role: "staff",
                createdAt: now,
                updatedAt: now
            });
        }

        if (staffDocs.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid staff records to insert.",
                errors
            });
        }

        // =====================================================
        // DELETE ALL EXISTING NON-ADMIN STAFF
        // =====================================================
        // The admin document (role: "admin") is explicitly
        // excluded and stays untouched.

        await db.collection("staff").deleteMany({
            role: { $ne: "admin" }
        });

        // =====================================================
        // INSERT ALL NEW STAFF
        // =====================================================

        const insertResult = await db
            .collection("staff")
            .insertMany(staffDocs);

        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({
            success: true,
            message: "Staff collection replaced successfully. Admin account preserved.",
            insertedCount: insertResult.insertedCount,
            failedCount: errors.length,
            errors
        });

    } catch (error) {

        console.error(
            "REPLACE ALL STAFF ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// =====================================================
// GET STAFF (ARRAY OF ALL STAFF RECORDS)
// =====================================================
const getStaff = async (req, res) => {
    try {

        const db = getDB();

        // =====================================================
        // FETCH ALL STAFF (EXCLUDE PASSWORD)
        // =====================================================

        const staffList = await db
            .collection("staff")
            .find({role:"staff"})
            .project({ password: 0 })
            .toArray();

        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({
            success: true,
            count: staffList.length,
            data: staffList
        });

    } catch (error) {

        console.error(
            "GET STAFF ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    updateStaff, getStaff
};