import os
import math
import re
import secrets
import string
from flask import Flask, render_template, request, jsonify

try:
    from zxcvbn import zxcvbn
except ImportError:
    zxcvbn = None

app = Flask(__name__)

def format_crack_time(seconds: float) -> str:
    """Format seconds into human-readable crack time."""
    if seconds <= 0 or seconds < 0.001:
        return "Instant (< 1 ms)"
    if seconds < 1:
        return f"{int(seconds * 1000)} ms"
    if seconds < 60:
        return f"{seconds:.1f} seconds"
    minutes = seconds / 60
    if minutes < 60:
        return f"{minutes:.1f} minutes"
    hours = minutes / 60
    if hours < 24:
        return f"{hours:.1f} hours"
    days = hours / 24
    if days < 30.5:
        return f"{days:.1f} days"
    months = days / 30.4
    if months < 12:
        return f"{months:.1f} months"
    years = days / 365.25
    if years < 1000:
        return f"{years:.1f} years"
    if years < 1_000_000:
        return f"{int(years):,} years"
    if years < 1_000_000_000:
        return f"{years / 1_000_000:.1f} million years"
    if years < 1_000_000_000_000:
        return f"{years / 1_000_000_000:.1f} billion years"
    return f"{years / 1_000_000_000_000:.1f} trillion years"

def analyze_password(password: str):
    """Analyze entropy, crack time, composition, and security score."""
    length = len(password)
    if length == 0:
        return {
            "score": 0,
            "score_label": "Empty",
            "score_class": "empty",
            "entropy_bits": 0.0,
            "crack_time": "—",
            "feedback": "Enter a password to analyze.",
            "checklist": {
                "length": False,
                "upper": False,
                "lower": False,
                "digits": False,
                "symbols": False
            }
        }

    has_upper = bool(re.search(r'[A-Z]', password))
    has_lower = bool(re.search(r'[a-z]', password))
    has_digits = bool(re.search(r'[0-9]', password))
    has_symbols = bool(re.search(r'[^A-Za-z0-9]', password))

    # Calculate active character pool
    pool = 0
    if has_lower: pool += 26
    if has_upper: pool += 26
    if has_digits: pool += 10
    if has_symbols: pool += 33

    # Shannon Entropy in bits
    entropy = round(length * math.log2(pool), 1) if pool > 0 else 0.0

    score_labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"]
    score_classes = ["very-weak", "weak", "fair", "strong", "very-strong"]

    # Use zxcvbn if available, otherwise heuristic fallback
    if zxcvbn is not None:
        try:
            res = zxcvbn(password)
            score = res['score']
            crack_time = res['crack_times_display']['offline_fast_hashing_1e10_per_second']
            feedback = res['feedback']['warning'] or (res['feedback']['suggestions'][0] if res['feedback']['suggestions'] else "Strong password!")
        except Exception:
            score = min(4, int(entropy / 20))
            combinations = (pool ** length) / 2 if pool > 0 else 0
            crack_time = format_crack_time(combinations / 1e10)
            feedback = "Looks good!" if score >= 3 else "Add length and diverse characters."
    else:
        if entropy < 28 or length < 8:
            score = 0
        elif entropy < 36 or length < 10:
            score = 1
        elif entropy < 60 or length < 12:
            score = 2
        elif entropy < 80 or length < 14:
            score = 3
        else:
            score = 4
        combinations = (pool ** length) / 2 if pool > 0 else 0
        crack_time = format_crack_time(combinations / 1e10)
        feedback = "Strong password!" if score >= 3 else "Increase length and mix character types."

    return {
        "score": score,
        "score_label": score_labels[score],
        "score_class": score_classes[score],
        "entropy_bits": entropy,
        "crack_time": crack_time,
        "feedback": feedback,
        "checklist": {
            "length": length >= 12,
            "upper": has_upper,
            "lower": has_lower,
            "digits": has_digits,
            "symbols": has_symbols
        }
    }

def generate_password(length=16, use_upper=True, use_lower=True, use_digits=True, use_symbols=True):
    """Generate a cryptographically secure random password."""
    pool = ""
    guaranteed = []

    if use_upper:
        pool += string.ascii_uppercase
        guaranteed.append(secrets.choice(string.ascii_uppercase))
    if use_lower:
        pool += string.ascii_lowercase
        guaranteed.append(secrets.choice(string.ascii_lowercase))
    if use_digits:
        pool += string.digits
        guaranteed.append(secrets.choice(string.digits))
    if use_symbols:
        symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        pool += symbols
        guaranteed.append(secrets.choice(symbols))

    if not pool:
        pool = string.ascii_letters + string.digits
        guaranteed.append(secrets.choice(pool))

    remaining = max(0, length - len(guaranteed))
    chars = guaranteed + [secrets.choice(pool) for _ in range(remaining)]

    # Cryptographic shuffle
    for i in range(len(chars) - 1, 0, -1):
        j = secrets.randbelow(i + 1)
        chars[i], chars[j] = chars[j], chars[i]

    return "".join(chars[:length])

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json() or {}
    password = data.get('password', '')
    return jsonify(analyze_password(password))

@app.route('/generate', methods=['GET', 'POST'])
def generate():
    if request.method == 'POST':
        data = request.get_json() or {}
    else:
        data = request.args.to_dict()

    length = int(data.get('length', 16))
    length = max(6, min(64, length))
    use_upper = str(data.get('uppercase', 'true')).lower() in ['true', '1', 'yes']
    use_lower = str(data.get('lowercase', 'true')).lower() in ['true', '1', 'yes']
    use_digits = str(data.get('digits', 'true')).lower() in ['true', '1', 'yes']
    use_symbols = str(data.get('symbols', 'true')).lower() in ['true', '1', 'yes']

    pwd = generate_password(length, use_upper, use_lower, use_digits, use_symbols)
    analysis = analyze_password(pwd)
    return jsonify({"password": pwd, "analysis": analysis})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    print(f"\n=======================================================")
    print(f" ShieldCheck is running at: http://127.0.0.1:{port}")
    print(f"=======================================================\n")
    app.run(debug=True, host='127.0.0.1', port=port)
