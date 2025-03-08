import anthropic  # type: ignore
from config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL, MAX_TOKENS, SYSTEM_PROMPT
from db import get_messages_by_conversation_id, add_message, init_db

init_db()

# Initialize Anthropic client
client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

print(f"MODEL BEING USED: {ANTHROPIC_MODEL}")


def generate_full_response(user_message, conversation_id):
    """
    Generate a response using the Anthropic API

    Args:
        user_message (str): The message from the user

    Returns:
        str: The assistant's response
    """

    add_message(conversation_id, "user", user_message)

    messages = get_messages_by_conversation_id(conversation_id)

    response = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=messages,
    )

    assistant_message = response.content[0].text

    add_message(conversation_id, "assistant", assistant_message)

    return assistant_message


def generate_response(user_message, conversation_id):
    """
    Generate a streaming response using the Anthropic API

    Args:
        user_message (str): The message from the user
        conversation_id (str): The conversation ID

    Returns:
        Generator that yields response chunks or error messages
    """
    try:
        add_message(conversation_id, "user", user_message)
        messages = get_messages_by_conversation_id(conversation_id)

        # Check if messages is properly formatted
        if not messages or not isinstance(messages, list) or len(messages) == 0:
            raise ValueError("No messages found for this conversation")

        # For accumulating the complete response
        full_response = ""

        # Stream the response
        with client.messages.stream(
            model=ANTHROPIC_MODEL,
            max_tokens=MAX_TOKENS,
            system=SYSTEM_PROMPT,
            messages=messages,
        ) as stream:
            for text in stream.text_stream:
                full_response += text
                # Yield each text chunk
                yield {"type": "chunk", "content": text}

        # After streaming is complete, save the full message
        add_message(conversation_id, "assistant", full_response)

    except Exception as e:
        # Log the error for debugging
        error_message = f"Error: {str(e)}"
        print(f"Streaming error occurred: {error_message}")

        # Yield the error message
        yield {"type": "error", "content": error_message}
