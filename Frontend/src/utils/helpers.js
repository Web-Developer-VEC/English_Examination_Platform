// =========================================
// Shuffle Functions
// =========================================

export function shuffleQuestions(array) {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

export function shuffleOptions(question) {
    const options = [...question.options];

    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }

    return {
        ...question,
        options
    };
}

// =========================================
// Audio Helpers
// =========================================

export function remainingPlays(playCount, maxPlays = 2) {
    return maxPlays - playCount;
}

export function isAudioLocked(playCount, maxPlays = 2) {
    return playCount >= maxPlays;
}

// =========================================
// Question Helpers
// =========================================

export function answeredCount(answers) {
    return Object.keys(answers).length;
}

export function isAllQuestionsAnswered(answers, questions) {
    return answeredCount(answers) === questions.length;
}

// =========================================
// Countdown Helpers
// =========================================

export function getProgress(countdown, total = 10) {
    return (countdown / total) * 100;
}