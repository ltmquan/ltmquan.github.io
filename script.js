// ====== Quiz data ======
const QUIZ = [
    {
        id: 1,
        q: 'Which planet is known as the Red Planet?',
        choices: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
        answer: 1
    },
    {
        id: 2,
        q: 'What is the capital of Japan?',
        choices: ['Beijing', 'Seoul', 'Tokyo', 'Bangkok'],
        answer: 2
    },
    {
        id: 3,
        q: 'Which gas do plants primarily absorb from the atmosphere?',
        choices: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
        answer: 2
    },
    {
        id: 4,
        q: 'Who wrote the play "Romeo and Juliet"?',
        choices: ['Charles Dickens', 'William Shakespeare', 'Leo Tolstoy', 'Mark Twain'],
        answer: 1
    },
    {
        id: 5,
        q: 'What is the chemical symbol for gold?',
        choices: ['Au', 'Ag', 'Gd', 'Go'],
        answer: 0
    }
];

// ====== State ======
const state = {
    index: 0,
    answers: Array(QUIZ.length).fill(null),
    startTime: null,
    duration: 60 * 3 // 3 minutes timer (seconds)
};

// ====== Elements ======
const quizArea = document.getElementById('quiz-area');
const currentEl = document.getElementById('current');
const totalEl = document.getElementById('total');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const restartBtn = document.getElementById('restart');
const downloadBtn = document.getElementById('download');
const progressBar = document.getElementById('progress-bar');
const resultBox = document.getElementById('result');
const timerEl = document.getElementById('timer');

totalEl.textContent = QUIZ.length;

// ====== Render ======
function renderQuestion() {
    const item = QUIZ[state.index];
    currentEl.textContent = state.index + 1;
    const selected = state.answers[state.index];

    const html = `
        <h2 class="question">${escapeHtml(item.q)}</h2>
        <ul class="choices" role="radiogroup" aria-labelledby="question-${item.id}">
          ${item.choices.map((c, i) => `
            <li>
              <label class="choice" tabindex="0">
                <input type="radio" name="choice" value="${i}" ${selected === i ? 'checked' : ''} />
                <span>${escapeHtml(c)}</span>
              </label>
            </li>
          `).join('')}
        </ul>
      `;

    quizArea.innerHTML = html;

    // Attach choice handlers
    quizArea.querySelectorAll('input[name=choice]').forEach(i => {
        i.addEventListener('change', (e) => {
            state.answers[state.index] = Number(e.target.value);
            saveProgress();
            updateControls();
        });
    });

    // Keyboard friendly label click
    quizArea.querySelectorAll('.choice').forEach((lbl, idx) => {
        lbl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const inp = lbl.querySelector('input');
                inp.checked = true;
                inp.dispatchEvent(new Event('change', { bubbles: true }));
                e.preventDefault();
            }
        });
        lbl.addEventListener('click', () => {
            const inp = lbl.querySelector('input');
            inp.checked = true;
            inp.dispatchEvent(new Event('change', { bubbles: true }));
        });
    });

    updateProgress();
}

function updateProgress() {
    const pct = ((state.index) / (QUIZ.length)) * 100;
    progressBar.style.width = pct + '%';
}

function updateControls() {
    prevBtn.disabled = state.index === 0;
    nextBtn.disabled = state.index === QUIZ.length - 1;
}

// ====== Navigation ======
prevBtn.addEventListener('click', () => { state.index = Math.max(0, state.index - 1); renderQuestion(); updateControls(); });
nextBtn.addEventListener('click', () => { state.index = Math.min(QUIZ.length - 1, state.index + 1); renderQuestion(); updateControls(); });

submitBtn.addEventListener('click', () => { showResults(); });
restartBtn.addEventListener('click', () => { if (confirm('Restart the quiz? Your progress will be cleared.')) resetQuiz(); });

