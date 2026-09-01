import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    shuffleOptions,
    remainingPlays,
    isAudioLocked,
    answeredCount,
    isAllQuestionsAnswered,
    getProgress,
    formatTime,
    saveTestState,
    getTestState,
    clearTestState,
    getStudentSession
} from "../../utils/helpers";
import { syncExam, submitExam, reportMalpractice } from "../../services/studentService";

export default function AudioTest() {

    const navigate = useNavigate();
    const location = useLocation();

    const audioRef = useRef(null);
    const examClosedRef = useRef(false);
    const malpracticeReportingRef = useRef(false);

    const [examRemaining, setExamRemaining] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [syncingQuestions, setSyncingQuestions] = useState({});
    const [playCount, setPlayCount] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [isRestored, setIsRestored] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [violations, setViolations] = useState(0);
    const [warningMessage, setWarningMessage] = useState("");
    const [showWarning, setShowWarning] = useState(false);
    const [showFullscreenPopup, setShowFullscreenPopup] = useState(false);

    const examData = location.state;
    const studentSession = getStudentSession();
    const admissionNo = studentSession?.user?.admissionNo;
    const testId = examData?.testId;
    const MAX_PLAYS = 2;
    const audioProgress = duration > 0 ? ((duration - currentTime) / duration) * 100 : 0;
    const totalExamTime = (examData?.duration || 0) * 60;
    const examRemainingPercentage =
        totalExamTime > 0
            ? (examRemaining / totalExamTime) * 100
            : 0;

    const enterExamFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
            return true;
        } catch (error) {

            console.error("Exam fullscreen request failed:", error);

            return false;
        }
    };

    const handleViolation = async (reason) => {

        // Prevent multiple requests from the same/rapid events
        if (malpracticeReportingRef.current) {
            return;
        }

        // Exam already closed
        if (examClosedRef.current) {
            return;
        }

        malpracticeReportingRef.current = true;

        const session = getStudentSession();

        if (!session?.user?.admissionNo) {
            console.error("Student session not found.");
            malpracticeReportingRef.current = false;
            return;
        }

        if (!examData?.testId) {
            console.error("Test ID not found.");
            malpracticeReportingRef.current = false;
            return;
        }

        const payload = {
            testId: examData.testId,
            admissionNo: session.user.admissionNo,
            reason
        };

        try {

            const response = await reportMalpractice(payload);

            const violationNo =
                response?.malpractice?.violationNo || 0;

            setViolations(violationNo);

            // ==========================================
            // EXAM CLOSED
            // ==========================================

            if (response?.examClosed === true) {

                examClosedRef.current = true;

                clearTestState();

                setWarningMessage(
                    response?.message ||
                    "Examination closed due to malpractice."
                );

                setShowWarning(true);

                setTimeout(() => {
                    navigate("/studentlogin");
                }, 3000);

                return;
            }

            // ==========================================
            // VIOLATION 1 / 2
            // ==========================================

            setWarningMessage(reason);

            setShowWarning(true);

            setTimeout(() => {
                setShowWarning(false);
            }, 3000);

        } catch (error) {

            console.error("MALPRACTICE REPORT FAILED:", error);

            /*
             * IMPORTANT:
             *
             * Your backend returns HTTP 403 when
             * malpractice limit is reached.
             *
             * Therefore axios enters catch().
             */

            if (error.response?.status === 403) {

                const data = error.response.data;

                if (data?.examClosed === true) {

                    examClosedRef.current = true;

                    const violationNo =
                        data?.malpractice?.violationNo || 3;

                    setViolations(violationNo);

                    clearTestState(
                        admissionNo,
                        testId
                    );
                    setWarningMessage(
                        "Malpractice limit exceeded. Examination has been closed."
                    );

                    setShowWarning(true);

                    setTimeout(() => {
                        navigate("/studentlogin");
                    }, 3000);

                    return;
                }
            }

        } finally {

            malpracticeReportingRef.current = false;

        }
    };

    const handlePlay = () => {
        if (isPlaying || isAudioLocked(playCount, MAX_PLAYS)) return;
        setIsPlaying(true);
        audioRef.current.play();
    }

    const handleAudioEnd = () => {
        setPlayCount(prev => prev + 1);
        setIsPlaying(false);
    }

    const handleAnswer = async (questionNo, answer) => {

        // Update the screen immediately
        setAnswers(prev => ({
            ...prev,
            [questionNo]: answer
        }));

        setSyncingQuestions(prev => ({
            ...prev,
            [questionNo]: true
        }));

        // Get logged-in student session
        const session = getStudentSession();

        if (!session?.user?.admissionNo) {
            console.error("Student session not found.");
            setSyncingQuestions(prev => ({
                ...prev,
                [questionNo]: false
            }));
            return;
        }

        // Prepare backend payload
        const payload = {
            testId: examData?.testId,
            admissionNo: session.user.admissionNo,
            questionNo: Number(questionNo),
            studentAnswer: answer
        };

        try {

            const response = await syncExam(payload);

        } catch (error) {

            console.error("ANSWER SYNC FAILED:", error);

        } finally {
            setSyncingQuestions(prev => ({
                ...prev,
                [questionNo]: false
            }));
        }
    };

    const handleSubmit = async () => {

        if (isSubmitting) return;

        if (examClosedRef.current) {
            console.error("Exam already closed due to malpractice.");
            return;
        }

        if (submitted) {
            return;
        }
        // Make sure all questions are answered
        if (!isAllQuestionsAnswered(answers, questions)) {
            return;
        }
        // Get logged-in student
        const session = getStudentSession();
        if (!session?.user?.admissionNo) {
            navigate("/studentlogin");
            return;
        }
        // Make sure we have testId
        if (!examData?.testId) {
            console.error("Test ID not found.");
            return;
        }
        setIsSubmitting(true);
        const payload = {
            testId: examData.testId,
            admissionNo: session.user.admissionNo
        };
        try {
            const response = await submitExam(payload);
            if (!response?.success) {
                throw new Error(
                    response?.message ||
                    "Failed to submit examination."
                );
            }
            // Exam successfully submitted
            setSubmitted(true);
            setShowSuccess(true);
            // Stop saving old exam state
            clearTestState(
                admissionNo,
                testId
            );
            // Redirect countdown
            let seconds = 7;
            setCountdown(seconds);
            const timer = setInterval(() => {
                seconds--;
                setCountdown(seconds);
                if (seconds <= 0) {
                    clearInterval(timer);
                    navigate("/student/dashboard");
                }
            }, 1000);
        } catch (error) {
            console.error("EXAM SUBMISSION FAILED:", error);
            // Allow the student to try submitting again
            setIsSubmitting(false);
        }
    };

    useEffect(() => {

        const handleFullscreenChange = () => {

            if (!document.fullscreenElement) {
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

    }, []);


    useEffect(() => {

        // ==========================================
        // CHECK EXAM DATA
        // ==========================================

        if (!examData) {

            console.error("No exam data received.");

            navigate("/exam/instruction");

            return;
        }


        // ==========================================
        // CHECK STUDENT SESSION
        // ==========================================

        const session = getStudentSession();

        if (!session?.user?.admissionNo) {

            navigate("/studentlogin");

            return;
        }


        // ==========================================
        // CHECK TEST ID
        // ==========================================

        if (!examData.testId) {

            console.error("Entered wrong Testcode");

            navigate("/exam/instruction");

            return;
        }


        const currentAdmissionNo =
            session.user.admissionNo;

        const currentTestId =
            examData.testId;


        // ==========================================
        // RESTORE THIS STUDENT'S TEST STATE
        // ==========================================

        const saved = getTestState(
            currentAdmissionNo,
            currentTestId
        );


        if (saved) {
            setQuestions(
                saved.questions || []
            );

            setAnswers(
                saved.answers || {}
            );

            setPlayCount(
                saved.playCount || 0
            );

            setCurrentTime(
                saved.currentTime || 0
            );

            setIsRestored(true);

            return;
        }


        // ==========================================
        // CREATE QUESTIONS FOR THIS TEST
        // ==========================================

        const finalQuestions =
            examData.questions.map((question) => {

                const optionArray =
                    Object.entries(
                        question.options
                    ).map(([key, value]) => ({
                        key,
                        value
                    }));

                const questionData = {
                    id: question.questionNo,
                    question: question.question,
                    options: optionArray
                };

                return shuffleOptions(
                    questionData
                );
            });


        setQuestions(finalQuestions);

        // New student/test = no answers
        setAnswers({});

        setPlayCount(0);

        setCurrentTime(0);

    }, [examData, navigate]);

    useEffect(() => {

        if (
            questions.length === 0 ||
            !admissionNo ||
            !testId
        ) {
            return;
        }

        saveTestState(
            {
                questions,
                answers,
                playCount,
                currentTime
            },
            admissionNo,
            testId
        );

    }, [
        questions,
        answers,
        playCount,
        currentTime,
        admissionNo,
        testId
    ]);
    useEffect(() => {

        if (
            !admissionNo ||
            !testId
        ) {
            return;
        }

        const interval = setInterval(() => {

            if (!audioRef.current) {
                return;
            }

            saveTestState(
                {
                    questions,
                    answers,
                    playCount,
                    currentTime:
                        audioRef.current.currentTime
                },
                admissionNo,
                testId
            );

        }, 1000);

        return () => {
            clearInterval(interval);
        };

    }, [
        questions,
        answers,
        playCount,
        admissionNo,
        testId
    ]);

    useEffect(() => {

        // ==========================================
        // TAB / WINDOW SWITCH
        // ==========================================

        const visibilityHandler = () => {

            if (document.hidden) {

                handleViolation(
                    "Tab switched or window minimized."
                );

            }

        };

        const handleVisibilityChange = () => {
            if (document.hidden && !examClosedRef.current) {
                handleViolation(
                    "Exam window was moved to the background."
                );
            }
        };

        const handleWindowBlur = () => {
            if (!examClosedRef.current) {
                handleViolation(
                    "Exam window lost focus."
                );
            }
        };

        // ==========================================
        // RIGHT CLICK
        // ==========================================

        const contextMenuHandler = (e) => {

            e.preventDefault();

            handleViolation(
                "Right click detected."
            );

        };


        // ==========================================
        // KEYBOARD
        // ==========================================

        const keyHandler = (e) => {

            const key = e.key.toLowerCase();
            const code = e.code;

            // ==========================================
            // MEDIA KEYS
            // BLOCK ONLY - NO VIOLATION
            // ==========================================

            const mediaKeys = [
                "MediaPlayPause",
                "MediaTrackNext",
                "MediaTrackPrevious",
                "MediaStop"
            ];

            if (
                mediaKeys.includes(e.key) ||
                mediaKeys.includes(code)
            ) {
                e.preventDefault();
                e.stopPropagation();
                handleViolation(
                    "Media key pressed."
                );
                return;
            }


            // ==========================================
            // PRINT SCREEN
            // VIOLATION
            // ==========================================

            if (
                e.key === "PrintScreen" ||
                code === "PrintScreen"
            ) {
                e.preventDefault();
                e.stopPropagation();

                handleViolation(
                    "Print Screen key pressed."
                );

                return;
            }

            if (e.key === "Meta") {
                e.preventDefault();
                e.stopPropagation();

                handleViolation(
                    "Windows key pressed."
                );

                return;
            }


            // ==========================================
            // CTRL KEY
            // VIOLATION
            // ==========================================

            if (e.key === "Control") {

                e.preventDefault();
                e.stopPropagation();

                handleViolation(
                    "Ctrl key pressed."
                );

                return;
            }


            // ==========================================
            // SHIFT KEY
            // VIOLATION
            // ==========================================

            if (e.key === "Shift") {

                e.preventDefault();
                e.stopPropagation();

                handleViolation(
                    "Shift key pressed."
                );

                return;
            }


            // ==========================================
            // FUNCTION KEYS
            // ==========================================

            const restrictedFunctionKeys = [
                "F4",
                "F5",
                "F6",
                "F7",
                "F8",
                "F9",
                "F10",
                "F11",
                "F12"
            ];

            if (restrictedFunctionKeys.includes(e.key)) {

                e.preventDefault();
                e.stopPropagation();

                handleViolation(
                    `${e.key} key pressed.`
                );

                return;
            }


            // ==========================================
            // RESTRICTED SHORTCUTS
            // ==========================================

            if (
                (e.ctrlKey && key === "r") ||
                (e.ctrlKey && key === "u") ||
                (e.ctrlKey && e.shiftKey && key === "i") ||
                (e.ctrlKey && e.shiftKey && key === "j")
            ) {

                e.preventDefault();
                e.stopPropagation();

                handleViolation(
                    "Restricted keyboard shortcut detected."
                );

                return;
            }
        };
        // ==========================================
        // KEY UP
        // ==========================================

        const keyUpHandler = (e) => {

            const mediaKeys = [
                "MediaPlayPause",
                "MediaTrackNext",
                "MediaTrackPrevious",
                "MediaStop",
            ];

            if (
                mediaKeys.includes(e.key) ||
                mediaKeys.includes(e.code)
            ) {
                e.preventDefault();
                e.stopPropagation();
                handleViolation("Media key pressed.");
            }
        };
        // ==========================================
        // PRINT
        // ==========================================

        const beforePrintHandler = () => {

            handleViolation(
                "Print action detected."
            );

        };


        // ==========================================
        // REGISTER EVENTS
        // ==========================================

        document.addEventListener(
            "visibilitychange",
            visibilityHandler
        );

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        document.addEventListener(
            "contextmenu",
            contextMenuHandler
        );

        window.addEventListener(
            "keydown",
            keyHandler,
            true
        );

        window.addEventListener(
            "keyup",
            keyUpHandler,
            true
        );

        window.addEventListener(
            "beforeprint",
            beforePrintHandler
        );

        window.addEventListener(
            "blur",
            handleWindowBlur
        );

        // ==========================================
        // CLEANUP
        // ==========================================

        return () => {

            document.removeEventListener(
                "visibilitychange",
                visibilityHandler
            );

            window.removeEventListener(
                "blur",
                handleWindowBlur
            );

            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );

            document.removeEventListener(
                "contextmenu",
                contextMenuHandler
            );

            window.removeEventListener(
                "keydown",
                keyHandler,
                true
            );

            window.removeEventListener(
                "keyup",
                keyUpHandler,
                true
            );

            window.removeEventListener(
                "beforeprint",
                beforePrintHandler
            );

        };

    }, [examData, navigate]);

    useEffect(() => {
        if (!examData?.endTime) return;

        const updateExamTimer = () => {
            const end = new Date(examData.endTime).getTime();
            const now = Date.now();

            const remaining = Math.max(
                Math.floor((end - now) / 1000),
                0
            );

            setExamRemaining(remaining);

            if (remaining === 0) {
                // Exam time finished
                clearTestState(
                    admissionNo,
                    testId
                );
                navigate("/student/dashboard");
            }
        };

        updateExamTimer();

        const timer = setInterval(updateExamTimer, 1000);

        return () => clearInterval(timer);
    }, [examData?.endTime, navigate]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-[#800000]/10 flex flex-col">
            {/* OVERLAYS */}
            {showFullscreenPopup && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 text-center transform transition-all">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                            <svg
                                className="w-8 h-8"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                                ></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">
                            Fullscreen Required
                        </h2>
                        <p className="text-slate-500 text-sm mb-8">
                            This assessment requires fullscreen mode to ensure a secure
                            testing environment.
                        </p>
                        <button
                            onClick={async () => {
                                const success = await enterExamFullscreen();
                                if (success) setShowFullscreenPopup(false);
                            }}
                            className="w-full bg-[#800000] text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-[#6b0000] transition-colors shadow-sm"
                        >
                            Return to Assessment
                        </button>
                    </div>
                </div>
            )}

            {showWarning && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
                    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 text-center">
                        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-5">
                            <svg
                                className="w-8 h-8"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                ></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">
                            Security Warning
                        </h2>
                        <p className="text-slate-600 text-sm font-medium mb-6">
                            {warningMessage}
                        </p>
                        <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Remaining Chances
                            </span>
                            <span className="text-xl font-bold text-red-500">
                                {Math.max(3 - violations, 0)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {showSuccess && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
                    <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md mx-4 text-center">
                        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg
                                className="w-10 h-10"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                ></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            Assessment Submitted
                        </h2>
                        <p className="text-slate-500 text-sm mb-8">
                            Your answers have been securely saved and recorded.
                        </p>
                        <div className="w-full">
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all duration-1000 ease-linear rounded-full"
                                    style={{ width: `${getProgress(countdown)}%` }}
                                />
                            </div>
                            <p className="mt-4 text-xs text-slate-400 font-medium uppercase tracking-widest">
                                Redirecting in {countdown}s
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* FIXED EXAM TIMER */}
            <div className="fixed top-[160px] left-0 right-0 z-50">
                <div className="flex justify-center items-center py-3">
                    <div className="flex items-center px-5 py-2 rounded-lg border border-slate-300 bg-white shadow-sm">

                        <span className="text-lg font-medium text-gray-700">
                            Time Left:
                        </span>

                        <span
                            className={`ml-2 text-lg font-bold ${examRemainingPercentage < 10
                                ? "text-red-600"
                                : "text-green-600"
                                }`}
                        >
                            {formatTime(examRemaining)}
                        </span>

                    </div>
                </div>
            </div>

            {/* MAIN CONTENT LAYOUT */}
            <main className="max-w-[1200px] mx-auto w-full px-4 md:px-6 py-6 flex-1">
                {/* LEFT COLUMN: Player & Questions */}
                <div className="w-full flex flex-col gap-6">
                    {/* SUBJECT INFORMATION */}
                   
                    <div className="text-center flex justify-center items-center gap-210">

                        <div>
                            <p className="text-sm md:text-base font-semibold text-slate-500">
                                Subject Code
                            </p>

                            <span className="text-lg md:text-xl font-semibold text-slate-700">
                                23EN103L
                            </span>
                        </div>

                        <div>
                            <p className="text-sm md:text-base font-semibold text-slate-500">
                                Subject Name
                            </p>

                            <span className="text-lg md:text-xl font-semibold text-slate-700">
                                TECHNICAL ENGLISH
                            </span>
                        </div>

                    </div>
                    {/* MODERN AUDIO PLAYER */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row items-center gap-5">
                        <audio
                            ref={audioRef}
                            src={examData?.audioUrl}
                            preload="metadata"
                            onLoadedMetadata={() => {
                                setDuration(audioRef.current.duration);
                                if (isRestored) audioRef.current.currentTime = currentTime;
                            }}
                            onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
                            onEnded={handleAudioEnd}
                            className="hidden"
                        />

                        {/* Play Button */}
                        <button
                            onClick={handlePlay}
                            disabled={isPlaying || isAudioLocked(playCount, MAX_PLAYS)}
                            className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all ${isAudioLocked(playCount, MAX_PLAYS)
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                : isPlaying
                                    ? "bg-[#800000] text-white shadow-lg shadow-red-900/20 scale-105"
                                    : "bg-[#800000] text-white shadow-md hover:bg-[#6b0000] hover:scale-105"
                                }`}
                        >
                            {isAudioLocked(playCount, MAX_PLAYS) ? (
                                <svg
                                    className="w-6 h-6"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                            ) : isPlaying ? (
                                <svg
                                    className="w-6 h-6"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                            ) : (
                                <svg
                                    className="w-7 h-7 ml-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                            )}
                        </button>

                        {/* Player Track */}
                        <div className="flex-1 w-full flex flex-col justify-center gap-2">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-3">
                                    <span className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">
                                        Audio Source
                                    </span>
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${remainingPlays(playCount, MAX_PLAYS) === 0 ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"}`}
                                    >
                                        Plays Left: {remainingPlays(playCount, MAX_PLAYS)}
                                    </span>
                                </div>
                                <span className="text-[13px] font-mono font-semibold text-slate-500">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-200 ease-linear rounded-full ${isAudioLocked(playCount, MAX_PLAYS) ? "bg-slate-400" : "bg-[#800000]"}`}
                                    style={{ width: `${audioProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* QUESTIONS LIST */}
                    <div className="space-y-5">
                        {questions.map((question, index) => (
                            <div
                                id={`question-${question.id}`}
                                key={question.id}
                                className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all hover:border-slate-300"
                            >
                                {/* Question Header */}
                                <div className="px-5 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-semibold text-sm">
                                            {index + 1}
                                        </div>

                                        <span className="text-sm font-medium text-slate-500">
                                            Question
                                        </span>
                                    </div>

                                    <div className="flex items-center">
                                        {syncingQuestions[question.id] ? (
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-md animate-pulse">
                                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                            </div>
                                        ) : answers[question.id] ? (
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-md">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                Saved
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Question Body */}
                                <div className="px-5 md:px-6 py-5">
                                    {/* Question */}
                                    <h2 className="text-[17px] md:text-lg text-slate-800 font-medium leading-relaxed mb-4">
                                        {question.question}
                                    </h2>

                                    {/* Options */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                                        {question.options.map((option, idx) => {
                                            const isSelected =
                                                answers[question.id] === option.value;

                                            const serialLabel = String.fromCharCode(65 + idx);

                                            return (
                                                <label
                                                    key={option.key}
                                                    className="group flex items-center gap-3 py-3 cursor-pointer"
                                                >
                                                    {/* Native Radio */}
                                                    <input
                                                        type="radio"
                                                        name={`question-${question.id}`}
                                                        value={option.value}
                                                        checked={isSelected}
                                                        onChange={() =>
                                                            handleAnswer(question.id, option.value)
                                                        }
                                                        className="sr-only"
                                                    />

                                                    {/* Radio Circle */}
                                                    <div
                                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                                            ? "border-[#800000]"
                                                            : "border-slate-300 group-hover:border-slate-400"
                                                            }`}
                                                    >
                                                        {isSelected && (
                                                            <div className="w-2.5 h-2.5 rounded-full bg-[#800000]" />
                                                        )}
                                                    </div>

                                                    {/* Option Letter */}
                                                    <span
                                                        className={`w-5 text-sm font-semibold ${isSelected
                                                            ? "text-[#800000]"
                                                            : "text-slate-400"
                                                            }`}
                                                    >
                                                        {serialLabel}.
                                                    </span>

                                                    {/* Option Text */}
                                                    <span
                                                        className={`text-[15px] leading-snug ${isSelected
                                                            ? "text-slate-900 font-medium"
                                                            : "text-slate-600 group-hover:text-slate-900"
                                                            }`}
                                                    >
                                                        {option.value}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* ANSWERED COUNT + SUBMIT */}
                    <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

                        {/* Answered Count */}
                        <div className="flex items-center justify-between mb-5">

                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Assessment Progress
                                </p>

                                <p className="text-xl font-bold text-slate-800 mt-1">
                                    {answeredCount(answers)} / {questions.length}
                                    <span className="ml-2 text-sm font-medium text-slate-500">
                                        Questions Answered
                                    </span>
                                </p>
                            </div>

                            {/* Progress */}
                            <div className="text-right">
                                <p className="text-sm font-semibold text-green-600">
                                    {questions.length > 0
                                        ? Math.round(
                                            (answeredCount(answers) / questions.length) * 100
                                        )
                                        : 0
                                    }%
                                </p>
                            </div>

                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-6">

                            <div
                                className="h-full bg-green-500 rounded-full transition-all duration-300"
                                style={{
                                    width: `${questions.length > 0
                                        ? (answeredCount(answers) / questions.length) * 100
                                        : 0
                                        }%`
                                }}
                            />

                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={
                                isSubmitting ||
                                !isAllQuestionsAnswered(answers, questions)
                            }
                            className={`w-25 py-4 ml-auto rounded-xl font-bold text-[15px] transition-all duration-200 flex items-center justify-center gap-2 ${isSubmitting ||
                                !isAllQuestionsAnswered(answers, questions)
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-[#800000] text-white hover:bg-[#6b0000] shadow-md hover:shadow-lg shadow-red-900/20 transform hover:-translate-y-0.5"
                                }`}
                        >

                            {isSubmitting
                                ? "Processing..."
                                : "Submit"
                            }

                            {!isSubmitting &&
                                isAllQuestionsAnswered(answers, questions) && (
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                                        />
                                    </svg>
                                )
                            }

                        </button>

                        {!isAllQuestionsAnswered(answers, questions) && (
                            <p className="text-[11px] text-center mt-3 text-slate-500 font-medium">
                                Answer all questions to submit
                            </p>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
}
