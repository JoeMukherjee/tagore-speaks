import json
import os
import random
import sqlite3
from typing import Dict, List, Optional, Union

# Define the database path - ensure it's consistent with manage_creations.py
DB_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "tagore-data", "tagore-data")
)
DB_PATH = os.path.join(DB_DIR, "creations.db")

# Define tool schemas
LIST_WORKS_TOOL = {
    "name": "list_works",
    "description": "Lists creative works by Tagore such as poems, short stories, essays, and non-fiction.",
    "input_schema": {
        "type": "object",
        "properties": {
            "category": {
                "type": "string",
                "description": "Category of works to list ('poem', 'short-stories', 'essay', 'non-fiction', or 'all')",
                "enum": ["poem", "short-stories", "essay", "non-fiction", "all"],
            },
            "random": {
                "type": "boolean",
                "description": "Whether to return random works or all works",
                "default": False,
            },
            "limit": {
                "type": "integer",
                "description": "Maximum number of works to return (for random selection)",
                "default": 5,
            },
        },
        "required": [],
    },
}

GET_WORK_CONTENT_TOOL = {
    "name": "get_work_content",
    "description": "Retrieves the content of a specific creative work by title.",
    "input_schema": {
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "Title of the work to retrieve content for",
            },
            "part_number": {
                "type": ["integer", "null"],
                "description": "Specific part number to retrieve (if not specified, defaults to first part unless whole_work is true)",
            },
            "whole_work": {
                "type": "boolean",
                "description": "Whether to retrieve the entire work with all parts. Set whole_work to true only if the user specifically requests for the whole content, otherwise set to false.",
                "default": False,
            },
            "fuzzy_match": {
                "type": "boolean",
                "description": "Whether to perform fuzzy matching on the title",
                "default": True,
            },
        },
        "required": ["title"],
    },
}


def list_works(params: Optional[Dict] = None) -> Dict:
    """
    List works from the database, with support for filtering, randomization, and limiting.

    Args:
        params (dict, optional): Parameters for filtering works
            - category (str): Category to filter by ('poem', 'short-stories', 'essay', 'non-fiction', 'all')
            - random (bool): Whether to return random works
            - limit (int): Maximum number of works to return when random=True

    Returns:
        dict: A structured response containing the requested works
    """
    # Set defaults
    params = params or {}
    category = params.get("category", "all")
    random_select = params.get("random", False)
    limit = params.get("limit", 5)

    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Build the query
        query = """
        SELECT w.id, w.title, c.name as category, w.has_parts, w.date_created
        FROM works w
        JOIN categories c ON w.category_id = c.id
        """

        query_params = ()
        if category != "all":
            query += " WHERE c.name = ?"
            query_params = (category,)

        # Get all matching works
        cursor.execute(query, query_params)
        rows = cursor.fetchall()

        # Convert rows to dictionaries
        works = [dict(row) for row in rows]

        # Handle randomization
        if random_select and works:
            # Randomly select up to 'limit' works
            selected_works = random.sample(works, min(limit, len(works)))
        else:
            selected_works = works

        # Format the response
        result = {
            "works": selected_works,
            "count": len(selected_works),
            "category": category,
            "randomized": random_select,
        }

        conn.close()
        return result

    except Exception as e:
        return {"error": str(e)}


