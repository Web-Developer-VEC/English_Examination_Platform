import { Routes, Route, Navigate } from "react-router-dom";

import Register from "../components/auth/Register";
import AdminLogin from "../components/admin/AdminLogin";
import StudentLogin from "../components/student/StudentLogin";

import StudentLayout from "../layouts/StudentLayout";
import AdminLayout from "../layouts/AdminLayout";

import StartTest from "../pages/student/StartTest";
import AudioTest from "../pages/student/AudioTest";

import Dashboard from "../pages/admin/Dashboard";
import Admins from "../pages/admin/Admins";
import CreateTest from "../pages/admin/CreateTest";
import Schedule from "../pages/admin/Schedule";
import Results from "../pages/admin/Results";
import Students from "../pages/admin/Students";
import Sidebar from "../components/admin/Sidebar";

export default function AppRoutes() {
  return (
    <Routes>

      {/* Authentication */}
      <Route path="/register" element={<Register />} />
      <Route path="/adminlogin" element={<AdminLogin />} />
      <Route path="/" element={<StudentLogin />} />

      {/* Student */}
      <Route path="/student" element={<StudentLayout />}>
        <Route path="start-test" element={<StartTest />} />
        <Route path="audio" element={<AudioTest />} />
      </Route>

      {/* admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="admins" element={<Admins />} />
        <Route path="create-test" element={<CreateTest />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="results" element={<Results />} />
        {/* <Route path="Sidebar" element={<Sidebar />} /> */}
        <Route path="students" element={<Students />} />
      </Route>

    </Routes>
  );
}