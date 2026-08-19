import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { startExam } from "../../services/studentService";
import { getStudentSession } from "../../utils/helpers";

export default function InstructionsPage() {
    const [accepted, setAccepted] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [error, setError] = useState("");
    const [testCode, setTestCode] = useState("");

    const navigate = useNavigate();
    const isValidTestCode = /^[A-Z0-9]+$/.test(testCode);
    const testCodeRef = useRef(null);
    const handleAccept = (event) => {
        const checked = event.target.checked;
        setAccepted(checked);
        if (!checked) {
            setTestCode("");
        }
    };

    // TEST CODE HANDLER
    const handleTestCodeChange = (event) => {
        let value = event.target.value.toUpperCase();
        value = value.replace(/[^A-Z0-9]/g, "");
        setTestCode(value);
    };

    // START TEST
    const handleStartTest = async () => {
        console.log("🔥 START TEST BUTTON CLICKED");
        console.log("Test Code:", testCode);

        try {

            // Get logged-in student session
            const session = getStudentSession();

            if (!session?.user?.admissionNo) {
                console.error("Student session not found.");
                navigate("/");
                return;
            }

            // Get actual student's admission number
            const admissionNo = session.user.admissionNo;

            console.log("Student Admission No:", admissionNo);

            // Start exam
            const response = await startExam(
                testCode,
                admissionNo
            );

            console.log("🔥 BACKEND RESPONSE:", response);

            // Send exam data to AudioTest
            navigate("/student/exam", {
                state: {
                    ...response,
                    admissionNo
                }
            });

        } catch (error) {

            console.error(
                "🔥 START EXAM FAILED:",
                error
            );

            console.error(
                "🔥 SERVER RESPONSE:",
                error.response?.data
            );

            console.error(
                "🔥 STATUS:",
                error.response?.status
            );
        }
    };
    useEffect(() => {
        if (accepted) {
            setTimeout(() => {
                testCodeRef.current?.focus();
            }, 500);
        }
    }, [accepted]);

    return (
        <div className="min-h-screen bg-gray-100 px-4 py-10">
            {/* MAIN CONTAINER */}
            <div
                className="
                    max-w-5xl
                    mx-auto
                    bg-white
                    rounded-xl
                    shadow-md
                    overflow-hidden
                "
            >
                {/* Yellow Top Border */}
                <div className="h-2 bg-[#FDCC03]"></div>
                <div className="px-6 md:px-10 py-8">
                    {/* TITLE */}
                    <div className="mb-8">
                        <h1
                            className="
                                text-3xl
                                font-bold
                                text-black
                            "
                        >
                            General Instructions
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Please read the following instructions carefully
                            before proceeding to the assessment.
                        </p>
                    </div>
                    {/* INSTRUCTION LIST */}
                    <div className="space-y-5">
                        <Instruction
                            number="01"
                            text="Use headphones or earphones during the assessment."
                        />
                        <Instruction
                            number="02"
                            text="Make sure you are in a quiet environment before starting."
                        />
                        <Instruction
                            number="03"
                            text="Listen carefully to each audio question before answering."
                        />
                        <Instruction
                            number="04"
                            text="Do not refresh, close, or navigate away from the browser during the assessment."
                        />
                        <Instruction
                            number="05"
                            text="Ensure that you have a stable internet connection throughout the test."
                        />
                        <Instruction
                            number="06"
                            text="The timer will begin immediately after you start the assessment."
                        />
                        <Instruction
                            number="07"
                            text="Complete all questions within the allotted time."
                        />
                    </div>
                    {/* DIVIDER */}
                    <div className="border-t border-gray-200 my-8"></div>
                    {/* CONFIRMATION CHECKBOX */}
                    <label
                        className={`
                            flex
                            items-center
                            gap-4
                            px-5
                            py-4
                            rounded-lg
                            border-2
                            cursor-pointer
                            transition-all
                            duration-300
                            ${accepted
                                ? "border-[#FDCC03] bg-yellow-50"
                                : "border-gray-200 bg-gray-50 hover:border-[#FDCC03]"
                            }
                        `}
                    >
                        <input
                            type="checkbox"
                            checked={accepted}
                            onChange={handleAccept}

                            className="
                                w-5
                                h-5
                                accent-[#FDCC03]
                                cursor-pointer
                            "
                        />
                        <span className="font-medium text-gray-800">

                            I have read and understood all the above
                            instructions.

                        </span>
                    </label>
                    {/* TEST CODE SECTION */}
                    <div
                        className={`
                            overflow-hidden
                            transition-all
                            duration-500
                            ease-in-out
                            ${accepted
                                ? "max-h-60 opacity-100 mt-8"
                                : "max-h-0 opacity-0 mt-0"
                            }
                        `}
                    >
                        {/* Test Code Label */}
                        <label
                            htmlFor="testCode"

                            className="
                                block
                                text-sm
                                font-bold
                                text-black
                                mb-2
                            "
                        >
                            Enter Test Code
                        </label>
                        {/* Description */}
                        <p className="text-sm text-gray-500 mb-3">
                            Enter the test code provided by your faculty.
                        </p>
                        {/* Test Code Input */}
                        <input
                            id="testCode"
                            ref={testCodeRef}
                            type="text"
                            value={testCode}
                            onChange={handleTestCodeChange}
                            maxLength={10}
                            autoComplete="off"
                            className={`
                                w-full
                                md:w-[420px]
                                px-4
                                py-3
                                border-2
                                rounded-lg
                                bg-white
                                text-black
                                font-semibold
                                uppercase
                                tracking-wider
                                outline-none
                                transition-all
                                duration-300
                                ${testCode === ""
                                    ? "border-gray-200 focus:border-[#FDCC03] focus:ring-4 focus:ring-yellow-100"
                                    : isValidTestCode
                                        ? "border-green-500 focus:ring-4 focus:ring-green-100"
                                        : "border-red-400 focus:ring-4 focus:ring-red-100"
                                }
                            `}
                        />
                        {/* TEST CODE VALIDATION MESSAGE */}
                        {testCode && (
                            <p
                                className={`
                                    mt-2
                                    text-sm
                                    font-medium
                                    ${isValidTestCode
                                        ? "text-green-600"
                                        : "text-red-500"
                                    }
                                `}
                            >
                                {
                                    isValidTestCode
                                        ? "✓ Valid test code format"
                                        : "Test code can contain only capital letters and numbers."
                                }
                            </p>
                        )}
                        {/* Character Counter */}
                        <p className="text-xs text-gray-400 mt-2">
                            {testCode.length}/10 characters
                        </p>
                    </div>
                    {/* START TEST BUTTON */}
                    <div className="flex justify-end mt-10">
                        <button
                            onClick={handleStartTest}
                            disabled={
                                !accepted ||
                                !isValidTestCode
                            }
                            className="
                                px-8
                                py-3
                                rounded-lg
                                font-bold
                                transition-all
                                duration-300
                                bg-yellow-300
                                text-black
                                enabled:hover:bg-[#800000]
                                enabled:hover:text-white
                                enabled:hover:shadow-lg
                                enabled:hover:-translate-y-0.5
                                disabled:bg-gray-300
                                disabled:text-gray-500
                                disabled:cursor-not-allowed
                            "
                        >
                            Start Test →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}





// =============================================
// REUSABLE INSTRUCTION COMPONENT
// =============================================

function Instruction({ number, text }) {

    return (

        <div
            className="
                flex
                items-start
                gap-4
                group
            "
        >


            {/* Number */}

            <div
                className="
                    flex-shrink-0
                    w-10
                    h-10
                    flex
                    items-center
                    justify-center
                    rounded-lg
                    bg-[#FDCC03]
                    text-black
                    font-bold
                "
            >

                {number}

            </div>



            {/* Instruction Text */}

            <div
                className="
                    flex-1
                    min-h-10
                    flex
                    items-center
                    px-4
                    py-2
                    rounded-lg
                    bg-gray-50
                    text-gray-700
                    border
                    border-gray-100
                    transition-all
                    duration-200

                    group-hover:border-[#FDCC03]
                "
            >

                {text}

            </div>


        </div>

    );

}