import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { shuffleQuestions, shuffleOptions, remainingPlays, isAudioLocked, answeredCount, isAllQuestionsAnswered, getProgress } from "../../utils/helpers";
import tick from "../../assets/images/tick.png";

export default function AudioTest() {

    const navigate = useNavigate();

    const [isPlaying, setIsPlaying] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const audioRef = useRef(null);

    const [questions, setQuestions] = useState([]);

    const [answers, setAnswers] = useState({});

    const [playCount, setPlayCount] = useState(0);

    const [violations, setViolations] = useState(0);

    const [submitted, setSubmitted] = useState(false);

    const [showWarning, setShowWarning] = useState(false);

    const [showSuccess, setShowSuccess] = useState(false);

    const MAX_PLAYS = 2;

    const MAX_VIOLATIONS = 2;

    const dummyData = {

        audioUrl: "/audio/test.mp3",

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
        let seconds = 10;
        setCountdown(seconds);
        const timer = setInterval(() => {
            seconds--;
            setCountdown(seconds);
            if (seconds === 0) { clearInterval(timer); navigate("/") }
        }, 1000);
    }
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {

        const shuffledQuestions = shuffleQuestions(dummyData.questions);

        const finalQuestions = shuffledQuestions.map(shuffleOptions);

        setQuestions(finalQuestions);

    }, []);

    return (
        <>
            {/* {showSuccess && <SuccessPopup />} */}
            {
                showSuccess && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

                        <div className="bg-white rounded-2xl shadow-2xl p-8 w-[450px]">

                            <div className="flex flex-col items-center text-center space-y-4">

                                {/* Success Icon */}
                                <img src={tick} alt="Success" className="w-20 h-20 object-contain animate-bounce"/>

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
                    onEnded={handleAudioEnd}
                />
                <button
                    onClick={handlePlay}
                    disabled={isPlaying || isAudioLocked(playCount, MAX_PLAYS)}
                    className="bg-[#800000] text-white px-6 py-3 rounded-lg disabled:bg-gray-400"
                >
                    {
                        playCount >= 2
                            ?
                            "Audio Locked"
                            :
                            playCount === 0
                                ?
                                "Play Audio"
                                :
                                "Replay Audio"
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
                >
                    {isSubmitting ? "Submitting..." : "Submit Test"}
                </button>

            </div>

        </>

    );
}