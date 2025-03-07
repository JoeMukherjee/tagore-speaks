import anthropic  # type: ignore
from config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL, MAX_TOKENS, SYSTEM_PROMPT

# Initialize Anthropic client
client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def generate_response(user_message):
    """
    Generate a response using the Anthropic API

    Args:
        user_message (str): The message from the user

    Returns:
        str: The assistant's response
    """
    response = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    # Extract the assistant's response
    return response.content[0].text
