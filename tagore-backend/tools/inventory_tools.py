import json
import os
import sqlite3
from typing import Dict, List, Optional, Union
import re

# Define the database path
DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "tagore-data"))
DB_PATH = os.path.join(DB_DIR, "inventory.db")

# Define tool schemas
LIST_ITEMS_TOOL = {
    "name": "list_items",
    "description": "Lists items in the inventory with support for filtering and sorting.",
    "input_schema": {
        "type": "object",
        "properties": {
            "category": {
                "type": "string",
                "description": "Category of items to list (e.g., 'books', 'merchandise', 'all')",
            },
            "sort_by": {
                "type": "string",
                "description": "Field to sort by (e.g., 'name', 'price', 'stock')",
                "enum": ["name", "price", "stock", "category"],
            },
            "order": {
                "type": "string",
                "description": "Sort order ('ASC' or 'DESC')",
                "enum": ["ASC", "DESC"],
                "default": "ASC",
            },
            "min_price": {
                "type": "number",
                "description": "Minimum price filter",
            },
            "max_price": {
                "type": "number",
                "description": "Maximum price filter",
            },
            "min_stock": {
                "type": "integer",
                "description": "Minimum stock filter",
            },
            "max_stock": {
                "type": "integer",
                "description": "Maximum stock filter",
            },
        },
        "required": [],
    },
}

GET_ITEM_DETAILS_TOOL = {
    "name": "get_item_details",
    "description": "Retrieves detailed information about a specific inventory item.",
    "input_schema": {
        "type": "object",
        "properties": {
            "item_id": {
                "type": "integer",
                "description": "ID of the item to retrieve",
            },
            "item_name": {
                "type": "string",
                "description": "Name of the item to retrieve",
            },
        },
        "required": [],
    },
}

CREATE_ITEM_TOOL = {
    "name": "create_item",
    "description": "Creates a new item in the inventory.",
    "input_schema": {
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "description": "Name of the item",
            },
            "category": {
                "type": "string",
                "description": "Category of the item",
                "default": "uncategorized",
            },
            "price": {
                "type": "number",
                "description": "Price of the item",
                "default": 0,
            },
            "stock": {
                "type": "integer",
                "description": "Stock quantity",
                "default": 0,
            },
            "description": {
                "type": "string",
                "description": "Optional description of the item",
                "default": "",
            },
        },
        "required": ["name"],
    },
}

UPDATE_ITEM_TOOL = {
    "name": "update_item",
    "description": "Updates an existing item in the inventory.",
    "input_schema": {
        "type": "object",
        "properties": {
            "item_id": {
                "type": "integer",
                "description": "ID of the item to update",
            },
            "item_name": {
                "type": "string",
                "description": "Name of the item to update (alternative to item_id)",
            },
            "name": {
                "type": "string",
                "description": "New name for the item",
            },
            "category": {
                "type": "string",
                "description": "New category for the item",
            },
            "price": {
                "type": "number",
                "description": "New price for the item",
            },
            "stock": {
                "type": "integer",
                "description": "New stock quantity",
            },
            "description": {
                "type": "string",
                "description": "New description for the item",
            },
        },
        "required": [],
    },
}

TRANSACTION_TOOL = {
    "name": "record_transaction",
    "description": "Records a sale or purchase transaction.",
    "input_schema": {
        "type": "object",
        "properties": {
            "item_id": {
                "type": "integer", 
                "description": "ID of the item",
            },
            "item_name": {
                "type": "string",
                "description": "Name of the item (alternative to item_id)",
            },
            "transaction_type": {
                "type": "string",
                "description": "Type of transaction ('sale' or 'purchase')",
                "enum": ["sale", "purchase"],
            },
            "quantity": {
                "type": "integer",
                "description": "Quantity of items in the transaction",
                "default": 1,
            },
        },
        "required": ["transaction_type"],
    },
}

