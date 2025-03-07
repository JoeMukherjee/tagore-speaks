from flask import Blueprint, request, jsonify  # type: ignore
from services.anthropic_service import generate_response

# Create a Blueprint for chat routes
chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/api/chat", methods=["POST"])
def chat():
    """Handle chat API endpoint"""
    data = request.json
    user_message = data.get("message", "")

    try:
        # Generate response using Anthropic service
        assistant_response = generate_response(user_message)
        return jsonify({"message": assistant_response})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"message": f"Sorry, there was an error: {str(e)}"}), 500
