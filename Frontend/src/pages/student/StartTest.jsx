import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { startExam } from "../../services/studentService";
import { getStudentSession } from "../../utils/helpers";

export default function InstructionsPage() {
    const [showFullscreenPopup, setShowFullscreenPopup] = useState(false);
    const [statusPopup, setStatusPopup] = useState({
        show: false,
        type: "error",
        message: ""
    });
    const [accepted, setAccepted] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [error, setError] = useState("");
    const [testCode, setTestCode] = useState("");

    const navigate = useNavigate();
    const isValidTestCode = /^[A-Z0-9]+$/.test(testCode);
    const testCodeRef = useRef(null);
    const testContainerRef = useRef(null);

    const enterFullscreen = async () => {
        try {
            if (document.fullscreenElement) {
                return true;
            }

            await document.documentElement.requestFullscreen();

            return true;

        } catch (error) {
            console.error("Fullscreen request failed:", error);
            return false;
        }
    };

    const showStatusPopup = (message, type = "error") => {
        setStatusPopup({
            show: true,
            type,
            message
        });
    };

    const handleAccept = async (event) => {

        const checked = event.target.checked;

        setAccepted(checked);

        if (checked) {

            await enterFullscreen();

            setTimeout(() => {
                testCodeRef.current?.focus();
            }, 100);

        } else {

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

            // ==========================================
            // GET STUDENT SESSION
            // ==========================================

            const session = getStudentSession();

            if (!session?.user?.admissionNo) {

                showStatusPopup(
                    "Student session not found. Please login again."
                );

                navigate("/student-login");

                return;
            }

            const admissionNo =
                session.user.admissionNo;

            console.log(
                "Student Admission No:",
                admissionNo
            );


            // ==========================================
            // START EXAM
            // ==========================================

            const response = await startExam(
                testCode,
                admissionNo
            );

            console.log(
                "🔥 BACKEND RESPONSE:",
                response
            );


            // ==========================================
            // SUCCESS
            // ==========================================

            if (response?.success) {

                showStatusPopup(
                    "Test started successfully!",
                    "success"
                );

                navigate("/student/exam", {
                    state: {
                        ...response,
                        admissionNo
                    }
                });

            }

        } catch (error) {

            console.error(
                "🔥 START EXAM FAILED:",
                error
            );

            const status =
                error.response?.status;

            const message =
                error.response?.data?.message;


            // ==========================================
            // 400 BAD REQUEST
            // ==========================================

            if (status === 400) {

                showStatusPopup(
                    message || "Invalid request. Please check the test code."  
                );

            }


            // ==========================================
            // 403 FORBIDDEN
            // ==========================================

            else if (status === 403) {

                showStatusPopup(
                    message || "You have already taken this test." 
                );

            }


            // ==========================================
            // 404 NOT FOUND
            // ==========================================

            else if (status === 404) {

                showStatusPopup(
                   message || "Invalid test code or student not found."
                );

            }


            // ==========================================
            // 500 SERVER ERROR
            // ==========================================

            else if (status === 500) {

                showStatusPopup(
                    "Server error. Please try again later."
                );

            }


            // ==========================================
            // NETWORK ERROR
            // ==========================================

            else if (!error.response) {

                showStatusPopup(
                    "Unable to connect to server."
                );

            }


            // ==========================================
            // OTHER ERROR
            // ==========================================

            else {

                showStatusPopup(
                    message || "Something went wrong. Please try again."
                );

            }

        }
    };

    useEffect(() => {

        if (!accepted) return;

        const handleFullscreenChange = () => {

            if (!document.fullscreenElement) {

                console.log("⚠️ Fullscreen exited");

                setShowFullscreenPopup(true);
            }

        };

        document.addEventListener(
            "fullscreenchange",
            handleFullscreenChange
        );

        return () => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange
            );
        };

    }, [accepted]);

    useEffect(() => {

        if (!accepted) return;

        const handleKeyDown = (e) => {

            if (e.key === "F11") {

                e.preventDefault();

                setShowFullscreenPopup(true);

            }

        };

        window.addEventListener(
            "keydown",
            handleKeyDown,
            true
        );

        return () => {

            window.removeEventListener(
                "keydown",
                handleKeyDown,
                true
            );

        };

    }, [accepted]);

    // useEffect(() => {

    //     const handleKeyDown = (e) => {

    //         if (e.key === "F12") {

    //             e.preventDefault();
    //             e.stopPropagation();

    //             console.log("F12 blocked on Start Test page");
    //         }

    //     };

    //     window.addEventListener(
    //         "keydown",
    //         handleKeyDown,
    //         true
    //     );

    //     return () => {

    //         window.removeEventListener(
    //             "keydown",
    //             handleKeyDown,
    //             true
    //         );

    //     };

    // }, []);

    return (
        <>
            {showFullscreenPopup && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">

                    <div className="bg-white rounded-xl p-8 text-center shadow-2xl">

                        <h2 className="text-xl font-bold text-red-600">
                            Fullscreen Required
                        </h2>

                        <p className="mt-3 text-gray-600">
                            You must return to fullscreen mode to continue.
                        </p>

                        <button
                            type="button"
                            onClick={async () => {

                                console.log("🔥 RESTORE FULLSCREEN CLICKED");

                                const success = await enterFullscreen();

                                console.log(
                                    "🔥 FULLSCREEN RESULT:",
                                    success
                                );

                                if (success) {
                                    setShowFullscreenPopup(false);

                                    setTimeout(() => {
                                        testCodeRef.current?.focus();
                                    }, 100);
                                }

                            }}
                            className="mt-6 px-6 py-3 rounded-lg bg-[#800000] text-white font-semibold"
                        >
                            Return to Fullscreen
                        </button>

                    </div>

                </div>
            )}
            {statusPopup.show && (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60">

                    <div className="bg-white rounded-2xl shadow-2xl w-[420px] p-8 text-center">

                        {/* Icon */}
                        <div
                            className={`
                    mx-auto
                    w-14
                    h-14
                    rounded-full
                    flex
                    items-center
                    justify-center
                    text-2xl
                    font-bold
                    ${statusPopup.type === "success"
                                    ? "bg-green-100 text-green-600"
                                    : "bg-red-100 text-red-600"
                                }
                `}
                        >
                            {statusPopup.type === "success" ? "✓" : "!"}
                        </div>

                        {/* Title */}
                        <h2
                            className={`
                    mt-4
                    text-xl
                    font-bold
                    ${statusPopup.type === "success"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                `}
                        >
                            {statusPopup.type === "success"
                                ? "Success"
                                : "Unable to Start Test"
                            }
                        </h2>

                        {/* Message */}
                        <p className="mt-3 text-gray-600">
                            {statusPopup.message}
                        </p>

                        {/* Close */}
                        <button
                            type="button"
                            onClick={() => {
                                setStatusPopup({
                                    show: false,
                                    type: "error",
                                    message: ""
                                });
                            }}
                            className="mt-6 px-7 py-2.5 rounded-lg bg-[#800000] text-white font-semibold hover:bg-[#600000]"
                        >
                            OK
                        </button>

                    </div>

                </div>
            )}
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
                                onChange={async (e) => {
                                    const checked = e.target.checked;
                                    setAccepted(checked);

                                    if (checked) {
                                        await enterFullscreen();

                                        setTimeout(() => {
                                            testCodeRef.current?.focus();
                                        }, 100);
                                    }
                                }}

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
        </>
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