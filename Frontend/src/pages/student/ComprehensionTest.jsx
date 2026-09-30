import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  shuffleQuestions,
  shuffleOptions,
  answeredCount,
  isAllQuestionsAnswered,
  getProgress,
  formatTime,
  saveTestState,
  getTestState,
  clearTestState,
  getStudentSession,
  getSubjectDetails,
} from "../../utils/helpers";
import {
  syncExam,
  syncExamTime,
  submitExam,
  reportMalpractice,
} from "../../services/studentService";
import { getApiErrorMessage } from "../../utils/apiError";
import {
  BookOpen,
  Clock3,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Send,
  AlignLeft,
} from "lucide-react";

export default function ComprehensionTest() {
  const navigate = useNavigate();
  const location = useLocation();

  const examClosedRef = useRef(false);
  const malpracticeReportingRef = useRef(false);
  const passageScrollRef = useRef(null);
  const examRemainingRef = useRef(0);
  const hasAutoSubmittedRef = useRef(false);

  const [examRemaining, setExamRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [syncingQuestions, setSyncingQuestions] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [violations, setViolations] = useState(0);
  const [warningMessage, setWarningMessage] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [showFullscreenPopup, setShowFullscreenPopup] = useState(false);

  // Font size setting for passage: 0 = normal (16px), 1 = large (18px), 2 = xl (20px), -1 = small (14px)
  const [fontSizeLevel, setFontSizeLevel] = useState(0);

  const examData = location.state;
  const studentSession = getStudentSession();
  const admissionNo = studentSession?.user?.admissionNo;
  const testId = examData?.testId;
  const subjectDetails = getSubjectDetails(examData?.semester);
  const passageText = examData?.passage || "";

  const totalExamTime = (examData?.duration || 0) * 60;
  const examRemainingPercentage =
    totalExamTime > 0 ? (examRemaining / totalExamTime) * 100 : 0;

  const passageWordCount = useMemo(() => {
    if (!passageText) return 0;
    return passageText.trim().split(/\s+/).filter(Boolean).length;
  }, [passageText]);

  const readingTimeEst = useMemo(() => {
    return Math.max(1, Math.ceil(passageWordCount / 180));
  }, [passageWordCount]);

  const fontClasses = [
    "text-sm leading-relaxed",      // -1: small
    "text-base leading-relaxed",    // 0: normal
    "text-lg leading-loose",        // 1: large
    "text-xl leading-loose",        // 2: x-large
  ][fontSizeLevel + 1];

  const enterExamFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        setShowFullscreenPopup(false);
        return true;
      }
      await document.documentElement.requestFullscreen();
      setShowFullscreenPopup(false);
      return true;
    } catch (error) {
      console.error("Exam fullscreen request failed:", error);
      return false;
    }
  };

  useEffect(() => {
    examRemainingRef.current = examRemaining;
  }, [examRemaining]);

  useEffect(() => {
    if (showWarning) {
      const timer = setTimeout(() => {
        setShowWarning(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showWarning]);

  const handleViolation = async (reason) => {
    if (malpracticeReportingRef.current) return;
    if (examClosedRef.current) return;

    malpracticeReportingRef.current = true;
    const session = getStudentSession();

    if (!session?.user?.admissionNo || !examData?.testId) {
      malpracticeReportingRef.current = false;
      return;
    }

    const payload = {
      testId: examData.testId,
      admissionNo: session.user.admissionNo,
      reason,
      timeRemaining: examRemainingRef.current,
    };

    try {
      const response = await reportMalpractice(payload);
      const violationNo = response?.malpractice?.violationNo || 0;
      setViolations(violationNo);

      if (response?.examClosed === true) {
        examClosedRef.current = true;
        clearTestState(admissionNo, testId);
        setWarningMessage(
          response?.message || "Examination closed due to malpractice."
        );
        setShowWarning(true);
        setTimeout(() => {
          navigate("/studentlogin");
        }, 3000);
        return;
      }

      setWarningMessage(reason);
      setShowWarning(true);
      setTimeout(() => {
        setShowWarning(false);
      }, 3000);
    } catch (error) {
      setWarningMessage(
        getApiErrorMessage(error, "Unable to report examination violation.")
      );

      if (error.response?.status === 403) {
        const data = error.response.data;
        if (data?.examClosed === true) {
          examClosedRef.current = true;
          const violationNo = data?.malpractice?.violationNo || 3;
          setViolations(violationNo);
          clearTestState(admissionNo, testId);
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

  const handleAnswer = async (questionNo, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNo]: answer,
    }));

    setSyncingQuestions((prev) => ({
      ...prev,
      [questionNo]: true,
    }));

    const session = getStudentSession();
    if (!session?.user?.admissionNo) {
      setSyncingQuestions((prev) => ({
        ...prev,
        [questionNo]: false,
      }));
      return;
    }

    const payload = {
      testId: examData?.testId,
      admissionNo: session.user.admissionNo,
      questionNo: Number(questionNo),
      studentAnswer: answer,
      timeRemaining: examRemainingRef.current,
    };

    try {
      await syncExam(payload);
    } catch (error) {
      console.error("ANSWER SYNC FAILED:", error);
    } finally {
      setSyncingQuestions((prev) => ({
        ...prev,
        [questionNo]: false,
      }));
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (examClosedRef.current) {
      console.error("Exam already closed due to malpractice.");
      return;
    }

    if (!isAllQuestionsAnswered(answers, questions)) {
      return;
    }

    const session = getStudentSession();
    if (!session?.user?.admissionNo) {
      navigate("/studentlogin");
      return;
    }

    if (!examData?.testId) {
      console.error("Test ID not found.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      admissionNo: session.user.admissionNo,
      testId: examData.testId,
    };

    try {
      const response = await submitExam(payload);
      if (!response?.success) {
        throw new Error(response?.message || "Failed to submit examination.");
      }

      setSubmitted(true);
      setShowSuccess(true);
      clearTestState(admissionNo, testId);

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
      setWarningMessage(
        getApiErrorMessage(error, "Failed to submit examination.")
      );
      setShowWarning(true);
      setIsSubmitting(false);
    }
  };

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        setShowFullscreenPopup(false);
      } else {
        setShowFullscreenPopup(true);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Initialize questions & test state
  useEffect(() => {
    if (!examData) {
      console.error("No exam data received.");
      navigate("/exam/instruction");
      return;
    }

    const session = getStudentSession();
    if (!session?.user?.admissionNo) {
      navigate("/studentlogin");
      return;
    }

    if (!examData.testId) {
      console.error("Invalid Test ID");
      navigate("/exam/instruction");
      return;
    }

    const currentAdmissionNo = session.user.admissionNo;
    const currentTestId = examData.testId;

    const saved = getTestState(currentAdmissionNo, currentTestId);
    if (saved && Array.isArray(saved.questions) && saved.questions.length > 0) {
      setQuestions(saved.questions);
      setAnswers(saved.answers || {});
      setIsRestored(true);
      return;
    }

    const rawQuestions = Array.isArray(examData.questions)
      ? examData.questions
      : Array.isArray(examData?.data?.questions)
      ? examData.data.questions
      : [];

    const finalQuestions = rawQuestions.map((question, qIdx) => {
      let optionArray = [];
      if (Array.isArray(question.options)) {
        optionArray = question.options.map((opt, i) => {
          if (typeof opt === "object" && opt !== null) {
            return {
              key: opt.key || String.fromCharCode(65 + i),
              value: opt.value || opt.text || String(opt),
            };
          }
          return {
            key: String.fromCharCode(65 + i),
            value: String(opt),
          };
        });
      } else if (question.options && typeof question.options === "object") {
        optionArray = Object.entries(question.options).map(([key, value]) => ({
          key,
          value: String(value),
        }));
      }

      const questionData = {
        id: question.id ?? question.questionNo ?? qIdx + 1,
        question: question.question || question.questionText || "",
        options: optionArray,
      };

      return shuffleOptions(questionData);
    });

    const shuffledQuestions = shuffleQuestions(finalQuestions);
    setQuestions(shuffledQuestions);

    const initialAnswers = {};
    if (Array.isArray(examData?.savedAnswers) && examData.savedAnswers.length > 0) {
      examData.savedAnswers.forEach((item) => {
        if (item && item.questionNo != null) {
          initialAnswers[item.questionNo] = item.studentAnswer;
        }
      });
      setIsRestored(true);
    }

    setAnswers(initialAnswers);
  }, [examData, navigate]);

  // Persist answers to local storage
  useEffect(() => {
    if (!questions || questions.length === 0 || !admissionNo || !testId) {
      return;
    }

    saveTestState(
      {
        questions,
        answers,
        playCount: 0,
        currentTime: 0,
        timeRemaining: examRemaining,
      },
      admissionNo,
      testId
    );
  }, [questions, answers, examRemaining, admissionNo, testId]);

  // Security event handlers (Strict restrictions matching AudioTest)
  useEffect(() => {
    // ==========================================
    // TAB / WINDOW SWITCH
    // ==========================================
    const visibilityHandler = () => {
      if (document.hidden) {
        handleViolation("Tab switched or window minimized.");
      }
    };

    // ==========================================
    // RIGHT CLICK
    // ==========================================
    const contextMenuHandler = (e) => {
      e.preventDefault();
      setWarningMessage("Right click detected.");
      setShowWarning(true);
    };

    // ==========================================
    // KEYBOARD
    // ==========================================
    const keyHandler = (e) => {
      const key = e.key.toLowerCase();
      const code = e.code;

      // MEDIA KEYS
      const mediaKeys = [
        "MediaPlayPause",
        "MediaTrackNext",
        "MediaTrackPrevious",
        "MediaStop",
      ];

      if (mediaKeys.includes(e.key) || mediaKeys.includes(code)) {
        e.preventDefault();
        e.stopPropagation();
        setWarningMessage("Media key pressed.");
        setShowWarning(true);
        return;
      }

      // PRINT SCREEN
      if (e.key === "PrintScreen" || code === "PrintScreen") {
        e.preventDefault();
        e.stopPropagation();
        setWarningMessage("Print Screen key pressed.");
        setShowWarning(true);
        return;
      }

      // WINDOWS KEY
      if (e.key === "Meta") {
        e.preventDefault();
        e.stopPropagation();
        setWarningMessage("Windows key pressed.");
        setShowWarning(true);
        return;
      }

      // SHIFT KEY
      if (e.key === "Shift") {
        e.preventDefault();
        e.stopPropagation();
        setWarningMessage("Shift key pressed.");
        setShowWarning(true);
        return;
      }

      // FUNCTION KEYS
      const restrictedFunctionKeys = [
        "F1", "F2", "F3", "F4", "F5", "F6",
        "F7", "F8", "F9", "F10", "F11", "F12",
      ];

      if (restrictedFunctionKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        setWarningMessage(`${e.key} key pressed.`);
        setShowWarning(true);
        return;
      }

      // RESTRICTED SHORTCUTS
      if (
        (e.ctrlKey && key === "r") ||
        (e.ctrlKey && key === "u") ||
        (e.ctrlKey && e.shiftKey && key === "i") ||
        (e.ctrlKey && e.shiftKey && key === "j")
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("Restricted keyboard shortcut detected.");
        return;
      }

      // RESTRICTED CLIPBOARD / PRINT SHORTCUTS
      if (
        (e.ctrlKey && (key === "c" || key === "v" || key === "x" || key === "p"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        setWarningMessage("Copy/Paste action is restricted.");
        setShowWarning(true);
        return;
      }
    };

    // ==========================================
    // PRINT
    // ==========================================
    const beforePrintHandler = () => {
      setWarningMessage("Print action detected.");
      setShowWarning(true);
    };

    // ==========================================
    // CLIPBOARD & SELECTION PREVENTION
    // ==========================================
    const preventClipboard = (e) => {
      e.preventDefault();
      setWarningMessage("Copy/Paste action is restricted.");
      setShowWarning(true);
    };

    const preventSelection = (e) => {
      e.preventDefault();
    };

    // ==========================================
    // REGISTER EVENTS
    // ==========================================
    document.addEventListener("visibilitychange", visibilityHandler);
    document.addEventListener("contextmenu", contextMenuHandler);
    window.addEventListener("keydown", keyHandler, true);
    window.addEventListener("beforeprint", beforePrintHandler);
    document.addEventListener("copy", preventClipboard);
    document.addEventListener("cut", preventClipboard);
    document.addEventListener("paste", preventClipboard);
    document.addEventListener("selectstart", preventSelection);
    document.addEventListener("dragstart", preventSelection);

    // ==========================================
    // CLEANUP
    // ==========================================
    return () => {
      document.removeEventListener("visibilitychange", visibilityHandler);
      document.removeEventListener("contextmenu", contextMenuHandler);
      window.removeEventListener("keydown", keyHandler, true);
      window.removeEventListener("beforeprint", beforePrintHandler);
      document.removeEventListener("copy", preventClipboard);
      document.removeEventListener("cut", preventClipboard);
      document.removeEventListener("paste", preventClipboard);
      document.removeEventListener("selectstart", preventSelection);
      document.removeEventListener("dragstart", preventSelection);
    };
  }, [examData, navigate]);

  // Periodic time sync to server
  useEffect(() => {
    if (!examData?.testId || !admissionNo || submitted) return;

    const syncInterval = setInterval(() => {
      if (examRemainingRef.current > 0 && !examClosedRef.current) {
        syncExamTime({
          testId: examData.testId,
          admissionNo,
          timeRemaining: examRemainingRef.current,
        }).catch(() => {});
      }
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [examData?.testId, admissionNo, submitted]);

  // Exam timer
  useEffect(() => {
    if (!examData?.duration && examData?.timeRemaining == null) return;

    // Check if test was restored with remaining time from session or server
    const savedState = admissionNo && testId ? getTestState(admissionNo, testId) : null;
    let initialSeconds;

    if (savedState?.timeRemaining != null && Number(savedState.timeRemaining) > 0) {
      initialSeconds = Number(savedState.timeRemaining);
    } else if (examData?.timeRemaining != null && Number(examData.timeRemaining) > 0) {
      initialSeconds = Number(examData.timeRemaining);
    } else {
      initialSeconds = Number(examData.duration || 0) * 60;
    }

    setExamRemaining(initialSeconds);
    examRemainingRef.current = initialSeconds;

    const timer = setInterval(() => {
      setExamRemaining((prev) => {
        const istDate = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
        const istMinutes = istDate.getHours() * 60 + istDate.getMinutes();
        const isPast5pmIST = istMinutes >= 1020 || istMinutes < 510;

        if (prev <= 1 || isPast5pmIST) {
          clearInterval(timer);
          clearTestState(admissionNo, testId);
          if (
            !hasAutoSubmittedRef.current &&
            !examClosedRef.current &&
            (examData?.testId || testId) &&
            admissionNo
          ) {
            hasAutoSubmittedRef.current = true;
            submitExam({
              testId: examData?.testId || testId,
              admissionNo,
            }).catch((err) => {
              console.error("Auto submit on duration expiry error:", err);
            });
          }
          navigate("/student/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [examData?.duration, examData?.timeRemaining, admissionNo, testId, navigate]);

  const scrollToQuestion = (id) => {
    const el = document.getElementById(`question-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-[#800000]/10 flex flex-col select-none">
      {/* OVERLAYS */}
      {showFullscreenPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 text-center transform transition-all">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Fullscreen Required</h2>
            <p className="text-slate-500 text-sm mb-8">
              This reading comprehension assessment requires fullscreen mode to ensure a secure testing environment.
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
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Security Warning</h2>
            <p className="text-slate-600 text-sm font-medium mb-6">{warningMessage}</p>
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
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Assessment Submitted</h2>
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

      {/* FIXED SECOND NAV BAR (For Timing, Assessment Info, and Progress) */}
      <nav className="fixed top-[130px] left-0 right-0 h-[64px] z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm flex items-center">
        <div className="max-w-[1600px] mx-auto w-full px-4 md:px-6 flex items-center justify-between">
          {/* Left: Exam / Passage Info */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-[#800000] rounded-lg">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-bold text-slate-900 leading-tight">
                  {subjectDetails.name}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-[#800000] border border-amber-200">
                  {subjectDetails.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Reading Comprehension Assessment • Read the passage carefully and answer all questions
              </p>
            </div>
          </div>

          {/* Right: Progress & Timer */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Quick Answered Count */}
            {questions.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                <span className="text-slate-400">Answered:</span>
                <span className="text-green-700 font-bold">
                  {answeredCount(answers)}/{questions.length}
                </span>
              </div>
            )}

            {/* Time Left Badge */}
            <div className="flex items-center gap-2 px-3.5 md:px-4 py-1.5 md:py-2 rounded-xl border border-slate-300 bg-slate-50 shadow-inner">
              <Clock3
                size={18}
                className={
                  examRemainingPercentage < 10
                    ? "text-red-600 animate-pulse"
                    : "text-slate-500"
                }
              />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:inline">
                Time Left:
              </span>
              <span
                className={`text-base md:text-lg font-bold font-mono ${
                  examRemainingPercentage < 10
                    ? "text-red-600 animate-pulse"
                    : "text-green-600"
                }`}
              >
                {formatTime(examRemaining)}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT - 2 COLUMN SPLIT */}
      <main className="max-w-[1600px] mx-auto w-full px-4 md:px-6 pt-[80px] pb-8 flex-1 flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN: PASSAGE VIEWER (Sticky on Desktop below Second Nav Bar) */}
        <section className="lg:w-1/2 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:max-h-[calc(100vh-220px)] lg:sticky lg:top-[205px]">
          {/* Passage Toolbar */}
          <div className="flex-none px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlignLeft size={18} className="text-slate-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Reading Passage</h2>
              <span className="text-xs text-slate-400 font-medium">({passageWordCount} words • ~{readingTimeEst} min read)</span>
            </div>

            {/* Font Zoom Controls */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setFontSizeLevel((prev) => Math.max(-1, prev - 1))}
                disabled={fontSizeLevel <= -1}
                title="Decrease font size"
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
              >
                <ZoomOut size={16} />
              </button>
              <button
                type="button"
                onClick={() => setFontSizeLevel(0)}
                title="Reset font size"
                className="px-1.5 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                <RotateCcw size={13} className="inline mr-0.5" />
                100%
              </button>
              <button
                type="button"
                onClick={() => setFontSizeLevel((prev) => Math.min(2, prev + 1))}
                disabled={fontSizeLevel >= 2}
                title="Increase font size"
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
              >
                <ZoomIn size={16} />
              </button>
            </div>
          </div>

          {/* Passage Body */}
          <div
            ref={passageScrollRef}
            className="flex-1 p-6 md:p-8 overflow-y-auto font-serif text-slate-800 leading-relaxed space-y-4"
          >
            {passageText ? (
              passageText.split(/\n\s*\n/).map((paragraph, pIdx) => (
                <p key={pIdx} className={`${fontClasses} text-justify text-slate-700 whitespace-pre-wrap`}>
                  {paragraph}
                </p>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                <BookOpen size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No passage text provided for this examination.</p>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: QUESTIONS & PROGRESS */}
        <section className="lg:w-1/2 flex flex-col gap-6">
          {/* Question Navigator / Palette */}
          {questions.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Questions Overview ({answeredCount(answers)}/{questions.length} answered)
                </span>
                <span className="text-xs font-semibold text-green-600">
                  {Math.round((answeredCount(answers) / questions.length) * 100)}%
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {questions.map((q, idx) => {
                  const isDone = !!answers[q.id];
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => scrollToQuestion(q.id)}
                      className={`w-9 h-9 rounded-lg font-semibold text-xs transition-all flex items-center justify-center cursor-pointer ${
                        isDone
                          ? "bg-green-600 text-white shadow-sm hover:bg-green-700"
                          : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* QUESTIONS LIST */}
          <div className="space-y-5">
            {questions.map((question, index) => (
              <div
                id={`question-${question.id}`}
                key={question.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all hover:border-slate-300 shadow-sm"
              >
                {/* Question Header */}
                <div className="px-5 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-[#800000] flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="text-sm font-semibold text-slate-600">
                      Question {index + 1} of {questions.length}
                    </span>
                  </div>

                  <div className="flex items-center">
                    {syncingQuestions[question.id] ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-md animate-pulse">
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </div>
                    ) : answers[question.id] ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-md">
                        <CheckCircle2 size={14} />
                        Saved
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Question Body */}
                <div className="px-5 md:px-6 py-5">
                  <h3 className="text-base md:text-lg text-slate-900 font-medium leading-relaxed mb-4">
                    {question.question}
                  </h3>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {question.options.map((option, idx) => {
                      const isSelected = answers[question.id] === option.value;
                      const serialLabel = String.fromCharCode(65 + idx);

                      return (
                        <label
                          key={option.key || idx}
                          className={`group flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-50/60 border-[#800000] shadow-sm"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option.value}
                            checked={isSelected}
                            onChange={() => handleAnswer(question.id, option.value)}
                            className="sr-only"
                          />
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected ? "border-[#800000] bg-[#800000]" : "border-slate-300 group-hover:border-slate-400"
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span
                            className={`w-6 text-sm font-bold ${
                              isSelected ? "text-[#800000]" : "text-slate-400"
                            }`}
                          >
                            {serialLabel}.
                          </span>
                          <span
                            className={`text-sm md:text-[15px] leading-snug flex-1 ${
                              isSelected ? "text-slate-900 font-semibold" : "text-slate-700"
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

          {/* SUBMIT FOOTER */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Completion Status
                </p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">
                  {answeredCount(answers)} of {questions.length} completed
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-green-600">
                  {questions.length > 0 ? Math.round((answeredCount(answers) / questions.length) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    questions.length > 0 ? (answeredCount(answers) / questions.length) * 100 : 0
                  }%`,
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isAllQuestionsAnswered(answers, questions)}
              className={`w-full py-3.5 rounded-xl font-bold text-sm md:text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                isSubmitting || !isAllQuestionsAnswered(answers, questions)
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-[#800000] text-white hover:bg-[#6b0000] shadow-md hover:shadow-lg shadow-red-900/20"
              }`}
            >
              <Send size={18} />
              {isSubmitting ? "Submitting..." : "Submit Examination"}
            </button>

            {!isAllQuestionsAnswered(answers, questions) && (
              <p className="text-xs text-center mt-3 text-slate-400">
                Please answer all questions before submitting.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
