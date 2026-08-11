import axios from "axios";

const API_URL = "http://localhost:5000/api/staff/questions";

export const startExam = async (testcode, admissionNo) => {
    const response = await axios.post(
        `${API_URL}/startexam`,
        {
            testcode,
            admissionNo,
        }
    );

    return response.data;
};