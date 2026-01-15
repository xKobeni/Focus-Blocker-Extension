// Challenge Generator Utility
// Generates random challenges based on type and difficulty

// XP Rewards based on difficulty
export const XP_REWARDS = {
    math: { 1: 10, 2: 20, 3: 35, 4: 50, 5: 75 },
    memory: { 1: 15, 2: 25, 3: 40, 4: 60, 5: 85 },
    typing: { 1: 15, 2: 25, 3: 40, 4: 55, 5: 80 },
    exercise: { 1: 30, 2: 50, 3: 75, 4: 100, 5: 150 },
    breathing: { 1: 20, 2: 30, 3: 45, 4: 65, 5: 90 },
    puzzle: { 1: 20, 2: 35, 3: 55, 4: 80, 5: 110 },
    reaction: { 1: 10, 2: 18, 3: 30, 4: 45, 5: 65 }
};

// Math Challenge Generator
export function generateMathChallenge(difficulty) {
    let question, answer;
    
    switch(difficulty) {
        case 1: // Easy: Simple addition/subtraction
            const a1 = Math.floor(Math.random() * 10) + 1;
            const b1 = Math.floor(Math.random() * 10) + 1;
            const op1 = Math.random() > 0.5 ? '+' : '-';
            if (op1 === '+') {
                question = `${a1} + ${b1}`;
                answer = (a1 + b1).toString();
            } else {
                const larger = Math.max(a1, b1);
                const smaller = Math.min(a1, b1);
                question = `${larger} - ${smaller}`;
                answer = (larger - smaller).toString();
            }
            break;
            
        case 2: // Medium: Multiplication/division
            const a2 = Math.floor(Math.random() * 12) + 1;
            const b2 = Math.floor(Math.random() * 12) + 1;
            const op2 = Math.random() > 0.5 ? '×' : '÷';
            if (op2 === '×') {
                question = `${a2} × ${b2}`;
                answer = (a2 * b2).toString();
            } else {
                const product = a2 * b2;
                question = `${product} ÷ ${a2}`;
                answer = b2.toString();
            }
            break;
            
        case 3: // Hard: Two operations
            const a3 = Math.floor(Math.random() * 15) + 5;
            const b3 = Math.floor(Math.random() * 10) + 1;
            const c3 = Math.floor(Math.random() * 10) + 1;
            const ops3 = ['+', '-', '×'];
            const op3a = ops3[Math.floor(Math.random() * ops3.length)];
            const op3b = ops3[Math.floor(Math.random() * ops3.length)];
            
            let result3;
            if (op3a === '+') result3 = a3 + b3;
            else if (op3a === '-') result3 = a3 - b3;
            else result3 = a3 * b3;
            
            if (op3b === '+') result3 = result3 + c3;
            else if (op3b === '-') result3 = result3 - c3;
            else result3 = result3 * c3;
            
            question = `${a3} ${op3a} ${b3} ${op3b} ${c3}`;
            answer = result3.toString();
            break;
            
        case 4: // Expert: Three operations with parentheses
            const a4 = Math.floor(Math.random() * 12) + 3;
            const b4 = Math.floor(Math.random() * 8) + 2;
            const c4 = Math.floor(Math.random() * 10) + 1;
            const d4 = Math.floor(Math.random() * 5) + 1;
            
            const inner = a4 * b4;
            const middle = inner + c4;
            const result4 = middle - d4;
            
            question = `(${a4} × ${b4}) + ${c4} - ${d4}`;
            answer = result4.toString();
            break;
            
        case 5: // Master: Complex with multiple parentheses
            const a5 = Math.floor(Math.random() * 10) + 5;
            const b5 = Math.floor(Math.random() * 8) + 2;
            const c5 = Math.floor(Math.random() * 6) + 2;
            const d5 = Math.floor(Math.random() * 10) + 1;
            
            const left = a5 * b5;
            const right = c5 + d5;
            const result5 = left - right;
            
            question = `(${a5} × ${b5}) - (${c5} + ${d5})`;
            answer = result5.toString();
            break;
            
        default:
            question = "5 + 3";
            answer = "8";
    }
    
    return {
        type: 'math',
        difficulty,
        content: {
            question,
            correctAnswer: answer
        },
        xpReward: XP_REWARDS.math[difficulty]
    };
}

