import sqlite3
import os
import uuid

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "tagore-data"))

DB_FILE = os.path.join(DB_DIR, "tagore_speaks_conversations.db")


def init_db():
    """Initialize the database and create tables if they don't exist"""

    os.makedirs(DB_DIR, exist_ok=True)

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """
    )

    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT,
        role TEXT,
        content TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id)
    )
    """
    )

    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS tool_calls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT,
        message_id INTEGER,
        tool_name TEXT,
        tool_parameters TEXT,
        tool_response TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id),
        FOREIGN KEY (message_id) REFERENCES messages (id)
    )
    """
    )

    conn.commit()
    conn.close()


def get_connection():
    """Get a database connection"""
    return sqlite3.connect(DB_FILE)


def get_messages_by_conversation_id(conversation_id):
    """
    Retrieve all messages for a specific conversation

    Args:
        conversation_id (str): The unique ID of the conversation

    Returns:
        list: List of message dictionaries with role and content
    """
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY timestamp",
        (conversation_id,),
    )

    messages = [
        {"role": row["role"], "content": row["content"]} for row in cursor.fetchall()
    ]

    conn.close()
    return messages


def add_message(conversation_id, role, content):
    """
    Add a new message to the database

    Args:
        conversation_id (str): The unique ID of the conversation
        role (str): The role of the message sender (user or assistant)
        content (str): The content of the message

    Returns:
        tuple: (conversation_id, message_id)
    """

    if conversation_id is None:
        conversation_id = str(uuid.uuid4())

    if role is None or content is None:
        raise ValueError("Role and content must be provided")

    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Check if conversation exists
        cursor.execute("SELECT id FROM conversations WHERE id = ?", (conversation_id,))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO conversations (id) VALUES (?)", (conversation_id,)
            )

        cursor.execute(
            "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
            (conversation_id, role, content),
        )

        message_id = cursor.lastrowid
        conn.commit()
    except sqlite3.Error as e:
        print(f"Database error: {str(e)}")
        conn.rollback()
        raise e
    finally:
        conn.close()

    return conversation_id, message_id


def add_tool_call(
    conversation_id, message_id, tool_name, tool_parameters, tool_response
):
    """
    Record a tool call in the database

    Args:
        conversation_id (str): The unique ID of the conversation
        message_id (int): The ID of the message that triggered the tool call
        tool_name (str): The name of the tool that was called
        tool_parameters (str): JSON string of parameters passed to the tool
        tool_response (str): JSON string of the response from the tool

    Returns:
        int: The ID of the inserted tool call record
    """
    if conversation_id is None or tool_name is None:
        raise ValueError("Conversation ID and tool name must be provided")

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO tool_calls 
            (conversation_id, message_id, tool_name, tool_parameters, tool_response) 
            VALUES (?, ?, ?, ?, ?)
            """,
            (conversation_id, message_id, tool_name, tool_parameters, tool_response),
        )

        conn.commit()
        tool_call_id = cursor.lastrowid
    except sqlite3.Error as e:
        print(f"Database error when adding tool call: {str(e)}")
        conn.rollback()
        raise e
    finally:
        conn.close()

    return tool_call_id


def get_last_message_id(conversation_id):
    """
    Get the ID of the most recent message in a conversation

    Args:
        conversation_id (str): The unique ID of the conversation

    Returns:
        int: The ID of the most recent message
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id FROM messages WHERE conversation_id = ? ORDER BY timestamp DESC LIMIT 1",
        (conversation_id,),
    )

    result = cursor.fetchone()
    conn.close()

    return result[0] if result else None


def get_tool_calls_by_conversation_id(conversation_id):
    """
    Retrieve all tool calls for a specific conversation

    Args:
        conversation_id (str): The unique ID of the conversation

    Returns:
        list: List of tool call dictionaries
    """
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, message_id, tool_name, tool_parameters, tool_response, timestamp 
        FROM tool_calls 
        WHERE conversation_id = ? 
        ORDER BY timestamp
        """,
        (conversation_id,),
    )

    tool_calls = [
        {
            "id": row["id"],
            "message_id": row["message_id"],
            "tool_name": row["tool_name"],
            "parameters": row["tool_parameters"],
            "response": row["tool_response"],
            "timestamp": row["timestamp"],
        }
        for row in cursor.fetchall()
    ]

    conn.close()
    return tool_calls
