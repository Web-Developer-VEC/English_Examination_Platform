import api from "./api";

const API_URL = "/staff";

// GET SCHEDULED EXAMS
export const getScheduleExams = async () => {
    const response = await api.get(
        `${API_URL}/schedule/getscheduleexams`
    );

    return response.data;
};

// CANCEL / DELETE SCHEDULED EXAM
export const deleteScheduledExam = async (testId) => {
    const response = await api.post(
        `${API_URL}/schedule/delete-scheduled-exam`,
        {
            testId:testId,
        }
    );

    return response.data;
};

// END SCHEDULED EXAM
export const endScheduledExam = async (testId) => {
    const response = await api.post(
        `${API_URL}/schedule/end-test`,
        {
            testId: testId,
        }
    );

    return response.data;
};

// RESUME STUDENT EXAM
export const resumeStudentExam = async (payload) => {
    const body =
        typeof payload === "string"
            ? { username: payload }
            : {
                  username: payload?.username,
                  questionCode: payload?.questionCode,
              };

    const response = await api.post(
        `${API_URL}/schedule/resume-student-exam`,
        body
    );

    return response.data;
};

// UPLOAD QUESTIONS
export const uploadQuestions = async ({
    questionCode,
    type = "audio",
    audioFile,
    passage,
    passageFile,
    questionFile,
}) => {
    const formData = new FormData();

    formData.append(
        "questionCode",
        questionCode.trim()
    );

    formData.append(
        "type",
        type
    );

    if (audioFile) {
        formData.append(
            "audio",
            audioFile
        );
    }

    if (passage) {
        formData.append(
            "passage",
            passage.trim()
        );
    }

    if (passageFile) {
        formData.append(
            "passageFile",
            passageFile
        );
    }

    if (questionFile) {
        formData.append(
            "questions",
            questionFile
        );
    }

    const response = await api.post(
        `${API_URL}/questionsupload`,
        formData
    );

    return response.data;
};

// GET QUESTION FORM DATA
export const getQuestionFormData = async () => {
    const response = await api.get(
        `${API_URL}/schedule/getformdata`
    );

    return response.data;
};


// DELETE QUESTION SET
export const deleteQuestionSet = async (questionSetId) => {
    const response = await api.delete(
        `${API_URL}/delete-question-set`,
        {
            data: {
                questionSetId,
            },
        }
    );

    return response.data;
};

// GET FORM DATA
export const getFormData = async () => {
    const response = await api.get(
        `${API_URL}/schedule/getformdata`
    );

    return response.data;
};


// GET EXAM RESULTS / REPORT
export const getExamResults = async (requestBody) => {
    const response = await api.post(
        `${API_URL}/exam-results`,
        requestBody
    );

    return response.data;
};

// =====================================================
// UPLOAD STUDENT DATA
// =====================================================
export const uploadStudentData = async (file) => {
    const formData = new FormData();

    formData.append("student_data", file);

    const response = await api.post(
        `${API_URL}/studentsupload`,
        formData
    );

    return response.data;
};


// =====================================================
// GET EXISTING STUDENTS
// =====================================================
export const getExistingStudents = async ({
    batch,
    department,
    section,
}) => {

    const response = await api.post(
        `${API_URL}/student-data`,
        {
            batch,
            department,
            section,
        }
    );

    return response.data;
};

// Delete existing student data
export const deleteStudent = async (admissionNo) => {
  const response = await api.delete("/staff/delete-student", {
    data: {
      admissionNo: admissionNo,
    },
  });
  return response.data;
};


// =====================================================
// GET BATCH / DEPARTMENT / SECTION
// =====================================================

// SCHEDULE EXAM
export const scheduleExam = async (payload) => {
    const response = await api.post(
        `${API_URL}/schedule/scheduleexam`,
        payload
    );

    return response.data;
};

// =====================================================
// GET DEPARTMENT / SECTION DATA
// =====================================================

export const getScheduleFormData = async () => {
    const response = await api.get(
        `${API_URL}/schedule/getformdata`
    );

    return response.data;
};


// =====================================================
// GET ALL STAFF
// =====================================================

export const getStaff = async () => {
    const response = await api.get(
        `${API_URL}/getstaff`
    );

    return response.data;
};


// =====================================================
// ADD / UPDATE / DELETE STAFF
// =====================================================

export const updateStaff = async (payload) => {
    const response = await api.post(
        `${API_URL}/updatestaff`,
        payload
    );

    return response.data;
};

// =====================================================
// UPDATE STUDENT PROFILE ACCESS
// =====================================================

export const updateStudentProfileAccess = async (
    students
) => {
    const response = await api.put(
        `${API_URL}/student-edit`,
        {
            students,
        }
    );

    return response.data;
};


// =====================================================
// GET ACADEMIC YEAR
// =====================================================

export const getAcademicYear = async () => {
    const response = await api.get(
        `${API_URL}/academic-year`
    );

    return response.data;
};


// =====================================================
// UPDATE ACADEMIC YEAR
// =====================================================

export const updateAcademicYear = async (
    academicYear
) => {
    const response = await api.put(
        `${API_URL}/academic-year`,
        {
            academicYear,
        }
    );

    return response.data;
};

// =====================================================
// GET SUBJECTS
// =====================================================

export const getSubjects = async () => {
    const response = await api.get(
        `${API_URL}/subjects`
    );

    return response.data;
};

// =====================================================
// UPDATE SUBJECTS
// =====================================================

export const updateSubjects = async (subjects) => {
    const response = await api.put(
        `${API_URL}/subjects`,
        {
            subjects,
        }
    );

    return response.data;
};
export const deleteStaff = async (data) => {
  const response = await api.post(
    "/staff/deletestaff",
    {
      data,
    }
  );

  return response.data;
};  