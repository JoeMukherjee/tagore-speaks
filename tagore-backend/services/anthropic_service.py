import json
import traceback
import anthropic  # type: ignore
from config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL, MAX_TOKENS, SYSTEM_PROMPT
from db import (
    get_messages_by_conversation_id,
    add_message,
    add_tool_call,
    init_db,
)
from tools.tools import LIST_CREATIONS_TOOL, list_creations


# List of available tools
TOOLS = [LIST_CREATIONS_TOOL]

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
    Generate a streaming response using the Anthropic API with tool use support

    Args:
        user_message (str): The message from the user
        conversation_id (str): The conversation ID

    Returns:
        Generator that yields response chunks, tool calls, or error messages
    """
    try:
        # Add the user message and get the message ID
        conversation_id, user_message_id = add_message(
            conversation_id, "user", user_message
        )
        print(
            f"\n--- New user message in conversation_id {conversation_id} user_message_id {user_message_id} ---"
        )
        print(f"User: {user_message}")

        messages = get_messages_by_conversation_id(conversation_id)

        # Check if messages is properly formatted
        if not messages or not isinstance(messages, list) or len(messages) == 0:
            raise ValueError("No messages found for this conversation")

        # For accumulating the complete response
        full_response = ""

        print(f"Starting streaming response with model: {ANTHROPIC_MODEL}")
        print(f"Messages count: {len(messages)}")
        print(f"Tools enabled: {[tool['name'] for tool in TOOLS]}")

        # Stream the response with tools enabled
        with client.messages.stream(
            model=ANTHROPIC_MODEL,
            max_tokens=MAX_TOKENS,
            system=SYSTEM_PROMPT,
            messages=messages,
            tools=TOOLS,  # Add the tools parameter
        ) as stream:

            # Handle both text and tool calls in the stream
            for chunk in stream:
                print(
                    f"Chunk received - Type: {chunk.type}, Delta Type: {getattr(chunk, 'delta', None) and getattr(chunk.delta, 'type', 'N/A')}"
                )

                print(f"Chunk total: {chunk}")

                if (
                    chunk.type == "content_block_delta"
                    and chunk.delta.type == "text_delta"
                ):
                    text = chunk.delta.text
                    full_response += text
                    print(f"Received chunk: '{text}' (length: {len(text)})")

                    # Only log newlines and longer content to avoid excessive logging
                    if text.strip() or "\n" in text:
                        print(f"Yielding chunk to frontend: '{text}'")

                    yield {"type": "chunk", "content": text}

                elif (
                    chunk.type == "content_block_start"
                    and chunk.content_block.type == "tool_use"
                ):
                    # A tool call is being made
                    tool_use = chunk.content_block
                    tool_name = tool_use.name
                    tool_params = tool_use.input

                    print(f"\n=== TOOL CALL DETECTED ===")
                    print(f"Tool: {tool_name}")
                    print(f"Parameters: {json.dumps(tool_params, indent=2)}")

                    if tool_name == "list_creations":
                        # Execute the tool function
                        tool_response = list_creations(tool_params)

                        print(f"Tool Response: {json.dumps(tool_response, indent=2)}")

                        # Convert parameters and response to JSON strings for storage
                        tool_params_json = (
                            json.dumps(tool_params) if tool_params else "{}"
                        )
                        tool_response_json = json.dumps(tool_response)

                        # Record the tool call in the database
                        tool_call_id = add_tool_call(
                            conversation_id,
                            user_message_id,
                            tool_name,
                            tool_params_json,
                            tool_response_json,
                        )

                        # Format the beginning of the tool call as text
                        yield {
                            "type": "chunk",
                            "content": "\n\nHere are some of my creative works:\n\n",
                        }

                        # Handle the creations in natural language format
                        if "creations" in tool_response:
                            creations = tool_response["creations"]
                            count = tool_response["count"]
                            work_type = tool_response["type"]

                            if count == 0:
                                # No creations found
                                if work_type == "all":
                                    yield {
                                        "type": "chunk",
                                        "content": "You don't have any creative works saved yet.\n",
                                    }
                                else:
                                    yield {
                                        "type": "chunk",
                                        "content": f"You don't have any {work_type} works saved yet.\n",
                                    }
                            else:
                                # Yield each creation as a separate chunk in natural language
                                for i, creation in enumerate(creations, 1):
                                    title = creation.get("title", "Untitled")
                                    creation_type = creation.get("type", "work")
                                    date = creation.get("date_created", "")
                                    snippet = creation.get("snippet", "")

                                    creation_text = (
                                        f'{i}. "{title}" ({creation_type})' + "\n"
                                    )

                                    if snippet:
                                        creation_text += f'   "{snippet}..."\n'

                                    yield {
                                        "type": "chunk",
                                        "content": creation_text + "\n",
                                    }

                        # Handle error case
                        elif "error" in tool_response:
                            yield {
                                "type": "chunk",
                                "content": f"Sorry, I encountered an error while retrieving your creative works: {tool_response['error']}\n",
                            }

                        # Message if no creations file exists
                        elif "message" in tool_response:
                            yield {
                                "type": "chunk",
                                "content": f"{tool_response['message']}\n",
                            }

                        # Add a closing line
                        yield {
                            "type": "chunk",
                            "content": "Let me know if you'd like more details about any of these works.\n\n",
                        }

        print(f"\nStreaming completed")
        print(f"Accumulated response length: {len(full_response)}")
        print(f"First 50 chars: '{full_response[:50]}'")
        print(f"Last 50 chars: '{full_response[-50:] if full_response else ''}'")

        # After streaming is complete, save the full message
        conversation_id, assistant_message_id = add_message(
            conversation_id, "assistant", full_response
        )

        print(f"\n--- Complete assistant response ---")
        print(
            f"Assistant: {full_response[:200]}..."
            if len(full_response) > 200
            else f"Assistant: {full_response}"
        )
        print(
            f"--- End of response (conversation_id: {conversation_id}, message_id: {assistant_message_id}) ---\n"
        )

    except Exception as e:
        error_message = f"Error: {str(e)}"
        print(f"\n!!! STREAMING ERROR OCCURRED !!!")
        print(f"Error message: {error_message}")
        print(f"Traceback: {traceback.format_exc()}")

        # Yield the error message
        yield {"type": "error", "content": error_message}
