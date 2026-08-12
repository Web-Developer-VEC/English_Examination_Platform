import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { shuffleQuestions, shuffleOptions, remainingPlays, isAudioLocked, answeredCount, isAllQuestionsAnswered, getProgress } from "../../utils/helpers";
import tick from "../../assets/images/tick.png";
import { formatTime, saveTestState, getTestState, clearTestState } from "../../utils/helpers";
import Audiofile from "../../assets/audio/sample.mp3";

export default function AudioTest() {

    const navigate = useNavigate();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);
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
    const MAX_PLAYS = 2;
    const remainingTime = Math.max(duration - currentTime, 0);
    const dummyData = {

        audioUrl: Audiofile,

        questions: [

            {

                id: 1,

                question: "Where did the speaker go?",

                options: [

                    "Airport",

                    "School",

                    "Hospital",

                    "Library"

                ]

            },

            {

                id: 2,

                question: "What time is the meeting?",

                options: [

                    "9 AM",

                    "10 AM",

                    "11 AM",

                    "12 PM"

                ]

            }

        ]

    };

    const handleViolation = (type) => {
        const count = violations + 1;
        setViolations(count);
        setWarningMessage(type);
        setShowWarning(true);
        /*
            Backend
            POST /student/violation
            {
                type,
                count,
                testId,
                studentId
            }
        */
        console.log("Violation Payload:", {
            type,
            count
        });
        setTimeout(() => {
            setShowWarning(false);
        }, 3000);
        if (count >= 3) {
            clearTestState();
            /*
                Backend
                status : TERMINATED
                reason : type
            */
            navigate("/");
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

    const handleAnswer = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));

    }
    const handleSubmit = () => {
        setIsSubmitting(true);
        console.log("Submitted");
        console.log(answers);
        setSubmitted(true);
        setShowSuccess(true);
        let seconds = 7;
        setCountdown(seconds);
        const timer = setInterval(() => {
            seconds--;
            setCountdown(seconds);
            if (seconds === 0) { clearInterval(timer); clearTestState(); navigate("/") }
        }, 1000);
    }

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
        const shuffledQuestions = shuffleQuestions(dummyData.questions);
        const finalQuestions = shuffledQuestions.map(shuffleOptions);
        setQuestions(finalQuestions);
    }, []);
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
        // Tab Change / Minimize
        const visibilityHandler = () => {
            if (document.hidden) {
                handleViolation("Tab switched or window minimized");
            }
        };
        // Right Click
        const contextMenuHandler = (e) => {
            e.preventDefault();
            handleViolation("Right click detected");
        };
        // Keyboard Shortcuts
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
                handleViolation("Restricted keyboard shortcut");
            }
        };
        // Register Listeners
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
        // Cleanup
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
    }, [violations]);

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

                                {/* Message */}
                                <p className="text-gray-600">
                                    The result has been sent to your email.
                                </p>

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
            <div className="max-w-5xl mx-auto p-6">


                {/* Audio Section */}
                <audio
                    ref={audioRef}
                    src={dummyData.audioUrl}
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
                <p>Remaining : {formatTime(remainingTime)}</p>
                <button
                    onClick={handlePlay}
                    disabled={isPlaying || isAudioLocked(playCount, MAX_PLAYS)}
                    className="bg-yellow-300 text-black px-6 py-3 hover:bg-[#800000] hover:text-white rounded-lg disabled:bg-gray-400"
                >
                    {isAudioLocked(playCount, MAX_PLAYS) ? "Audio Locked" : playCount === 0 ? "Play Audio" : "Replay Audio"}
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
                                            key={option}
                                            className="flex items-center gap-3 py-2"
                                        >
                                            <input
                                                type="radio"
                                                name={question.id}
                                                value={option}
                                                checked={answers[question.id] === option}
                                                onChange={() => handleAnswer(question.id, option)}
                                            />
                                            {option}
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