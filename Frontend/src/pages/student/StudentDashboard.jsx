import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/common/footer";
import { toast, ToastContainer } from 'react-toastify';
import { getStudentSession } from "../../utils/helpers";
import { getStudent, updateStudent } from "../../services/studentService";

const StudentDashboard = () => {
  const navigate = useNavigate();

  // No more hardcoded dummy student — everything comes from the backend now
  const [student, setStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [testResults, setTestResults] = useState([
    { id: "TEST001", cie: "CIE 1", mark: "45/50", status: "Sent" },
    { id: "TEST002", cie: "CIE 2", mark: "42/50", status: "Pending" },
    { id: "TEST003", cie: "Model", mark: "88/100", status: "Pending" },
    { id: "TEST004", cie: "CIE 3", mark: "47/50", status: "Sent" },
    { id: "TEST005", cie: "Lab 1", mark: "95/100", status: "Pending" },
    { id: "TEST006", cie: "Lab 2", mark: "92/100", status: "Pending" },
    { id: "TEST007", cie: "Final", mark: "89/100", status: "Pending" },
    { id: "TEST008", cie: "Model 2", mark: "91/100", status: "Pending" },
    { id: "TEST009", cie: "Lab 3", mark: "98/100", status: "Pending" },
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setEditForm({
      ...editForm,
      [name]: value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    setIsSaving(true);

    try {
      // Username follows the register number when it's present,
      // and falls back to the admission number otherwise.
      const derivedUsername =
        editForm.registerNo && editForm.registerNo.trim()
          ? editForm.registerNo
          : editForm.admissionNo;

      const updateData = {
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

      const response = await updateStudent(updateData);

      console.log("Updated student:", response.student);

      setStudent(response.student);
      setEditForm(response.student);

      setIsEditing(false);

      toast.success("Student profile updated successfully!");

    } catch (error) {

      console.error("Error updating student:", error);

      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Failed to update profile"
      );

    } finally {

      setIsSaving(false);

    }
  };

  const handleSendResult = (testId) => {
    setTestResults((prevResults) =>
      prevResults.map((test) =>
        test.id === testId && test.status !== "Sent"
          ? { ...test, status: "Sent" }
          : test
      )
    );
  };

  // Fetch the logged-in student's data from the backend on mount
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

        const result = await getStudent(username);

        if (!result.success) {
          throw new Error(
            result.message || "Failed to fetch student data"
          );
        }

        console.log(
          "Student data from DB:",
          result.data
        );

        setStudent(result.data);
        setEditForm(result.data);

      } catch (error) {

        console.error(
          "Error fetching student:",
          error
        );

        setFetchError(
          error.response?.data?.message ||
          error.message ||
          "Failed to load student data"
        );

      } finally {

        setIsLoading(false);

      }
    };

    fetchStudent();

  }, []);

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

  // Loading state — shown while the initial fetch is in flight
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

  // Error / empty state — shown if the fetch failed or returned nothing
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

  // Username mirrors the register number when present, otherwise the
  // admission number — shown live as the register number field changes.
  const displayUsername =
    editForm.registerNo && editForm.registerNo.trim()
      ? editForm.registerNo
      : editForm.admissionNo;

  return (
    <>
      <ToastContainer position="bottom-right" autoClose='3000' />
      <div
        className="
        w-full
        h-[calc(100dvh-172px)]
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
                    <th className="py-3 px-4 font-bold">CIE</th>
                    <th className="py-3 px-4 font-bold">Mark</th>
                    <th className="py-3 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {testResults.map((test, index) => (
                    <tr
                      key={index}
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
                        {test.id}
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
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Sent
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSendResult(test.id)}
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
                            "
                              title="Send result to student"
                            >
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
        </div>

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
              if (e.target === e.currentTarget && !isSaving) setIsEditing(false);
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Register No
                  </label>
                  <input
                    type="text"
                    name="registerNo"
                    value={editForm.registerNo}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={editForm.phone}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department (Cannot be changed)
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={editForm.department}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section (Cannot be changed)
                  </label>
                  <input
                    type="text"
                    name="section"
                    value={editForm.section}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={editForm.gender}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch
                  </label>
                  <input
                    type="text"
                    name="batch"
                    value={editForm.batch}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="text"
                    name="dob"
                    value={editForm.dob}
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
        )}
        <Footer />
      </div>
    </>

  );
};

export default StudentDashboard;