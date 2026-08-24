import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from "../../components/common/footer";

const StudentDashboard = () => {
  const navigate = useNavigate();

  const initialData = {
    _id: '6a87c83102ec8ae7173907d3',
    name: 'Naveen S',
    registerNo: '13546788009',
    admissionNo: '24VEC_009',
    email: 'naveen009@gmail.com',
    phone: '7809876509',
    department: 'AI&DS',
    year: 3,
    section: 'A',
    batch: '2024-2028',
    dob: '123',
    gender: 'Male',
    username: '24VEC_509',
  };

  const [student, setStudent] = useState(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(initialData);

  const [testResults, setTestResults] = useState([
    { id: 'TEST001', cie: 'CIE 1', mark: '45/50', status: 'Sent' },
    { id: 'TEST002', cie: 'CIE 2', mark: '42/50', status: 'Pending' },
    { id: 'TEST003', cie: 'Model', mark: '88/100', status: 'Pending' },
    { id: 'TEST004', cie: 'CIE 3', mark: '47/50', status: 'Sent' },
    { id: 'TEST005', cie: 'Lab 1', mark: '95/100', status: 'Pending' },
    { id: 'TEST006', cie: 'Lab 2', mark: '92/100', status: 'Pending' },
    { id: 'TEST007', cie: 'Final', mark: '89/100', status: 'Pending' },
    { id: 'TEST008', cie: 'Model 2', mark: '91/100', status: 'Pending' },
    { id: 'TEST009', cie: 'Lab 3', mark: '98/100', status: 'Pending' },
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setEditForm({
      ...editForm,
      [name]: value,
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setStudent(editForm);
    setIsEditing(false);
  };

  const handleSendResult = (testId) => {
    setTestResults((prevResults) =>
      prevResults.map((test) =>
        test.id === testId
          ? { ...test, status: 'Sent' }
          : test
      )
    );
  };

  return (
    /*
      IMPORTANT:
      Your page already has a header above this dashboard.
      Therefore we subtract the header height from 100dvh.

      172px = approximate height of the header shown in your screenshot.
      Using dvh makes this work better with browser viewport sizing.
    */
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

      {/* =========================
          TOP ACTION BAR
      ========================== */}
      <div
        className="
          flex-none
          flex
          justify-between
          items-center
          bg-white
          p-4
          rounded-xl
          shadow-sm
          border-l-4
          border-yellow-400
          mb-6
        "
      >
        <h1 className="text-2xl font-bold text-gray-800">
          Student Portal
        </h1>

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
            onClick={() => navigate('/exam/instruction')}
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

      {/* =========================
          MAIN CONTENT
      ========================== */}
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

        {/* =========================
            STUDENT PROFILE
        ========================== */}
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

          {/* NO SCROLLBAR HERE */}
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

        {/* =========================
            TEST RESULTS
        ========================== */}
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

          {/* 
            THIS IS THE ONLY ELEMENT THAT CAN SCROLL.
            The outer page cannot scroll.
          */}
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

              {/* TABLE HEADER */}
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
                  <th className="py-3 px-4 font-bold">
                    S.No
                  </th>

                  <th className="py-3 px-4 font-bold">
                    Question Code
                  </th>

                  <th className="py-3 px-4 font-bold">
                    CIE
                  </th>

                  <th className="py-3 px-4 font-bold">
                    Mark
                  </th>

                  <th className="py-3 px-4 font-bold text-right">
                    Action
                  </th>
                </tr>
              </thead>

              {/* TABLE BODY */}
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

                        {test.status === 'Sent' && (
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
                        )}

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

                          {test.status === 'Sent'
                            ? 'Resend'
                            : 'Send'}
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>

      </div>

      {/* =========================
          EDIT PROFILE MODAL
      ========================== */}
      {isEditing && (
        <div
          className="
            fixed
            inset-0
            bg-black/30
            backdrop-blur-sm
            flex
            items-center
            justify-center
            p-4
            z-50
          "
        >
          <div
            className="
              bg-white
              rounded-xl
              shadow-2xl
              w-full
              max-w-2xl
              max-h-[90vh]
              overflow-y-auto
              p-6
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
              "
            >
              <h2 className="text-2xl font-bold text-gray-800">
                Edit Profile
              </h2>

              <button
                onClick={() => setIsEditing(false)}
                className="
                  text-gray-500
                  hover:text-red-500
                  transition
                  cursor-pointer
                "
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
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="col-span-1 md:col-span-2">
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
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-yellow-400
                    outline-none
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
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-yellow-400
                    outline-none
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
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-yellow-400
                    outline-none
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
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-yellow-400
                    outline-none
                  "
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>

                <input
                  type="text"
                  name="department"
                  value={editForm.department}
                  onChange={handleInputChange}
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-yellow-400
                    outline-none
                  "
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section
                </label>

                <input
                  type="text"
                  name="section"
                  value={editForm.section}
                  onChange={handleInputChange}
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-yellow-400
                    outline-none
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
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-yellow-400
                    outline-none
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
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-yellow-400
                    outline-none
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
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-yellow-400
                    outline-none
                  "
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>

                <input
                  type="text"
                  name="username"
                  value={editForm.username}
                  onChange={handleInputChange}
                  className="
                    w-full
                    p-2
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-yellow-400
                    outline-none
                  "
                />
              </div>

              <div
                className="
                  col-span-1
                  md:col-span-2
                  flex
                  justify-end
                  gap-4
                  mt-4
                  border-t
                  pt-4
                "
              >
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="
                    px-4
                    py-2
                    border
                    rounded-lg
                    hover:bg-gray-50
                    font-medium
                    transition
                    cursor-pointer
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
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
                  "
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    <Footer />
    </div>
  );
};

export default StudentDashboard;