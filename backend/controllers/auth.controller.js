const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { getDB } = require("../config/db"); // Change according to your project

// REGISTER
const register = async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            role,
            phone,
            year,
            dob,
            section,
            batch,
            name,
            department,
            admissionNo
        } = req.body;

        

        if (!username || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Name, password and role are required"
            });
        }

        if (!["student", "staff"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be either 'student' or 'staff'"
            });
        }

        const db = getDB();

        const collection = role === "student"
            ? db.collection("students")
            : db.collection("staff");

        // Check if admission number already exists
        const existingUser = await collection.findOne({ username: username });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
     if(role=="student"){
        await collection.insertOne({
            username:admissionNo,
            password: dob,
            dob,
            name,
            registerNo:null,
            admissionNo,
            email,
            phone,
            department,
            year,
            section,
            batch,
            createdAt: new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata"
}),
        });}
    if(role=="staff"){
        await collection.insertOne({
            username,
            password: hashedPassword,
        });
    }
        res.status(201).json({
            success: true,
            message: "User registered successfully"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


// LOGIN
const login = async (req, res) => {

    try {

        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Username, password and role are required"
            });
        }

        if (!["student", "staff"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be either 'student' or 'staff'"
            });
        }

        const db = getDB();

        const collection = role === "student"
            ? db.collection("students")
            : db.collection("staff");

        const user = await collection.findOne({ username });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {
    register,
    login
};