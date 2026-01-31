from flask import Flask, render_template, request, jsonify, session
from zxcvbn import zxcvbn
import hashlib
import requests
import secrets
import string

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    password = data.get('password', '')
    
    if not password:
        return jsonify({"score": 0, "crack_time": "N/A", "feedback": "", "history": session.get('history', [])})

    result = zxcvbn(password)
    analysis = {
        "password": password[:3] + "****" if len(password) > 3 else "****", 
        "score": result['score'],
        "crack_time": result['crack_times_display']['offline_fast_hashing_1e10_per_second']
    }

    if 'history' not in session:
        session['history'] = []
    
    history = session['history']
    history.insert(0, analysis)
    session['history'] = history[:5] 
    
    return jsonify({
        "score": result['score'],
        "crack_time": analysis['crack_time'],
        "feedback": result['feedback']['warning'] or "Highly Secure!",
        "history": session['history']
    })

@app.route('/check_pwned', methods=['POST'])
def check_pwned():
    data = request.get_json()
    password = data.get('password', '')
    if not password: return jsonify({"count": 0})

    # K-Anonymity implementation
    sha1_password = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
    prefix, suffix = sha1_password[:5], sha1_password[5:]
    url = f"https://api.pwnedpasswords.com/range/{prefix}"
    
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            hashes = (line.split(':') for line in response.text.splitlines())
            for h, count in hashes:
                if h == suffix:
                    return jsonify({"count": int(count)})
    except:
        pass
    return jsonify({"count": 0})

@app.route('/clear', methods=['POST'])
def clear_history():
    session.pop('history', None)
    return jsonify({"status": "success"})

@app.route('/generate', methods=['GET'])
def generate():
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(16))
    return jsonify({"password": password})

if __name__ == '__main__':
    app.run(debug=True)
