import uuid
from flask import Blueprint, request, jsonify  # type: ignore
from services.anthropic_service import generate_response

# Create a Blueprint for chat routes
chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/api/chat", methods=["POST"])
def chat():
    """Handle chat API endpoint"""
    data = request.json
    user_message = data.get("message", "")
    conversation_id = data.get("conversationId")

    try:
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
        assistant_response = generate_response(user_message, conversation_id)
        return jsonify(
            {"message": assistant_response, "conversationId": conversation_id}
        )

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"message": f"Sorry, there was an error: {str(e)}"}), 500
