const segments = document.querySelectorAll('.segment');
const entropyLabel = document.getElementById('entropy-val');

function updateUI(data) {
    // 1. Update Segmented Meter
    segments.forEach((seg, i) => {
        if (i < data.score + 1) {
            seg.style.background = getScoreColor(data.score);
            seg.style.boxShadow = `0 0 10px ${getScoreColor(data.score)}`;
        } else {
            seg.style.background = 'rgba(255,255,255,0.1)';
            seg.style.boxShadow = 'none';
        }
    });

    // 2. Update Entropy
    document.getElementById('entropy-display').style.display = 'block';
    entropyLabel.innerText = `${data.entropy} bits`;

    // 3. Update Brute Force Scenarios
    document.getElementById('scen-fast').innerText = data.crack_times.offline_fast;
    document.getElementById('scen-gpu').innerText = data.crack_times.gpu_cluster;

    // 4. Detailed Feedback
    const suggestList = data.suggestions.map(s => `<li>${s}</li>`).join('');
    document.getElementById('feedback-label').innerHTML = `<strong>${data.feedback}</strong><ul>${suggestList}</ul>`;
}

function getScoreColor(score) {
    if (score <= 1) return '#ff4d4d';
    if (score === 2) return '#ffaa00';
    if (score === 3) return '#00ccff';
    return '#00ff88';
}

// Diceware Button
document.getElementById('dicewareBtn').addEventListener('click', async () => {
    const res = await fetch('/generate_diceware');
    const data = await res.json();
    passwordInput.value = data.password;
    passwordInput.dispatchEvent(new Event('input'));
});
