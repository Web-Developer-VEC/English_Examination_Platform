const XLSX = require("xlsx");
const path = require("path");
const os = require("os");
const fs = require("fs");
const parseExcel = require("../utils/parseExcel");

const sampleData = [
  {
    "Question": "What is the primary theme discussed in the passage?",
    "Option A": "Technological innovation in rural areas",
    "Option B": "The historical evolution of communication",
    "Option C": "Environmental impact of urban development",
    "Option D": "Economic factors influencing global trade",
    "Answer": "The historical evolution of communication"
  },
  {
    "Question": "According to the speaker, what led to the initial breakthrough?",
    "Option A": "A sudden discovery in laboratory testing",
    "Option B": "Collaborative international research efforts",
    "Option C": "Accidental observation during fieldwork",
    "Option D": "Increased financial grants from the government",
    "Answer": "Collaborative international research efforts"
  },
  {
    "Question": "What does the word 'ephemeral' most nearly mean in this context?",
    "Option A": "Long-lasting and permanent",
    "Option B": "Short-lived and temporary",
    "Option C": "Difficult to understand",
    "Option D": "Extremely significant",
    "Answer": "Short-lived and temporary"
  },
  {
    "Question": "Which conclusion is best supported by the evidence presented?",
    "Option A": "Traditional methods will completely disappear",
    "Option B": "Further empirical studies are required",
    "Option C": "The outcome exceeded initial projections",
    "Option D": "Participants expressed strong skepticism",
    "Answer": "The outcome exceeded initial projections"
  },
  {
    "Question": "What advice does the author offer to future researchers?",
    "Option A": "Focus exclusively on qualitative data",
    "Option B": "Maintain rigorous documentation standards",
    "Option C": "Avoid multi-disciplinary partnerships",
    "Option D": "Publish findings prior to verification",
    "Answer": "Maintain rigorous documentation standards"
  }
];

// Create workbook and worksheet
const worksheet = XLSX.utils.json_to_sheet(sampleData, {
  header: ["Question", "Option A", "Option B", "Option C", "Option D", "Answer"]
});

// Set column widths for better readability in Excel
worksheet["!cols"] = [
  { wch: 60 }, // Question
  { wch: 40 }, // Option A
  { wch: 40 }, // Option B
  { wch: 40 }, // Option C
  { wch: 40 }, // Option D
  { wch: 45 }, // Answer
];

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");

// Generate buffer and validate using backend parser
const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

try {
  const parsed = parseExcel(buffer);
  console.log(`Validation succeeded! Parsed ${parsed.length} questions correctly.`);
} catch (err) {
  console.error("Validation failed:", err.message);
  process.exit(1);
}

// Write to Downloads folder
const downloadsDir = path.join(os.homedir(), "Downloads");
const targetPath = path.join(downloadsDir, "sample_questions.xlsx");

fs.writeFileSync(targetPath, buffer);
console.log(`Successfully saved sample excel to: ${targetPath}`);
