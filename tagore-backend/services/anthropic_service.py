import anthropic  # type: ignore
from config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL, MAX_TOKENS, SYSTEM_PROMPT
from db import get_messages_by_conversation_id, add_message, init_db

init_db()

# Initialize Anthropic client
client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def generate_response(user_message, conversation_id):
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
