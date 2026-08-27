const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { getDB } = require("../config/db");

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
            department,
            batch,
            name,
            admissionNo
        } = req.body;



        if (!username || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Name, password and role are required"
            });
        }

        if (!["student", "staff","admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be either 'student', 'staff' or 'admin'"
            });
        }

        const db = getDB();
      
        const collection = role === "student"
            ? db.collection("students")
            : db.collection("staff")
            

        // Check if username already exists
        const existingUser = await collection.findOne({ username: username });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        if (role == "student") {
            await collection.insertOne({
                username: admissionNo,
                password: dob,
                dob,
                name,
                registerNo: null,
                admissionNo,
                email,
                phone,
                department,
                year,
                section,
                batch
            });
        }
        else {
            await collection.insertOne({
                username,
                password: hashedPassword,
                name,
                email,
                phone
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

        const {
            username,
            password,
            role
        } = req.body;

        // =====================================================
        // VALIDATION
        // =====================================================

        if (!username || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Username, password and role are required"
            });
        }

        if (!["student","staff","admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be either 'student', 'staff' or 'admin'"
                
            });
        }

        const db = getDB();

        // =====================================================
        // COLLECTION
        // =====================================================

        const collection =
            role === "student"
                ? db.collection("students")
                :db.collection("staff");

        // =====================================================
        // FIND USER
        // =====================================================

        const user = await collection.findOne({
            username: username.trim()
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // =====================================================
        // PASSWORD CHECK
        // =====================================================

        let resetPass = false;

        // -----------------------------------------------------
        // STUDENT FIRST LOGIN
        // Password = DOB
        // -----------------------------------------------------

        if (role === "student") {

            if (
                password === user.password &&
                user.password === user.dob
            ) {

                resetPass = true;

            } else {

                // Student has already changed password
                const isMatch = await bcrypt.compare(
                    password,
                    user.password
                );

                if (!isMatch) {
                    return res.status(401).json({
                        success: false,
                        message: "Invalid username or password"
                    });
                }
            }

        }

        // =====================================================
        // STAFF PASSWORD
        // =====================================================

        else {

            const isMatch = await bcrypt.compare(
                password,
                user.password
            );

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid username or password"
                });
            }
        }

        // =====================================================
        // SESSION TIMES
        // =====================================================

        const loginAt = new Date();

        const expiresAt = new Date(
            loginAt.getTime() + 24 * 60 * 60 * 1000
        );

        // =====================================================
        // JWT
        // =====================================================

        const token = jwt.sign(
            {
                id: user._id.toString(),
                username: user.username,
                role: role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // =====================================================
        // STORE SESSION
        // =====================================================

        const session = {

            userId: user._id,

            username: user.username,

            role: role,

            token: token,

            loginAt: loginAt,

            expiresAt: expiresAt,

            active: true,

            logoutAt: null,

            createdAt: loginAt,

            updatedAt: loginAt

        };

        const sessionResult =
            await db.collection("sessions").insertOne(session);

        // =====================================================
        // RESPONSE
        // =====================================================

        const userData = {
            id: user._id,
            username: user.username,
            role: role,
            name: user.name 
        };

        if (role === "student") {

            userData.admissionNo = user.admissionNo;
            userData.registerNo = user.registerNo;
            userData.department = user.department;
            userData.section = user.section;
        }

        return res.status(200).json({

            success: true,

            message: "Login successful",

            token,

            sessionId: sessionResult.insertedId,

            resetPass,

            expiresAt,

            user: userData

        });

    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

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