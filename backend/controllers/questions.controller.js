const parseExcel = require("../utils/parseExcel");
const { getDB } = require("../config/db");

const questionsupload = async (req, res) => {

    try {

        // Validate middleware execution
        if (!req.uploadedData) {
            return res.status(400).json({
                success: false,
                message: "Upload failed. Please upload both audio and Excel files."
            });
        }

        const { testcode } = req.body;
        const { audio, questions } = req.uploadedData;

        // Validate testcode
        if (!testcode || !testcode.trim()) {
            return res.status(400).json({
                success: false,
                message: "testcode is required."
            });
        }

        // Parse & Validate Excel
        const parsedQuestions = parseExcel(
            req.files.questions.buffer
        );

        // Build MongoDB document
        const document = {

            testcode: testcode.trim(),

            audioUrl: audio.url,

            questionsUrl: questions.url,

            questions: parsedQuestions,

            createdAt: new Date(),

            updatedAt: new Date()

        };

        // Get MongoDB
        const db = getDB();

        // Save document
        const result = await db
            .collection("questions")
            .insertOne(document);

        // Success Response
        return res.status(201).json({

            success: true,

            message: "Questions uploaded successfully.",

            data: {

                _id: result.insertedId,

                ...document

            }

        });

    } catch (error) {

        console.error("Questions Upload Error:", error);

        // Validation Errors
        return res.status(error.status || 500).json({

            success: false,

            message: error.message || "Internal Server Error"

        });

    }

};

module.exports = {
    questionsupload
};