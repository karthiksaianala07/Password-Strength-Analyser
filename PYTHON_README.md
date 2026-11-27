# Backend Architecture & Code Walkthrough: `app.py`

This document provides a comprehensive technical breakdown of [`app.py`](file:///d:/ShieldCheck/app.py), the Flask-powered backend driving the **ShieldCheck** Password Analyzer & Generator platform.

---

## 📋 Table of Contents
1. [Overview](#1-overview)
2. [Imports & Dependency Resilience](#2-imports--dependency-resilience)
3. [Helper Functions](#3-helper-functions)
   - [`format_crack_time(seconds)`](#format_crack_timeseconds)
   - [`analyze_password(password)`](#analyze_passwordpassword)
   - [`generate_password(...)`](#generate_password)
4. [Flask API Routes](#4-flask-api-routes)
   - [`GET /`](#get-)
   - [`POST /analyze`](#post-analyze)
   - [`GET` / `POST /generate`](#get--post-generate)
5. [Server Startup & Port Configuration](#5-server-startup--port-configuration)
6. [Data Flow Diagram](#6-data-flow-diagram)

---

## 1. Overview

`app.py` serves as the central API and calculation backend for ShieldCheck. It performs two primary roles:
- **Cryptographic & Heuristic Password Analysis:** Evaluates character pool sizes, computes theoretical Shannon entropy in bits, detects vulnerabilities, and estimates brute-force crack times across modern hardware threat models.
- **Cryptographically Secure Password Generation:** Leverages Python's `secrets` module (CSPRNG) to generate high-entropy passwords with configurable length and character sets.

---

## 2. Imports & Dependency Resilience

```python
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
```

### Key Modules Used:
- **`secrets`:** Python's standard library module for generating cryptographically strong random numbers suitable for managing sensitive data like passwords. Unlike `random`, `secrets` is backed by OS-level cryptographic entropy (`/dev/urandom` or `CryptGenRandom`).
- **`math`:** Provides `math.log2()` used to calculate information entropy in bits.
- **`re`:** Regular expressions to classify character sets (uppercase, lowercase, numbers, special characters).
- **`Flask`:** The WSGI web framework providing HTTP request routing, template rendering, and JSON responses.

### 🛡️ Dependency Fault Tolerance:
The backend wraps the import of `zxcvbn` inside a `try...except ImportError` block. If `zxcvbn` is not installed or encounters an issue, the application **does not crash**; instead, it automatically falls back to an integrated mathematical entropy and heuristic estimation engine.

---

## 3. Helper Functions

### `format_crack_time(seconds: float) -> str`

Converts raw floating-point second values into clean, human-readable time durations across multiple orders of magnitude.

#### Logic & Scaling:
- **Sub-millisecond:** `Instant (< 1 ms)`
- **Milliseconds:** `X ms` (when $< 1$ s)
- **Seconds:** `X.X seconds` (when $< 60$ s)
- **Minutes, Hours, Days, Months:** Dynamically scaled using standard divisors ($60$, $3600$, $86400$, etc.).
- **Years to Trillions of Years:** Formats large astronomical numbers gracefully (`4.2 million years`, `1.5 billion years`, `12.0 trillion years`).

---

### `analyze_password(password: str) -> dict`

The analytical engine that performs comprehensive security and mathematical inspection on any given password.

#### Step 1: Input Validation & Edge Case Handling
If `len(password) == 0`, it immediately returns a structured `empty` state, zeroing out metrics and marking all checklist items as unfulfilled.

#### Step 2: Character Pool Size ($R$)
The function evaluates the active character sets using regular expressions:
- Lowercase (`a-z`): $+26$ characters
- Uppercase (`A-Z`): $+26$ characters
- Digits (`0-9`): $+10$ characters
- Special Symbols: $+33$ characters

$$\text{Pool Size } R = \sum \text{active set sizes} \quad (\text{maximum } 95)$$

#### Step 3: Information Entropy ($E$)
Shannon Entropy is computed in bits:
$$E = L \times \log_2(R)$$
*(where $L$ is password length and $R$ is character pool size).*

#### Step 4: Scoring & Threat-Model Crack Time
- **Primary Engine (`zxcvbn`):** When available, evaluates dictionary patterns, spatial keyboard walks (`qwerty`), repetitions, and leetspeak substitutions. It extracts:
  - `score`: integer from $0$ (Very Weak) to $4$ (Very Strong).
  - `crack_times_display`: specifically the `offline_fast_hashing_1e10_per_second` threat model (representing an attacker utilizing a modern high-end GPU cluster running $10^{10}$ hashes/second).
  - `feedback`: specific warnings or improvement suggestions.
- **Mathematical Fallback:** If `zxcvbn` is not active, the function calculates crack time using combinatorial probability:
  $$\text{Expected Guesses} = \frac{R^L}{2}$$
  $$\text{Time in Seconds} = \frac{\text{Expected Guesses}}{10^{10} \text{ guesses/sec}}$$

#### Step 5: Return Structure
Returns a JSON-serializable dictionary:
```json
{
  "score": 3,
  "score_label": "Strong",
  "score_class": "strong",
  "entropy_bits": 68.4,
  "crack_time": "12.4 years",
  "feedback": "Strong password!",
  "checklist": {
    "length": true,
    "upper": true,
    "lower": true,
    "digits": true,
    "symbols": true
  }
}
```

---

### `generate_password(length=16, use_upper=True, use_lower=True, use_digits=True, use_symbols=True) -> str`

Generates cryptographically random passwords tailored to user-specified constraints.

#### Algorithm Breakdown:
1. **Guaranteed Character Inclusion:** For each selected character set (uppercase, lowercase, numbers, symbols), it immediately picks one random character using `secrets.choice()` to ensure no selected category is omitted by random chance.
2. **Remaining Pool Selection:** The remaining characters needed ($L - \text{guaranteed}$) are randomly drawn from the composite pool.
3. **Cryptographic In-Place Shuffle (Fisher-Yates):** To prevent guaranteed characters from consistently appearing at the start of the password, it applies a cryptographic Fisher-Yates shuffle utilizing `secrets.randbelow()`:
   ```python
   for i in range(len(chars) - 1, 0, -1):
       j = secrets.randbelow(i + 1)
       chars[i], chars[j] = chars[j], chars[i]
   ```

---

## 4. Flask API Routes

### `GET /`
- **Function:** `index()`
- **Purpose:** Serves the frontend application entry point via `render_template('index.html')`.

---

### `POST /analyze`
- **Function:** `analyze()`
- **Content-Type:** `application/json`
- **Request Body:**
  ```json
  {
    "password": "UserEnteredPassword123!"
  }
  ```
- **Response:** JSON payload output from `analyze_password()`.

---

### `GET` / `POST /generate`
- **Function:** `generate()`
- **Accepted Methods:** Supports both `GET` (query string parameters) and `POST` (JSON body) for flexible API consumption.
- **Parameters:**
  | Parameter | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `length` | `int` | `16` | Password length (clamped between 6 and 64) |
  | `uppercase`| `bool`| `true` | Include uppercase letters (`A-Z`) |
  | `lowercase`| `bool`| `true` | Include lowercase letters (`a-z`) |
  | `digits` | `bool`| `true` | Include numeric digits (`0-9`) |
  | `symbols` | `bool`| `true` | Include special symbols (`!@#$%^&*...`) |
- **Response:**
  ```json
  {
    "password": "k9#mQ!7xL$2kP9wZ",
    "analysis": {
      "score": 4,
      "score_label": "Very Strong",
      "entropy_bits": 95.2,
      "crack_time": "3.2 million years",
      ...
    }
  }
  ```

---

## 5. Server Startup & Port Configuration

```python
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    print(f"\n=======================================================")
    print(f" ShieldCheck is running at: http://127.0.0.1:{port}")
    print(f"=======================================================\n")
    app.run(debug=True, host='127.0.0.1', port=port)
```

### Windows & Environment Optimization:
- **Port Selection (`5050`):** Default port 5000 is often reserved by Windows NAT (`winnat`) or Hyper-V container services (WSAEACCES socket permission error). Using port `5050` guarantees conflict-free binding.
- **Localhost Isolation (`127.0.0.1`):** Binding to `127.0.0.1` avoids Windows firewall warnings and administrative permission prompts while maintaining local privacy.
- **Dynamic Override:** The port can be customized dynamically using the `PORT` environment variable:
  ```powershell
  $env:PORT="8080"; python app.py
  ```

---

## 6. Data Flow Diagram

```
+--------------------------------------------------------+
|                      Browser / UI                      |
+--------------------------------------------------------+
       |                                        ^
       | 1. POST /analyze { password }          |
       |    or POST /generate { options }       | 4. Returns JSON
       v                                        |
+--------------------------------------------------------+
|                     Flask (app.py)                     |
|  - parse request JSON                                  |
|  - route handling                                      |
+--------------------------------------------------------+
       |                                        |
       v                                        v
+-----------------------------+  +-------------------------------+
|    analyze_password()       |  |     generate_password()       |
| - Regex character classification|  | - CSPRNG via `secrets`        |
| - Pool size calculation (R) |  | - Guaranteed character checks |
| - Shannon Entropy: L*log2(R)|  | - Cryptographic Fisher-Yates  |
| - zxcvbn / Heuristic engine |  +-------------------------------+
| - format_crack_time()       |
+-----------------------------+
```
