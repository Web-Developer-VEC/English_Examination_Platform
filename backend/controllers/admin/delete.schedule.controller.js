const { ObjectId } = require("mongodb");
const { getDB } = require("../../config/db");

const OPTIONAL_LINKED_COLLECTIONS = [
  "attendance",
  "exam_session",
  "exam_sessions",
  "sessions",
  "exam_log",
  "exam_logs",
  "logs",
  "ratelog",
  "mongolog",
];

const deleteScheduledExam = async (req, res) => {
  try {
    const { testId } = req.body;
    if (!testId) {
      return res.status(400).json({
        success: false,
        message: "testId is required.",
      });
    }
    if (!ObjectId.isValid(testId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid testId.",
      });
    }

    const db = getDB();
    const scheduleId = new ObjectId(testId);
    const schedule = await db.collection("schedule").findOne({ _id: scheduleId });
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Scheduled exam not found.",
      });
    }

    const idForms = [scheduleId, String(scheduleId)];
    const examFilter = {
      $or: [{ testId: { $in: idForms } }, { test_id: { $in: idForms } }],
    };
    const examAttempts = await db
      .collection("exam")
      .find(examFilter, { projection: { _id: 1 } })
      .toArray();
    const examIds = examAttempts.map((attempt) => attempt._id);
    const examIdForms = examIds.flatMap((id) => [id, String(id)]);

    const linkedClauses = [
      { testId: { $in: idForms } },
      { test_id: { $in: idForms } },
      { scheduleId: { $in: idForms } },
      { schedule_id: { $in: idForms } },
    ];
    if (examIdForms.length) {
      linkedClauses.push(
        { examId: { $in: examIdForms } },
        { exam_id: { $in: examIdForms } },
        { attemptId: { $in: examIdForms } },
        { attempt_id: { $in: examIdForms } },
      );
    }
    const linkedFilter = { $or: linkedClauses };

    const malpracticeFilter = {
      $or: [
        { testId: { $in: idForms } },
        { test_id: { $in: idForms } },
        ...(examIdForms.length
          ? [
              { examId: { $in: examIdForms } },
              { exam_id: { $in: examIdForms } },
            ]
          : []),
      ],
    };
    const scheduleIdString = String(scheduleId);
    const resultFilter = {
      $or: [
        { scheduleIds: scheduleIdString },
        { lastUpdatedTestId: scheduleIdString },
        { testId: { $in: idForms } },
        { scheduleId: { $in: idForms } },
      ],
    };

    const deletedCounts = {};

    // Remove child records first and the schedule last. Authentication sessions
    // and general logs without a direct test/attempt reference are left intact.
    for (const collectionName of OPTIONAL_LINKED_COLLECTIONS) {
      const exists = await db
        .listCollections({ name: collectionName }, { nameOnly: true })
        .hasNext();
      if (!exists) continue;
      const result = await db.collection(collectionName).deleteMany(linkedFilter);
      deletedCounts[collectionName] = result.deletedCount;
    }

    const malpracticeResult = await db
      .collection("malpractice")
      .deleteMany(malpracticeFilter);
    deletedCounts.malpractice = malpracticeResult.deletedCount;

    const resultResult = await db.collection("result").deleteMany(resultFilter);
    deletedCounts.result = resultResult.deletedCount;

    const examResult = await db.collection("exam").deleteMany(examFilter);
    deletedCounts.exam = examResult.deletedCount;

    const scheduleResult = await db.collection("schedule").deleteOne({ _id: scheduleId });
    deletedCounts.schedule = scheduleResult.deletedCount;

    if (scheduleResult.deletedCount !== 1) {
      return res.status(409).json({
        success: false,
        message: "Related data was removed, but the schedule could not be deleted.",
        deletedCounts,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Test and directly linked records deleted successfully.",
      testId: String(scheduleId),
      deletedCounts,
    });
  } catch (error) {
    console.error("DELETE TEST AND RELATED RECORDS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete test and related records.",
      error: error.message || "Unexpected server error.",
    });
  }
};

module.exports = { deleteScheduledExam };
