/**
 * ShieldCheck - Minimalist, High-Performance Password Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elements - Analyzer
    const passwordInput = document.getElementById('passwordInput');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const eyeIcon = document.getElementById('eyeIcon');
    const copyInputBtn = document.getElementById('copyInputBtn');
    const clearInputBtn = document.getElementById('clearInputBtn');
    
    const strengthBar = document.getElementById('strengthBar');
    const scoreLabel = document.getElementById('scoreLabel');
    const crackTimeVal = document.getElementById('crackTimeVal');
    const entropyVal = document.getElementById('entropyVal');
    const feedbackText = document.getElementById('feedbackText');

    const chkLength = document.getElementById('chkLength');
    const chkUpper = document.getElementById('chkUpper');
    const chkLower = document.getElementById('chkLower');
    const chkDigits = document.getElementById('chkDigits');
    const chkSymbols = document.getElementById('chkSymbols');

    // Elements - Generator
    const genInitialState = document.getElementById('genInitialState');
    const genActiveState = document.getElementById('genActiveState');
    const initialGenerateBtn = document.getElementById('initialGenerateBtn');
    const generatedPassword = document.getElementById('generatedPassword');
    const copyGenBtn = document.getElementById('copyGenBtn');
    const regenerateBtn = document.getElementById('regenerateBtn');
    const useInAnalyzerBtn = document.getElementById('useInAnalyzerBtn');
    const lengthSlider = document.getElementById('lengthSlider');
    const lengthValue = document.getElementById('lengthValue');

    const optUpper = document.getElementById('optUpper');
    const optLower = document.getElementById('optLower');
    const optDigits = document.getElementById('optDigits');
    const optSymbols = document.getElementById('optSymbols');

    let hasGenerated = false;

    const toast = document.getElementById('toast');
    let toastTimeout = null;
    let debounceTimer = null;

    // Toast helper
    function showToast(message = "Copied to clipboard!") {
        toast.innerText = message;
        toast.classList.remove('hidden');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, 2200);
    }

    // Friendly crack time formatter (Client-side fallback)
    function formatTimeFriendly(seconds) {
        if (!seconds || seconds <= 0 || seconds < 0.001) return "Instant (< 1 ms)";
        if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;
        if (seconds < 60) return `${seconds.toFixed(1)} seconds`;
        const minutes = seconds / 60;
        if (minutes < 60) return `${minutes.toFixed(1)} minutes`;
        const hours = minutes / 60;
        if (hours < 24) return `${hours.toFixed(1)} hours`;
        const days = hours / 24;
        if (days < 30.5) return `${days.toFixed(1)} days`;
        const months = days / 30.4;
        if (months < 12) return `${months.toFixed(1)} months`;
        const years = days / 365.25;
        if (years < 1000) return `${years.toFixed(1)} years`;
        if (years < 1e6) return `${Math.round(years).toLocaleString()} years`;
        if (years < 1e9) return `${(years / 1e6).toFixed(1)}M years`;
        if (years < 1e12) return `${(years / 1e9).toFixed(1)}B years`;
        return `${(years / 1e12).toFixed(1)}T years`;
    }

    // Instant Client-side calculation
    function analyzeClient(pwd) {
        const len = pwd.length;
        if (len === 0) {
            return {
                score: 0,
                scoreLabel: "—",
                scoreClass: "empty",
                entropy: "0 bits",
                crackTime: "—",
                feedback: "Enter a password to evaluate strength.",
                checklist: { length: false, upper: false, lower: false, digits: false, symbols: false }
            };
        }

        const hasUpper = /[A-Z]/.test(pwd);
        const hasLower = /[a-z]/.test(pwd);
        const hasDigits = /[0-9]/.test(pwd);
        const hasSymbols = /[^A-Za-z0-9]/.test(pwd);

        let pool = 0;
        if (hasLower) pool += 26;
        if (hasUpper) pool += 26;
        if (hasDigits) pool += 10;
        if (hasSymbols) pool += 33;

        const entropy = pool > 0 ? (len * Math.log2(pool)).toFixed(1) : 0;

        let score = 0;
        const e = parseFloat(entropy);
        if (e < 28 || len < 8) score = 0;
        else if (e < 36 || len < 10) score = 1;
        else if (e < 60 || len < 12) score = 2;
        else if (e < 80 || len < 14) score = 3;
        else score = 4;

        const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
        const classes = ["very-weak", "weak", "fair", "strong", "very-strong"];

        // Estimated fast hash crack time (10 billion guesses/sec)
        const combinations = pool > 0 ? Math.pow(pool, len) / 2 : 0;
        const seconds = combinations / 1e10;

        const feedback = score >= 3 ? "Strong password!" : (len < 12 ? "Tip: Make it at least 12 characters." : "Tip: Mix uppercase, digits, and symbols.");

        return {
            score,
            scoreLabel: labels[score],
            scoreClass: classes[score],
            entropy: `${entropy} bits`,
            crackTime: formatTimeFriendly(seconds),
            feedback,
            checklist: {
                length: len >= 12,
                upper: hasUpper,
                lower: hasLower,
                digits: hasDigits,
                symbols: hasSymbols
            }
        };
    }

    // Render analysis into UI
    function renderAnalysis(data) {
        strengthBar.className = `strength-bar-fill ${data.scoreClass}`;
        scoreLabel.innerText = data.scoreLabel;
        crackTimeVal.innerText = data.crackTime;
        entropyVal.innerText = data.entropy;
        feedbackText.innerText = data.feedback;

        // Checklist pills
        chkLength.classList.toggle('valid', data.checklist.length);
        chkUpper.classList.toggle('valid', data.checklist.upper);
        chkLower.classList.toggle('valid', data.checklist.lower);
        chkDigits.classList.toggle('valid', data.checklist.digits);
        chkSymbols.classList.toggle('valid', data.checklist.symbols);
    }

    // Debounced Backend Deep Check (zxcvbn patterns)
    async function fetchBackendAnalysis(pwd) {
        if (!pwd) return;
        try {
            const res = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd })
            });
            if (!res.ok) return;
            const data = await res.json();
            
            // Refine with backend zxcvbn results
            strengthBar.className = `strength-bar-fill ${data.score_class}`;
            scoreLabel.innerText = data.score_label;
            crackTimeVal.innerText = data.crack_time;
            entropyVal.innerText = `${data.entropy_bits} bits`;
            feedbackText.innerText = data.feedback;
        } catch (e) {
            // Silently fallback to client calculations
        }
    }

    // Input event
    passwordInput.addEventListener('input', () => {
        const pwd = passwordInput.value;
        const clientResult = analyzeClient(pwd);
        renderAnalysis(clientResult);

        clearTimeout(debounceTimer);
        if (pwd.length > 0) {
            debounceTimer = setTimeout(() => {
                fetchBackendAnalysis(pwd);
            }, 250);
        }
    });

    // Toggle show/hide password
    togglePasswordBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        eyeIcon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
    });

    // Copy analyzer password
    copyInputBtn.addEventListener('click', () => {
        if (!passwordInput.value) {
            showToast("Nothing to copy!");
            return;
        }
        navigator.clipboard.writeText(passwordInput.value).then(() => {
            showToast("Password copied!");
        });
    });

    // Clear analyzer input
    clearInputBtn.addEventListener('click', () => {
        passwordInput.value = '';
        renderAnalysis(analyzeClient(''));
        passwordInput.focus();
    });

    // ==========================================
    // Generator Logic
    // ==========================================
    function generateClientPassword() {
        const len = parseInt(lengthSlider.value, 10);
        let pool = "";
        const guaranteed = [];

        if (optUpper.checked) {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            pool += chars;
            guaranteed.push(chars[Math.floor(Math.random() * chars.length)]);
        }
        if (optLower.checked) {
            const chars = "abcdefghijklmnopqrstuvwxyz";
            pool += chars;
            guaranteed.push(chars[Math.floor(Math.random() * chars.length)]);
        }
        if (optDigits.checked) {
            const chars = "0123456789";
            pool += chars;
            guaranteed.push(chars[Math.floor(Math.random() * chars.length)]);
        }
        if (optSymbols.checked) {
            const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
            pool += chars;
            guaranteed.push(chars[Math.floor(Math.random() * chars.length)]);
        }

        if (!pool) {
            pool = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            guaranteed.push(pool[Math.floor(Math.random() * pool.length)]);
        }

        const remaining = Math.max(0, len - guaranteed.length);
        const result = [...guaranteed];
        for (let i = 0; i < remaining; i++) {
            result.push(pool[Math.floor(Math.random() * pool.length)]);
        }

        // Shuffle
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }

        return result.slice(0, len).join('');
    }

    async function triggerGenerate() {
        const payload = {
            length: lengthSlider.value,
            uppercase: optUpper.checked,
            lowercase: optLower.checked,
            digits: optDigits.checked,
            symbols: optSymbols.checked
        };

        try {
            const res = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                generatedPassword.value = data.password;
                return;
            }
        } catch (e) {
            // Local fallback
        }

        generatedPassword.value = generateClientPassword();
    }

    // Generator events
    initialGenerateBtn.addEventListener('click', () => {
        hasGenerated = true;
        genInitialState.classList.add('hidden');
        genActiveState.classList.remove('hidden');
        triggerGenerate();
    });

    lengthSlider.addEventListener('input', () => {
        lengthValue.innerText = lengthSlider.value;
        if (hasGenerated) {
            triggerGenerate();
        }
    });

    [optUpper, optLower, optDigits, optSymbols].forEach(opt => {
        opt.addEventListener('change', () => {
            // Ensure at least one is checked
            if (!optUpper.checked && !optLower.checked && !optDigits.checked && !optSymbols.checked) {
                opt.checked = true;
            }
            if (hasGenerated) {
                triggerGenerate();
            }
        });
    });

    regenerateBtn.addEventListener('click', triggerGenerate);

    copyGenBtn.addEventListener('click', () => {
        if (!generatedPassword.value) return;
        navigator.clipboard.writeText(generatedPassword.value).then(() => {
            showToast("Generated password copied!");
        });
    });

    useInAnalyzerBtn.addEventListener('click', () => {
        const pwd = generatedPassword.value;
        if (!pwd) return;
        passwordInput.value = pwd;
        passwordInput.dispatchEvent(new Event('input'));
        showToast("Transferred to Analyzer!");
    });

    // Initial state: waiting for user to click Generate Password
});
