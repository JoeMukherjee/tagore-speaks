import json
import logging
import traceback
from db import get_messages_by_conversation_id, add_message, add_tool_call, init_db
from services.anthropic_service import AnthropicService
from tools.tools import LIST_CREATIONS_TOOL, list_creations, format_creations_response

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# List of available tools
TOOLS = [LIST_CREATIONS_TOOL]


class ResponseService:
    def __init__(self):
        """Initialize the response service"""
        self.anthropic_service = AnthropicService()
        init_db()

    def generate_full_response(self, user_message, conversation_id):
        """
        Generate a full response using the Anthropic API with tool support

        Args:
            user_message (str): The message from the user
            conversation_id (str): The conversation ID

        Returns:
            str: The assistant's response
        """
        conversation_id, user_message_id = add_message(
            conversation_id, "user", user_message
        )
        logger.info(
            f"\n--- New user message in conversation_id {conversation_id} user_message_id {user_message_id} ---"
        )
        logger.info(f"User: {user_message}")

        messages = get_messages_by_conversation_id(conversation_id)

        # Validate messages
        if not messages or not isinstance(messages, list) or len(messages) == 0:
            raise ValueError("No messages found for this conversation")

        model = self.anthropic_service.model
        logger.info(f"Starting full response with model: {model}")
        logger.info(f"Messages count: {len(messages)}")
        logger.info(f"Tools enabled: {[tool['name'] for tool in TOOLS]}")

        # Pass TOOLS to create_message
        response = self.anthropic_service.create_message(messages, TOOLS)

        # Process the response and handle any tool calls
        full_response = ""
        for content_block in response.content:
            if content_block.type == "text":
                full_response += content_block.text
            elif content_block.type == "tool_use":
                # Process the tool call and capture the results
                for result in self._handle_tool_call(
                    content_block, conversation_id, user_message_id
                ):
                    if result["type"] == "chunk":
                        full_response += result["content"]

        # Save the complete response
        conversation_id, assistant_message_id = add_message(
            conversation_id, "assistant", full_response
        )

        logger.info(f"\n--- Complete assistant response ---")
        logger.info(
            f"Assistant: {full_response[:200]}..."
            if len(full_response) > 200
            else f"Assistant: {full_response}"
        )
        logger.info(
            f"--- End of response (conversation_id: {conversation_id}, message_id: {assistant_message_id}) ---\n"
        )

        return full_response

    def _handle_tool_call(self, tool_use, conversation_id, user_message_id):
        """Handle a tool call"""
        tool_name = tool_use.name
        tool_params = tool_use.input

        # Map of tool names to their handler functions
        tool_handlers = {"list_creations": self._handle_list_creations}

        try:
            if tool_name in tool_handlers:
                yield from tool_handlers[tool_name](
                    tool_use, conversation_id, user_message_id
                )
            else:
                # Handle unknown tool
                logger.info(f"Warning: Unknown tool '{tool_name}' called")
                yield {
                    "type": "chunk",
                    "content": f"\n\nI tried to use a tool that isn't available ({tool_name}). Please contact support.\n\n",
                }
        except Exception as e:
            logger.info(f"Error executing tool {tool_name}: {str(e)}")
            logger.info(traceback.format_exc())
            yield {
                "type": "chunk",
                "content": f"\n\nI encountered an error while trying to use the {tool_name} tool: {str(e)}\n\n",
            }

    def _handle_list_creations(self, tool_use, conversation_id, user_message_id):
        """Handle the list_creations tool"""
        tool_params = tool_use.input

        # Execute the tool
        tool_response = list_creations(tool_params)

        logger.info(f"Tool Response: {json.dumps(tool_response, indent=2)}")

        # Store the tool call
        tool_params_json = json.dumps(tool_params) if tool_params else "{}"
        tool_response_json = json.dumps(tool_response)

        add_tool_call(
            conversation_id,
            user_message_id,
            "list_creations",
            tool_params_json,
            tool_response_json,
        )

        yield from format_creations_response(tool_response)
