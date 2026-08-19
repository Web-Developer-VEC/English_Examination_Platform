import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import tick from "../../assets/images/tick.png";
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
    const [examRemaining, setExamRemaining] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);
    const malpracticeReportingRef = useRef(false);
    const examClosedRef = useRef(false);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [playCount, setPlayCount] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [isRestored, setIsRestored] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [violations, setViolations] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState("");
    const location = useLocation();
    const examData = location.state;
    const MAX_PLAYS = 2;
    const remainingTime = Math.max(duration - currentTime, 0);
    const audioProgress = duration > 0 ? ((duration - currentTime) / duration) * 100 : 0;
    const examDuration = examData?.duration || 0;
    const totalExamTime = (examData?.duration || 0) * 60;
    const examRemainingPercentage =
        totalExamTime > 0
            ? (examRemaining / totalExamTime) * 100
            : 0;

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

        console.log(
            "🔥 MALPRACTICE PAYLOAD:",
            payload
        );

        try {

            const response = await reportMalpractice(payload);

            console.log(
                "🔥 MALPRACTICE RESPONSE:",
                response
            );

            const violationNo =
                response?.malpractice?.violationNo || 0;

            const remaining =
                response?.malpractice?.remaining || 0;

            setViolations(violationNo);

            console.log(
                "🔥 VIOLATION NUMBER:",
                violationNo
            );

            console.log(
                "🔥 REMAINING CHANCES:",
                remaining
            );

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
                    navigate("/");
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

            console.error(
                "🔥 MALPRACTICE REPORT FAILED:",
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

                    clearTestState();

                    setWarningMessage(
                        data?.message ||
                        "Malpractice limit exceeded. Examination has been closed."
                    );

                    setShowWarning(true);

                    setTimeout(() => {
                        navigate("/");
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

        // Get logged-in student session
        const session = getStudentSession();

        if (!session?.user?.admissionNo) {
            console.error("Student session not found.");
            return;
        }

        // Prepare backend payload
        const payload = {
            testId: examData?.testId,
            admissionNo: session.user.admissionNo,
            questionNo: Number(questionNo),
            studentAnswer: answer
        };

        console.log(
            "🔥 SYNC ANSWER PAYLOAD:",
            payload
        );

        try {

            const response = await syncExam(payload);

            console.log(
                "🔥 SYNC ANSWER RESPONSE:",
                response
            );

        } catch (error) {

            console.error(
                "🔥 ANSWER SYNC FAILED:",
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

    const handleSubmit = async () => {

        if (isSubmitting) return;

        if (examClosedRef.current) {
            console.error(
                "Exam already closed due to malpractice."
            );
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
            console.error("Student session not found.");
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
        console.log(
            "🔥 SUBMIT EXAM PAYLOAD:",
            payload
        );
        try {
            const response = await submitExam(payload);
            console.log(
                "🔥 SUBMIT EXAM RESPONSE:",
                response
            );
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
            clearTestState();
            // Redirect countdown
            let seconds = 7;
            setCountdown(seconds);
            const timer = setInterval(() => {
                seconds--;
                setCountdown(seconds);
                if (seconds <= 0) {
                    clearInterval(timer);
                    navigate("/");
                }
            }, 1000);
        } catch (error) {
            console.error(
                "🔥 EXAM SUBMISSION FAILED:",
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
            // Allow the student to try submitting again
            setIsSubmitting(false);
        }
    };

    const terminateTest = () => {
        clearTestState();
        /*
            Backend
            status:"TERMINATED"
            reason:"Multiple Violations"
        */
        navigate("/");
    }


    useEffect(() => {

        const saved = getTestState();

        if (saved) {

            setQuestions(saved.questions);
            setAnswers(saved.answers);
            setPlayCount(saved.playCount);
            setCurrentTime(saved.currentTime);
            setIsRestored(true);

            return;
        }

        if (!examData) {

            console.error("No exam data received.");

            navigate("/student/start-test");

            return;
        }

        console.log(
            "Exam data received:",
            examData
        );

        const finalQuestions = examData.questions.map(
            (question) => {

                const optionArray = Object.entries(
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

                return shuffleOptions(questionData);
            }
        );

        setQuestions(finalQuestions);

    }, [examData, navigate]);

    useEffect(() => {
        if (questions.length === 0) return;
        saveTestState({
            questions,
            answers,
            playCount,
            currentTime
        });
    }, [questions, answers, playCount]);
    useEffect(() => {
        const interval = setInterval(() => {
            if (!audioRef.current) return;
            saveTestState({
                questions,
                answers,
                playCount,
                currentTime: audioRef.current.currentTime
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [questions, answers, playCount]);

    useEffect(() => {

        const visibilityHandler = () => {

            if (document.hidden) {
                handleViolation(
                    "Tab switched or window minimized."
                );
            }

        };

        const contextMenuHandler = (e) => {

            e.preventDefault();

            handleViolation(
                "Right click detected."
            );

        };

        const keyHandler = (e) => {

            const key = e.key.toLowerCase();

            if (
                key === "f12" ||
                (e.ctrlKey && key === "r") ||
                (e.ctrlKey && key === "u") ||
                (e.ctrlKey && e.shiftKey && key === "i") ||
                (e.ctrlKey && e.shiftKey && key === "j")
            ) {

                e.preventDefault();

                handleViolation(
                    "Restricted keyboard shortcut detected."
                );

            }

        };

        document.addEventListener(
            "visibilitychange",
            visibilityHandler
        );

        document.addEventListener(
            "contextmenu",
            contextMenuHandler
        );

        window.addEventListener(
            "keydown",
            keyHandler
        );

        return () => {

            document.removeEventListener(
                "visibilitychange",
                visibilityHandler
            );

            document.removeEventListener(
                "contextmenu",
                contextMenuHandler
            );

            window.removeEventListener(
                "keydown",
                keyHandler
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
                clearTestState();
                navigate("/");
            }
        };

        updateExamTimer();

        const timer = setInterval(updateExamTimer, 1000);

        return () => clearInterval(timer);
    }, [examData?.endTime, navigate]);

    return (
        <>
            {
                showWarning && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl p-8 w-[420px] text-center">
                            <h2 className="text-2xl font-bold text-red-600">
                                Examination Warning
                            </h2>
                            <p className="mt-4">
                                {warningMessage}
                            </p>
                            <p className="mt-3 font-semibold">
                                Remaining Chances :
                                {Math.max(3 - violations, 0)}
                            </p>
                        </div>
                    </div>
                )
            }
            {
                showSuccess && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

                        <div className="bg-white rounded-2xl shadow-2xl p-8 w-[450px]">

                            <div className="flex flex-col items-center text-center space-y-4">

                                {/* Success Icon */}
                                <img src={tick} alt="Success" className="w-20 h-20 object-contain animate-bounce" />

                                {/* Heading */}
                                <h2 className="text-2xl font-bold text-[#800000]">
                                    Test Submitted Successfully
                                </h2>

                                {/* Progress Section */}
                                <div className="w-full mt-3">

                                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">

                                        <div
                                            className="h-full bg-[#800000] transition-[width] duration-1000 ease-linear"
                                            style={{
                                                width: `${getProgress(countdown)}%`
                                            }}
                                        />

                                    </div>

                                    <p className="mt-3 text-sm text-gray-600 font-medium">
                                        Redirecting in
                                        <span className="font-bold text-[#800000]">
                                            {" "}{countdown}{" "}
                                        </span>
                                        seconds...
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>
                )
            }
            {/* Exam Remaining */}
            <div className="flex justify-center mt-3 ml-350">
                <div
                    className={`inline-flex flex-col items-center rounded-lg border px-3 py-1 ${examRemainingPercentage < 10
                        ? "border-red-500 bg-red-50"
                        : examRemainingPercentage < 25
                            ? "border-yellow-500 bg-yellow-50"
                            : "border-green-500 bg-green-50"
                        }`}
                >
                    <span className="text-xs text-gray-500">
                        Exam Remaining
                    </span>

                    <span
                        className={`text-lg font-bold ${examRemainingPercentage < 10
                            ? "text-red-600"
                            : examRemainingPercentage < 25
                                ? "text-yellow-500"
                                : "text-green-600"
                            }`}
                    >
                        {formatTime(examRemaining)}
                    </span>
                </div>
            </div>
            <div className="max-w-5xl mx-auto p-6">
                <div className="mb-4">

                    {/* Timer Row */}
                    <div className="flex items-end justify-between mb-2">

                        {/* Audio Remaining */}
                        <div>
                            <p className="font-medium">
                                Remaining : {formatTime(remainingTime)}
                            </p>
                        </div>
                    </div>

                    {/* Audio Progress Bar */}
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#800000] transition-[width] duration-300"
                            style={{
                                width: `${audioProgress}%`
                            }}
                        />
                    </div>

                </div>

                <audio
                    ref={audioRef}
                    src={examData?.audioUrl}
                    preload="metadata"
                    onLoadedMetadata={() => {
                        setDuration(audioRef.current.duration);
                        if (isRestored) {
                            audioRef.current.currentTime = currentTime;
                        }
                    }}
                    onTimeUpdate={() => {
                        setCurrentTime(audioRef.current.currentTime);
                    }}
                    onEnded={handleAudioEnd}
                />

                <button
                    onClick={handlePlay}
                    disabled={isPlaying || isAudioLocked(playCount, MAX_PLAYS)}
                    className="bg-yellow-300 text-black px-6 py-3 hover:bg-[#800000] hover:text-white rounded-lg disabled:bg-gray-400"
                >
                    {
                        isAudioLocked(playCount, MAX_PLAYS)
                            ? "Audio Locked"
                            : playCount === 0
                                ? "Play Audio"
                                : "Replay Audio"
                    }
                </button>
                <p className="mt-3">
                    Remaining Plays :
                    {remainingPlays(playCount, MAX_PLAYS)}
                </p>

                {/* Questions */}

                {
                    questions.map((question, index) => (
                        <div
                            key={question.id}
                            className="bg-white rounded-xl shadow p-6 mb-6"
                        >
                            <h2 className="font-semibold">
                                Question {index + 1}
                            </h2>
                            <p className="mt-3">
                                {question.question}
                            </p>
                            <div className="mt-5">

                                {
                                    question.options.map(option => (
                                        <label
                                            key={option.key}
                                            className="flex items-center gap-3 py-2"
                                        >
                                            <input
                                                type="radio"
                                                name={question.id}
                                                value={option.value}
                                                checked={
                                                    answers[question.id] === option.value
                                                }
                                                onChange={() =>
                                                    handleAnswer(
                                                        question.id,
                                                        option.value
                                                    )
                                                }
                                            />

                                            <span>
                                                {option.key}. {option.value}
                                            </span>
                                        </label>
                                    ))
                                }


                            </div>

                        </div>

                    ))
                }
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-6">
                    <h2 className="font-semibold">
                        Answered :
                        {answeredCount(answers)}/{questions.length}
                    </h2>
                </div>

                {/* Submit */}

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !isAllQuestionsAnswered(answers, questions)}
                    className="bg-[#800000] text-black bg-yellow-300 enabled:hover:bg-[#800000] enabled:hover:text-white px-6 py-3 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "Submitting..." : "Submit Test"}
                </button>

            </div>

        </>

    );
}