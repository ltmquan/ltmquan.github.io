import { HEROES } from "./heroes.js";

// ====== Questions data ======
export const QUESTIONS = [
    {
        id: 1,
        q: 'What\'s your preferred role?',
        choices: ['Safe Lane', 'Mid Lane', 'Off Lane', 'Support', 'Hard Support'],
        answer: 1
    },
    {
        id: 2,
        q: 'What are your three favorite heroes for this role?',
        choices: HEROES,
        answer: 2
    }
];