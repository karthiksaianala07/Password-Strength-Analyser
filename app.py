import math, hashlib, requests, secrets, string
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
    return round(len(password) * math.log2(max(charset_size, 1)), 2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    pwd = data.get('password', '')
    if not pwd: return jsonify({"score": 0, "history": session.get('history', [])})

    res = zxcvbn(pwd)
    
    analysis = {
        "password": pwd[:3] + "****" if len(pwd) > 3 else "****",
        "score": res['score'],
        "entropy": get_entropy(pwd),
        "crack_times": {
            "offline_fast": res['crack_times_display']['offline_fast_hashing_1e10_per_second'],
            "gpu_cluster": "Minutes" if res['score'] < 3 else "Centuries"
        },
        "feedback": res['feedback']['warning'] or "Optimal configuration.",
        "suggestions": res['feedback']['suggestions']
    }

    if 'history' not in session: session['history'] = []
    history = session['history']
    history.insert(0, analysis)
    session['history'] = history[:5]
    
    return jsonify(analysis)

@app.route('/generate_diceware', methods=['GET'])
def generate_diceware():
    # Example list; use a full 7776 word list for production
    words = ["nebula", "cipher", "shield", "carbon", "vault", "matrix", "vector", "proxy"]
    return jsonify({"password": "-".join(secrets.choice(words) for _ in range(4))})

@app.route('/clear', methods=['POST'])
def clear_history():
    session.pop('history', None)
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True)
