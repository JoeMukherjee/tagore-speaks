from flask import Flask  # type: ignore
from flask_cors import CORS  # type: ignore
from routes.chat_routes import chat_bp
from routes.inventory_routes import inventory_bp


def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    CORS(app, origins=["https://e39f-45-113-88-36.ngrok-free.app"])
   

    # Register blueprints
    app.register_blueprint(chat_bp)
    app.register_blueprint(inventory_bp)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
