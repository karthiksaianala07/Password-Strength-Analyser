const passwordInput = document.getElementById('password');
const strengthBar = document.getElementById('strength-bar');
const percentageText = document.getElementById('percentage-text');
const circularProgress = document.querySelector('.circular-progress');
const historyBody = document.getElementById('history-body');
const colors = ['#ff4d4d', '#ffa64d', '#ffff4d', '#4dff88', '#00ffcc'];

let pwnedTimeout;

// 1. Analysis Logic
passwordInput.addEventListener('input', async () => {
    const pwd = passwordInput.value;
    clearTimeout(pwnedTimeout);

    if (!pwd) return resetUI();

    const res = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
    });
    const data = await res.json();
    updateUI(data);

    // Debounced Pwned Check
    pwnedTimeout = setTimeout(async () => {
        const pRes = await fetch('/check_pwned', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
        });
        const pData = await pRes.json();
        const alertBox = document.getElementById('pwned-alert');
        if (pData.count > 0) {
            alertBox.classList.add('pwned-danger');
            document.getElementById('pwned-text').innerText = ` Warning: Found in ${pData.count.toLocaleString()} breaches!`;
        } else {
            alertBox.classList.remove('pwned-danger');
        }
    }, 600);
});

function updateUI(data) {
    const score = data.score;
    const percent = (score / 4) * 100;
    const color = colors[score];
    
    percentageText.innerText = `${percent}%`;
    circularProgress.style.background = `conic-gradient(${color} ${(percent/100)*360}deg, rgba(255,255,255,0.1) 0deg)`;
    strengthBar.style.width = `${percent}%`;
    strengthBar.style.backgroundColor = color;
    document.getElementById('time-label').innerText = `Crack Time: ${data.crack_time}`;
    document.getElementById('feedback-label').innerText = data.feedback;
    renderHistory(data.history);
}

function resetUI() {
    percentageText.innerText = '0%';
    strengthBar.style.width = '0%';
    circularProgress.style.background = `conic-gradient(rgba(255,255,255,0.1) 0deg, rgba(255,255,255,0.1) 0deg)`;
    document.getElementById('time-label').innerText = 'Crack Time: -';
    document.getElementById('feedback-label').innerText = 'Ready for analysis';
    document.getElementById('pwned-alert').classList.remove('pwned-danger');
}

// 2. Generate & Copy
document.getElementById('generateBtn').addEventListener('click', async () => {
    const res = await fetch('/generate');
    const data = await res.json();
    passwordInput.value = data.password;
    passwordInput.dispatchEvent(new Event('input'));
});

document.getElementById('copyBtn').addEventListener('click', () => {
    if (!passwordInput.value) return;
    navigator.clipboard.writeText(passwordInput.value);
    const icon = document.getElementById('copyBtn');
    icon.className = 'fas fa-check';
    setTimeout(() => icon.className = 'fas fa-copy', 2000);
});

document.getElementById('togglePassword').addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
});

// 3. Theme Toggle
const toggleSwitch = document.querySelector('#checkbox');
toggleSwitch.addEventListener('change', (e) => {
    const theme = e.target.checked ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
});

// 4. History
function renderHistory(history) {
    if (!history) return;
    historyBody.innerHTML = history.map(item => `<tr><td>${item.password}</td><td>${item.crack_time}</td></tr>`).join('');
}

document.getElementById('clearBtn').addEventListener('click', async () => {
    await fetch('/clear', { method: 'POST' });
    historyBody.innerHTML = '';
});