def get_work_content(params: Dict) -> Dict:
    """
    Retrieve a specific work's content by title.

    Args:
        params (dict): Parameters for retrieving the work
            - title (str): Title of the work to retrieve
            - fuzzy_match (bool): Whether to perform fuzzy matching on the title
            - part_number (int, optional): Specific part number to retrieve
            - whole_work (bool): Whether to retrieve the entire work with all parts

    Returns:
        dict: A structured response containing the work and its content
    """
    title = params.get("title")
    fuzzy_match = params.get("fuzzy_match", True)
    part_number = params.get("part_number")
    whole_work = params.get("whole_work", False)

    if not title:
        return {"error": "Title is required"}

    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Try to find the work by exact title first
        cursor.execute(
            """
            SELECT w.id, w.title, c.name as category, w.has_parts, w.date_created
            FROM works w
            JOIN categories c ON w.category_id = c.id
            WHERE w.title = ?
            """,
            (title,),
        )

        work = cursor.fetchone()

        # If not found and fuzzy matching is enabled, try a LIKE search
        if work is None and fuzzy_match:
            cursor.execute(
                """
                SELECT w.id, w.title, c.name as category, w.has_parts, w.date_created
                FROM works w
                JOIN categories c ON w.category_id = c.id
                WHERE w.title LIKE ?
                ORDER BY length(w.title)  /* Prioritize shorter titles as more likely exact matches */
                LIMIT 1
                """,
                (f"%{title}%",),
            )
            work = cursor.fetchone()

        if work is None:
            conn.close()
            return {
                "found": False,
                "message": f"No work found with title '{title}'",
                "suggestions": get_title_suggestions(title) if fuzzy_match else [],
            }

        # Convert to dict
        work_dict = dict(work)

        cursor.execute(
            """
            SELECT part_number, content
            FROM work_parts
            WHERE work_id = ?
            ORDER BY part_number
            """,
            (work_dict["id"],),
        )

        all_parts = []
        for row in cursor.fetchall():
            all_parts.append(
                {"part_number": row["part_number"], "content": row["content"]}
            )

        # Handle the special cases for part selection
        selected_parts = []

        # Case 1: If title contains "Gitanjali" and no specific part is requested, return part 35
        if "gitanjali" in title.lower() and not part_number and not whole_work:
            for part in all_parts:
                if part["part_number"] == 35:
                    selected_parts = [part]
                    break
            # If part 35 was not found, fall back to the first part or all parts
            if not selected_parts and all_parts:
                selected_parts = [all_parts[0]]

        # Case 2: If a specific part number is requested
        elif part_number is not None:
            for part in all_parts:
                if part["part_number"] == part_number:
                    selected_parts = [part]
                    break
            # If requested part was not found, indicate this in the response
            if not selected_parts:
                return {
                    "found": True,
                    "work": work_dict,
                    "message": f"Part {part_number} not found for '{title}'",
                }

        # Case 3: Return all parts if whole_work is True
        elif whole_work:
            selected_parts = all_parts

        # Case 4: Default behavior - return only the first part
        elif all_parts:
            selected_parts = [all_parts[0]]

        work_dict["parts"] = selected_parts

        conn.close()

        return {"found": True, "work": work_dict}

    except Exception as e:
        return {"error": str(e)}


