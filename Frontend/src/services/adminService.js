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
            testId,
        }
    );

    return response.data;
};

// UPLOAD QUESTIONS
export const uploadQuestions = async ({
    questionCode,
    audioFile,
    questionFile,
}) => {

    const formData = new FormData();

    formData.append(
        "questionCode",
        questionCode.trim()
    );

    formData.append(
        "audio",
        audioFile
    );

    formData.append(
        "questions",
        questionFile
    );

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


// =====================================================
// GET BATCH / DEPARTMENT / SECTION
// =====================================================
export const getScheduleFormData = async () => {

    const response = await api.get(
        `${API_URL}/schedule/getformdata`
    );

    return response.data;
};

// SCHEDULE EXAM
export const scheduleExam = async (payload) => {
    const response = await api.post(
        `${API_URL}/schedule/scheduleexam`,
        payload
    );

    return response.data;
};