def init_inventory_db():
    """Initialize the inventory database and tables"""
    
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create items table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        price REAL,
        stock INTEGER,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create transactions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER,
        transaction_type TEXT,
        quantity INTEGER,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items (id)
    )
    ''')
    
    conn.commit()
    conn.close()
    
    return {"success": True, "message": "Inventory database initialized"}

def get_connection():
    """Get a database connection"""
    return sqlite3.connect(DB_PATH)

def list_items(params: Optional[Dict] = None) -> Dict:
    """
    List items from the inventory with filtering and sorting options.
    
    Args:
        params (dict, optional): Parameters for filtering and sorting items
            - category (str): Category to filter by
            - sort_by (str): Field to sort by
            - order (str): Sort order ('ASC' or 'DESC')
            - min_price (float): Minimum price filter
            - max_price (float): Maximum price filter
            - min_stock (int): Minimum stock filter
            - max_stock (int): Maximum stock filter
            
    Returns:
        dict: A structured response containing the matching items
    """
    # Set defaults
    params = params or {}
    category = params.get("category", "all")
    sort_by = params.get("sort_by")
    order = params.get("order", "ASC")
    min_price = params.get("min_price")
    max_price = params.get("max_price")
    min_stock = params.get("min_stock")
    max_stock = params.get("max_stock")
    
    try:
        conn = get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Build the query
        query = "SELECT * FROM items"
        query_params = []
        conditions = []
        
        # Add filter conditions
        if category and category != "all":
            conditions.append("category = ?")
            query_params.append(category)
        
        if min_price is not None:
            conditions.append("price >= ?")
            query_params.append(float(min_price))
        
        if max_price is not None:
            conditions.append("price <= ?")
            query_params.append(float(max_price))
        
        if min_stock is not None:
            conditions.append("stock >= ?")
            query_params.append(int(min_stock))
        
        if max_stock is not None:
            conditions.append("stock <= ?")
            query_params.append(int(max_stock))
        
        # Add the WHERE clause if we have conditions
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        # Add sorting
        if sort_by in ["name", "price", "stock", "category"]:
            query += f" ORDER BY {sort_by} {order}"
        
        # Execute query
        cursor.execute(query, query_params)
        rows = cursor.fetchall()
        
        # Convert rows to dictionaries
        items = [dict(row) for row in rows]
        
        conn.close()
        return {
            "success": True,
            "items": items,
            "count": len(items),
            "filters": {
                "category": category,
                "min_price": min_price,
                "max_price": max_price,
                "min_stock": min_stock,
                "max_stock": max_stock
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_item(params: Dict) -> Dict:
    """
    Retrieve a specific item by ID or name.
    
    Args:
        params (dict): Parameters for retrieving the item
            - item_id (int): ID of the item to retrieve
            - item_name (str): Name of the item to retrieve
            
    Returns:
        dict: A structured response containing the item details
    """
    item_id = params.get("item_id")
    item_name = params.get("item_name")
    
    if not item_id and not item_name:
        return {"success": False, "error": "Either item_id or item_name must be provided"}
    
    try:
        conn = get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if item_id:
            cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,))
        else:
            cursor.execute("SELECT * FROM items WHERE name LIKE ?", (f"%{item_name}%",))
        
        row = cursor.fetchone()
        
        if not row:
            return {"success": True, "found": False, "message": "Item not found"}
        
        item = dict(row)
        
        conn.close()
        return {"success": True, "found": True, "item": item}
    except Exception as e:
        return {"success": False, "error": str(e)}

def create_item(params: Dict) -> Dict:
    """
    Create a new item in the inventory.
    
    Args:
        params (dict): Item details
            - name (str): Name of the item
            - category (str): Category of the item
            - price (float): Price of the item
            - stock (int): Stock quantity
            - description (str): Description of the item
            
    Returns:
        dict: A structured response indicating success or failure
    """
    name = params.get("name")
    category = params.get("category", "uncategorized")
    price = params.get("price", 0.0)
    stock = params.get("stock", 0)
    description = params.get("description", "")
    
    if not name:
        return {"success": False, "error": "Item name is required"}
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO items (name, category, price, stock, description) VALUES (?, ?, ?, ?, ?)",
            (name, category, price, stock, description)
        )
        
        item_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            "success": True, 
            "item_id": item_id,
            "message": f"Item '{name}' created successfully"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def update_item(params: Dict) -> Dict:
    """
    Update an existing item in the inventory.
    
    Args:
        params (dict): Update parameters
            - item_id (int): ID of the item to update
            - item_name (str): Name of the item to update (alternative to item_id)
            - name (str): New name for the item
            - category (str): New category for the item
            - price (float): New price for the item
            - stock (int): New stock quantity
            - description (str): New description for the item
            
    Returns:
        dict: A structured response indicating success or failure
    """
    item_id = params.get("item_id")
    item_name = params.get("item_name")
    
    if not item_id and not item_name:
        return {"success": False, "error": "Either item_id or item_name must be provided"}
    
    # Resolve item_id from name if name is provided
    if not item_id and item_name:
        get_result = get_item({"item_name": item_name})
        if get_result["success"] and get_result["found"]:
            item_id = get_result["item"]["id"]
        else:
            return {"success": False, "error": f"Item not found: {item_name}"}
    
    # Build update fields
    update_fields = {}
    if "name" in params:
        update_fields["name"] = params["name"]
    if "category" in params:
        update_fields["category"] = params["category"]
    if "price" in params:
        update_fields["price"] = float(params["price"])
    if "stock" in params:
        update_fields["stock"] = int(params["stock"])
    if "description" in params:
        update_fields["description"] = params["description"]
    
    if not update_fields:
        return {"success": False, "error": "No update fields provided"}
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Build the SET clause for the SQL update
        set_clause = ", ".join(f"{field} = ?" for field in update_fields)
        values = list(update_fields.values())
        values.append(item_id)  # For the WHERE clause
        
        cursor.execute(
            f"UPDATE items SET {set_clause} WHERE id = ?",
            values
        )
        
        if cursor.rowcount == 0:
            conn.close()
            return {"success": False, "error": f"Item with ID {item_id} not found"}
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": f"Item updated successfully"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def record_transaction(params: Dict) -> Dict:
    """
    Record a sale or purchase transaction.
    
    Args:
        params (dict): Transaction details
            - item_id (int): ID of the item
            - item_name (str): Name of the item (alternative to item_id)
            - transaction_type (str): Type of transaction ('sale' or 'purchase')
            - quantity (int): Quantity of items in the transaction
            
    Returns:
        dict: A structured response indicating success or failure
    """
    item_id = params.get("item_id")
    item_name = params.get("item_name")
    transaction_type = params.get("transaction_type", "sale")
    quantity = params.get("quantity", 1)
    
    if not item_id and not item_name:
        return {"success": False, "error": "Either item_id or item_name must be provided"}
    
    # Resolve item_id from name if name is provided
    if not item_id and item_name:
        get_result = get_item({"item_name": item_name})
        if get_result["success"] and get_result["found"]:
            item_id = get_result["item"]["id"]
        else:
            return {"success": False, "error": f"Item not found: {item_name}"}
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Get the current stock level
        cursor.execute("SELECT stock FROM items WHERE id = ?", (item_id,))
        result = cursor.fetchone()
        
        if not result:
            conn.close()
            return {"success": False, "error": f"Item with ID {item_id} not found"}
        
        current_stock = result[0]
        
        # Calculate new stock level
        if transaction_type == "sale":
            if current_stock < quantity:
                conn.close()
                return {"success": False, "error": f"Insufficient stock: {current_stock} available, {quantity} requested"}
            new_stock = current_stock - quantity
        else:  # purchase
            new_stock = current_stock + quantity
        
        # Update the stock level
        cursor.execute(
            "UPDATE items SET stock = ? WHERE id = ?",
            (new_stock, item_id)
        )
        
        # Record the transaction
        cursor.execute(
            "INSERT INTO transactions (item_id, transaction_type, quantity) VALUES (?, ?, ?)",
            (item_id, transaction_type, quantity)
        )
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "transaction_type": transaction_type,
            "previous_stock": current_stock,
            "new_stock": new_stock,
            "message": f"{transaction_type.capitalize()} of {quantity} item(s) recorded successfully"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_analytics(params: Optional[Dict] = None) -> Dict:
    """
    Generate inventory analytics.
    
    Args:
        params (dict, optional): Analytics parameters
            - category (str): Filter by category
            - period (str): Time period for transaction analysis
            
    Returns:
        dict: A structured response with analytics data
    """
    params = params or {}
    category = params.get("category")
    period = params.get("period", "all")
    
    try:
        conn = get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Build category filter
        category_filter = ""
        query_params = []
        if category:
            category_filter = "WHERE category = ?"
            query_params.append(category)
        
        # Calculate inventory value
        cursor.execute(
            f"SELECT SUM(price * stock) as total_value, COUNT(*) as item_count FROM items {category_filter}",
            query_params
        )
        result = cursor.fetchone()
        total_value = result["total_value"] or 0
        item_count = result["item_count"] or 0
        
        # Get top items by value
        cursor.execute(
            f"""
            SELECT id, name, category, price, stock, (price * stock) as value
            FROM items {category_filter}
            ORDER BY value DESC
            LIMIT 5
            """,
            query_params
        )
        top_items_by_value = [dict(row) for row in cursor.fetchall()]
        
        # Get items with low stock
        cursor.execute(
            f"""
            SELECT id, name, category, price, stock
            FROM items {category_filter}
            WHERE stock < 10
            ORDER BY stock ASC
            """,
            query_params
        )
        low_stock_items = [dict(row) for row in cursor.fetchall()]
        
        # Get recent transactions
        period_filter = ""
        if period == "day":
            period_filter = "WHERE DATE(transaction_date) = DATE('now')"
        elif period == "week":
            period_filter = "WHERE DATE(transaction_date) >= DATE('now', '-7 days')"
        elif period == "month":
            period_filter = "WHERE DATE(transaction_date) >= DATE('now', '-1 month')"
        
        cursor.execute(
            f"""
            SELECT t.id, t.item_id, i.name as item_name, t.transaction_type, t.quantity, t.transaction_date
            FROM transactions t
            JOIN items i ON t.item_id = i.id
            {period_filter}
            ORDER BY t.transaction_date DESC
            LIMIT 10
            """
        )
        recent_transactions = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            "success": True,
            "analytics": {
                "total_value": total_value,
                "item_count": item_count,
                "top_items_by_value": top_items_by_value,
                "low_stock_items": low_stock_items,
                "recent_transactions": recent_transactions
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def format_inventory_response(tool_response: Dict) -> List[Dict]:
    """Format inventory response for display"""
    chunks = []
    
    if not tool_response.get("success", False):
        chunks.append({
            "type": "chunk",
            "content": f"\n\nError: {tool_response.get('error', 'Unknown error')}\n\n",
            "speakable": True
        })
        return chunks
    
    # Format list_items response
    if "items" in tool_response:
        items = tool_response["items"]
        count = tool_response["count"]
        
        if count == 0:
            chunks.append({
                "type": "chunk",
                "content": "\n\nNo items found matching your criteria.\n\n",
                "speakable": True
            })
        else:
            intro = f"\n\nFound {count} items"
            
            # Add filter info if provided
            filters = tool_response.get("filters", {})
            if filters.get("category") and filters["category"] != "all":
                intro += f" in the '{filters['category']}' category"
            
            chunks.append({
                "type": "chunk",
                "content": f"{intro}:\n\n",
                "speakable": True
            })
            
            # Add each item
            for item in items:
                item_text = f"• {item['name']} - ${item['price']:.2f} - Stock: {item['stock']} - Category: {item['category']}\n"
                chunks.append({
                    "type": "chunk",
                    "content": item_text,
                    "speakable": True
                })
    
    # Format get_item response
    elif "item" in tool_response:
        if tool_response.get("found", False):
            item = tool_response["item"]
            item_details = f"\n\nItem Details:\n\n"
            item_details += f"Name: {item['name']}\n"
            item_details += f"Category: {item['category']}\n"
            item_details += f"Price: ${item['price']:.2f}\n"
            item_details += f"Stock: {item['stock']}\n"
            
            if item.get("description"):
                item_details += f"Description: {item['description']}\n"
            
            chunks.append({
                "type": "chunk",
                "content": item_details,
                "speakable": True
            })
        else:
            chunks.append({
                "type": "chunk",
                "content": f"\n\nItem not found.\n\n",
                "speakable": True
            })
    
    # Format create_item, update_item, or transaction response
    elif "message" in tool_response:
        chunks.append({
            "type": "chunk",
            "content": f"\n\n{tool_response['message']}\n\n",
            "speakable": True
        })
        
        # For transactions, add additional details
        if "transaction_type" in tool_response:
            transaction_details = f"Transaction Type: {tool_response['transaction_type'].capitalize()}\n"
            transaction_details += f"Previous Stock: {tool_response['previous_stock']}\n"
            transaction_details += f"New Stock: {tool_response['new_stock']}\n"
            
            chunks.append({
                "type": "chunk",
                "content": transaction_details,
                "speakable": True
            })
    
    # Format analytics response
    elif "analytics" in tool_response:
        analytics = tool_response["analytics"]
        
        analytics_text = f"\n\nInventory Analytics:\n\n"
        analytics_text += f"Total Inventory Value: ${analytics['total_value']:.2f}\n"
        analytics_text += f"Total Items: {analytics['item_count']}\n\n"
        
        chunks.append({
            "type": "chunk",
            "content": analytics_text,
            "speakable": True
        })
        
        if analytics.get("top_items_by_value"):
            chunks.append({
                "type": "chunk",
                "content": "Top Items by Value:\n",
                "speakable": True
            })
            
            for item in analytics["top_items_by_value"]:
                chunks.append({
                    "type": "chunk",
                    "content": f"• {item['name']} - ${item['value']:.2f} (Stock: {item['stock']})\n",
                    "speakable": True
                })
            
            chunks.append({"type": "chunk", "content": "\n", "speakable": False})
        
        if analytics.get("low_stock_items"):
            chunks.append({
                "type": "chunk",
                "content": "Items with Low Stock:\n",
                "speakable": True
            })
            
            for item in analytics["low_stock_items"]:
                chunks.append({
                    "type": "chunk",
                    "content": f"• {item['name']} - Stock: {item['stock']}\n",
                    "speakable": True
                })
            
            chunks.append({"type": "chunk", "content": "\n", "speakable": False})
    
    return chunks 