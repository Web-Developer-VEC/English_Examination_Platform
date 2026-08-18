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

export function saveTestState(state) {

    sessionStorage.setItem(
        "audioTest",
        JSON.stringify(state)
    );
}


export function getTestState() {

    const saved =
        sessionStorage.getItem("audioTest");

    return saved
        ? JSON.parse(saved)
        : null;
}


export function clearTestState() {

    sessionStorage.removeItem(
        "audioTest"
    );
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
    sessionStorage.removeItem(
        "studentSession"
    );
}