const passwordInput = document.getElementById('password');
const strengthBar = document.getElementById('strength-bar');
const percentageText = document.getElementById('percentage-text');
const circularProgress = document.querySelector('.circular-progress');
const historyBody = document.getElementById('history-body');

const colors = ['#ff4d4d', '#ffa64d', '#ffff4d', '#4dff88', '#00ffcc'];

passwordInput.addEventListener('input', async () => {
    const pwd = passwordInput.value;
    if (!pwd) return resetUI();

    const res = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
    });
    const data = await res.json();

    updateUI(data);
});

function updateUI(data) {
    // 1. Update Gauge & Percentage
    const score = data.score;
    const percent = (score / 4) * 100;
    const color = colors[score];
    
    percentageText.innerText = `${percent}%`;
    circularProgress.style.background = `conic-gradient(${color} ${(percent/100)*360}deg, rgba(255,255,255,0.1) 0deg)`;

    // 2. Update Strength Bar
    strengthBar.style.width = `${percent}%`;
    strengthBar.style.backgroundColor = color;

    // 3. Update Text Labels
    document.getElementById('time-label').innerText = `Crack Time: ${data.crack_time}`;
    document.getElementById('feedback-label').innerText = data.feedback;

    // 4. Update History Table
    renderHistory(data.history);
}

function renderHistory(history) {
    historyBody.innerHTML = history.map(item => `
        <tr>
            <td>${item.password}</td>
            <td>${item.crack_time}</td>
        </tr>
    `).join('');
}

function resetUI() {
    percentageText.innerText = '0%';
    strengthBar.style.width = '0%';
    circularProgress.style.background = `conic-gradient(rgba(255,255,255,0.1) 0deg, rgba(255,255,255,0.1) 0deg)`;
}

// Clear History Button
document.getElementById('clearBtn').addEventListener('click', async () => {
    await fetch('/clear', { method: 'POST' });
    historyBody.innerHTML = '';
});

// Copy and Toggle logic remain the same as previous versions...
