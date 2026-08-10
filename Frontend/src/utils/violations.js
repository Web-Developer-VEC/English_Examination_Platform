export const MAX_VIOLATIONS = 3;

export function createViolation(type) {
    return {
        type,
        time: new Date().toISOString()
    };
}

export function nextViolationCount(current) {
    return current + 1;
}

export function shouldTerminate(count) {
    return count >= MAX_VIOLATIONS;
}