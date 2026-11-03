const parseExcel = require("../../utils/parseExcel");
const { getDB } = require("../../config/db");

const questionsupload = async (req, res) => {
  try {
    const { questionCode } = req.body;
    const { type, audio, audioDurationMinutes, passage } = req.uploadedData;

    // Validate questionCode
    if (!questionCode || !questionCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "questionCode is required.",
        error: "questionCode is required.",
      });
    }

    // Parse & Validate Excel
    const parsedQuestions = parseExcel(req.files.questions.buffer);

    // Build MongoDB document
    const document = {
      questionCode: questionCode.trim(),

      type: type || "audio",

      passage: passage || null,

      audioDurationMinutes: audioDurationMinutes || 0,

      audioUrl: audio?.url || null,

      questions: parsedQuestions,

      createdAt: new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),

      updatedAt: new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
    };

    // Get MongoDB
    const db = getDB();

    // Save document
    const result = await db.collection("questions").insertOne(document);

    // Success Response
    return res.status(201).json({
      success: true,

      message: "Questions uploaded successfully.",

      data: {
        _id: result.insertedId,

        ...document,
      },
    });
  } catch (error) {
    console.error("Questions Upload Error:", error);

    const status = error.status || 500;
    const detail = error.message || "Unexpected server error.";

    return res.status(status).json({
      success: false,
      message: status < 500 ? detail : "Failed to upload questions.",
      error: detail,
    });
  }
};

module.exports = {
  questionsupload,
};
