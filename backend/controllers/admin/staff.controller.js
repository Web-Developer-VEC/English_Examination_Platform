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
        message: "Request body must contain a single staff object in 'data'.",
      });
    }

    const db = getDB();
    const staffCollection = db.collection("staff");

    const {
      id,
      _id,
      name,
      allowdept, // Expected format: [{ batch: "...", classes: [{ dept: "...", sec: "..." }] }]
      semester,
      email,
      phoneNo,
      photo,
    } = data;

    // 2. Required fields validation
    if (!name || !semester || !email || !phoneNo) {
      return res.status(400).json({
        success: false,
        message: "name, semester, email, and phoneNo are required.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(phoneNo).trim();

    // 3. Find existing staff
    let existingStaff = null;
    if (_id) {
      try {
        existingStaff = await staffCollection.findOne({
          _id: new ObjectId(String(_id)),
          role: "staff",
        });
      } catch (error) {
        console.log("Invalid MongoDB _id:", _id);
      }
    }
    if (!existingStaff && id) {
      existingStaff = await staffCollection.findOne({
        $or: [{ id: String(id) }, { _id: String(id) }],
        role: "staff",
      });
    }
    if (!existingStaff) {
      existingStaff = await staffCollection.findOne({
        email: normalizedEmail,
        role: "staff",
      });
    }

    // 4. Protect admin account
    const admin = await staffCollection.findOne({
      email: normalizedEmail,
      role: "admin",
    });
    if (admin) {
      return res.status(403).json({
        success: false,
        message:
          "This email belongs to the admin account and cannot be modified here.",
      });
    }

    // 5. Check for duplicate email
    const duplicateEmail = await staffCollection.findOne({
      email: normalizedEmail,
      role: "staff",
      ...(existingStaff ? { _id: { $ne: existingStaff._id } } : {}),
    });

    if (duplicateEmail) {
      return res.status(409).json({
        success: false,
        message: "Another staff member already uses this email.",
      });
    }

    // 6. Format allowdept array for nested batch groups
    const cleanAllowdept = Array.isArray(allowdept)
      ? allowdept
          .map((batchGroup) => {
            // Check if it's a valid batch group object
            if (
              !batchGroup ||
              !batchGroup.batch ||
              !Array.isArray(batchGroup.classes)
            ) {
              return null;
            }

            // Clean the classes inside the batch
            const cleanClasses = batchGroup.classes
              .filter((cls) => cls && cls.dept && cls.sec)
              .map((cls) => ({
                dept: String(cls.dept).trim(),
                sec: String(cls.sec).trim(),
              }));

            // If the batch has no valid classes, drop the entire batch
            if (cleanClasses.length === 0) {
              return null;
            }

            return {
              batch: String(batchGroup.batch).trim(),
              classes: cleanClasses,
            };
          })
          .filter(Boolean) // Filter out the nulls
      : [];

    const now = new Date();

    const staffData = {
      name: String(name).trim(),
      allowdept: cleanAllowdept,
      semester: String(semester).trim(),
      email: normalizedEmail,
      phoneNo: normalizedPhone,
      username: normalizedEmail, // Store email as username
      photo: photo || "",
      role: "staff",
      updatedAt: now,
    };

    // 7. Update existing staff
    if (existingStaff || operation === "update") {
      if (!existingStaff) {
        return res
          .status(404)
          .json({ success: false, message: "Staff member not found." });
      }

      await staffCollection.updateOne(
        { _id: existingStaff._id, role: "staff" },
        { $set: staffData },
      );

      return res.status(200).json({
        success: true,
        message: "Staff updated successfully.",
        data: { ...staffData, _id: existingStaff._id },
      });
    }

    // 8. Insert new staff
    if (operation === "insert" || !existingStaff) {
      const hashedPassword = await bcrypt.hash(normalizedPhone, SALT_ROUNDS);
      const newStaff = {
        ...staffData,
        password: hashedPassword,
        createdAt: now,
      };

      const insertResult = await staffCollection.insertOne(newStaff);

      return res.status(201).json({
        success: true,
        message: "Staff added successfully.",
        data: { ...staffData, _id: insertResult.insertedId },
      });
    }
  } catch (error) {
    console.error("UPDATE STAFF ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update staff.",
      error: error.message || "Unexpected server error.",
    });
  }
};

// =====================================================
// DELETE ONE STAFF ONLY
// =====================================================
const deleteStaff = async (req, res) => {
  try {
    // Support finding username whether it's wrapped in { data: {} } or flat in req.body
    const username = req.body?.data?.username || req.body?.username;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Staff username is required.",
      });
    }

    const db = getDB();
    const staffCollection = db.collection("staff");

    const normalizedUsername = String(username).trim().toLowerCase();

    const query = {
      username: normalizedUsername,
      role: "staff",
    };

    const result = await staffCollection.deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Staff deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE STAFF ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete staff.",
      error: error.message || "Unexpected server error.",
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
      data: staffList,
    });
  } catch (error) {
    console.error("GET STAFF ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load staff.",
      error: error.message || "Unexpected server error.",
    });
  }
};

module.exports = {
  updateStaff,
  deleteStaff,
  getStaff,
};
