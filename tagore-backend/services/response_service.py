import json
import logging
import traceback
from db import get_messages_by_conversation_id, add_message, add_tool_call, init_db
from services.anthropic_service import AnthropicService
from tools.tagore_tools import (
    LIST_WORKS_TOOL,
    GET_WORK_CONTENT_TOOL,
    list_works,
    get_work_content,
    format_works_response,
    format_work_content_response,
)

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# List of available tools (updated with the new tools)
TOOLS = [LIST_WORKS_TOOL, GET_WORK_CONTENT_TOOL]


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
        history_response = ""
        speakable_chunks = []

        for content_block in response.content:
            if content_block.type == "text":
                text_content = content_block.text
                full_response += text_content
                history_response += text_content
                speakable_chunks.append({"text": text_content, "speakable": True})
            elif content_block.type == "tool_use":
                # Process the tool call and capture the results
                for result in self._handle_tool_call(
                    content_block, conversation_id, user_message_id
                ):
                    if result["type"] == "chunk":
                        full_response += result["content"]
                        speakable_status = result.get("speakable", False)
                        if speakable_status:
                            speakable_chunks.append(
                                {
                                    "text": result["content"],
                                    "speakable": speakable_status,
                                }
                            )

                history_response += f"\n\n[Note: Used tool '{content_block.name}' to retrieve information]"

        # Save the complete response
        conversation_id, assistant_message_id = add_message(
            conversation_id, "assistant", history_response
        )

        logger.info(f"\n--- Complete assistant response ---")
        logger.info(
            f"Assistant (full): {full_response[:200]}..."
            if len(full_response) > 200
            else f"Assistant (full): {full_response}"
        )
        logger.info(
            f"Assistant (history): {history_response[:200]}..."
            if len(history_response) > 200
            else f"Assistant (history): {history_response}"
        )

        print(f"full_response: {full_response}")
        print(f"speakable_chunks: {speakable_chunks}")

        return full_response, speakable_chunks

    def _handle_tool_call(self, tool_use, conversation_id, user_message_id):
        """Handle a tool call"""
        tool_name = tool_use.name
        tool_params = tool_use.input

        # Updated map of tool names to their handler functions
        tool_handlers = {
            "list_works": self._handle_list_works,
            "get_work_content": self._handle_get_work_content,
        }

        try:
            if tool_name in tool_handlers:
                yield from tool_handlers[tool_name](
                    tool_use, conversation_id, user_message_id
                )
            else:
                # Handle unknown tool
                logger.error(f"Unknown tool '{tool_name}' called")
                yield {
                    "type": "chunk",
                    "content": f"\n\nI tried to use a tool that isn't available ({tool_name}). Please contact support.\n\n",
                }
        except Exception as e:
            logger.error(f"Error executing tool {tool_name}: {str(e)}")
            logger.error(traceback.format_exc())
            yield {
                "type": "chunk",
                "content": f"\n\nI encountered an error while trying to use the {tool_name} tool: {str(e)}\n\n",
            }

    def _handle_list_works(self, tool_use, conversation_id, user_message_id):
        """Handle the list_works tool"""
        tool_params = tool_use.input

        # Execute the tool
        tool_response = list_works(tool_params)

        logger.info(
            f"Tool Response (list_works): {json.dumps(tool_response, indent=2)}"
        )

        # Store the tool call
        tool_params_json = json.dumps(tool_params) if tool_params else "{}"
        tool_response_json = json.dumps(tool_response)

        add_tool_call(
            conversation_id,
            user_message_id,
            "list_works",
            tool_params_json,
            tool_response_json,
        )

        yield from format_works_response(tool_response)

    def _handle_get_work_content(self, tool_use, conversation_id, user_message_id):
        """Handle the get_work_content tool"""
        tool_params = tool_use.input

        # Execute the tool
        tool_response = get_work_content(tool_params)

        logger.info(
            f"Tool Response (get_work_content): {json.dumps(tool_response, indent=2)}"
        )

        # Store the tool call
        tool_params_json = json.dumps(tool_params) if tool_params else "{}"
        tool_response_json = json.dumps(tool_response)

        add_tool_call(
            conversation_id,
            user_message_id,
            "get_work_content",
            tool_params_json,
            tool_response_json,
        )

        yield from format_work_content_response(tool_response)
