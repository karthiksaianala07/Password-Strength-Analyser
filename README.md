# ShieldCheck | Minimalist Password Analyzer & Generator

A clean, robust, and distraction-free tool for analyzing password strength, information entropy, estimated brute-force crack times, and generating cryptographically secure passwords.

---

## ✨ Features

- **Minimalist Single-View Interface:** Everything you need in one focused, distraction-free dashboard.
- **Real-Time Strength Meter:** 5-level animated strength meter (Very Weak &rarr; Very Strong).
- **Core Cryptographic Metrics:**
  - **Crack Time:** Real-world fast-hash brute-force estimation (10 billion guesses/sec).
  - **Shannon Information Entropy:** Measured in bits ($E = L \times \log_2(R)$).
- **Live Requirements Checklist:** Instant visual feedback for Length (12+ chars), Uppercase, Lowercase, Numbers, and Symbols.
- **Built-In Secure Password Generator:**
  - Length slider (8–32 characters).
  - Character set toggles (`A-Z`, `a-z`, `0-9`, `!@#$`).
  - One-click copy and instant **"Test in Analyzer"** sync.
- **Zero Privacy Compromise:** All mathematical analysis happens in your browser and your local backend. Credentials are never logged or sent to third parties.

---

## 🚀 Running the Project

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Server
```bash
python app.py
```

### 3. Open in Browser
Visit **[http://127.0.0.1:5050](http://127.0.0.1:5050)**.

---

## 📁 Project Structure

```
ShieldCheck/
├── app.py                # Lightweight Flask backend (analysis & generation)
├── requirements.txt      # Python dependencies
├── templates/
│   └── index.html        # Minimalist single-card UI
├── static/
│   ├── style.css         # Clean dark theme stylesheet
│   └── script.js         # Instant client-side analysis & generator controller
└── README.md             # Documentation
```
