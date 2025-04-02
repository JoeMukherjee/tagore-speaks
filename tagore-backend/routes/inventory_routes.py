import uuid
import logging
from flask import Blueprint, request, jsonify  # type: ignore
from services.inventory_service import InventoryService

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

inventory_bp = Blueprint("inventory", __name__)
inventory_service = InventoryService()

@inventory_bp.route("/api/inventory/query", methods=["POST"])
def inventory_query():
    """Process a natural language query for inventory management"""
    data = request.json
    user_message = data.get("message")
    conversation_id = data.get("conversationId")

    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        logger.info(f"Created new conversation ID: {conversation_id}")

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        response_text, speakable_chunks = inventory_service.process_inventory_query(
            user_message, conversation_id
        )
        return jsonify(
            {
                "response": response_text,
                "conversationId": conversation_id,
                "speakableChunks": speakable_chunks,
            }
        )
    except ValueError as ve:
        logger.error(f"Validation error in inventory_query: {str(ve)}")
        return jsonify({"error": str(ve), "conversationId": conversation_id}), 400
    except Exception as e:
        logger.error(f"Error in inventory_query: {str(e)}")
        return jsonify({"error": "An unexpected error occurred. Please try again later.", "conversationId": conversation_id}), 500

@inventory_bp.route("/api/inventory/initialize", methods=["POST"])
def initialize_inventory():
    """Initialize the inventory with sample data"""
    try:
        result = inventory_service.initialize_sample_inventory()
        
        return jsonify(
            {
                "success": result["success"],
                "message": result["message"],
                "itemsAdded": result["items_added"],
                "itemsFailed": result["items_failed"]
            }
        )
    except Exception as e:
        logger.error(f"Error initializing inventory: {str(e)}")
        return jsonify({"error": "An error occurred while initializing the inventory. Please try again later."}), 500

@inventory_bp.route("/api/inventory/items", methods=["GET"])
def list_inventory_items():
    """Get a list of inventory items with optional filtering"""
    try:
        # Extract query parameters
        category = request.args.get("category", "all")
        sort_by = request.args.get("sortBy")
        order = request.args.get("order", "ASC")
        min_price = request.args.get("minPrice")
        max_price = request.args.get("maxPrice")
        min_stock = request.args.get("minStock")
        max_stock = request.args.get("maxStock")
        
        # Build params dictionary
        params = {
            "category": category,
            "sort_by": sort_by,
            "order": order
        }
        
        # Add optional parameters if provided
        if min_price:
            params["min_price"] = float(min_price)
        if max_price:
            params["max_price"] = float(max_price)
        if min_stock:
            params["min_stock"] = int(min_stock)
        if max_stock:
            params["max_stock"] = int(max_stock)
        
        # Import the list_items function from inventory_tools
        from tools.inventory_tools import list_items
        
        # Get items
        result = list_items(params)
        
        if not result["success"]:
            return jsonify({"error": result["error"]}), 400
        
        return jsonify({
            "items": result["items"],
            "count": result["count"],
            "filters": result["filters"]
        })
    except ValueError as ve:
        logger.error(f"Validation error in list_inventory_items: {str(ve)}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Error in list_inventory_items: {str(e)}")
        return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500

@inventory_bp.route("/api/inventory/items/<int:item_id>", methods=["GET"])
def get_inventory_item(item_id):
    """Get details for a specific inventory item"""
    try:
        # Import the get_item function from inventory_tools
        from tools.inventory_tools import get_item
        
        # Get item details
        result = get_item({"item_id": item_id})
        
        if not result["success"]:
            return jsonify({"error": result["error"]}), 400
        
        if not result["found"]:
            return jsonify({"error": "Item not found"}), 404
        
        return jsonify({"item": result["item"]})
    except Exception as e:
        logger.error(f"Error in get_inventory_item: {str(e)}")
        return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500

@inventory_bp.route("/api/inventory/items", methods=["POST"])
def create_inventory_item():
    """Create a new inventory item"""
    try:
        data = request.json
        
        # Validate required fields
        if not data.get("name"):
            return jsonify({"error": "Item name is required"}), 400
        
        # Import the create_item function from inventory_tools
        from tools.inventory_tools import create_item
        
        # Create the item
        result = create_item(data)
        
        if not result["success"]:
            return jsonify({"error": result["error"]}), 400
        
        return jsonify({
            "success": True,
            "itemId": result["item_id"],
            "message": result["message"]
        }), 201
    except Exception as e:
        logger.error(f"Error in create_inventory_item: {str(e)}")
        return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500

@inventory_bp.route("/api/inventory/items/<int:item_id>", methods=["PUT"])
def update_inventory_item(item_id):
    """Update an existing inventory item"""
    try:
        data = request.json
        
        # Add item_id to the data
        data["item_id"] = item_id
        
        # Import the update_item function from inventory_tools
        from tools.inventory_tools import update_item
        
        # Update the item
        result = update_item(data)
        
        if not result["success"]:
            return jsonify({"error": result["error"]}), 400
        
        return jsonify({
            "success": True,
            "message": result["message"]
        })
    except Exception as e:
        logger.error(f"Error in update_inventory_item: {str(e)}")
        return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500

@inventory_bp.route("/api/inventory/items/<int:item_id>", methods=["DELETE"])
def delete_inventory_item(item_id):
    """Delete an inventory item"""
    try:
        # Not implemented in the tools yet, but could be added
        return jsonify({"error": "Delete operation not implemented"}), 501
    except Exception as e:
        logger.error(f"Error in delete_inventory_item: {str(e)}")
        return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500

@inventory_bp.route("/api/inventory/transactions", methods=["POST"])
def record_inventory_transaction():
    """Record a sale or purchase transaction"""
    try:
        data = request.json
        
        # Validate required fields
        if not (data.get("item_id") or data.get("item_name")):
            return jsonify({"error": "Either item_id or item_name is required"}), 400
        
        if not data.get("transaction_type") in ["sale", "purchase"]:
            return jsonify({"error": "Transaction type must be 'sale' or 'purchase'"}), 400
        
        # Import the record_transaction function from inventory_tools
        from tools.inventory_tools import record_transaction
        
        # Record the transaction
        result = record_transaction(data)
        
        if not result["success"]:
            return jsonify({"error": result["error"]}), 400
        
        return jsonify({
            "success": True,
            "message": result["message"],
            "transactionType": result["transaction_type"],
            "previousStock": result["previous_stock"],
            "newStock": result["new_stock"]
        })
    except Exception as e:
        logger.error(f"Error in record_inventory_transaction: {str(e)}")
        return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500

@inventory_bp.route("/api/inventory/analytics", methods=["GET"])
def get_inventory_analytics():
    """Get inventory analytics and insights"""
    try:
        # Extract query parameters
        category = request.args.get("category")
        period = request.args.get("period", "all")
        
        # Build params dictionary
        params = {}
        if category:
            params["category"] = category
        if period:
            params["period"] = period
        
        # Import the get_analytics function from inventory_tools
        from tools.inventory_tools import get_analytics
        
        # Get analytics
        result = get_analytics(params)
        
        if not result["success"]:
            return jsonify({"error": result["error"]}), 400
        
        return jsonify({"analytics": result["analytics"]})
    except Exception as e:
        logger.error(f"Error in get_inventory_analytics: {str(e)}")
        return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500 