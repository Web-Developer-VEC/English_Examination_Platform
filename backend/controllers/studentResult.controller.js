const { generateStudentExamPDF } = require("../service/student_result.service"); 

const generateStudentResult = async (req, res) => {
  try {
    const { testId, admissionNo } = req.body;

    const result = await generateStudentExamPDF(testId, admissionNo);

    return res.status(200).json(result);
  } catch (error) {
    const status =
      error.message.includes("required") || error.message.includes("Invalid")
        ? 400
        : error.message.includes("not found")
          ? 404
          : 500;

    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { generateStudentResult };
