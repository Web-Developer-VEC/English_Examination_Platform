import { Routes, Route, Navigate } from "react-router-dom";

import Register from "../components/auth/Register";
import AdminLogin from "../components/admin/AdminLogin";
import StudentLogin from "../components/student/StudentLogin";
import StudentProtectedRoute from "../components/auth/StudentProtectedRoute";
import AdminProtectedRoute from "../components/auth/AdminProtectedRoute";
import ForgetPassword from "../components/auth/ForgetPassword";

import StudentLayout from "../layouts/StudentLayout";
import AdminLayout from "../layouts/AdminLayout";
import ExamLayout from "../layouts/ExamLayout";

import StartTest from "../pages/student/StartTest";
import AudioTest from "../pages/student/AudioTest";

import AdminDashboard from "../pages/admin/AdminDashboard";
import StudentDashboard from "../pages/student/StudentDashboard";
import Admins from "../pages/admin/Admins";
import QuestionUpload from "../pages/admin/QuestionUpload";
import Schedule from "../pages/admin/Schedule";
import Results from "../pages/admin/StudentResult";
import Students from "../pages/admin/Students";
import FacultyList from "../pages/admin/FacultyList";
import StudentDataUpload from "../pages/admin/StudentDataUpload";
import StudentResult from "../pages/admin/StudentResult";
import ProfileEdit from "../pages/admin/ProfileEdit";
export default function AppRoutes() {
  return (
    <Routes>
      {/* Authentication */}
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<AdminLogin />} />
      <Route path="/studentlogin" element={<StudentLogin />} />
      <Route path="/forgot-password" element={<ForgetPassword />} />

      {/* Student */}
      <Route element={<StudentProtectedRoute />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route path="dashboard" element={<StudentDashboard />} />
        </Route>
        <Route path="/exam" element={<ExamLayout />}>
          <Route path="instruction" element={<StartTest />} />
          <Route path="audiotest" element={<AudioTest />} />
        </Route>
      </Route>

      {/* admin */}
      <Route element={<AdminProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="admins" element={<Admins />} />
          <Route path="questionupload" element={<QuestionUpload />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="results" element={<Results />} />
          <Route path="students" element={<Students />} />
          <Route path="facultyIncharge" element={<FacultyList />} />
          <Route path="studentData" element={<StudentDataUpload />} />
          <Route path="StudentProfileAccess" element={<ProfileEdit />} />
          <Route path="student-result" element={<StudentResult />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
