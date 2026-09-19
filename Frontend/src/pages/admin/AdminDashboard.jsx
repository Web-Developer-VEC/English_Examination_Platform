import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  CalendarDays,
  Activity,
  CircleCheck,
  X,
  Users,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import {
  deleteScheduledExam,
  endScheduledExam,
  resumeStudentExam,
  getScheduleExams,
  getExistingStudents,
} from "../../services/adminService";
import ThemeDropdown from "../../components/common/ThemeDropDown";
import ConfirmModal from "../../components/common/ConfirmModal";
import { getAdminSession } from "../../utils/helpers";
import { getApiErrorMessage } from "../../utils/apiError";
import { toast } from "react-toastify";
export default function AdminDashboard() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [department, setDepartment] = useState("All");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTest, setSelectedTest] = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeUsername, setResumeUsername] = useState("");
  const [resuming, setResuming] = useState(false);
  const [resumePopup, setResumePopup] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "danger",
    onConfirm: null,
    isLoading: false,
  });
  const navigate = useNavigate();
  const adminSession = getAdminSession();
  const isAdmin = adminSession?.user.role === "admin";
  const getDynamicStatus = (startTime, endTime) => {
    if (!startTime || !endTime) {
      return "Upcoming";
    }
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (now < start) {
      return "Upcoming";
    }
    if (now >= start && now <= end) {
      return "Ongoing";
    }
    return "Completed";
  };
  useEffect(() => {
    let interval;
    let isMounted = true;
    const fetchTests = async () => {
      try {
        setError("");

        const result = await getScheduleExams();
        if (!result.success) {
          throw new Error(result.message || "Failed to fetch exam data");
        }

        const formattedTests = (result.data || []).map((exam) => ({
          id: exam.examId,

          department: exam.department || "N/A",

          category: exam.category || "N/A",

          section: exam.section || "N/A",

          date:
            exam.date ||
            (exam.startTime
              ? new Date(exam.startTime).toLocaleDateString("en-CA")
              : "N/A"),

          testCode: exam.testcode || "N/A",

          status:
            exam.status === "Completed"
              ? "Completed"
              : exam.startTime && exam.endTime
                ? getDynamicStatus(exam.startTime, exam.endTime)
                : exam.status || "Scheduled",

          questionSetId: exam.questionSetId,

          questionCode: exam.questionCode,

          startTime: exam.startTime,

          endTime: exam.endTime,

          duration: exam.duration,

          admissionNo: exam.admissionNo || [],
          students: exam.admissionNo,
          batch: exam.batch || "",
        }));

        // Prevent state updates after component unmount
        if (isMounted) {
          setTests(formattedTests);
        }
      } catch (err) {
        console.error("Error fetching scheduled exams:", err);

        if (isMounted) {
          setError(getApiErrorMessage(err, "Unable to load tests."));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchTests();

    // Refresh every 10 seconds
    interval = setInterval(fetchTests, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ==========================================================
  // SUMMARY
  // ==========================================================

  // University tests are restricted to admin only
  const visibleTests = useMemo(() => {
    if (!isAdmin) {
      return tests.filter(
        (t) => String(t.category || "").toLowerCase() !== "university",
      );
    }
    return tests;
  }, [tests, isAdmin]);

  const totalExams = visibleTests.length;

  const todaysTests = visibleTests.filter(
    (t) => t.date === new Date().toLocaleDateString("en-CA"),
  ).length;

  const activeTests = visibleTests.filter((t) => t.status === "Ongoing").length;

  const completedTests = visibleTests.filter((t) => t.status === "Completed").length;

  // ==========================================================
  // FILTERED DATA
  // ==========================================================

  const filteredTests = useMemo(() => {
    const filtered = visibleTests.filter((test) => {
      const matchDepartment =
        department === "All" || test.department === department;

      const matchCategory = category === "All" || test.category === category;

      const matchStatus = status === "All" || test.status === status;

      const matchDate = selectedDate === "" || test.date === selectedDate;

      return matchDepartment && matchCategory && matchStatus && matchDate;
    });

    // Ongoing → Upcoming → Completed
    const statusPriority = {
      Ongoing: 1,
      Upcoming: 2,
      Completed: 3,
    };

    filtered.sort((a, b) => {
      // First sort by status
      const statusDifference =
        statusPriority[a.status] - statusPriority[b.status];

      if (statusDifference !== 0) {
        return statusDifference;
      }

      // Ongoing → earliest end time first
      if (a.status === "Ongoing") {
        return new Date(a.endTime) - new Date(b.endTime);
      }

      // Upcoming → earliest start time first
      if (a.status === "Upcoming") {
        return new Date(a.startTime) - new Date(b.startTime);
      }

      // Completed → latest completed test first
      if (a.status === "Completed") {
        return new Date(b.endTime) - new Date(a.endTime);
      }

      return 0;
    });

    return filtered;
  }, [tests, department, category, status, selectedDate]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.ceil(filteredTests.length / recordsPerPage);

  const startIndex = (currentPage - 1) * recordsPerPage;

  const paginatedTests = filteredTests.slice(
    startIndex,
    startIndex + recordsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [department, category, status, selectedDate]);

  const handleCancel = (test) => {
    setConfirmModal({
      isOpen: true,
      title: "Cancel Scheduled Test?",
      message: `Are you sure you want to cancel the scheduled test for ${test.department || "All Departments"} ${test.section ? `(Sec ${test.section})` : ""}? This action cannot be undone.`,
      confirmText: "Cancel Test",
      cancelText: "Keep Test",
      type: "danger",
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          const result = await deleteScheduledExam(test.id);

          if (!result.success) {
            throw new Error(result.message || "Failed to cancel the test.");
          }

          // Remove from dashboard
          setTests((prevTests) => prevTests.filter((item) => item.id !== test.id));

          toast.success("Test cancelled successfully.");
        } catch (error) {
          console.error("Error cancelling the test:", error);
          toast.error(getApiErrorMessage(error, "Unable to cancel the test."));
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleEndTest = (test) => {
    setConfirmModal({
      isOpen: true,
      title: "End Test & Process Results?",
      message: `Are you sure you want to end this test (${test.department} - Sec ${test.section})?\n\nThis will mark the exam as completed, auto-submit ongoing attempts, and email results to students.`,
      confirmText: "End Test Now",
      cancelText: "Go Back",
      type: "warning",
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          toast.info("Ending test and processing student results...");
          const result = await endScheduledExam(test.id);

          if (!result.success) {
            throw new Error(result.message || "Failed to end the test.");
          }

          // Update locally
          setTests((prevTests) =>
            prevTests.map((item) =>
              item.id === test.id ? { ...item, status: "Completed" } : item
            )
          );

          if (selectedTest && selectedTest.id === test.id) {
            setSelectedTest((prev) =>
              prev ? { ...prev, status: "Completed" } : null
            );
          }

          toast.success(result.message || "Test ended successfully.");
        } catch (error) {
          console.error("Error ending the test:", error);
          toast.error(getApiErrorMessage(error, "Unable to end the test."));
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleResumeStudent = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!resumeUsername || !resumeUsername.trim()) {
      setResumePopup({
        type: "error",
        title: "Username Required",
        message: "Please enter the student's username, admission number, or register number to resume.",
      });
      return;
    }

    setResuming(true);
    try {
      const result = await resumeStudentExam(resumeUsername.trim());
      if (!result.success) {
        throw new Error(result.message || "Failed to resume student exam.");
      }

      setResumeUsername("");
      setShowResumeModal(false);
      setResumePopup({
        type: "success",
        title: "Exam Unlocked for Resume",
        message: result.message || "Student exam unlocked successfully!",
        student: result.student,
        testCode: result.testCode,
      });
    } catch (err) {
      console.error("Error resuming student exam:", err);
      const errMsg = getApiErrorMessage(err, "Failed to resume student exam.");
      setResumePopup({
        type: "error",
        title: "Unable to Resume Exam",
        message: errMsg,
      });
    } finally {
      setResuming(false);
    }
  };

  const handleTestClick = async (test) => {
    setSelectedTest(test);
    setStudentLoading(true);

    try {
      const result = await getExistingStudents({
        batch: test.batch,
        department: test.department,
        section: test.section,
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch students");
      }

      const students = result.data || [];

      // Only keep students assigned to this particular exam
      const assignedAdmissionNumbers = new Set(
        (test.admissionNo || []).map(String),
      );

      const examStudents = students.filter(
        (student) =>
          assignedAdmissionNumbers.has(String(student.username)) ||
          assignedAdmissionNumbers.has(String(student.admissionNo)),
      );

      setSelectedTest({
        ...test,
        students: examStudents.length > 0 ? examStudents : (test.admissionNo?.length === 0 ? students : []),
      });
    } catch (error) {
      console.error("Error fetching students:", error);

      setSelectedTest({
        ...test,
        students: [],
      });
      setError(getApiErrorMessage(error, "Unable to load students."));
    } finally {
      setStudentLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-100">
      <main className="flex-1 px-6 py-8">
        {loading && (
          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Loading tests...</p>
          </div>
        )}

        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {/* HEADER */}

        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-5">
          <div>
            <h1 className="text-3xl font-bold text-[#7a1f2b]">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-gray-500">
              Manage English Audio Listening Tests
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setResumeUsername("");
                setShowResumeModal(true);
              }}
              className="px-5 py-3 rounded-lg bg-[#7a1f2b] hover:bg-[#5e1620] text-white font-semibold transition shadow-sm flex items-center gap-2 cursor-pointer border border-[#7a1f2b]"
              title="Unlock an unsubmitted exam for a student using their username"
            >
              <RotateCcw size={18} className="text-[#FDCC03]" />
              <span>Resume Test</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate("/admin/schedule")}
                className="px-6 py-3 rounded-lg bg-[#FDCC03] hover:bg-[#7a1f2b] hover:text-white font-semibold transition"
              >
                + Schedule Test
              </button>
            )}
          </div>
        </div>

        {/* SUMMARY CARDS */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
          <SummaryCard title="Total Exams" value={totalExams} type="total" />

          <SummaryCard title="Today's Tests" value={todaysTests} type="today" />

          <SummaryCard title="Active Tests" value={activeTests} type="active" />

          <SummaryCard
            title="Completed Tests"
            value={completedTests}
            type="completed"
          />
        </div>

        {/* ==========================================================
            FILTER BAR
        ========================================================== */}

        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Filters
            </span>
            {(department !== "All" ||
              category !== "All" ||
              selectedDate !== "" ||
              status !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setDepartment("All");
                  setCategory("All");
                  setSelectedDate("");
                  setStatus("All");
                }}
                className="text-xs font-semibold text-[#800000] hover:underline flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={12} />
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {/* DEPARTMENT / BRANCH */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#000000]">
                Branch
              </label>
              <ThemeDropdown
                value={department}
                options={[
                  "All",
                  ...[...new Set(tests.map((item) => item.department))].filter(
                    Boolean,
                  ),
                ]}
                onChange={setDepartment}
                placeholder="Select Branch"
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#000000]">
                Category
              </label>
              <ThemeDropdown
                value={category}
                options={[
                  "All",
                  "Re-Test",
                  ...[...new Set(visibleTests.map((item) => item.category))]
                    .filter(Boolean)
                    .filter((item) => item !== "Re-Test"),
                ]}
                onChange={setCategory}
                placeholder="Select Category"
              />
            </div>

            {/* DATE */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#000000]">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="
                  w-full
                  h-11
                  px-3
                  rounded-lg
                  border
                  border-gray-300
                  focus:outline-none
                  focus:ring-2
                  focus:ring-yellow-300
                  focus:border-[#FDCC03]
                  text-sm
                  text-gray-700
                  bg-white
                  "
                />
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate("")}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear Date"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* STATUS */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#000000]">
                Status
              </label>
              <ThemeDropdown
                value={status}
                options={["All", "Completed", "Ongoing", "Upcoming"]}
                onChange={setStatus}
                placeholder="Select Status"
              />
            </div>
          </div>
        </div>

        {/* ==========================================================
            TABLE
        ========================================================== */}

        <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-x-auto">
          {/* TABLE HEADER */}

          <div
            className="hidden lg:grid items-center gap-4 bg-gray-50 border-b border-gray-200 px-6"
            style={{
              gridTemplateColumns:
                "2.4fr 0.7fr 1.2fr 1fr 1fr 1fr 1fr 1fr 1fr 1.1fr",
            }}
          >
            <TableHeading>Branch</TableHeading>

            <TableHeading>Section</TableHeading>

            <TableHeading>Category</TableHeading>

            <TableHeading>Date</TableHeading>

            <TableHeading>Start Time</TableHeading>

            <TableHeading>End Time</TableHeading>

            <TableHeading>Question Code</TableHeading>

            <TableHeading>Test Code</TableHeading>

            <TableHeading>Status</TableHeading>

            <TableHeading>Action</TableHeading>
          </div>

          {/* TABLE BODY */}

          {filteredTests.length === 0 ? (
            <div className="py-24 text-center">
              <h2 className="text-2xl font-bold">No Tests Found</h2>

              <p className="mt-2 text-gray-500">
                No matching records available.
              </p>
            </div>
          ) : (
            paginatedTests.map((test) => (
              <div
                key={test.id}
                onClick={() => handleTestClick(test)}
                className="
            grid
            items-center
            gap-4
            px-6
            py-5
            border-b
            border-gray-100
            hover:bg-yellow-50/40
            transition
            cursor-pointer
        "
                style={{
                  gridTemplateColumns:
                    "2.4fr 0.7fr 1.2fr 1fr 1fr 1fr 1fr 1fr 1fr 1.1fr",
                }}
              >
                {/* DEPARTMENT */}

                <div className="flex items-center justify-left">
                  <span className="font-semibold text-gray-900">
                    {test.department}
                  </span>
                </div>

                {/* SECTION */}

                <div className="flex items-center justify-center">
                  <span className="font-semibold">{test.section}</span>
                </div>

                {/* CATEGORY */}

                <div className="flex items-center justify-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {test.category}
                    </h3>
                  </div>
                </div>

                {/* DATE */}

                <div className="flex items-center justify-center text-gray-600">
                  {test.date}
                </div>

                {/* START TIME */}
                <div className="flex items-center justify-center text-gray-600">
                  {test.startTime
                    ? new Date(test.startTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "-"}
                </div>

                {/* END TIME */}
                <div className="flex items-center justify-center text-gray-600">
                  {test.endTime
                    ? new Date(test.endTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "-"}
                </div>

                {/* Question CODE */}

                <div className="flex items-center justify-center">
                  <span
                    className="
                        px-3
                        py-1
                        rounded-full
                        bg-gray-100
                        text-sm
                        font-semibold
                    "
                  >
                    {test.questionCode}
                  </span>
                </div>
                {/* TEST CODE */}

                <div className="flex items-center justify-center">
                  <span
                    className="
                        px-3
                        py-1
                        rounded-full
                        bg-gray-100
                        text-sm
                        font-semibold
                    "
                  >
                    {test.testCode}
                  </span>
                </div>

                {/* STATUS */}

                <div className="flex items-center justify-center">
                  <StatusBadge status={test.status} />
                </div>

                {/* ACTION */}

                <div className="flex items-center justify-center gap-1.5">
                  {String(test.category).toLowerCase() === "normal" &&
                    test.status !== "Completed" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndTest(test);
                        }}
                        className="
                          px-2.5
                          py-1.5
                          rounded-lg
                          text-xs
                          font-semibold
                          bg-[#7a1f2b]
                          text-white
                          hover:bg-[#5e1620]
                          shadow-sm
                          transition-all
                          duration-200
                          cursor-pointer
                          whitespace-nowrap
                        "
                        title="End test immediately and send student results"
                      >
                        End Test
                      </button>
                    )}

                  {test.status === "Upcoming" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(test);
                      }}
                      className="
                        px-2.5
                        py-1.5
                        rounded-lg
                        text-xs
                        font-semibold
                        border
                        border-red-200
                        bg-red-50
                        text-red-600
                        hover:bg-red-600
                        hover:text-white
                        transition-all
                        duration-200
                        cursor-pointer
                        whitespace-nowrap
                      "
                    >
                      Cancel
                    </button>
                  )}

                  {test.status === "Completed" && (
                    <span className="text-xs text-gray-400 font-medium">-</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ==========================================================
            PAGINATION
        ========================================================== */}

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {filteredTests.length === 0
              ? "Showing 0 Records"
              : `Showing ${startIndex + 1}-${Math.min(
                  startIndex + recordsPerPage,
                  filteredTests.length,
                )} of ${filteredTests.length} Records`}
          </p>

          <div>
            {currentPage > 1 && (
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                className="
                    px-4
                    py-2
                    rounded-lg
                    border
                    border-gray-300
                    hover:bg-gray-100
                    transition
                "
              >
                Previous
              </button>
            )}

            {totalPages > 0 && (
              <span
                className="
                    px-4
                    py-2
                    rounded-lg
                    bg-[#FDCC03]
                    font-semibold
                "
              >
                {currentPage}
              </span>
            )}

            {currentPage < totalPages && (
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                className="
                    px-4
                    py-2
                    rounded-lg
                    border
                    border-gray-300
                    hover:bg-gray-100
                    transition
                "
              >
                Next
              </button>
            )}
          </div>
        </div>
        {/* TEST DETAILS MODAL */}

        {/* TEST DETAILS MODAL */}

        {selectedTest &&
          createPortal(
            <div
              className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 px-4"
              onClick={() => setSelectedTest(null)}
            >
              <div
                className="
                    w-full
                    max-w-5xl
                    overflow-hidden
                    rounded-2xl
                    bg-white
                    shadow-2xl
                "
                onClick={(e) => e.stopPropagation()}
              >
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7a1f2b]">
                      <ClipboardList size={21} className="text-[#FDCC03]" />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Test Details
                      </h2>

                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <span>{selectedTest.testCode || "N/A"}</span>

                        <span>•</span>

                        <span>{selectedTest.category || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTest(null)}
                    className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-lg
                            text-gray-400
                            transition
                            hover:bg-gray-100
                            hover:text-gray-700
                        "
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* MAIN CONTENT */}

                <div className="max-h-[78vh] overflow-y-auto p-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
                    {/* LEFT SIDE */}

                    <div>
                      {/* TEST CODE CARD */}

                      <div className="rounded-2xl bg-[#7a1f2b] p-6 text-white">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#FDCC03]">
                          Question Code
                        </p>

                        <p className="mt-3 text-3xl font-extrabold tracking-widest">
                          {selectedTest.questionCode || "N/A"}
                        </p>

                        <div className="mt-5 border-t border-white/10 pt-4">
                          <p className="text-xs text-white/50">Status</p>

                          <div className="mt-2">
                            <StatusBadge status={selectedTest.status} />
                          </div>
                        </div>
                      </div>

                      {/* TEST SUMMARY */}

                      <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                        <h3 className="text-sm font-bold text-gray-900">
                          Test Summary
                        </h3>

                        <div className="mt-5 space-y-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Department
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {selectedTest.department || "N/A"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Section
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {selectedTest.section || "N/A"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Batch
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {selectedTest.batch || "N/A"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Date
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {selectedTest.date || "N/A"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Time
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {selectedTest.startTime && selectedTest.endTime
                                ? `${new Date(selectedTest.startTime).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })} - ${new Date(selectedTest.endTime).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}`
                                : selectedTest.duration
                                  ? `${selectedTest.duration} mins (Duration only)`
                                  : "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SIDE */}

                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            Students
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            Students associated with this test
                          </p>
                        </div>

                        <div
                          className="
                                    flex
                                    items-center
                                    gap-2
                                    rounded-xl
                                    bg-[#fff8d9]
                                    px-4
                                    py-2
                                "
                        >
                          <Users size={17} className="text-[#7a1f2b]" />

                          <span className="font-bold text-[#7a1f2b]">
                            {studentLoading
                              ? "..."
                              : selectedTest.students?.length || 0}
                          </span>
                        </div>
                      </div>

                      {/* STUDENT LIST */}

                      {studentLoading ? (
                        <div
                          className="
                                    flex
                                    min-h-[300px]
                                    items-center
                                    justify-center
                                    rounded-2xl
                                    border
                                    border-gray-200
                                    bg-gray-50
                                "
                        >
                          <div className="text-center">
                            <div
                              className="
                                            mx-auto
                                            h-8
                                            w-8
                                            animate-spin
                                            rounded-full
                                            border-4
                                            border-gray-200
                                            border-t-[#7a1f2b]
                                        "
                            />

                            <p className="mt-3 text-sm text-gray-500">
                              Loading students...
                            </p>
                          </div>
                        </div>
                      ) : selectedTest.students?.length > 0 ? (
                        <div className="overflow-hidden rounded-2xl border border-gray-200">
                          {/* LIST HEADER */}

                          <div
                            className="
                                        grid
                                        grid-cols-[55px_1fr_120px]
                                        items-center
                                        bg-gray-50
                                        px-5
                                        py-3
                                    "
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              S.no
                            </span>

                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Student
                            </span>

                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Gender
                            </span>
                          </div>

                          {/* LIST */}

                          <div className="max-h-[430px] overflow-y-auto">
                            {selectedTest.students.map((student, index) => {
                              const admissionNo =
                                student.username ||
                                student.admissionNo ||
                                student.admissionNumber ||
                                "";

                              const name =
                                student.name ||
                                student.studentName ||
                                "Unknown Student";

                              const gender = student.gender || "Unknown";

                              return (
                                <div
                                  key={`${admissionNo}-${index}`}
                                  className="
                                                            grid
                                                            grid-cols-[55px_1fr_120px]
                                                            items-center
                                                            border-t
                                                            border-gray-100
                                                            px-5
                                                            py-3.5
                                                            transition
                                                            hover:bg-[#fffaf0]
                                                        "
                                >
                                  {/* NUMBER */}

                                  <span className="text-sm font-medium text-gray-400">
                                    {String(index + 1).padStart(2, "0")}
                                  </span>

                                  {/* STUDENT */}

                                  <div className="flex items-center gap-3">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-gray-900">
                                        {name}
                                      </p>

                                      <p className="mt-0.5 text-xs text-gray-400">
                                        {admissionNo}
                                      </p>
                                    </div>
                                  </div>

                                  {/* GENDER */}

                                  <span
                                    className="
                                                            w-fit
                                                            rounded-full
                                                            bg-gray-100
                                                            px-3
                                                            py-1.5
                                                            text-xs
                                                            font-semibold
                                                            text-gray-600
                                                        "
                                  >
                                    {gender}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div
                          className="
                                    flex
                                    min-h-[300px]
                                    flex-col
                                    items-center
                                    justify-center
                                    rounded-2xl
                                    border
                                    border-dashed
                                    border-gray-300
                                    bg-gray-50
                                    text-center
                                "
                        >
                          <div
                            className="
                                        flex
                                        h-12
                                        w-12
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-gray-200
                                    "
                          >
                            <Users size={21} className="text-gray-400" />
                          </div>

                          <p className="mt-3 text-sm font-semibold text-gray-700">
                            No students found
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            No student records are available.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* FOOTER */}

                <div
                  className="
                    flex
                    items-center
                    justify-end
                    gap-3
                    border-t
                    border-gray-200
                    bg-gray-50
                    px-6
                    py-4
                "
                >
                  {String(selectedTest.category).toLowerCase() === "normal" &&
                    selectedTest.status !== "Completed" && (
                      <button
                        type="button"
                        onClick={() => {
                          handleEndTest(selectedTest);
                          setSelectedTest(null);
                        }}
                        className="
                          rounded-lg
                          bg-red-600
                          px-5
                          py-2.5
                          text-sm
                          font-semibold
                          text-white
                          transition
                          hover:bg-red-700
                          shadow-sm
                          cursor-pointer
                        "
                      >
                        End Test
                      </button>
                    )}
                  <button
                    type="button"
                    onClick={() => setSelectedTest(null)}
                    className="
                            rounded-lg
                            bg-[#7a1f2b]
                            px-6
                            py-2.5
                            text-sm
                            font-semibold
                            text-white
                            transition
                            hover:bg-[#641923]
                            cursor-pointer
                        "
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}

        {/* ==========================================================
            RESUME STUDENT TEST MODAL
        ========================================================== */}
        {showResumeModal &&
          createPortal(
            <div
              className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
              style={{ zIndex: 999999 }}
            >
              <div
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* MODAL HEADER */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-[#7a1f2b] flex items-center justify-center shadow-xs">
                      <RotateCcw size={20} className="text-[#7a1f2b]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 leading-tight">
                        Resume Student Test
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Unlock an unsubmitted exam attempt
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowResumeModal(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* MODAL BODY */}
                <form onSubmit={handleResumeStudent} className="p-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Enter the student's <strong>username</strong> (admission or register number) whose exam was interrupted and needs to be resumed.
                  </p>

                  <div className="mb-5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Student Username
                    </label>
                    <input
                      type="text"
                      value={resumeUsername}
                      onChange={(e) => setResumeUsername(e.target.value)}
                      placeholder="e.g. 21EC001 or 112821104001"
                      autoFocus
                      disabled={resuming}
                      className="w-full h-11 px-3.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FDCC03]/60 focus:border-[#7a1f2b] text-sm font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowResumeModal(false)}
                      disabled={resuming}
                      className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resuming || !resumeUsername.trim()}
                      className="px-5 py-2.5 rounded-lg bg-[#7a1f2b] hover:bg-[#5e1620] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      {resuming ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Unlocking...</span>
                        </>
                      ) : (
                        <span>Unlock & Resume</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )}

        {/* ==========================================================
            RESUME POPUP NOTIFICATION MODAL (SUCCESS & ERROR)
        ========================================================== */}
        {resumePopup &&
          createPortal(
            <div
              className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
              style={{ zIndex: 999999 }}
            >
              <div
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden text-center p-6 animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {resumePopup.type === "success" ? (
                  <>
                    {/* SUCCESS ICON */}
                    <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-[#FDCC03] text-[#7a1f2b] flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <RotateCcw size={30} className="text-[#7a1f2b]" />
                    </div>

                    <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider mb-2">
                      Unlocked Successfully
                    </span>

                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {resumePopup.title || "Exam Unlocked for Resume"}
                    </h3>
                    <p className="text-xs text-gray-500 mb-5">
                      Single-use resume permission has been granted
                    </p>

                    {/* DETAILS CARD */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-2.5 mb-5 text-sm">
                      {resumePopup.student?.name && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-500 uppercase">
                            Student Name
                          </span>
                          <span className="font-bold text-gray-900">
                            {resumePopup.student.name}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          Admission / Reg No
                        </span>
                        <span className="font-semibold text-gray-800">
                          {resumePopup.student?.admissionNo ||
                            resumePopup.student?.username}
                        </span>
                      </div>
                      {resumePopup.testCode && (
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="text-xs font-semibold text-gray-500 uppercase">
                            Test Code
                          </span>
                          <span className="px-2.5 py-1 bg-yellow-100 border border-[#FDCC03] rounded-md font-extrabold text-[#7a1f2b] tracking-wider text-xs">
                            {resumePopup.testCode}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs text-amber-900 mb-6 text-left leading-relaxed">
                      <strong>Important:</strong> The student can now enter the test code and click <strong>Start Test</strong>. This is a one-time permission and will be consumed immediately upon entry.
                    </div>

                    <button
                      type="button"
                      onClick={() => setResumePopup(null)}
                      className="w-full py-3 rounded-lg bg-[#7a1f2b] hover:bg-[#5e1620] text-white font-semibold transition shadow-sm cursor-pointer"
                    >
                      OK, Got It
                    </button>
                  </>
                ) : (
                  <>
                    {/* ERROR ICON */}
                    <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <AlertCircle size={32} />
                    </div>

                    <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider mb-2">
                      Resume Failed
                    </span>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {resumePopup.title || "Unable to Resume Exam"}
                    </h3>

                    <div className="bg-red-50/60 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-800 text-center leading-relaxed font-medium">
                      {resumePopup.message}
                    </div>

                    <button
                      type="button"
                      onClick={() => setResumePopup(null)}
                      className="w-full py-3 rounded-lg bg-[#7a1f2b] hover:bg-[#5e1620] text-white font-semibold transition shadow-sm cursor-pointer"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>,
            document.body,
          )}
      {/* CUSTOM CONFIRM MODAL */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
        isLoading={confirmModal.isLoading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </main>
    </div>
  );
}

/* ==========================================================
   SUMMARY CARD
========================================================== */
function SummaryCard({ title, value, type }) {
  const descriptions = {
    total: "All scheduled exams",
    today: "Scheduled for today",
    active: "Currently in progress",
    completed: "Successfully completed",
  };

  return (
    <div
      className="
                relative
                bg-white
                border
                border-gray-200
                rounded-xl
                px-5
                py-4
                overflow-hidden
                transition-all
                duration-200
                hover:shadow-md
                hover:border-gray-300
            "
    >
      {/* TOP ACCENT */}

      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#FDCC03]" />

        <p
          className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wider
                    text-gray-500
                "
        >
          {title}
        </p>
      </div>

      {/* MAIN CONTENT */}

      <div className="mt-3 flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <span
            className="
                        text-4xl
                        leading-none
                        font-semibold
                        tracking-tight
                        text-[#7a1f2b]
                    "
          >
            {String(value).padStart(2, "0")}
          </span>

          <span
            className="
                        text-xs
                        text-gray-400
                    "
          >
            exams
          </span>
        </div>

        <p
          className="
                    max-w-[120px]
                    text-right
                    text-[11px]
                    leading-4
                    text-gray-400
                "
        >
          {descriptions[type]}
        </p>
      </div>

      {/* DIVIDER */}

      <div
        className="
                mt-4
                border-t
                border-gray-100
            "
      />

      {/* BOTTOM */}

      <div
        className="
                mt-2
                flex
                items-center
                justify-between
            "
      >
        <span
          className="
                    text-[10px]
                    uppercase
                    tracking-wide
                    text-gray-300
                "
        >
          Dashboard
        </span>

        <span
          className="
                    text-[10px]
                    font-medium
                    text-gray-400
                "
        >
          {new Date().getFullYear()}
        </span>
      </div>
    </div>
  );
}

/* ==========================================================
   TABLE HEADER
========================================================== */

function TableHeading({ children }) {
  return (
    <div className="py-4 flex items-center justify-center">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 text-center w-full">
        {children}
      </p>
    </div>
  );
}

/* ==========================================================
   STATUS BADGE
========================================================== */

function StatusBadge({ status }) {
  if (status === "Completed") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        Completed
      </span>
    );
  }

  if (status === "Ongoing") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FDCC03] opacity-60"></span>

          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FDCC03]"></span>
        </span>
        Ongoing
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
      Upcoming
    </span>
  );
}
