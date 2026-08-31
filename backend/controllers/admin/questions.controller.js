const parseExcel = require("../../utils/parseExcel");
const { getDB } = require("../../config/db");

const questionsupload = async (req, res) => {

    try {

        const { questionCode } = req.body;
        const { audio, audioDurationMinutes } = req.uploadedData;

        

        // Validate questionCode
        if (!questionCode || !questionCode.trim()) {
            return res.status(400).json({
                success: false,
                message: "questionCode is required."
            });
        }

        // Parse & Validate Excel
        const parsedQuestions = parseExcel(
            req.files.questions.buffer
        );

        // Build MongoDB document
        const document = {

            questionCode: questionCode.trim(),

            
            audioDurationMinutes: audioDurationMinutes,

            audioUrl: audio.url,

            questions: parsedQuestions,

            createdAt: new Date().toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata"
            }),

            updatedAt: new Date().toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata"
            })

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

        return res.status(error.status || 500).json({

            success: false,

            message: error.message || "Internal Server Error"

        });

    }

};

module.exports = {
    questionsupload
};