// =====================================================
// Shuffle Functions
// =====================================================

// DO NOT shuffle questions.
// Question order must remain exactly as received
// from the backend.
export function shuffleQuestions(array) {
    return [...array];
}


// Shuffle ONLY the options.
// Each option keeps its original key and value.
//
// Example:
//
// {
//     A: "Slow",
//     B: "Clumsy",
//     C: "Quick",
//     D: "Unsteady"
// }
//
// becomes:
//
// [
//     { key: "C", value: "Quick" },
//     { key: "A", value: "Slow" },
//     { key: "D", value: "Unsteady" },
//     { key: "B", value: "Clumsy" }
// ]
//
export function shuffleOptions(question) {

    const options = Array.isArray(question.options)
        ? [...question.options]
        : [];

    for (let i = options.length - 1; i > 0; i--) {

        const j = Math.floor(
            Math.random() * (i + 1)
        );

        [options[i], options[j]] = [
            options[j],
            options[i]
        ];
    }

    return {
        ...question,
        options
    };
}


// =====================================================
// Audio Helpers
// =====================================================

export function remainingPlays(
    playCount,
    maxPlays = 2
) {
    return Math.max(maxPlays - playCount, 0);
}


export function isAudioLocked(
    playCount,
    maxPlays = 2
) {
    return playCount >= maxPlays;
}


// =====================================================
// Question Helpers
// =====================================================

export function answeredCount(answers) {
    return Object.keys(answers).length;
}


export function isAllQuestionsAnswered(
    answers,
    questions
) {
    return (
        answeredCount(answers) === questions.length
    );
}


// =====================================================
// Countdown Helpers
// =====================================================

export function getProgress(
    countdown,
    total = 7
) {
    if (total <= 0) return 0;

    return (countdown / total) * 100;
}


// =====================================================
// Violation Helpers
// =====================================================


// =====================================================
// Test State Helpers
// =====================================================
export function saveTestState(state, admissionNo, testId) {
    const key = `audioTestState:${admissionNo}:${testId}`;

    sessionStorage.setItem(
        key,
        JSON.stringify(state)
    );
}

export function getTestState(admissionNo, testId) {
    const key = `audioTestState:${admissionNo}:${testId}`;

    const saved = sessionStorage.getItem(key);

    return saved ? JSON.parse(saved) : null;
}

export function clearTestState(admissionNo, testId) {
    const key = `audioTestState:${admissionNo}:${testId}`;

    sessionStorage.removeItem(key);
}

// =====================================================
// Time Helpers
// =====================================================

export function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return "00:00";
    }

    const mins = Math.floor(seconds / 60);

    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs
        .toString()
        .padStart(2, "0")}`;
}

// =====================================================
// Student Session Helpers
// =====================================================

export function saveStudentSession(session) {
    sessionStorage.setItem(
        "studentSession",
        JSON.stringify(session)
    );

    window.dispatchEvent(
        new Event("studentSessionChanged")
    );
}

export function getStudentSession() {
    const saved = sessionStorage.getItem(
        "studentSession"
    );

    return saved
        ? JSON.parse(saved)
        : null;
}

export function clearStudentSession() {
    Object.keys(sessionStorage)
        .filter((key) => key.startsWith("sentResults:"))
        .forEach((key) => sessionStorage.removeItem(key));
    sessionStorage.removeItem(
        "studentSession"
    );

    window.dispatchEvent(
        new Event("studentSessionChanged")
    );
}

export function saveAdminSession(session) {
    sessionStorage.setItem(
        "adminSession",
        JSON.stringify(session)
    );

    window.dispatchEvent(
        new Event("adminSessionChanged")
    );
}

export function  getAdminSession() {
    const saved = sessionStorage.getItem(
        "adminSession"
    );

    return saved
        ? JSON.parse(saved)
        : null;
}

export function clearAdminSession() {
    sessionStorage.removeItem(
        "adminSession"
    );

    window.dispatchEvent(
        new Event("adminSessionChanged")
    );
}
// =====================================================
// Sent Result Tracking Helpers
// (per admissionNo — "already sent" persists across
// refresh but resets on logout/login)
// =====================================================

export function getSentResults(admissionNo) {
    if (!admissionNo) return [];

    const saved = sessionStorage.getItem(
        `sentResults:${admissionNo}`
    );

    return saved ? JSON.parse(saved) : [];
}

export function markResultSent(admissionNo, testId) {
    if (!admissionNo || !testId) return;

    const current = getSentResults(admissionNo);

    if (!current.includes(testId)) {
        sessionStorage.setItem(
            `sentResults:${admissionNo}`,
            JSON.stringify([...current, testId])
        );
    }
}