import { QUESTIONS } from "./consts/questions.js";
import { HEROES } from "./consts/heroes.js";

// ====== State ======
const state = {
    index: 0,
    answers: Array(QUESTIONS.length).fill(null),
};

// ====== Elements ======
const questionArea = document.getElementById('q-area');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const restartBtn = document.getElementById('restart');
const resultBox = document.getElementById('result');

// ====== Render ======
function renderQuestion() {
    const item = QUESTIONS[state.index];
    const selected = state.answers[state.index];

    let html = '';
    if (item.choices.length <= 5) {
        html = `
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
    } else {
        html = `
            <h2 class="question">${escapeHtml(item.q)}</h2>
            <div id="dropdown" class="choice">
                <div class="select-box" id="selectBox">Select heroes...</div>
                <div class="options-container" id="optionsContainer" hidden>
                    ${item.choices.map((c, i) => `
                        <label><input id="hero-${c.id}" type="checkbox" value="${c.id}">${c.name}</label>
                    `).join('')}
                </div>
            </div>
        `;
    }

    questionArea.innerHTML = html;

    if (item.choices.length <= 5) {
        // Attach choice handlers
        questionArea.querySelectorAll('input[name=choice]').forEach(i => {
            i.addEventListener('change', (e) => {
                state.answers[state.index] = Number(e.target.value);
                saveProgress();
                updateControls();
            });
        });

        // Keyboard friendly label click
        questionArea.querySelectorAll('.choice').forEach((lbl, idx) => {
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
    } else {
        // Select box handlers
        const dropdown = document.getElementById("dropdown");
        const selectBox = document.getElementById("selectBox");
        const optionsContainer = document.getElementById("optionsContainer");
        dropdown.addEventListener("click", () => {
            optionsContainer.hidden = false;
        })

        // Attach choice handlers
        questionArea.querySelectorAll('input[type=checkbox]').forEach((inp, idx) => {
            inp.addEventListener('change', (e) => {
                const checked = Array.from(optionsContainer.querySelectorAll('input:checked'));

                state.answers[state.index] = checked.map(cb => Number(cb.value));
                if (checked.length == 3) {
                    optionsContainer.querySelectorAll('input:not(:checked)').forEach(inp => {
                        inp.disabled = true;
                    });
                } else {
                    optionsContainer.querySelectorAll('input:disabled').forEach(inp => {
                        inp.disabled = false;
                    });
                }

                const checkedNames = checked.map(cb => cb.parentNode.textContent.trim());
                selectBox.textContent = checkedNames.length > 0 ? checkedNames.join('; ') : 'Select heroes...';
                saveProgress();
                updateControls();
            })
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!e.target.closest("#dropdown")) {
                optionsContainer.hidden = true;
            }
        });
    }
}

function updateControls() {
    prevBtn.disabled = state.index === 0;
    nextBtn.disabled = state.index === QUESTIONS.length - 1;
}

// ====== Navigation ======
prevBtn.addEventListener('click',
    () => {
        state.index = Math.max(0, state.index - 1);
        renderQuestion();
        updateControls();
    }
);

nextBtn.addEventListener('click',
    () => {
        state.index = Math.min(QUESTIONS.length - 1, state.index + 1);
        renderQuestion();
        updateControls();
    }
);

submitBtn.addEventListener('click', () => { showResults(); });
restartBtn.addEventListener('click', () => { if (confirm('Restart the quiz? Your progress will be cleared.')) resetQuiz(); });

// ====== Results ======
function showResults(auto = false) {
    const details = QUESTIONS.map((q, i) => {
        return { q: q.q, selected: state.answers[i] };
    });

    const answers = details.map((d, i) => {
        if (d.selected != null) {
            if (!isNaN(d.selected)) {
                return escapeHtml(QUESTIONS[i].choices[d.selected]);
            } else {
                return d.selected.map(ind => escapeHtml(QUESTIONS[i].choices[ind].name)).join(', ');
            }
        }
    });

    resultBox.hidden = false;
    resultBox.innerHTML = `\n
        <ol style="margin-top:10px;padding-left:18px">\n
            ${details.map((d, i) => `
                <li style="margin-bottom:8px">
                    <div style="font-weight:600">${escapeHtml(d.q)}</div>\n
                    <div class="small">Your answer: ${d.selected === null ? '<em>none</em>' : answers[i]} </div>
                </li>`
            ).join('')}
        </ol>
      `;
}

function resetQuiz() {
    state.index = 0;
    state.answers = Array(QUESTIONS.length).fill(null);
    resultBox.hidden = true;
    renderQuestion();
    updateControls();
    saveProgress(true);
}

// ====== Persistence ======
function saveProgress(forceClear = false) {
    if (forceClear) { localStorage.removeItem('test-progress'); return; }
    const data = { index: state.index, answers: state.answers };
    localStorage.setItem('test-progress', JSON.stringify(data));
}

function loadProgress() {
    try {
        const data = JSON.parse(localStorage.getItem('test-progress') || 'null');
        if (data && Array.isArray(data.answers) && data.answers.length === QUESTIONS.length) {
            state.index = data.index || 0;
            state.answers = data.answers;
            return true;
        }
    } catch (e) {/* ignore */ }
    return false;
}

// ====== Utilities ======
function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ====== Init ======
(function init() {
    localStorage.clear();
    loadProgress();
    renderQuestion();
    updateControls();
})();

// Make enter/space on next/prev work when focused
[prevBtn, nextBtn, submitBtn].forEach(b => b.addEventListener('keyup', e => { if (e.key === 'Enter' || e.key === ' ') b.click(); }));