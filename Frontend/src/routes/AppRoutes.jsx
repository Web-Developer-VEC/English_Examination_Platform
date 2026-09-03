import { Routes, Route, Navigate } from "react-router-dom";
import StudentFullscreen from "../components/student/StudentFullscreen";
import NotFound from "../components/common/NotFound";
import useOnlineStatus from "../hooks/useOnlineStatus";
import Boot from "../components/common/boot";

import Register from "../components/auth/Register";
import AdminLogin from "../components/admin/AdminLogin";
import StudentLogin from "../components/student/StudentLogin";
import StudentProtectedRoute from "../components/auth/StudentProtectedRoute";
import AdminProtectedRoute from "../components/auth/AdminProtectedRoute";
import PWALaunch from "../components/common/PWALaunch";
import ForgetPassword from "../components/auth/ForgetPassword";

import StudentLayout from "../layouts/StudentLayout";
import AdminLayout from "../layouts/AdminLayout";
import ExamLayout from "../layouts/ExamLayout";

import Instruction from "../pages/student/StartTest";
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
      <Route path="/pwa-launch" element={<PWALaunch />} />
      <Route path="/forgot-password" element={<ForgetPassword />} />


      {/* =========================
          ALL STUDENT PAGES
         ========================= */}

      <Route element={<StudentFullscreen />}>

        {/* Student Login */}
        <Route path="/studentlogin" element={<StudentLogin />}/>

        {/* Protected Student Pages */}
        <Route element={<StudentProtectedRoute />}>

          {/* Student */}
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />}/>
          </Route>


          {/* Exam */}
          <Route path="/exam" element={<ExamLayout />}>
            <Route index element={<Navigate to="instruction" replace/>}/>
            <Route path="instruction" element={<Instruction />}/>
            <Route path="audiotest" element={<AudioTest />}/>
          </Route>
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

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

