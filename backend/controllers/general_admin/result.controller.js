const {
  generateAndSaveClassReport,
  getStoredClassReport,
  countAvailableTestsForClass,
  checkNewTestAssignedAfterReport,
} = require("../../service/class_report.service");

// ============================================================
// GENERATE / FETCH EXAM REPORT
// ============================================================

const generateExamReport = async (req, res) => {
  try {
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is required.",
      });
    }

    const {
      batch,
      department,
      section,
      cie,
      semester,
      academicYear,
      category,
      refresh,
    } = data;

    // Report categories are strictly "normal" and "university" (retest marks are included in normal)
    const normalizedCategory =
      String(category || "").trim().toLowerCase() === "university"
        ? "university"
        : "normal";

    // Restrict University category reports to administrators only
    if (normalizedCategory === "university" && req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "University examination reports are restricted to administrators only.",
      });
    }

    // No CIE for University examination
    const effectiveCie = normalizedCategory === "university" ? null : (cie || null);

    // 1. Check "result" collection first to fetch stored URL immediately
    if (!refresh) {
      const storedReport = await getStoredClassReport({
        batch,
        department,
        section,
        semester,
        category: normalizedCategory,
        cie: effectiveCie,
      });

      if (storedReport && storedReport.url) {
        // Check if any test was assigned, scheduled, or submitted AFTER the saved result timestamp
        const hasNewTestAssigned = await checkNewTestAssignedAfterReport({
          batch,
          department,
          section,
          semester,
          category: normalizedCategory,
          cie: effectiveCie,
          academicYear,
          reportUpdatedAt: storedReport.updatedAt || storedReport.createdAt,
        });

        // Count currently scheduled/conducted tests for this CIE
        const availableTestCount = await countAvailableTestsForClass({
          batch,
          department,
          section,
          semester,
          category: normalizedCategory,
          cie: effectiveCie,
          academicYear,
        });

        // If any test was assigned after the saved result or available test count has increased:
        // Regenerate the report again!
        const baselineCount =
          storedReport.scheduleCount !== undefined && storedReport.scheduleCount !== null
            ? storedReport.scheduleCount
            : storedReport.testCount;

        if (
          hasNewTestAssigned ||
          (baselineCount !== undefined &&
            baselineCount !== null &&
            availableTestCount > baselineCount)
        ) {
          console.log(
            `[CLASS REPORT] New test assigned/updated after saved result (stored count: ${baselineCount}, current count: ${availableTestCount}, hasNewTestAssigned: ${hasNewTestAssigned}). Generating report again...`
          );
        } else {
          return res.status(200).json({
            success: true,
            message: "Exam report fetched successfully from result collection.",
            data: {
              key: storedReport.key,
              url: storedReport.url,
              filename: storedReport.filename,
              totalStudents: storedReport.totalStudents,
              staff: storedReport.staff,
              category: storedReport.category,
              cie: storedReport.cie,
              semester: storedReport.semester,
              updatedAt: storedReport.updatedAt,
              fromResultCollection: true,
            },
          });
        }
      }
    }

    // 2. If not yet stored in result collection or refresh requested, generate and store
    const generatedReport = await generateAndSaveClassReport({
      batch,
      department,
      section,
      semester,
      category: normalizedCategory,
      cie: effectiveCie,
      academicYear,
    });

    return res.status(200).json({
      success: true,
      message: "Exam report generated and stored successfully.",
      data: generatedReport,
    });
  } catch (error) {
    console.error("Exam report error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate examination report.",
      error: error.message || "Unexpected server error.",
    });
  }
};

module.exports = {
  generateExamReport,
};
