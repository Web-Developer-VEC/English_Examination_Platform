/**
 * ============================================================================
 * EXAM DATA CLEANUP SCRIPT (REUSABLE)
 * ============================================================================
 *
 * Deletes historical exam data including:
 *  - Scheduled exams (collection: "schedule")
 *  - Student exam attempts & submissions (collection: "exam")
 *  - Login sessions (collection: "sessions")
 *  - Exam malpractice logs (collection: "malpractice")
 *  - Generated class exam reports (collection: "result")
 *
 * Filter: On and before specified cutoff date (Default: 2026-09-18 23:59:59 IST)
 *
 * USAGE (inside backend/):
 *   # Preview what will be deleted (DRY RUN - Safe, no data modified):
 *   node cleanup_exam_data.js
 *   node cleanup_exam_data.js 2026-09-18
 *
 *   # Actually delete the data (PERMANENT):
 *   node cleanup_exam_data.js --confirm
 *   node cleanup_exam_data.js 2026-09-18 --confirm
 *
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");

// Resolve dotenv from local or backend/node_modules
let dotenv;
try {
  dotenv = require("dotenv");
} catch {
  dotenv = require(path.join(__dirname, "../backend/node_modules/dotenv"));
}

// Find .env file in backend/ or parent
const envPaths = [
  path.join(__dirname, "../backend/.env"),
  path.join(__dirname, "../.env"),
  path.join(process.cwd(), "backend/.env"),
  path.join(process.cwd(), ".env"),
];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

// Resolve MongoClient & ObjectId robustly across pnpm, npm, and direct paths
let MongoClient, ObjectId;
function loadMongoDB() {
  // 1. Standard require
  try {
    return require("mongodb");
  } catch {}

  // 2. Direct pnpm path
  const pnpmPaths = [
    path.join(__dirname, "node_modules/.pnpm/mongodb@6.21.0/node_modules/mongodb"),
    path.join(__dirname, "../backend/node_modules/.pnpm/mongodb@6.21.0/node_modules/mongodb"),
  ];
  for (const p of pnpmPaths) {
    if (fs.existsSync(p)) {
      try {
        return require(p);
      } catch {}
    }
  }

  // 3. Dynamic scan in node_modules/.pnpm
  const pnpmRoots = [
    path.join(__dirname, "node_modules/.pnpm"),
    path.join(__dirname, "../backend/node_modules/.pnpm"),
  ];
  for (const root of pnpmRoots) {
    if (fs.existsSync(root)) {
      try {
        const dirs = fs.readdirSync(root);
        const mongoDir = dirs.find((d) => d.startsWith("mongodb@"));
        if (mongoDir) {
          const target = path.join(root, mongoDir, "node_modules/mongodb");
          if (fs.existsSync(target)) {
            return require(target);
          }
        }
      } catch {}
    }
  }

  // 4. Require via connect-mongo
  try {
    const connectMongoPkg = require.resolve("connect-mongo/package.json", {
      paths: [__dirname, path.join(__dirname, "../backend")],
    });
    const subRequire = require("module").createRequire(connectMongoPkg);
    return subRequire("mongodb");
  } catch {}

  throw new Error("Could not resolve 'mongodb' module. Please ensure dependencies are installed in backend.");
}

const mongoPkg = loadMongoDB();
MongoClient = mongoPkg.MongoClient;
ObjectId = mongoPkg.ObjectId;

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME || "English_Exam_Platform";

// Parse CLI arguments
const args = process.argv.slice(2);
const isConfirmed = args.includes("--confirm") || args.includes("--force");
const dateArg = args.find((arg) => /^\d{4}-\d{2}-\d{2}$/.test(arg)) ||
  args.find((arg) => arg.startsWith("--date="))?.replace("--date=", "") ||
  "2026-09-18";

// Validate Cutoff Date
if (!/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
  console.error("❌ Invalid date format. Please use YYYY-MM-DD (e.g. 2026-09-18)");
  process.exit(1);
}

// Cutoff Date string and IST End of Day timestamp
const cutoffDateStr = dateArg; // e.g. "2026-09-18"
const cutoffDateEnd = new Date(`${cutoffDateStr}T23:59:59.999+05:30`);

async function runCleanup() {
  const client = new MongoClient(mongoUri);

  try {
    console.log("====================================================================");
    console.log("             EXAM PLATFORM DATA CLEANUP UTILITY                     ");
    console.log("====================================================================");
    console.log(`📡 MongoDB URI   : ${mongoUri}`);
    console.log(`🗄️  Database Name : ${dbName}`);
    console.log(`📅 Cutoff Date   : On and before ${cutoffDateStr} (23:59:59 IST)`);
    console.log(`🕒 Cutoff UTC    : ${cutoffDateEnd.toISOString()}`);
    console.log(`⚙️  Mode          : ${isConfirmed ? "🔴 PERMANENT DELETE (--confirm)" : "🟡 DRY RUN (Preview only)"}`);
    console.log("====================================================================\n");

    await client.connect();
    const db = client.db(dbName);

    // =========================================================================
    // 1. SCHEDULE COLLECTION
    // =========================================================================
    const scheduleFilter = {
      $or: [
        { date: { $lte: cutoffDateStr } },
        { startTime: { $lte: cutoffDateEnd } },
        { createdAt: { $lte: cutoffDateEnd } },
      ],
    };

    const matchingSchedules = await db
      .collection("schedule")
      .find(scheduleFilter, { projection: { _id: 1, testcode: 1, category: 1, date: 1, cie: 1, eligibility: 1 } })
      .toArray();

    const scheduleIds = matchingSchedules.map((s) => s._id);
    const scheduleIdStrings = scheduleIds.map((id) => String(id));

    // =========================================================================
    // 2. EXAM COLLECTION (Student attempts)
    // =========================================================================
    const examFilter = {
      $or: [
        ...(scheduleIds.length > 0 ? [{ testId: { $in: scheduleIds } }] : []),
        { startedAt: { $lte: cutoffDateEnd } },
        { createdAt: { $lte: cutoffDateEnd } },
        { date: { $lte: cutoffDateStr } },
      ],
    };

    const matchingExams = await db
      .collection("exam")
      .find(examFilter, { projection: { _id: 1, testId: 1, admissionNo: 1, startedAt: 1 } })
      .toArray();

    const examIds = matchingExams.map((e) => e._id);

    // =========================================================================
    // 3. SESSIONS COLLECTION (User login sessions)
    // =========================================================================
    const sessionFilter = {
      $or: [
        { createdAt: { $lte: cutoffDateEnd } },
        { loginAt: { $lte: cutoffDateEnd } },
      ],
    };

    const sessionCount = await db.collection("sessions").countDocuments(sessionFilter);

    // =========================================================================
    // 4. MALPRACTICE COLLECTION
    // =========================================================================
    const malpracticeFilter = {
      $or: [
        ...(scheduleIds.length > 0 ? [{ testId: { $in: scheduleIds } }] : []),
        ...(examIds.length > 0 ? [{ examId: { $in: examIds } }] : []),
        { createdAt: { $lte: cutoffDateEnd } },
      ],
    };

    const malpracticeCount = await db.collection("malpractice").countDocuments(malpracticeFilter);

    // =========================================================================
    // 5. RESULT COLLECTION (Class report summaries)
    // =========================================================================
    const resultFilter = {
      $or: [
        ...(scheduleIdStrings.length > 0 ? [{ scheduleIds: { $in: scheduleIdStrings } }] : []),
        ...(scheduleIdStrings.length > 0 ? [{ lastUpdatedTestId: { $in: scheduleIdStrings } }] : []),
        { createdAt: { $lte: cutoffDateEnd } },
      ],
    };

    const resultCount = await db.collection("result").countDocuments(resultFilter);

    // =========================================================================
    // SUMMARY DISPLAY
    // =========================================================================
    console.log("📊 MATCHING RECORDS FOUND FOR DELETION:");
    console.log("--------------------------------------------------------------------");
    console.log(` 1. schedule     : ${matchingSchedules.length} scheduled exam(s)`);
    console.log(` 2. exam         : ${matchingExams.length} student attempt(s) / submission(s)`);
    console.log(` 3. sessions     : ${sessionCount} login session(s)`);
    console.log(` 4. malpractice  : ${malpracticeCount} malpractice incident log(s)`);
    console.log(` 5. result       : ${resultCount} class report summary record(s)`);
    console.log("--------------------------------------------------------------------");
    const totalRecords = matchingSchedules.length + matchingExams.length + sessionCount + malpracticeCount + resultCount;
    console.log(` Total Records   : ${totalRecords}\n`);

    if (totalRecords === 0) {
      console.log("✅ No records found matching the criteria on or before " + cutoffDateStr);
      return;
    }

    // =========================================================================
    // EXECUTION
    // =========================================================================
    if (!isConfirmed) {
      console.log("⚠️  [DRY RUN COMPLETE] No records were deleted.");
      console.log("👉 To PERMANENTLY delete these records, run the script with --confirm:");
      console.log(`   node scripts/cleanup_exam_data.js ${cutoffDateStr} --confirm\n`);
      return;
    }

    console.log("🚨 PROCEEDING WITH PERMANENT DELETION...\n");

    // 1. Delete Schedule
    let deletedSchedules = 0;
    if (matchingSchedules.length > 0) {
      const res = await db.collection("schedule").deleteMany({ _id: { $in: scheduleIds } });
      deletedSchedules = res.deletedCount;
      console.log(` ✅ Deleted ${deletedSchedules} scheduled exam(s) from 'schedule'`);
    }

    // 2. Delete Exam Attempts
    let deletedExams = 0;
    if (matchingExams.length > 0) {
      const res = await db.collection("exam").deleteMany({ _id: { $in: examIds } });
      deletedExams = res.deletedCount;
      console.log(` ✅ Deleted ${deletedExams} attempt(s) from 'exam'`);
    }

    // 3. Delete Sessions
    let deletedSessions = 0;
    if (sessionCount > 0) {
      const res = await db.collection("sessions").deleteMany(sessionFilter);
      deletedSessions = res.deletedCount;
      console.log(` ✅ Deleted ${deletedSessions} session(s) from 'sessions'`);
    }

    // 4. Delete Malpractice
    let deletedMalpractice = 0;
    if (malpracticeCount > 0) {
      const res = await db.collection("malpractice").deleteMany(malpracticeFilter);
      deletedMalpractice = res.deletedCount;
      console.log(` ✅ Deleted ${deletedMalpractice} record(s) from 'malpractice'`);
    }

    // 5. Delete Result
    let deletedResults = 0;
    if (resultCount > 0) {
      const res = await db.collection("result").deleteMany(resultFilter);
      deletedResults = res.deletedCount;
      console.log(` ✅ Deleted ${deletedResults} report(s) from 'result'`);
    }

    console.log("\n====================================================================");
    console.log(`🎉 SUCCESS: Cleaned up ${deletedSchedules + deletedExams + deletedSessions + deletedMalpractice + deletedResults} total documents on and before ${cutoffDateStr}.`);
    console.log("====================================================================\n");

  } catch (error) {
    console.error("❌ Cleanup failed with error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

runCleanup();
