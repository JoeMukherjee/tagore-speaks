import json
import os


DB_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "tagore-conv-db")
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
