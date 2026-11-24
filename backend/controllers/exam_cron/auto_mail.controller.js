// Automail is disabled per requirements:
// Emails are sent ONLY on student submit exam or when manually triggered in student dashboard.
const checkCompletedExams = async () => {
  return {
    success: true,
    message: "Automail is disabled.",
    processedTests: 0,
  };
};

module.exports = {
  checkCompletedExams,
};
