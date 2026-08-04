import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Register from "../pages/student/Register";

import StudentLayout from "../layouts/StudentLayout";
import AdminLayout from "../layouts/AdminLayout";

import StartTest from "../pages/student/StartTest";
import AudioTest from "../pages/student/AudioTest";

import Dashboard from "../pages/admin/Dashboard";
import Admins from "../pages/admin/Admins";
import CreateTest from "../pages/admin/CreateTest";
import Questions from "../pages/admin/Questions";
import Results from "../pages/admin/Results";
import Students from "../pages/admin/Students";

export default function AppRoutes() {
  return (
    <Routes>

      {/* Authentication */}
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />

      {/* Student */}
      <Route path="/student" element={<StudentLayout />}>
        <Route path="start-test" element={<StartTest />} />
        <Route path="audio" element={<AudioTest />} />
      </Route>

      {/* admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="admins" element={<Admins />} />
        <Route path="create-test" element={<CreateTest />} />
        <Route path="questions" element={<Questions />} />
        <Route path="results" element={<Results />} />
        <Route path="students" element={<Students />} />
      </Route>

    </Routes>
  );
}