def get_title_suggestions(title: str, limit: int = 3) -> List[str]:
    """
    Get title suggestions for a failed search.

    Args:
        title (str): The search term
        limit (int): Maximum number of suggestions

    Returns:
        list: A list of suggested titles
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Get similar titles
        cursor.execute(
            """
            SELECT title
            FROM works
            WHERE title LIKE ?
            ORDER BY length(title)
            LIMIT ?
            """,
            (f"%{title}%", limit),
        )

        suggestions = [row[0] for row in cursor.fetchall()]
        conn.close()

        return suggestions

    except Exception:
        return []


def format_works_response(tool_response: Dict) -> List[Dict]:  # type: ignore
    """
    Format the list_works tool response for display

    Args:
        tool_response (dict): Response from the list_works function

    Returns:
        Generator yielding formatted chunks for display
    """
    # Header
    yield {"type": "chunk", "content": "\n\n", "speakable": False}

    work_to_print = ""

    # Handle the works
    if "works" in tool_response:
        works = tool_response["works"]
        count = tool_response["count"]
        category = tool_response["category"]

        if count == 0:
            # No works found
            if category == "all":
                yield {
                    "type": "chunk",
                    "content": "I couldn't find any creative works in the database.\n",
                    "speakable": True,
                }
            else:
                yield {
                    "type": "chunk",
                    "content": f"I couldn't find any {category} works in the database.\n",
                    "speakable": True,
                }
        else:
            if category == "all":
                # Show each work
                for i, work in enumerate(works, 1):
                    title = work.get("title", "Untitled")
                    if i == 0:
                        work_to_print = title
                    work_category = work.get("category", "unknown")

                    yield {
                        "type": "chunk",
                        "content": f'{i}. "{title}" ',
                        "speakable": False,
                    }
                    yield {
                        "type": "chunk",
                        "content": f"({work_category})\n",
                        "speakable": False,
                    }
            else:
                # Show each work
                for i, work in enumerate(works, 1):
                    title = work.get("title", "Untitled")
                    if i == 0:
                        work_to_print = title
                    work_category = work.get("category", "unknown")

                    yield {
                        "type": "chunk",
                        "content": f'{i}. "{title}."\n',
                        "speakable": False,
                    }

            # yield {
            #     "type": "chunk",
            #     "content": f"\nFound {count} works{' (randomly selected)' if tool_response.get('randomized') else ''}.\n",
            # }

    # Handle errors
    elif "error" in tool_response:
        yield {
            "type": "chunk",
            "content": f"Sorry, I encountered an error while retrieving the works: {tool_response['error']}.\n",
            "speakable": False,
        }

    # Closing line
    if work_to_print != "":
        yield {
            "type": "chunk",
            "content": f'\nYou can ask me to read any of these works by title, like "Please read {work_to_print}" or ask me for other works.\n',
            "speakable": True,
        }
        yield {
            "type": "chunk",
            "content": f"Or try clicking on a link above.\n",
            "speakable": True,
        }
    else:
        yield {
            "type": "chunk",
            "content": f"\nYou can ask me to read any of these or other works by title.\n",
            "speakable": True,
        }
        yield {
            "type": "chunk",
            "content": f"Or try clicking on a link above.\n",
            "speakable": True,
        }


def format_work_content_response(tool_response: Dict) -> List[Dict]:  # type: ignore
    """
    Format the get_work_content tool response for display

    Args:
        tool_response (dict): Response from the get_work_content function

    Returns:
        Generator yielding formatted chunks for display
    """
    if "error" in tool_response:
        yield {
            "type": "chunk",
            "content": f"\n\nSorry, I encountered an error: {tool_response['error']}\n",
            "speakable": False,
        }
        return

    if not tool_response.get("found", False):
        yield {
            "type": "chunk",
            "content": f"\n\n{tool_response.get('message', 'Work not found.')}\n",
            "speakable": False,
        }

        # Show suggestions if any
        suggestions = tool_response.get("suggestions", [])
        if suggestions:
            suggestion_text = ", ".join(f'"{s}"' for s in suggestions)
            yield {
                "type": "chunk",
                "content": f"You might be looking for: {suggestion_text}?\n",
                "speakable": True,
            }
        return

    # Work was found
    work = tool_response["work"]
    title = work["title"]
    category = work["category"]

    yield {
        "type": "chunk",
        "content": f"\n\n# {title}\n\n",
        "speakable": False,
    }

    parts = work.get("parts", [])
    if len(parts) > 1:
        # Multi-part work
        for part in parts:
            part_number = part["part_number"]
            content = part["content"]

            yield {
                "type": "chunk",
                "content": f"## Part {part_number}\n\n{content}\n\n",
                "speakable": False,
            }
    else:
        # Single-part work
        if parts:
            content = parts[0]["content"]
            yield {"type": "chunk", "content": f"{content}\n", "speakable": True}
        else:
            yield {
                "type": "chunk",
                "content": "This work has no content available.\n",
                "speakable": False,
            }


# Export the tools and functions for use in the ResponseService
__all__ = [
    "LIST_WORKS_TOOL",
    "GET_WORK_CONTENT_TOOL",
    "list_works",
    "get_work_content",
    "format_works_response",
    "format_work_content_response",
]
