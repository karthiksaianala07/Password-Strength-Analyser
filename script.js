const passwordInput = document.getElementById('password');
const strengthBar = document.getElementById('strength-bar');
const timeLabel = document.getElementById('time-label');
const feedbackLabel = document.getElementById('feedback-label');
const togglePassword = document.getElementById('togglePassword');
const copyBtn = document.getElementById('copyBtn');
const generateBtn = document.getElementById('generateBtn');

const colors = ['#ff4d4d', '#ffa64d', '#ffff4d', '#4dff88', '#00ffcc'];

// 1. Analyze Password
passwordInput.addEventListener('input', async () => {
    const pwd = passwordInput.value;
    if (!pwd) {
        strengthBar.style.width = "0%";
        timeLabel.innerText = "Crack Time: -";
        feedbackLabel.innerText = "Start typing...";
        return;
    }

    const res = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
    });
    const data = await res.json();

    strengthBar.style.width = ((data.score + 1) * 20) + "%";
    strengthBar.style.backgroundColor = colors[data.score];
    timeLabel.innerText = `Crack Time: ${data.crack_time}`;
    feedbackLabel.innerText = data.feedback;
});

// 2. Toggle Visibility
togglePassword.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    togglePassword.classList.toggle('fa-eye-slash');
});

// 3. Generate Password
generateBtn.addEventListener('click', async () => {
    const res = await fetch('/generate');
    const data = await res.json();
    passwordInput.value = data.password;
    passwordInput.dispatchEvent(new Event('input'));
});

// 4. Copy to Clipboard
copyBtn.addEventListener('click', () => {
    if (!passwordInput.value) return;
    navigator.clipboard.writeText(passwordInput.value).then(() => {
        const originalClass = copyBtn.className;
        copyBtn.className = 'fas fa-check';
        setTimeout(() => copyBtn.className = originalClass, 2000);
    });
});