import { Routes, Route, Navigate } from "react-router-dom";

import Register from "../components/auth/Register";
import AdminLogin from "../components/admin/AdminLogin";
import StudentLogin from "../components/student/StudentLogin";
import StudentProtectedRoute from "../components/auth/StudentProtectedRoute";

import StudentLayout from "../layouts/StudentLayout";
import AdminLayout from "../layouts/AdminLayout";

import StartTest from "../pages/student/StartTest";
import AudioTest from "../pages/student/AudioTest";

import Dashboard from "../pages/admin/Dashboard";
import Admins from "../pages/admin/Admins";
import Questionupload from "../pages/admin/Questionupload";
import Schedule from "../pages/admin/Schedule";
import Results from "../pages/admin/StudentResult";
import Students from "../pages/admin/Students";
import FacultyList from "../pages/admin/FacultyList";
import Sidebar from "../components/admin/Sidebar";
import StudentDataUpload from "../pages/admin/StudentDataUpload";
import StudentResult from "../pages/admin/StudentResult";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Authentication */}
      <Route path="/register" element={<Register />} />
      <Route path="/adminlogin" element={<AdminLogin />} />
      <Route path="/" element={<StudentLogin />} />

      {/* Student */}
      <Route element={<StudentProtectedRoute />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route path="start-test" element={<StartTest />} />
          <Route path="exam" element={<AudioTest />} />
        </Route>
      </Route>

      {/* admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="admins" element={<Admins />} />
        <Route path="Questionupload" element={<Questionupload />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="results" element={<Results />} />
        {/* <Route path="Sidebar" element={<Sidebar />} /> */}
        <Route path="students" element={<Students />} />
        <Route path="faculty" element={<FacultyList />} />
        <Route path="student-data" element={<StudentDataUpload />} />
        <Route path="student-result" element={<StudentResult />} />
      </Route>
    </Routes>
  );
}
