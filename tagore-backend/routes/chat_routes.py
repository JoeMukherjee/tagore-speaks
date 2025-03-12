import uuid
from flask import Response, stream_with_context, Blueprint, request, jsonify  # type: ignore
from services.response_service import ResponseService
import json


# Create a Blueprint for chat routes
chat_bp = Blueprint("chat", __name__)
response_service = ResponseService()


@chat_bp.route("/api/chat", methods=["POST"])
def chat_message():
    data = request.json
    user_message = data.get("message")
    conversation_id = data.get("conversationId")

    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        print(f"Created new conversation ID: {conversation_id}")

    # Check if user_message is provided
    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        # Get the full response in one go
        response_text = response_service.generate_full_response(
            user_message, conversation_id
        )

        # Return the response as JSON
        return jsonify({"response": response_text, "conversationId": conversation_id})
    except Exception as e:
        print(f"Error in chat_message: {str(e)}")
        return jsonify({"error": str(e), "conversationId": conversation_id}), 500
