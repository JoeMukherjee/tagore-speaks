import sqlite3
import os
import uuid

DB_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "tagore-conv-db")
)

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
    """

    if conversation_id is None:
        conversation_id = str(uuid.uuid4())

    if role is None or content is None:
        raise ValueError("Role and content must be provided")

    conn = get_connection()
    cursor = conn.cursor()

    try:

        cursor.execute(
            "INSERT OR IGNORE INTO conversations (id) VALUES (?)", (conversation_id,)
        )

        cursor.execute(
            "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
            (conversation_id, role, content),
        )

        conn.commit()
    except sqlite3.Error as e:

        conn.rollback()
        raise e
    finally:
        conn.close()

    return conversation_id
