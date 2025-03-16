import uuid
import logging
import os
from flask import Response, stream_with_context, Blueprint, request, jsonify  # type: ignore
from services.response_service import ResponseService
import json

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

chat_bp = Blueprint("chat", __name__)
response_service = ResponseService()


@chat_bp.route("/api/chat", methods=["POST"])
def chat_message():
    data = request.json
    user_message = data.get("message")
    conversation_id = data.get("conversationId")

    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        logger.info(f"Created new conversation ID: {conversation_id}")

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        response_text, speakable_chunks = response_service.generate_full_response(
            user_message, conversation_id
        )
        return jsonify(
            {
                "response": response_text,
                "conversationId": conversation_id,
                "speakableChunks": speakable_chunks,
            }
        )
    except Exception as e:
        logger.info(f"Error in chat_message: {str(e)}")
        return jsonify({"error": str(e), "conversationId": conversation_id}), 500


@chat_bp.route("/api/cartesia-auth", methods=["GET"])
def get_cartesia_auth():
    try:
        api_key = os.environ.get("CARTESIA_API_KEY")

        if not api_key:
            return jsonify({"error": "Cartesia API key not configured"}), 500

        return jsonify(
            {
                "apiKey": api_key,
                "expiresAt": None,
            }
        )
    except Exception as e:
        logger.info(f"Error generating Cartesia auth: {str(e)}")
        return jsonify({"error": str(e)}), 500
