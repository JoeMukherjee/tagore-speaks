import json
import os


DB_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "tagore-data")
)

CREATIONS_FILE = os.path.join(DB_DIR, "creations.json")

# Tool definition
LIST_CREATIONS_TOOL = {
    "name": "list_creations",
    "description": "Lists user's creative works such as poems, short stories, and novels from a stored file.",
    "input_schema": {
        "type": "object",
        "properties": {
            "type": {
                "type": "string",
                "description": "Type of creative work to list (e.g., 'poem', 'story', 'novel', or 'all')",
            }
        },
        "required": [],
    },
}


def list_creations(params=None):
    """
    List user's creative works from a stored file.

    Args:
        params (dict, optional): Parameters for filtering works (e.g., by type)

    Returns:
        dict: A structured response containing the requested creations
    """
    # Default to 'all' if no type is specified
    work_type = params.get("type", "all").lower() if params else "all"

    try:
        # Try to read from your creations file
        try:
            with open(CREATIONS_FILE, "r") as f:
                creations = json.load(f)
        except FileNotFoundError:
            # Return an empty list if the file doesn't exist
            return {
                "creations": [],
                "count": 0,
                "type": work_type,
                "message": "No creations file found. Please create some content first.",
            }

        # Filter by type if requested
        if work_type != "all":
            filtered_creations = [
                item for item in creations if item.get("type", "").lower() == work_type
            ]
        else:
            filtered_creations = creations

        return {
            "creations": filtered_creations,
            "count": len(filtered_creations),
            "type": work_type,
        }
    except Exception as e:
        return {"error": str(e)}


def format_creations_response(tool_response):
    """
    Format the creations tool response for display

    Args:
        tool_response (dict): The response from list_creations function

    Returns:
        Generator yielding formatted chunks for display
    """
    # Header
    yield {
        "type": "chunk",
        "content": "\n\nHere are some of my creative works:\n\n",
    }

    # Handle the creations
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
            # Show each creation
            for i, creation in enumerate(creations, 1):
                title = creation.get("title", "Untitled")
                creation_type = creation.get("type", "work")
                snippet = creation.get("snippet", "")

                creation_text = f'{i}. "{title}" ({creation_type})' + "\n"

                if snippet:
                    creation_text += f'   "{snippet}..."\n'

                yield {
                    "type": "chunk",
                    "content": creation_text + "\n",
                }

    # Handle errors
    elif "error" in tool_response:
        yield {
            "type": "chunk",
            "content": f"Sorry, I encountered an error while retrieving your creative works: {tool_response['error']}\n",
        }

    # Handle messages
    elif "message" in tool_response:
        yield {
            "type": "chunk",
            "content": f"{tool_response['message']}\n",
        }

    # Closing line
    yield {
        "type": "chunk",
        "content": "Let me know if you'd like more details about any of these works.\n\n",
    }
