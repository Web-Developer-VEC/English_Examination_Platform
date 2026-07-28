import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";

import StudentLayout from "../layouts/StudentLayout";
import ProfessorLayout from "../layouts/ProfessorLayout";

import StartTest from "../pages/student/StartTest";
import AudioTest from "../pages/student/AudioTest";

import Dashboard from "../pages/professor/Dashboard";
import Professors from "../pages/professor/Professors";
import CreateTest from "../pages/professor/CreateTest";
import Questions from "../pages/professor/Questions";
import Results from "../pages/professor/Results";

export default function AppRoutes() {
  return (
    <Routes>

      {/* Authentication */}
      <Route path="/" element={<Home />} />

      {/* Student */}
      <Route path="/student" element={<StudentLayout />}>
        <Route path="start-test" element={<StartTest />} />
        <Route path="audio" element={<AudioTest />} />
      </Route>

      {/* Professor */}
      <Route path="/professor" element={<ProfessorLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="professors" element={<Professors />} />
        <Route path="create-test" element={<CreateTest />} />
        <Route path="questions" element={<Questions />} />
        <Route path="results" element={<Results />} />
      </Route>

    </Routes>
  );
}