// ====== Timer ======
let timerInterval = null;
function startTimer() {
    state.startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        const remaining = Math.max(0, state.duration - elapsed);
        timerEl.textContent = formatTime(remaining);
        if (remaining <= 0) { clearInterval(timerInterval); showResults(true); }
    }, 300);
}

// ====== Results ======
function showResults(auto = false) {
    // Score
    let correct = 0;
    const details = QUIZ.map((q, i) => {
        const isCorrect = state.answers[i] === q.answer;
        if (isCorrect) correct++;
        return { q: q.q, selected: state.answers[i], correct: q.answer, isCorrect };
    });

    const percent = Math.round((correct / QUIZ.length) * 100);
    resultBox.hidden = false;
    resultBox.innerHTML = `\n        <strong>Score: ${correct}/${QUIZ.length} (${percent}%)</strong>\n        <div class="small" style="margin-top:8px">${auto ? 'Time expired —' : ''} Review below.</div>\n        <ol style="margin-top:10px;padding-left:18px">\n          ${details.map(d => `<li style="margin-bottom:8px"><div style=\"font-weight:600\">${escapeHtml(d.q)}</div>\n            <div class=\"small\">Your answer: ${d.selected === null ? '<em>none</em>' : escapeHtml(QUIZ[details.indexOf(d)].choices[d.selected])} — ${d.isCorrect ? '<strong style=\"color:#34d399\">Correct</strong>' : '<strong style=\"color:#fb7185\">Incorrect</strong> (Correct: ' + escapeHtml(QUIZ[details.indexOf(d)].choices[d.correct]) + ')'}</div></li>`).join('')}
        </ol>
        <div style="margin-top:12px"><button id=\"saveResults\">Save to localStorage</button></div>
      `;

    document.getElementById('saveResults').addEventListener('click', () => {
        const payload = { score: correct, total: QUIZ.length, percent, answers: state.answers, at: new Date().toISOString() };
        const list = JSON.parse(localStorage.getItem('quiz-results') || '[]');
        list.push(payload);
        localStorage.setItem('quiz-results', JSON.stringify(list));
        alert('Results saved locally.');
    });

    // stop timer
    clearInterval(timerInterval);
}

function resetQuiz() {
    state.index = 0; state.answers = Array(QUIZ.length).fill(null); state.startTime = null; resultBox.hidden = true; renderQuestion(); updateControls(); updateProgress(); saveProgress(true); startTimer();
}

// ====== Persistence ======
function saveProgress(forceClear = false) {
    if (forceClear) { localStorage.removeItem('quiz-progress'); return; }
    const data = { index: state.index, answers: state.answers, startTime: state.startTime, duration: state.duration };
    localStorage.setItem('quiz-progress', JSON.stringify(data));
}

function loadProgress() {
    try {
        const data = JSON.parse(localStorage.getItem('quiz-progress') || 'null');
        if (data && Array.isArray(data.answers) && data.answers.length === QUIZ.length) {
            state.index = data.index || 0; state.answers = data.answers; state.startTime = data.startTime || Date.now(); state.duration = data.duration || state.duration; return true;
        }
    } catch (e) {/* ignore */ }
    return false;
}

// ====== Utilities ======
function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function formatTime(sec) { const m = Math.floor(sec / 60); const s = sec % 60; return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); }

// ====== Download self-contained HTML ======
downloadBtn.addEventListener('click', () => {
    const blob = new Blob([document.documentElement.outerHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'interactive-quiz.html'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

// ====== Init ======
(function init() {
    const had = loadProgress();
    renderQuestion(); updateControls(); updateProgress();
    if (!had) startTimer(); else { // resume timer sensibly
        if (!state.startTime) state.startTime = Date.now(); startTimer();
    }
})();

// Make enter/space on next/prev work when focused
[prevBtn, nextBtn, submitBtn].forEach(b => b.addEventListener('keyup', e => { if (e.key === 'Enter' || e.key === ' ') b.click(); }));