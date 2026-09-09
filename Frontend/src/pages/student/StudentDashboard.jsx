import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  User,
  Mail,
  BookOpen,
  Inbox,
  Edit2,
  Play,
  X,
  CheckCircle,
  Phone,
} from "lucide-react";
import Footer from "../../components/common/footer";
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
  clearStudentSession,
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
  const [firstLogin, setFirstLogin] = useState(false);

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
      // Backend returns the updated student under `data.data`,
      // not `data.student`.

      if (data.data) {
        setStudent(data.data);
        setEditForm(data.data);
        setFirstLogin(
          data.data.firstlogin === true ||
            data.data.firstLogin === true ||
            data.data.student?.firstlogin === true ||
            data.data.student?.firstLogin === true,
        );

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
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };
  // This is for making the fields uneditable . if you want to make it editable again change the true to false
  const registerNoOnlyEdit = true;
  const canEditAdditionalFields = firstLogin;
  // ============================================================
  // SEND RESULT
  // POSTs { testId, admissionNo } to /api/student/studentresult.
  // The row only flips to "Sent" once the backend confirms success —
  // it no longer happens optimistically on click.
  // ============================================================

  const handleSendResult = async (testId) => {
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
      const data = await sendStudentResult(testId, student.admissionNo);
      if (data.success) {
        toast.success("Result sent to mail successfully");
      }

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

      toast.error("Failed to send result");
    } finally {
      setSendingId(null);
    }
  };

  // ============================================================
  // LOGOUT
  // Same behavior as the header's logout: clear the student session,
  // let anything listening for session changes know, then redirect
  // to the login page.
  // ============================================================

  const handleLogout = () => {
    clearStudentSession();

    window.dispatchEvent(new Event("studentSessionChanged"));

    navigate("/studentlogin");
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
          navigate("/studentlogin");
        }

        const username = session.user.username;

        if (!username) {
          navigate("/studentlogin");
        }

        // NOTE: this service call does not attach session.token as an
        // Authorization header. If your backend requires it here, add
        // it via an interceptor in services/api.js instead of per-call.
        const result = await getStudent(username);

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

        setStudent(result.student);
        setEditForm(result.student);
        setFirstLogin(
          result.firstlogin === true ||
            result.firstLogin === true ||
            result.student?.firstlogin === true ||
            result.student?.firstLogin === true,
        );

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

        setTestResults(formattedTestResults);
      } catch (error) {
        console.error("Error fetching student:", error);

        setFetchError("Failed to load student data");
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
  // PAGE SCROLLBAR CONTROL
  // This dashboard is designed to fit entirely within the viewport
  // (h-[calc(100dvh-172px)] below already accounts for the header/
  // footer), so the outer document scrollbar is disabled for as long
  // as this page is mounted.
  // ============================================================

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  // ============================================================
  // LOADING
  // ============================================================

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100dvh-172px)] bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-[#800000] rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">
          Loading student data...
        </p>
      </div>
    );
  }

  // ============================================================
  // ERROR / EMPTY STATE
  // ============================================================

  if (fetchError || !student) {
    return (
      <div className="w-full h-[calc(100dvh-172px)] bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="p-4 bg-red-50 rounded-full">
          <X className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-red-600 font-semibold text-center px-6 text-lg">
          {fetchError || "Unable to load student data."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-[#800000] text-white font-semibold rounded-lg hover:bg-red-800 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
        >
          Try Again
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
  const hasChanges =
    editForm?.registerNo?.trim() !== student?.registerNo?.trim() ||
    (canEditAdditionalFields &&
      (editForm?.email !== student?.email ||
        editForm?.phone !== student?.phone ||
        editForm?.gender !== student?.gender ||
        editForm?.section !== student?.section));

  // ============================================================
  // MAIN DASHBOARD
  // ============================================================

  return (
    <div className="w-full h-[calc(100dvh-142px)] bg-slate-50 p-6 font-sans flex flex-col overflow-hidden box-border min-h-0">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="flex-none flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 text-[#800000] rounded-lg">
            <User size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Student Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {(firstLogin || student?.studentEditEnabled) && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer"
            >
              <Edit2 size={16} />
              <span>Edit Profile</span>
            </button>
          )}

          <button
            onClick={() => navigate("/exam/instruction")}
            className="flex items-center gap-2 px-6 py-2.5 bg-yellow-400 text-black font-bold rounded-lg hover:bg-[#800000] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
          >
            <Play size={18} className="fill-current" />
            <span>Take Test</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          CONTENT
      ======================================================== */}

      <div className="flex-1 flex flex-row gap-6 min-h-0 w-full overflow-hidden">
        {/* ======================================================
            STUDENT PROFILE (SIDEBAR)
        ====================================================== */}

        <div className="w-1/4 flex flex-col bg-white rounded-xl shadow-sm p-6 border border-gray-100 min-h-0 overflow-hidden">
          <div className="flex-none flex flex-col items-center text-center gap-3 mb-6 pb-5 border-b border-gray-100">
            <div className="w-14 h-14 shrink-0 bg-yellow-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm text-[#800000]">
              <span className="text-2xl font-bold">
                {student.name ? student.name.charAt(0).toUpperCase() : "S"}
              </span>
            </div>
            <div className="overflow-hidden w-full">
              <h2 className="text-lg font-bold text-gray-800 leading-tight truncate">
                {student.name}
              </h2>
              <p className="text-sm font-medium text-gray-500 mt-1">
                Username: {displayUsername}
              </p>
            </div>
          </div>
          <div className="flex-1 space-y-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mt-0.5">
                <BookOpen size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  Department
                </p>
                <p className="text-[15px] font-semibold text-gray-900 mt-0.5">
                  {student.department}{" "}
                  <span className="text-gray-400 font-normal mx-1">|</span> Sec{" "}
                  {student.section}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg mt-0.5">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  Email
                </p>
                <p className="text-[15px] font-semibold text-gray-900 mt-0.5 break-all">
                  {student.email || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mt-0.5">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  Phone
                </p>
                <p className="text-[15px] font-semibold text-gray-900 mt-0.5">
                  {student.phone || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-none mt-auto pt-6 border-t border-transparent">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 font-semibold py-2.5 rounded-lg transition-all duration-300 cursor-pointer"
              title="Logout"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* ======================================================
            TEST RESULTS TABLE
        ====================================================== */}

        <div className="w-3/4 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 min-h-0 overflow-hidden">
          <div className="flex-none p-6 pb-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              Test Results
            </h2>
            <div className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
              Total Exams: {testResults.length}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead className="bg-white sticky top-0 z-10 shadow-sm text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-4 px-6 font-bold w-16 text-center">S.No</th>
                  <th className="py-4 px-6 font-bold">Question Code</th>
                  <th className="py-4 px-6 font-bold">Exam</th>
                  <th className="py-4 px-6 font-bold">Mark</th>
                  <th className="py-4 px-6 font-bold text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {testResults.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-24">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <Inbox className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700">
                          No Exam Results Yet
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-sm">
                          Once you complete your tests and they are graded, the
                          results will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  testResults.map((test, index) => (
                    <tr
                      key={test.testId !== "-" ? test.testId : `row-${index}`}
                      className="hover:bg-yellow-50/50 transition-colors group"
                    >
                      <td className="py-4 px-6 text-gray-500 font-semibold text-center text-sm">
                        {String(index + 1).padStart(2, "0")}
                      </td>

                      <td className="py-4 px-6 font-bold text-gray-900">
                        <span className="bg-gray-100 group-hover:bg-white px-2.5 py-1 rounded-md border border-gray-200 text-sm transition-colors">
                          {test.questionCode}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-gray-600 font-medium">
                        {test.cie}
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-bold text-gray-900 text-lg">
                          {test.mark !== "-" ? test.mark.split("/")[0] : "-"}
                        </span>
                        {test.mark !== "-" && (
                          <span className="text-gray-400 text-sm font-medium">
                            /{test.mark.split("/")[1]}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end">
                          {test.status === "Sent" ? (
                            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                              <CheckCircle size={14} />
                              Sent
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSendResult(test.testId)}
                              disabled={sendingId === test.testId}
                              className="flex items-center gap-1.5 text-black bg-yellow-400 hover:bg-[#800000] hover:text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-wait disabled:hover:bg-yellow-400 disabled:hover:text-black"
                              title="Send result to student email"
                            >
                              {sendingId === test.testId ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Mail size={14} />
                                  Send Result
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================
          EDIT PROFILE MODAL
      ======================================================== */}

      {isEditing && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 z-[2147483000] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{ isolation: "isolate" }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) {
              setIsEditing(false);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full my-4 sm:my-0 p-6 border-t-4 border-yellow-400">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Edit Profile
                </h2>
              </div>

              <button
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="grid grid-cols-1 sm:grid-cols-2 gap-5"
            >
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Admission No{" "}
                  <span className="text-xs text-gray-400 font-normal ml-2">
                    (Cannot be changed)
                  </span>
                </label>
                <input
                  type="text"
                  name="admissionNo"
                  value={editForm?.admissionNo || ""}
                  disabled
                  className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editForm?.name || ""}
                  onChange={handleInputChange}
                  disabled={isSaving || registerNoOnlyEdit}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Register No
                </label>
                <input
                  type="text"
                  name="registerNo"
                  value={editForm?.registerNo || ""}
                  onChange={handleInputChange}
                  disabled={isSaving || registerNoOnlyEdit}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={editForm?.email || ""}
                  onChange={handleInputChange}
                  disabled={isSaving || !canEditAdditionalFields}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={editForm?.phone || ""}
                  onChange={handleInputChange}
                  disabled={isSaving || !canEditAdditionalFields}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Department{" "}
                  <span className="text-xs text-gray-400 font-normal ml-1">
                    (Cannot be changed)
                  </span>
                </label>
                <input
                  type="text"
                  name="department"
                  value={editForm?.department || ""}
                  disabled
                  className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Section
                </label>
                <select
                  name="section"
                  value={editForm?.section || ""}
                  onChange={handleInputChange}
                  disabled={isSaving || !canEditAdditionalFields}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 bg-white"
                >
                  <option value="">Select Section</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Gender
                </label>
                <select
                  name="gender"
                  value={editForm?.gender || ""}
                  onChange={handleInputChange}
                  disabled={isSaving || !canEditAdditionalFields}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 bg-white"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Batch
                </label>
                <input
                  type="text"
                  name="batch"
                  value={editForm?.batch || ""}
                  onChange={handleInputChange}
                  disabled={isSaving || registerNoOnlyEdit}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="text"
                  name="dob"
                  value={editForm?.dob || ""}
                  onChange={handleInputChange}
                  disabled={isSaving || registerNoOnlyEdit}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                  placeholder="YYYY-MM-DD"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Username{" "}
                  <span className="text-xs text-gray-400 font-normal ml-1">
                    (Cannot be changed)
                  </span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={displayUsername}
                  disabled
                  className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed font-medium"
                />
              </div>

              {/* BUTTONS */}
              <div className="col-span-1 sm:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 mt-6 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving || !hasChanges}
                  className="px-8 py-2.5 bg-yellow-400 text-black font-bold rounded-lg hover:bg-[#800000] hover:text-white shadow-sm transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-yellow-400 disabled:hover:text-black"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          FOOTER / TOAST
      ======================================================== */}

      {/* <Footer /> */}
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
