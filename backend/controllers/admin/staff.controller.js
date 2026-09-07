const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");
const { getDB } = require("../../config/db");

const SALT_ROUNDS = 10;

// =====================================================
// UPDATE / INSERT ONE STAFF ONLY
// =====================================================
const updateStaff = async (req, res) => {
    try {
        const { data, operation } = req.body;

        // 1. Validate payload structure
        if (!data || Array.isArray(data)) {
            return res.status(400).json({
                success: false,
                message: "Request body must contain a single staff object in 'data'."
            });
        }

        const db = getDB();
        const staffCollection = db.collection("staff");

        const {
            id,
            _id,
            name,
            allowdept, // Array of { dept, sec }
            academicYear,
            semester,
            email,
            phoneNo,
            photo
        } = data;

        // 2. Required fields validation
        if (!name || !academicYear || !semester || !email || !phoneNo) {
            return res.status(400).json({
                success: false,
                message: "name, academicYear, semester, email, and phoneNo are required."
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedPhone = String(phoneNo).trim();

        // 3. Find existing staff
        let existingStaff = null;
        if (_id) {
            try {
                existingStaff = await staffCollection.findOne({ _id: new ObjectId(String(_id)), role: "staff" });
            } catch (error) {
                console.log("Invalid MongoDB _id:", _id);
            }
        }
        if (!existingStaff && id) {
            existingStaff = await staffCollection.findOne({ $or: [{ id: String(id) }, { _id: String(id) }], role: "staff" });
        }
        if (!existingStaff) {
            existingStaff = await staffCollection.findOne({ email: normalizedEmail, role: "staff" });
        }

        // 4. Protect admin account
        const admin = await staffCollection.findOne({ email: normalizedEmail, role: "admin" });
        if (admin) {
            return res.status(403).json({
                success: false,
                message: "This email belongs to the admin account and cannot be modified here."
            });
        }

        // 5. Check for duplicate email
        const duplicateEmail = await staffCollection.findOne({
            email: normalizedEmail,
            role: "staff",
            ...(existingStaff ? { _id: { $ne: existingStaff._id } } : {})
        });

        if (duplicateEmail) {
            return res.status(409).json({
                success: false,
                message: "Another staff member already uses this email."
            });
        }

        // 6. Format allowdept array to strictly contain { dept, sec }
        const cleanAllowdept = Array.isArray(allowdept)
            ? allowdept
                .filter(item => item && item.dept && item.sec)
                .map(item => ({
                    dept: String(item.dept).trim(),
                    sec: String(item.sec).trim()
                }))
            : [];

        const now = new Date();

        const staffData = {
            name: String(name).trim(),
            allowdept: cleanAllowdept,
            academicYear: String(academicYear).trim(),
            semester: String(semester).trim(),
            email: normalizedEmail,
            phoneNo: normalizedPhone,
            username: normalizedEmail,
            photo: photo || "",
            role: "staff",
            updatedAt: now
        };

        // 7. Update existing staff
        if (existingStaff || operation === "update") {
            if (!existingStaff) {
                return res.status(404).json({ success: false, message: "Staff member not found." });
            }

            await staffCollection.updateOne(
                { _id: existingStaff._id, role: "staff" },
                { $set: staffData }
            );

            return res.status(200).json({
                success: true,
                message: "Staff updated successfully.",
                data: { ...staffData, _id: existingStaff._id }
            });
        }

        // 8. Insert new staff
        if (operation === "insert" || !existingStaff) {
            const hashedPassword = await bcrypt.hash(normalizedPhone, SALT_ROUNDS);
            const newStaff = {
                ...staffData,
                password: hashedPassword,
                createdAt: now
            };

            const insertResult = await staffCollection.insertOne(newStaff);

            return res.status(201).json({
                success: true,
                message: "Staff added successfully.",
                data: { ...staffData, _id: insertResult.insertedId }
            });
        }

    } catch (error) {
        console.error("UPDATE STAFF ERROR:", error);
        return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
    }
};

// =====================================================
// DELETE ONE STAFF ONLY
// =====================================================
const deleteStaff = async (req, res) => {
    try {
        const { username } = req.body.data;
        console.log(JSON.stringify(req.body,null,1));
        

        if (!username) {
            return res.status(400).json({ 
                success: false, 
                message: "Staff username is required." 
            });
        }

        const db = getDB();
        const staffCollection = db.collection("staff");
        
        const normalizedUsername = String(username).trim().toLowerCase();

        const query = { 
            username: normalizedUsername,
            role: "staff" 
        };

        const result = await staffCollection.deleteOne(query);

        if (result.deletedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Staff member not found." 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: "Staff deleted successfully." 
        });

    } catch (error) {
        console.error("DELETE STAFF ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || "Internal Server Error" 
        });
    }
};

// =====================================================
// GET STAFF
// =====================================================
const getStaff = async (req, res) => {
    try {
        const db = getDB();

        const staffList = await db
            .collection("staff")
            .find({ role: "staff" })
            .project({ password: 0 })
            .sort({ name: 1 })
            .toArray();

        return res.status(200).json({
            success: true,
            count: staffList.length,
            data: staffList
        });

    } catch (error) {
        console.error("GET STAFF ERROR:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    updateStaff,
    deleteStaff,
    getStaff
};