// Memory Challenge Generator
export function generateMemoryChallenge(difficulty) {
    const gridSizes = {
        1: { rows: 2, cols: 3, pairs: 3 },      // 2x3 = 6 cards (3 pairs)
        2: { rows: 3, cols: 4, pairs: 6 },      // 3x4 = 12 cards (6 pairs)
        3: { rows: 4, cols: 4, pairs: 8 },      // 4x4 = 16 cards (8 pairs)
        4: { rows: 4, cols: 5, pairs: 10 },     // 4x5 = 20 cards (10 pairs)
        5: { rows: 5, cols: 6, pairs: 15 }      // 5x6 = 30 cards (15 pairs)
    };
    
    const grid = gridSizes[difficulty];
    const emojis = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎬', '🎵', '🎸', '🎺', '🎻', '🎲', '🎰', '🏀', '⚽', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸'];
    const selectedEmojis = emojis.slice(0, grid.pairs);
    const cards = [...selectedEmojis, ...selectedEmojis];
    
    // Shuffle cards
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    
    return {
        type: 'memory',
        difficulty,
        content: {
            rows: grid.rows,
            cols: grid.cols,
            cards,
            timeLimit: 60 + (difficulty * 30)  // 90-210 seconds based on difficulty
        },
        xpReward: XP_REWARDS.memory[difficulty]
    };
}

// Typing Challenge Generator
export function generateTypingChallenge(difficulty) {
    const quotes = {
        1: [
            "Stay focused.",
            "You can do this.",
            "Keep going strong.",
            "Believe in yourself."
        ],
        2: [
            "Success is the sum of small efforts repeated day in and day out.",
            "The secret of getting ahead is getting started.",
            "Focus on being productive instead of busy."
        ],
        3: [
            "The only way to do great work is to love what you do and stay focused on your goals.",
            "Discipline is choosing between what you want now and what you want most in the long run.",
            "Your focus determines your reality, so choose wisely where you direct your attention."
        ],
        4: [
            "The successful warrior is the average person with laser-like focus and unwavering determination.",
            "Concentration and mental toughness are the margins of victory in any competition or endeavor.",
            "It's not always that we need to do more but rather that we need to focus on less and execute better."
        ],
        5: [
            "The ability to discipline yourself to delay gratification in the short term in order to enjoy greater rewards in the long term is the indispensable prerequisite for success in any field of human endeavor.",
            "Focus is a matter of deciding what things you're not going to do, because if you try to do everything, you'll accomplish nothing significant in the end."
        ]
    };
    
    const selectedQuotes = quotes[difficulty];
    const quote = selectedQuotes[Math.floor(Math.random() * selectedQuotes.length)];
    
    const requirements = {
        1: { minWPM: 20, minAccuracy: 85 },
        2: { minWPM: 30, minAccuracy: 90 },
        3: { minWPM: 40, minAccuracy: 92 },
        4: { minWPM: 50, minAccuracy: 95 },
        5: { minWPM: 60, minAccuracy: 97 }
    };
    
    return {
        type: 'typing',
        difficulty,
        content: {
            text: quote,
            requirements: requirements[difficulty],
            timeLimit: 120  // 2 minutes
        },
        xpReward: XP_REWARDS.typing[difficulty]
    };
}

// Exercise Challenge Generator
export function generateExerciseChallenge(difficulty) {
    const exercises = {
        1: [
            { name: 'Jumping Jacks', reps: 10, description: 'Do 10 jumping jacks' },
            { name: 'Arm Circles', reps: 15, description: 'Do 15 arm circles' }
        ],
        2: [
            { name: 'Jumping Jacks', reps: 20, description: 'Do 20 jumping jacks' },
            { name: 'High Knees', reps: 15, description: 'Do 15 high knees (each leg)' }
        ],
        3: [
            { name: 'Squats', reps: 15, description: 'Do 15 squats' },
            { name: 'Jumping Jacks', reps: 30, description: 'Do 30 jumping jacks' }
        ],
        4: [
            { name: 'Push-ups', reps: 10, description: 'Do 10 push-ups' },
            { name: 'Squats', reps: 20, description: 'Do 20 squats' }
        ],
        5: [
            { name: 'Burpees', reps: 10, description: 'Do 10 burpees' },
            { name: 'Push-ups', reps: 15, description: 'Do 15 push-ups' }
        ]
    };
    
    const exerciseList = exercises[difficulty];
    const exercise = exerciseList[Math.floor(Math.random() * exerciseList.length)];
    
    return {
        type: 'exercise',
        difficulty,
        content: {
            exercise: exercise.name,
            reps: exercise.reps,
            description: exercise.description,
            requireWebcam: true
        },
        xpReward: XP_REWARDS.exercise[difficulty]
    };
}

