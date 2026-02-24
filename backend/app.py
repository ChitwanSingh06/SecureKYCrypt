from flask import Flask
from routes.verify_routes import verify_bp

app = Flask(__name__)
app.register_blueprint(verify_bp)

if __name__ == "__main__":
    app.run(debug=True)