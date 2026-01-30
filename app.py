from flask import Flask, render_template, request, jsonify
from zxcvbn import zxcvbn
import secrets
import string

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    password = data.get('password', '')
    if not password:
        return jsonify({"score": 0, "crack_time": "0 seconds", "feedback": ""})

    result = zxcvbn(password)
    return jsonify({
        "score": result['score'],
        "crack_time": result['crack_times_display']['offline_fast_hashing_1e10_per_second'],
        "feedback": result['feedback']['warning'] or "Strong password!"
    })

@app.route('/generate', methods=['GET'])
def generate():
    # Cryptographically secure character pool
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(16))
    return jsonify({"password": password})

if __name__ == '__main__':
    app.run(debug=True)