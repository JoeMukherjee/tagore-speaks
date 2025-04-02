import json
import logging
import traceback
from db import add_message, add_tool_call, init_db
from services.anthropic_service import AnthropicService
from tools.inventory_tools import (
    LIST_ITEMS_TOOL,
    GET_ITEM_DETAILS_TOOL,
    CREATE_ITEM_TOOL,
    UPDATE_ITEM_TOOL,
    TRANSACTION_TOOL,
    init_inventory_db,
    list_items,
    get_item,
    create_item,
    update_item,
    record_transaction,
    get_analytics,
    format_inventory_response
)

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# List of available inventory tools
INVENTORY_TOOLS = [
    LIST_ITEMS_TOOL,
    GET_ITEM_DETAILS_TOOL,
    CREATE_ITEM_TOOL,
    UPDATE_ITEM_TOOL,
    TRANSACTION_TOOL
]

class InventoryService:
    def __init__(self):
        """Initialize the inventory service"""
        self.anthropic_service = AnthropicService()
        init_db()  # Ensure message database is initialized
        init_inventory_db()  # Initialize inventory database

    def process_inventory_query(self, user_message, conversation_id):
        """
        Process an inventory-related query using Claude API with tool support
        
        Args:
            user_message (str): The message from the user
            conversation_id (str): The conversation ID
            
        Returns:
            tuple: (response_text, speakable_chunks)
        """
        conversation_id, user_message_id = add_message(
            conversation_id, "user", user_message
        )
        logger.info(
            f"\n--- New inventory query in conversation_id {conversation_id} user_message_id {user_message_id} ---"
        )
        logger.info(f"User: {user_message}")
        
        # Create system prompt for inventory management
        system_prompt = """You are Tagore's Inventory Assistant, a helpful and knowledgeable assistant who helps manage a store's inventory.

You have access to the following tools to help manage inventory:
1. list_items - to list inventory items with filtering and sorting options
2. get_item_details - to get detailed information about a specific item
3. create_item - to add a new item to the inventory
4. update_item - to modify an existing item
5. record_transaction - to record sales or purchases

Always use the tools when appropriate to fulfill user requests about inventory.
For general questions or clarifications about inventory management, you can respond directly.
Be helpful, concise and professional.
"""
        
        # Create a simplified message array with just the current query
        # This helps focus Claude on the current task rather than conversation history
        messages = [
            {"role": "user", "content": user_message}
        ]
        
        # Call Claude with inventory tools
        response = self.anthropic_service.create_message(messages, INVENTORY_TOOLS)
        
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
                tool_results = self._handle_inventory_tool_call(
                    content_block, conversation_id, user_message_id
                )
                
                for result in tool_results:
                    full_response += result["content"]
                    if result.get("speakable", False):
                        speakable_chunks.append({
                            "text": result["content"],
                            "speakable": True
                        })
                
                history_response += f"\n\n[Note: Used tool '{content_block.name}' for inventory management]"
        
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
        
        return full_response, speakable_chunks
    
    def _handle_inventory_tool_call(self, tool_use, conversation_id, user_message_id):
        """Handle an inventory tool call and return the results"""
        tool_name = tool_use.name
        tool_params = tool_use.input
        
        # Map of tool names to their handler functions
        tool_handlers = {
            "list_items": self._handle_list_items,
            "get_item_details": self._handle_get_item_details,
            "create_item": self._handle_create_item,
            "update_item": self._handle_update_item,
            "record_transaction": self._handle_record_transaction
        }
        
        try:
            if tool_name in tool_handlers:
                return list(tool_handlers[tool_name](tool_use, conversation_id, user_message_id))
            else:
                # Handle unknown tool
                logger.error(f"Unknown inventory tool '{tool_name}' called")
                return [{
                    "type": "chunk",
                    "content": f"\n\nI tried to use an inventory tool that isn't available ({tool_name}). Please contact support.\n\n",
                    "speakable": True
                }]
        except Exception as e:
            logger.error(f"Error executing inventory tool {tool_name}: {str(e)}")
            logger.error(traceback.format_exc())
            return [{
                "type": "chunk",
                "content": f"\n\nI encountered an error while trying to use the {tool_name} tool: {str(e)}\n\n",
                "speakable": True
            }]
    
    def _handle_list_items(self, tool_use, conversation_id, user_message_id):
        """Handle the list_items tool"""
        tool_params = tool_use.input
        
        # Execute the tool
        tool_response = list_items(tool_params)
        
        logger.info(f"Tool Response (list_items): {json.dumps(tool_response, indent=2)[:500]}...")
        
        # Store the tool call
        tool_params_json = json.dumps(tool_params) if tool_params else "{}"
        tool_response_json = json.dumps(tool_response)
        
        add_tool_call(
            conversation_id,
            user_message_id,
            "list_items",
            tool_params_json,
            tool_response_json,
        )
        
        return format_inventory_response(tool_response)
    
    def _handle_get_item_details(self, tool_use, conversation_id, user_message_id):
        """Handle the get_item_details tool"""
        tool_params = tool_use.input
        
        # Execute the tool
        tool_response = get_item(tool_params)
        
        logger.info(f"Tool Response (get_item_details): {json.dumps(tool_response, indent=2)}")
        
        # Store the tool call
        tool_params_json = json.dumps(tool_params) if tool_params else "{}"
        tool_response_json = json.dumps(tool_response)
        
        add_tool_call(
            conversation_id,
            user_message_id,
            "get_item_details",
            tool_params_json,
            tool_response_json,
        )
        
        return format_inventory_response(tool_response)
    
    def _handle_create_item(self, tool_use, conversation_id, user_message_id):
        """Handle the create_item tool"""
        tool_params = tool_use.input
        
        # Execute the tool
        tool_response = create_item(tool_params)
        
        logger.info(f"Tool Response (create_item): {json.dumps(tool_response, indent=2)}")
        
        # Store the tool call
        tool_params_json = json.dumps(tool_params) if tool_params else "{}"
        tool_response_json = json.dumps(tool_response)
        
        add_tool_call(
            conversation_id,
            user_message_id,
            "create_item",
            tool_params_json,
            tool_response_json,
        )
        
        return format_inventory_response(tool_response)
    
    def _handle_update_item(self, tool_use, conversation_id, user_message_id):
        """Handle the update_item tool"""
        tool_params = tool_use.input
        
        # Execute the tool
        tool_response = update_item(tool_params)
        
        logger.info(f"Tool Response (update_item): {json.dumps(tool_response, indent=2)}")
        
        # Store the tool call
        tool_params_json = json.dumps(tool_params) if tool_params else "{}"
        tool_response_json = json.dumps(tool_response)
        
        add_tool_call(
            conversation_id,
            user_message_id,
            "update_item",
            tool_params_json,
            tool_response_json,
        )
        
        return format_inventory_response(tool_response)
    
    def _handle_record_transaction(self, tool_use, conversation_id, user_message_id):
        """Handle the record_transaction tool"""
        tool_params = tool_use.input
        
        # Execute the tool
        tool_response = record_transaction(tool_params)
        
        logger.info(f"Tool Response (record_transaction): {json.dumps(tool_response, indent=2)}")
        
        # Store the tool call
        tool_params_json = json.dumps(tool_params) if tool_params else "{}"
        tool_response_json = json.dumps(tool_response)
        
        add_tool_call(
            conversation_id,
            user_message_id,
            "record_transaction",
            tool_params_json,
            tool_response_json,
        )
        
        return format_inventory_response(tool_response)
    
    def initialize_sample_inventory(self):
        """Initialize a sample inventory with some basic items"""
        sample_items = [
            {"name": "Collected Poems of Tagore", "category": "books", "price": 24.99, "stock": 15, "description": "Complete collection of Rabindranath Tagore's poems"},
            {"name": "Gitanjali", "category": "books", "price": 12.99, "stock": 30, "description": "Song offerings by Rabindranath Tagore"},
            {"name": "The Home and the World", "category": "books", "price": 14.99, "stock": 20, "description": "Novel by Rabindranath Tagore"},
            {"name": "Tagore Portrait T-Shirt", "category": "clothing", "price": 19.99, "stock": 50, "description": "T-shirt with Tagore's portrait"},
            {"name": "Tagore Quote Mug", "category": "merchandise", "price": 9.99, "stock": 35, "description": "Coffee mug with famous Tagore quotes"},
            {"name": "Handcrafted Bengali Pen", "category": "stationery", "price": 7.99, "stock": 40, "description": "Traditional Bengali-style handcrafted pen"},
            {"name": "Tagore's Music CD", "category": "music", "price": 15.99, "stock": 25, "description": "CD featuring Rabindra Sangeet"},
            {"name": "Santiniketan Art Print", "category": "art", "price": 29.99, "stock": 10, "description": "Art print inspired by Tagore's Santiniketan style"}
        ]
        
        results = []
        for item in sample_items:
            result = create_item(item)
            results.append(result)
            if not result["success"]:
                logger.error(f"Failed to add sample item {item['name']}: {result['error']}")
        
        # Record a few sample transactions
        record_transaction({"item_name": "Gitanjali", "transaction_type": "sale", "quantity": 5})
        record_transaction({"item_name": "Tagore Quote Mug", "transaction_type": "sale", "quantity": 3})
        record_transaction({"item_name": "Collected Poems of Tagore", "transaction_type": "purchase", "quantity": 10})
        
        return {
            "success": True,
            "items_added": len([r for r in results if r["success"]]),
            "items_failed": len([r for r in results if not r["success"]]),
            "message": "Sample inventory initialized"
        } 