from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/health')
def health():
    return jsonify({"status": "healthy", "message": "Server is running!"})

@app.route('/api/test')
def test():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    print("Starting test server on port 5000...")
    app.run(debug=True, host='0.0.0.0', port=5000)