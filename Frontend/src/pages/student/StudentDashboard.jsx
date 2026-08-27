import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/common/footer";
import { toast, ToastContainer } from 'react-toastify';
import { getStudentSession } from "../../utils/helpers";
import {
  getStudent,
  updateStudent,
  sendStudentResult,
} from "../../services/studentService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getStudentSession,
  saveStudentSession,
  getSentResults,
  markResultSent,
} from "../../utils/helpers";

const StudentDashboard = () => {
  const navigate = useNavigate();

  // ============================================================
  // STUDENT STATE
  // ============================================================

  const [student, setStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // ============================================================
  // TEST RESULTS
  // Keep the frontend structure exactly the same.
  // Backend data will be converted into this structure.
  // ============================================================

  const [testResults, setTestResults] = useState([]);

  // Tracks which row's "Send" button is currently in flight, so only
  // that row shows a loading state instead of the whole table.
  const [sendingId, setSendingId] = useState(null);

  // ============================================================
  // INPUT CHANGE
  // ============================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================================
  // SAVE STUDENT PROFILE
  // ============================================================

  const handleSave = async (e) => {
    e.preventDefault();

    if (!editForm) {
      return;
    }

    setIsSaving(true);

    try {
      // Username follows register number when present,
      // otherwise admission number.
      const derivedUsername =
        editForm.registerNo && editForm.registerNo.trim()
          ? editForm.registerNo
          : editForm.admissionNo;

      const updateData = {
        // Included so the backend can reliably identify the
        // document to update even though admissionNo/username
        // are also sent below.
        _id: editForm._id,
        admissionNo: editForm.admissionNo,
        name: editForm.name,
        registerNo: editForm.registerNo,
        email: editForm.email,
        phone: editForm.phone,
        department: editForm.department,
        section: editForm.section,
        gender: editForm.gender,
        batch: editForm.batch,
        dob: editForm.dob,
        username: derivedUsername,
      };

      const data = await updateStudent(updateData);

      if (!data.success) {
        throw new Error(data.message || "Failed to update profile");
      }

      // Backend returns the updated student under `data.data`,
      // not `data.student`.
      console.log("Updated student:", data.data);

      if (data.data) {
        setStudent(data.data);
        setEditForm(data.data);

        // The session's username was captured at login. If registerNo
        // (which drives the username) changed, the session goes stale —
        // a refresh would then call getStudent() with the OLD username
        // and get "Student not found". Keep the session in sync.
        const session = getStudentSession();
        if (session?.user) {
          const newUsername =
            data.data.registerNo && data.data.registerNo.trim()
              ? data.data.registerNo
              : data.data.admissionNo;

          if (session.user.username !== newUsername) {
            saveStudentSession({
              ...session,
              user: {
                ...session.user,
                username: newUsername,
              },
            });
          }
        }
      }

      setIsEditing(false);

      toast.success("Student profile updated successfully!");
    } catch (error) {

      console.error("Error updating student:", error);

      // axios puts the backend's JSON error body on error.response.data
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update profile",
      );
    } finally {

      setIsSaving(false);

    }
  };

  // ============================================================
  // SEND RESULT
  // POSTs { testId, admissionNo } to /api/student/studentresult.
  // The row only flips to "Sent" once the backend confirms success —
  // it no longer happens optimistically on click.
  // ============================================================

  const handleSendResult = async (testId) => {
    console.log("SEND BUTTON TEST ID:", testId);

    if (!testId || testId === "-") {
      toast.warning("This exam is missing a valid test id and cannot be sent.");
      return;
    }

    if (!student?.admissionNo) {
      toast.warning("Admission number not found for this student.");
      return;
    }

    setSendingId(testId);

    try {
      console.log("Sending student result:", {
        testId,
        admissionNo: student.admissionNo,
      });

      const data = await sendStudentResult(testId, student.admissionNo);

      console.log("studentresult response:", data);

      if (!data.success) {
        throw new Error(data.message || "Failed to send result");
      }

      // Persist so a refresh doesn't let this be sent again —
      // only clears on logout.
      markResultSent(student.admissionNo, testId);

      setTestResults((prevResults) =>
        prevResults.map((test) =>
          test.testId === testId ? { ...test, status: "Sent" } : test,
        ),
      );
    } catch (error) {
      console.error("Error sending result:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to send result",
      );
    } finally {
      setSendingId(null);
    }
  };

  // ============================================================
  // FETCH STUDENT + EXAMS
  // ============================================================

  useEffect(() => {
    const fetchStudent = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
        const session = getStudentSession();

        if (!session || !session.user) {
          throw new Error(
            "No logged-in student found. Please log in again."
          );
        }

        const username = session.user.username;

        if (!username) {
          throw new Error(
            "No logged-in student found. Please log in again."
          );
        }

        // NOTE: this service call does not attach session.token as an
        // Authorization header. If your backend requires it here, add
        // it via an interceptor in services/api.js instead of per-call.
        const result = await getStudent(username);
        console.log("result:", result);

        if (!result.success) {
          throw new Error(result.message || "Failed to fetch student data");
        }

        // Backend returns the student under `result.student` (verified
        // against the live response) — NOT `result.data`. Using the
        // wrong key here means `student` ends up undefined and the
        // page falls straight to the error screen.
        if (!result.student) {
          throw new Error("Student information was not returned by backend.");
        }

        console.log("Student data from DB:", result.student);

        setStudent(result.student);
        setEditForm(result.student);

        // Exams: `id` must come from the backend's unique `examId`,
        // not `questionCode` — multiple attempts (normal + retest)
        // can share a questionCode, so using it as the row id made
        // two rows resolve to the same id and both got marked "Sent"
        // when only one was clicked.
        const backendExams = Array.isArray(result.exams)
          ? result.exams
          : Array.isArray(result.data?.exams)
            ? result.data.exams
            : [];

        console.log("BACKEND EXAMS:", backendExams);

        // Anything sent earlier in this login session should still show
        // as "Sent" after a refresh.
        const sentTestIds = getSentResults(result.student.admissionNo);

        const formattedTestResults = backendExams.map((exam) => {
          const examId =
            typeof exam._id === "object"
              ? exam._id?.$oid || String(exam._id)
              : exam._id || "";

          const testId =
            typeof exam.testId === "object"
              ? exam.testId?.$oid || String(exam.testId)
              : exam.testId || "";

          console.log("Exam being formatted:", exam);
          console.log("Exam ID:", examId);
          console.log("Test ID:", testId);

          return {
            // Unique exam document ID
            id: examId || "-",

            // IMPORTANT:
            // This is the ID required by /student/studentresult
            testId: testId || "-",

            // Question Code
            questionCode: exam.questionCode || "-",

            // Existing Exam column
            cie: exam.cie || exam.category || "-",

            // Existing Mark column
            mark:
              exam.obtainedMarks !== undefined && exam.totalMarks !== undefined
                ? `${exam.obtainedMarks}/${exam.totalMarks}`
                : "-",

            status: sentTestIds.includes(testId) ? "Sent" : "Pending",
          };
        });

        console.log("FINAL TEST RESULTS:", formattedTestResults);

        setTestResults(formattedTestResults);
      } catch (error) {
        console.error("Error fetching student:", error);

        setFetchError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load student data",
        );
      } finally {

        setIsLoading(false);

      }
    };

    fetchStudent();

  }, []);

  // ============================================================
  // MODAL BODY SCROLL CONTROL
  // ============================================================

  useEffect(() => {
    if (isEditing && student) {
      setEditForm(student);

      const previousOverflow = document.body.style.overflow;
      const previousPaddingRight = document.body.style.paddingRight;

      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = "hidden";

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.overflow = previousOverflow;
        document.body.style.paddingRight = previousPaddingRight;
      };
    }
  }, [isEditing, student]);

  // ============================================================
  // LOADING
  // ============================================================

  if (isLoading) {
    return (
      <div
        className="
          w-full
          h-[calc(100dvh-172px)]
          bg-gray-50
          flex
          items-center
          justify-center
        "
      >
        <p className="text-gray-500 font-medium">Loading student data...</p>
      </div>
    );
  }

  // ============================================================
  // ERROR / EMPTY STATE
  // ============================================================

  if (fetchError || !student) {
    return (
      <div
        className="
          w-full
          h-[calc(100dvh-172px)]
          bg-gray-50
          flex
          flex-col
          items-center
          justify-center
          gap-4
        "
      >
        <p className="text-red-600 font-semibold text-center px-6">
          {fetchError || "Unable to load student data."}
        </p>

        <button
          onClick={() => window.location.reload()}
          className="
            px-6
            py-2
            bg-yellow-400
            text-black
            font-semibold
            rounded-lg
            hover:bg-[#800000]
            hover:text-white
            transition-colors
            duration-300
            shadow-sm
            cursor-pointer
          "
        >
          Retry
        </button>
      </div>
    );
  }

  // ============================================================
  // USERNAME
  // ============================================================

  const displayUsername =
    editForm?.registerNo && editForm.registerNo.trim()
      ? editForm.registerNo
      : editForm?.admissionNo || "";

  // ============================================================
  // MAIN DASHBOARD
  // ============================================================

  return (
    <>
      <ToastContainer position="bottom-right" autoClose='3000' />
      <div
        className="
        w-full
        h-[calc(100dvh-1px)]
        bg-gray-50
        p-6
        font-sans
        flex
        flex-col
        overflow-hidden
        box-border
        min-h-0
      "
    >
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div
        className="
          flex-none
          flex
          justify-between
          items-center
          mb-6
        "
        >
          <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsEditing(true)}
              className="
              px-6
              py-2
              bg-white
              border-2
              border-gray-200
              text-gray-700
              font-semibold
              rounded-lg
              hover:bg-gray-50
              transition
              cursor-pointer
            "
            >
              Edit Profile
            </button>

            <button
              onClick={() => navigate("/exam/instruction")}
              className="
              px-6
              py-2
              bg-yellow-400
              text-black
              font-semibold
              rounded-lg
              hover:bg-[#800000]
              hover:text-white
              transition-colors
              duration-300
              shadow-sm
              cursor-pointer
            "
            >
              Take Test
            </button>
          </div>
        </div>

      {/* ========================================================
          CONTENT
      ======================================================== */}

      {/* ========================================================
          CONTENT
      ======================================================== */}

      <div
        className="
          flex-1
          flex
          flex-row
          gap-6
          min-h-0
          w-full
          overflow-hidden
        "
      >
        {/* ======================================================
            STUDENT PROFILE
        ====================================================== */}

        <div
          className="
            w-1/4
            flex
            flex-col
            bg-white
            rounded-xl
            shadow-sm
            p-6
            border
            border-gray-100
            min-h-0
            overflow-hidden
          "
          >
            <h2
              className="
              flex-none
              text-xl
              font-bold
              text-gray-800
              mb-6
              border-b
              pb-2
            "
            >
              Student Profile
            </h2>

          <div className="flex-none space-y-6 pr-1">
            {/* Name */}

            <div>
              <p
                className="
                  text-sm
                  text-gray-500
                  font-medium
                  uppercase
                  tracking-wider
                "
              >
                Name
              </p>

              <p className="text-lg font-semibold text-gray-900 mt-1">
                {student.name}
              </p>
            </div>

            {/* Department + Section */}

            <div>
              <p
                className="
                  text-sm
                  text-gray-500
                  font-medium
                  uppercase
                  tracking-wider
                "
              >
                Department & Section
              </p>

              <p className="text-lg font-semibold text-gray-900 mt-1">
                {student.department} - {student.section}
              </p>
            </div>

            {/* Email */}

            <div>
              <p
                className="
                  text-sm
                  text-gray-500
                  font-medium
                  uppercase
                  tracking-wider
                "
              >
                Email
              </p>

              <p
                className="
                  text-lg
                  font-semibold
                  text-gray-900
                  break-all
                  mt-1
                "
                >
                  {student.email}
                </p>
              </div>
            </div>
          </div>

        {/* ======================================================
            TEST RESULTS
            SAME FRONTEND TABLE STRUCTURE
        ====================================================== */}

        {/* ======================================================
            TEST RESULTS
            SAME FRONTEND TABLE STRUCTURE
        ====================================================== */}

        <div
          className="
            w-3/4
            flex
            flex-col
            bg-white
            rounded-xl
            shadow-sm
            p-6
            border
            border-gray-100
            min-h-0
            overflow-hidden
          "
          >
            <h2
              className="
              flex-none
              text-xl
              font-bold
              text-gray-800
              mb-4
              border-b
              pb-2
            "
            >
              Test Results
            </h2>

            <div
              className="
              flex-1
              min-h-0
              overflow-y-auto
              overflow-x-auto
              border
              border-gray-200
              rounded-lg
            "
            >
              <table
                className="
                w-full
                min-w-[700px]
                text-left
                border-collapse
              "
              >
                <thead
                  className="
                  bg-gray-100
                  sticky
                  top-0
                  z-10
                  shadow-sm
                  text-sm
                  uppercase
                  text-gray-600
                "
              >
                <tr>
                  <th className="py-3 px-4 font-bold">S.No</th>

                  <th className="py-3 px-4 font-bold">Question Code</th>

                  <th className="py-3 px-4 font-bold">Exam</th>

                  <th className="py-3 px-4 font-bold">Mark</th>

                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {testResults.map((test, index) => (
                  <tr
                    key={test.testId !== "-" ? test.testId : `row-${index}`}
                    className="
                      border-b
                      last:border-b-0
                      border-gray-200
                      hover:bg-yellow-50
                      transition
                    "
                  >
                    <td className="py-4 px-4 text-gray-700 font-medium">
                      {index + 1}
                    </td>

                    <td className="py-4 px-4 font-bold text-gray-900">
                      {test.questionCode}
                    </td>

                    <td className="py-4 px-4 text-gray-600 font-medium">
                      {test.cie}
                    </td>

                    <td className="py-4 px-4 font-bold text-gray-900">
                      {test.mark}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {test.status === "Sent" ? (
                          <span
                            className="
                              flex
                              items-center
                              text-green-700
                              bg-green-100
                              px-3
                              py-1
                              rounded-full
                              text-xs
                              font-bold
                              shadow-sm
                            "
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              />
                            <svg/>
                            Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendResult(test.testId)}
                            disabled={sendingId === test.testId}
                            className="
                              flex
                              items-center
                              text-black
                              bg-yellow-400
                              hover:bg-[#800000]
                              hover:text-white
                              px-4
                              py-1.5
                              rounded-full
                              text-xs
                              font-semibold
                              transition-colors
                              duration-300
                              cursor-pointer
                              shadow-sm
                              disabled:opacity-60
                              disabled:cursor-wait
                              disabled:hover:bg-yellow-400
                              disabled:hover:text-black
                            "
                            title="Send result to student"
                          >
                            {sendingId === test.testId ? (
                              "Sending..."
                            ) : (
                              <>
                                <svg
                                  className="
                                    w-3
                                    h-3
                                    mr-1
                                    transform
                                    rotate-45
                                    -mt-1
                                  "
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                  />
                                </svg>
                                Send
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* ========================================================
          EDIT PROFILE MODAL
      ======================================================== */}

      {/* ========================================================
          EDIT PROFILE MODAL
      ======================================================== */}

      {isEditing && (
        <div
          className="
            fixed
            inset-0
            bg-black/30
            backdrop-blur-sm
            flex
            items-start
            sm:items-center
            justify-center
            p-4
            z-[2147483000]
            overflow-y-auto
          "
          style={{ isolation: "isolate" }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) {
              setIsEditing(false);
            }
          }}
        >
          <div
            className="
              bg-white
              rounded-xl
              shadow-2xl
              w-full
              max-w-2xl
              max-h-[calc(100dvh-2rem)]
              sm:max-h-[85vh]
              overflow-y-auto
              my-4
              sm:my-0
              p-4
              sm:p-6
              border-t-4
              border-yellow-400
            "
            >
              <div
                className="
                flex
                justify-between
                items-center
                mb-6
                pb-4
                border-b
                sticky
                top-0
                bg-white
                z-10
              "
              >
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Edit Profile
                </h2>

                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="
                  text-gray-500
                  hover:text-red-500
                  transition
                  cursor-pointer
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
                  aria-label="Close"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form
                onSubmit={handleSave}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admission No (Cannot be changed)
                  </label>
                  <input
                    type="text"
                    name="admissionNo"
                    value={editForm.admissionNo}
                    disabled
                    className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    bg-gray-100
                    text-gray-500
                    cursor-not-allowed
                  "
                  />
                </div>

            <form
              onSubmit={handleSave}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {/* Admission No */}

              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admission No (Cannot be changed)
                </label>

                <input
                  type="text"
                  name="admissionNo"
                  value={editForm?.admissionNo || ""}
                  disabled
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    bg-gray-100
                    text-gray-500
                    cursor-not-allowed
                  "
                  />
                </div>

              {/* Name */}

              {/* Name */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={editForm?.name || ""}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-yellow-400
                    outline-none
                    disabled:bg-gray-100
                  "
                />
              </div>

              {/* Register No */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Register No
                </label>

                <input
                  type="text"
                  name="registerNo"
                  value={editForm?.registerNo || ""}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-yellow-400
                    outline-none
                    disabled:bg-gray-100
                  "
                />
              </div>

              {/* Email */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={editForm?.email || ""}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-yellow-400
                    outline-none
                    disabled:bg-gray-100
                  "
                />
              </div>

              {/* Phone */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>

                <input
                  type="text"
                  name="phone"
                  value={editForm?.phone || ""}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-yellow-400
                    outline-none
                    disabled:bg-gray-100
                  "
                />
              </div>

              {/* Department */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department (Cannot be changed)
                </label>

                <input
                  type="text"
                  name="department"
                  value={editForm?.department || ""}
                  disabled
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    bg-gray-100
                    text-gray-500
                    cursor-not-allowed
                  "
                  />
                </div>

              {/* Section */}

              {/* Section */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section (Cannot be changed)
                </label>

                <input
                  type="text"
                  name="section"
                  value={editForm?.section || ""}
                  disabled
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    bg-gray-100
                    text-gray-500
                    cursor-not-allowed
                  "
                  />
                </div>

              {/* Gender */}

              {/* Gender */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>

                <select
                  name="gender"
                  value={editForm?.gender || ""}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-yellow-400
                    outline-none
                    disabled:bg-gray-100
                  "
                >
                  <option value="">Select Gender</option>

                  <option value="Male">Male</option>

                  <option value="Female">Female</option>

                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Batch */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch
                </label>

                <input
                  type="text"
                  name="batch"
                  value={editForm?.batch || ""}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-yellow-400
                    outline-none
                    disabled:bg-gray-100
                  "
                />
              </div>

              {/* Date of Birth */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>

                <input
                  type="text"
                  name="dob"
                  value={editForm?.dob || ""}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-yellow-400
                    outline-none
                    disabled:bg-gray-100
                  "
                />
              </div>

              {/* Username */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username (Cannot be changed)
                </label>

                <input
                  type="text"
                  name="username"
                  value={displayUsername}
                  disabled
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    bg-gray-100
                    text-gray-500
                    cursor-not-allowed
                  "
                />
              </div>

              {/* BUTTONS */}

              <div
                className="
                  col-span-1
                  sm:col-span-2
                  flex
                  flex-col-reverse
                  sm:flex-row
                  justify-end
                  gap-3
                  sm:gap-4
                  mt-4
                  border-t
                  pt-4
                "
                >
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="
                    px-4
                    py-2
                    border
                    rounded-lg
                    hover:bg-gray-50
                    font-medium
                    transition
                    cursor-pointer
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="
                    px-6
                    py-2
                    bg-yellow-400
                    text-black
                    font-semibold
                    rounded-lg
                    hover:bg-yellow-500
                    shadow-sm
                    transition
                    cursor-pointer
                    disabled:opacity-70
                    disabled:cursor-wait
                  "
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          FOOTER
      ======================================================== */}

      <Footer />
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
    </div>
  );
};

export default StudentDashboard;
