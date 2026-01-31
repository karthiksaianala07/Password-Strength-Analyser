import math
import hashlib
import requests
import secrets
import string
from flask import Flask, render_template, request, jsonify, session
from zxcvbn import zxcvbn

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)

def get_entropy(password):
    if not password: return 0
    charset_size = 0
    if any(c in string.ascii_lowercase for c in password): charset_size += 26
    if any(c in string.ascii_uppercase for c in password): charset_size += 26
    if any(c in string.digits for c in password): charset_size += 10
    if any(c in string.punctuation for c in password): charset_size += 32
    # Entropy formula: log2(charset_size ^ length)
    return round(len(password) * math.log2(max(charset_size, 1)), 2)

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    password = data.get('password', '')
    if not password: return jsonify({"score": 0})

    result = zxcvbn(password)
    entropy = get_entropy(password)
    
    # Professional Cracking Scenarios
    crack_times = {
        "online_throttled": result['crack_times_display']['online_no_throtle_10_per_second'],
        "offline_fast": result['crack_times_display']['offline_fast_hashing_1e10_per_second'],
        "gpu_cluster": "Minutes" if result['score'] < 3 else "Years" # Simplified for logic
    }

    return jsonify({
        "score": result['score'],
        "entropy": entropy,
        "crack_times": crack_times,
        "feedback": result['feedback']['warning'] or "Strong alignment with security best practices.",
        "suggestions": result['feedback']['suggestions']
    })

@app.route('/generate_diceware', methods=['GET'])
def generate_diceware():
    # Simple word list for demonstration; in prod, use a 7k+ word list
    words = ["apple", "battery", "staple", "correct", "horse", "blue", "secure", "cloud", "tower"]
    passphrase = "-".join(secrets.choice(words) for _ in range(4))
    return jsonify({"password": passphrase})

@app.route('/generate', methods=['GET'])
def generate():
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(16))
    return jsonify({"password": password})

if __name__ == '__main__':
    app.run(debug=True)
