import api from "./api";

const API_URL = "/exam";

export const startExam = async (testcode, admissionNo) => {
    
    const response = await api.post(
        `${API_URL}/startexam`,
        {

            testcode,
            admissionNo,
        }
    );

    return response.data;
};

export const syncExam = async ({
    testId,
    admissionNo,
    questionNo,
    studentAnswer
}) => {

    const response = await api.post(
        `${API_URL}/examsync`,
        {
            testId,
            admissionNo,
            questionNo,
            studentAnswer
        }
    );

    return response.data;
};

// SUBMIT EXAM
export const submitExam = async ({
    testId,
    admissionNo,
}) => {
    const response = await api.post(
        `${API_URL}/submit`,
        {
            testId,
            admissionNo,
        }
    );

    return response.data;
};

export const reportMalpractice = async ({
    testId,
    admissionNo,
    reason
}) => {

    const response = await api.post(
        `${API_URL}/malpractice`,
        {
            testId,
            admissionNo,
            reason
        }
    );

    return response.data;
};