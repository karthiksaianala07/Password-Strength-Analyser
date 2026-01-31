const passwordInput = document.getElementById('password');
const segments = document.querySelectorAll('.segment');
const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#00ff88'];

passwordInput.addEventListener('input', async () => {
    const pwd = passwordInput.value;
    if (!pwd) return resetUI();

    const res = await fetch('/analyze', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ password: pwd })
    });
    const data = await res.json();
    updateUI(data);
});

function updateUI(data) {
    const score = data.score;
    segments.forEach((seg, i) => {
        if (i <= score) {
            seg.style.background = colors[score];
            seg.style.boxShadow = `0 0 8px ${colors[score]}`;
        } else {
            seg.style.background = 'rgba(255,255,255,0.05)';
            seg.style.boxShadow = 'none';
        }
    });

    document.getElementById('entropy-display').style.display = 'block';
    document.getElementById('entropy-val').innerText = data.entropy;
    document.getElementById('feedback-main').innerText = data.feedback;
    document.getElementById('scen-pc').innerText = data.crack_times.offline_fast;
    document.getElementById('scen-gpu').innerText = data.crack_times.gpu_cluster;
    
    const list = document.getElementById('suggestions-list');
    list.innerHTML = data.suggestions.map(s => `<li>${s}</li>`).join('');
}

function resetUI() {
    segments.forEach(s => s.style.background = 'rgba(255,255,255,0.05)');
    document.getElementById('entropy-display').style.display = 'none';
    document.getElementById('feedback-main').innerText = 'Awaiting analysis...';
    document.getElementById('suggestions-list').innerHTML = '';
}

document.getElementById('dicewareBtn').addEventListener('click', async () => {
    const res = await fetch('/generate_diceware');
    const data = await res.json();
    passwordInput.value = data.password;
    passwordInput.dispatchEvent(new Event('input'));
});