// Breathing Exercise Generator
export function generateBreathingChallenge(difficulty) {
    const patterns = {
        1: { inhale: 4, hold: 2, exhale: 4, cycles: 3 },
        2: { inhale: 4, hold: 4, exhale: 4, cycles: 4 },
        3: { inhale: 4, hold: 7, exhale: 8, cycles: 4 },  // 4-7-8 breathing
        4: { inhale: 5, hold: 5, exhale: 5, cycles: 5 },
        5: { inhale: 6, hold: 6, exhale: 6, cycles: 6 }
    };
    
    const pattern = patterns[difficulty];
    
    return {
        type: 'breathing',
        difficulty,
        content: {
            pattern,
            instructions: `Breathe in for ${pattern.inhale}s, hold for ${pattern.hold}s, exhale for ${pattern.exhale}s. Repeat ${pattern.cycles} times.`
        },
        xpReward: XP_REWARDS.breathing[difficulty]
    };
}

// Reaction Time Challenge Generator
export function generateReactionChallenge(difficulty) {
    const requirements = {
        1: { maxTime: 800, rounds: 3 },   // 800ms average, 3 rounds
        2: { maxTime: 600, rounds: 5 },   // 600ms average, 5 rounds
        3: { maxTime: 450, rounds: 5 },   // 450ms average, 5 rounds
        4: { maxTime: 350, rounds: 7 },   // 350ms average, 7 rounds
        5: { maxTime: 250, rounds: 10 }   // 250ms average, 10 rounds
    };
    
    const req = requirements[difficulty];
    
    return {
        type: 'reaction',
        difficulty,
        content: {
            rounds: req.rounds,
            maxAverageTime: req.maxTime,
            instructions: `Click as fast as you can when the color changes. Average reaction time must be under ${req.maxTime}ms across ${req.rounds} rounds.`
        },
        xpReward: XP_REWARDS.reaction[difficulty]
    };
}

// Main challenge generator
export function generateChallenge(type, difficulty = 2) {
    // Validate difficulty
    difficulty = Math.max(1, Math.min(5, difficulty));
    
    switch(type) {
        case 'math':
            return generateMathChallenge(difficulty);
        case 'memory':
            return generateMemoryChallenge(difficulty);
        case 'typing':
            return generateTypingChallenge(difficulty);
        case 'exercise':
            return generateExerciseChallenge(difficulty);
        case 'breathing':
            return generateBreathingChallenge(difficulty);
        case 'reaction':
            return generateReactionChallenge(difficulty);
        default:
            return generateMathChallenge(difficulty);
    }
}

// Verify challenge answer
export function verifyChallengeAnswer(challenge, userAnswer, timeTaken) {
    switch(challenge.type) {
        case 'math':
            return userAnswer.trim() === challenge.content.correctAnswer;
            
        case 'typing':
            // Check WPM and accuracy
            const words = challenge.content.text.split(' ').length;
            const timeInMinutes = timeTaken / 60;
            const wpm = Math.round(words / timeInMinutes);
            
            // Calculate accuracy (simplified - in real implementation, compare character by character)
            const accuracy = 100;  // This should be calculated based on actual typing
            
            const req = challenge.content.requirements;
            return wpm >= req.minWPM && accuracy >= req.minAccuracy;
            
        case 'memory':
        case 'exercise':
        case 'breathing':
        case 'reaction':
            // These require client-side verification
            // Server just validates the time and marks as complete
            return timeTaken < challenge.content.timeLimit;
            
        default:
            return false;
    }
}

export default {
    generateChallenge,
    verifyChallengeAnswer,
    XP_REWARDS
};
