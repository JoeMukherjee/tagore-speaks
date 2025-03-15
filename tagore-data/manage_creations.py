import sqlite3
import os
import datetime
import argparse
import sys

# Define the database path
DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "tagore-data"))
DB_PATH = os.path.join(DB_DIR, "creations.db")

# Define the categories
CATEGORIES = ["poem", "short-stories", "essay", "non-fiction"]


def init_db():
    """Initialize the database with the schema and categories"""
    # Ensure the directory exists
    os.makedirs(DB_DIR, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create categories table
    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
    )
    """
    )

    # Create works table
    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS works (
        id INTEGER PRIMARY KEY,
        category_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        has_parts BOOLEAN DEFAULT 0,
        FOREIGN KEY (category_id) REFERENCES categories (id)
    )
    """
    )

    # Create work_parts table
    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS work_parts (
        id INTEGER PRIMARY KEY,
        work_id INTEGER NOT NULL,
        part_number INTEGER NOT NULL,
        content TEXT NOT NULL,
        FOREIGN KEY (work_id) REFERENCES works (id),
        UNIQUE (work_id, part_number)
    )
    """
    )

    # Add categories if they don't exist
    for category in CATEGORIES:
        cursor.execute(
            "INSERT OR IGNORE INTO categories (name) VALUES (?)", (category,)
        )

    conn.commit()
    conn.close()

    print(f"Database initialized at {DB_PATH}")


def add_work(category, title, content=None, has_parts=False):
    """
    Add a new work to the database

    Args:
        category (str): Category name (must be one of the predefined categories)
        title (str): Title of the work
        content (str, optional): Content of the work (if it doesn't have parts)
        has_parts (bool): Whether the work has multiple parts

    Returns:
        int: ID of the newly added work
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get category_id
    cursor.execute("SELECT id FROM categories WHERE name = ?", (category.lower(),))
    result = cursor.fetchone()
    if not result:
        conn.close()
        raise ValueError(
            f"Category '{category}' not found. Available categories: {', '.join(CATEGORIES)}"
        )

    category_id = result[0]

    # Add the work
    cursor.execute(
        "INSERT INTO works (category_id, title, has_parts) VALUES (?, ?, ?)",
        (category_id, title, has_parts),
    )

    work_id = cursor.lastrowid

    # If work doesn't have parts, add the content as a single part
    if not has_parts and content:
        cursor.execute(
            "INSERT INTO work_parts (work_id, part_number, content) VALUES (?, ?, ?)",
            (work_id, 1, content),
        )

    conn.commit()
    conn.close()

    return work_id


def add_work_part(work_id, part_number, content):
    """
    Add a part to an existing work

    Args:
        work_id (int): ID of the work
        part_number (int): Part number
        content (str): Content of the part

    Returns:
        int: ID of the newly added part
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if work exists
    cursor.execute("SELECT has_parts FROM works WHERE id = ?", (work_id,))
    result = cursor.fetchone()
    if not result:
        conn.close()
        raise ValueError(f"Work with ID {work_id} not found")

    has_parts = result[0]
    if not has_parts:
        # Update the work to have parts
        cursor.execute("UPDATE works SET has_parts = 1 WHERE id = ?", (work_id,))

    # Add the part
    try:
        cursor.execute(
            "INSERT INTO work_parts (work_id, part_number, content) VALUES (?, ?, ?)",
            (work_id, part_number, content),
        )
        part_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        # Part number already exists, update instead
        cursor.execute(
            "UPDATE work_parts SET content = ? WHERE work_id = ? AND part_number = ?",
            (content, work_id, part_number),
        )
        cursor.execute(
            "SELECT id FROM work_parts WHERE work_id = ? AND part_number = ?",
            (work_id, part_number),
        )
        part_id = cursor.fetchone()[0]

    conn.commit()
    conn.close()

    return part_id


def get_work(work_id=None, title=None):
    """
    Get a work by ID or title

    Args:
        work_id (int, optional): ID of the work
        title (str, optional): Title of the work

    Returns:
        dict: Work data including its parts
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    cursor = conn.cursor()

    if work_id:
        cursor.execute(
            """
            SELECT w.id, w.title, c.name as category, w.has_parts, w.date_created
            FROM works w
            JOIN categories c ON w.category_id = c.id
            WHERE w.id = ?
            """,
            (work_id,),
        )
    elif title:
        cursor.execute(
            """
            SELECT w.id, w.title, c.name as category, w.has_parts, w.date_created
            FROM works w
            JOIN categories c ON w.category_id = c.id
            WHERE w.title = ?
            """,
            (title,),
        )
    else:
        conn.close()
        raise ValueError("Either work_id or title must be provided")

    result = cursor.fetchone()
    if not result:
        conn.close()
        return None

    work = dict(result)

    # Get all parts
    cursor.execute(
        "SELECT part_number, content FROM work_parts WHERE work_id = ? ORDER BY part_number",
        (work["id"],),
    )

    parts = []
    for row in cursor.fetchall():
        parts.append({"part_number": row["part_number"], "content": row["content"]})

    work["parts"] = parts

    conn.close()

    return work


def list_works(category=None):
    """
    List all works, optionally filtered by category

    Args:
        category (str, optional): Category to filter by

    Returns:
        list: List of works
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = """
    SELECT w.id, w.title, c.name as category, w.has_parts, w.date_created
    FROM works w
    JOIN categories c ON w.category_id = c.id
    """

    params = ()
    if category:
        query += " WHERE c.name = ?"
        params = (category.lower(),)

    query += " ORDER BY w.date_created DESC"

    cursor.execute(query, params)

    works = []
    for row in cursor.fetchall():
        work = dict(row)

        # Get the first part content as a preview
        cursor.execute(
            "SELECT content FROM work_parts WHERE work_id = ? ORDER BY part_number LIMIT 1",
            (work["id"],),
        )

        preview = cursor.fetchone()
        if preview:
            # Truncate preview to 100 characters
            preview_text = preview["content"]
            if len(preview_text) > 100:
                preview_text = preview_text[:100] + "..."
            work["preview"] = preview_text
        else:
            work["preview"] = ""

        works.append(work)

    conn.close()

    return works


def interactive_add_work():
    """Interactive command-line interface to add a work"""
    print("=== Add a New Creative Work ===")

    # Show categories
    print("\nAvailable categories:")
    for i, category in enumerate(CATEGORIES, 1):
        print(f"{i}. {category}")

    # Get category
    while True:
        try:
            category_idx = int(input("\nEnter category number: ")) - 1
            if 0 <= category_idx < len(CATEGORIES):
                category = CATEGORIES[category_idx]
                break
            else:
                print(f"Please enter a number between 1 and {len(CATEGORIES)}")
        except ValueError:
            print("Please enter a valid number")

    # Get title
    title = input("\nEnter the title: ").strip()
    if not title:
        print("Title cannot be empty")
        return

    # Ask if work has parts
    has_parts = input("\nDoes this work have multiple parts? (y/n): ").lower() == "y"

    if has_parts:
        # Add work without content first
        work_id = add_work(category, title, has_parts=True)

        print(f"\nWork '{title}' added with ID {work_id}")

        # Add parts
        while True:
            try:
                part_number = int(input("\nEnter part number (or 0 to finish): "))
                if part_number == 0:
                    break

                print("\nEnter content (end with a line containing only '---'):")
                content_lines = []
                while True:
                    line = input()
                    if line == "---":
                        break
                    content_lines.append(line)

                content = "\n".join(content_lines)

                part_id = add_work_part(work_id, part_number, content)
                print(f"Part {part_number} added with ID {part_id}")
            except ValueError as e:
                print(f"Error: {e}")
    else:
        # Get content for a single-part work
        print("\nEnter content (end with a line containing only '---'):")
        content_lines = []
        while True:
            line = input()
            if line == "---":
                break
            content_lines.append(line)

        content = "\n".join(content_lines)

        # Add work with content
        work_id = add_work(category, title, content)
        print(f"\nWork '{title}' added with ID {work_id}")


def batch_add_parts(work_id):
    """Add multiple parts to a work in batch mode"""
    work = get_work(work_id=work_id)
    if not work:
        print(f"Work with ID {work_id} not found")
        return

    print(f"\nBatch adding parts to: '{work['title']}'")
    print("(Enter part number 0 to finish)")

    while True:
        try:
            part_number = int(input("\nEnter part number: "))
            if part_number == 0:
                print("Finished adding parts.")
                break

            # Check if part already exists
            existing_part = next(
                (p for p in work["parts"] if p["part_number"] == part_number), None
            )
            if existing_part:
                print(f"Warning: Part {part_number} already exists.")
                overwrite = input("Overwrite? (y/n): ").lower() == "y"
                if not overwrite:
                    continue

            print("\nEnter content (end with a line containing only '---'):")
            content_lines = []
            while True:
                line = input()
                if line == "---":
                    break
                content_lines.append(line)

            content = "\n".join(content_lines)

            # Add the part
            add_work_part(work_id, part_number, content)
            print(f"Part {part_number} added/updated successfully")

            # Refresh the work data
            work = get_work(work_id=work_id)

        except ValueError as e:
            print(f"Error: {e}")


def interactive_edit_work():
    """Interactive command-line interface to edit a work"""
    print("=== Edit an Existing Creative Work ===")

    # Get work ID
    try:
        work_id = int(input("\nEnter work ID to edit: "))
    except ValueError:
        print("Please enter a valid number")
        return

    # Get the work
    work = get_work(work_id=work_id)
    if not work:
        print(f"Work with ID {work_id} not found")
        return

    print(f"\nEditing: '{work['title']}' ({work['category']})")

    # Options menu
    print("\nWhat would you like to edit?")
    print("1. Title")
    print("2. Category")
    print("3. Content/parts")

    choice = input("\nEnter choice (1-3): ")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    if choice == "1":
        # Edit title
        new_title = input(f"\nCurrent title: {work['title']}\nNew title: ").strip()
        if new_title:
            cursor.execute(
                "UPDATE works SET title = ? WHERE id = ?", (new_title, work_id)
            )
            print(f"Title updated to '{new_title}'")
        else:
            print("Title unchanged")

    elif choice == "2":
        # Edit category
        print("\nAvailable categories:")
        for i, category in enumerate(CATEGORIES, 1):
            print(f"{i}. {category}")

        try:
            category_idx = int(input("\nEnter new category number: ")) - 1
            if 0 <= category_idx < len(CATEGORIES):
                new_category = CATEGORIES[category_idx]

                # Get category_id
                cursor.execute(
                    "SELECT id FROM categories WHERE name = ?", (new_category,)
                )
                category_id = cursor.fetchone()[0]

                cursor.execute(
                    "UPDATE works SET category_id = ? WHERE id = ?",
                    (category_id, work_id),
                )
                print(f"Category updated to '{new_category}'")
            else:
                print("Category unchanged")
        except ValueError:
            print("Invalid input, category unchanged")

    elif choice == "3":
        # Edit content/parts
        if work["has_parts"]:
            # Show available parts
            print("\nAvailable parts:")
            for part in work["parts"]:
                # Use splitlines() to avoid backslash issue
                first_line = (
                    part["content"].splitlines()[0][:30] if part["content"] else ""
                )
                print(f"{part['part_number']}. First line: {first_line}...")

            print("\nWhat would you like to do?")
            print("1. Edit an existing part")
            print("2. Add a single new part")
            print("3. Batch add multiple parts")

            subchoice = input("\nEnter choice (1-3): ")

            if subchoice == "1":
                # Edit existing part
                try:
                    part_num = int(input("\nEnter part number to edit: "))

                    # Find the part
                    part_to_edit = next(
                        (p for p in work["parts"] if p["part_number"] == part_num), None
                    )
                    if part_to_edit:
                        print("\nCurrent content:")
                        print(part_to_edit["content"])

                        print(
                            "\nEnter new content (end with a line containing only '---'):"
                        )
                        content_lines = []
                        while True:
                            line = input()
                            if line == "---":
                                break
                            content_lines.append(line)

                        content = "\n".join(content_lines)

                        # Update the part
                        cursor.execute(
                            "UPDATE work_parts SET content = ? WHERE work_id = ? AND part_number = ?",
                            (content, work_id, part_num),
                        )
                        print(f"Part {part_num} updated")
                    else:
                        print(f"Part {part_num} not found")
                except ValueError:
                    print("Invalid input")

            elif subchoice == "2":
                # Add new part
                try:
                    new_part_num = int(input("Enter new part number: "))

                    print("\nEnter content (end with a line containing only '---'):")
                    content_lines = []
                    while True:
                        line = input()
                        if line == "---":
                            break
                        content_lines.append(line)

                    content = "\n".join(content_lines)
                    add_work_part(work_id, new_part_num, content)
                    print(f"Part {new_part_num} added")
                except ValueError as e:
                    print(f"Error: {e}")

            elif subchoice == "3":
                # Call the batch add function
                conn.commit()  # Commit any changes before calling batch function
                conn.close()
                batch_add_parts(work_id)
                return  # Return immediately as we've closed the connection

            else:
                print("Invalid choice")

    conn.commit()
    conn.close()


def main():
    parser = argparse.ArgumentParser(description="Manage creative works database")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Init command
    init_parser = subparsers.add_parser("init", help="Initialize the database")

    # Add work command
    add_parser = subparsers.add_parser("add", help="Add a new work interactively")

    # Edit work command
    edit_parser = subparsers.add_parser("edit", help="Edit an existing work")

    # List works command
    list_parser = subparsers.add_parser("list", help="List all works")
    list_parser.add_argument("-c", "--category", help="Filter by category")

    # View work command
    view_parser = subparsers.add_parser("view", help="View a work")
    view_parser.add_argument("-i", "--id", type=int, help="Work ID")
    view_parser.add_argument("-t", "--title", help="Work title")

    args = parser.parse_args()

    if args.command == "init":
        init_db()
        print("Database initialized")
    elif args.command == "add":
        init_db()  # Ensure database exists
        interactive_add_work()
    elif args.command == "edit":
        init_db()  # Ensure database exists
        interactive_edit_work()
    elif args.command == "list":
        init_db()  # Ensure database exists
        works = list_works(args.category)

        if not works:
            if args.category:
                print(f"No works found in category '{args.category}'")
            else:
                print("No works found")
        else:
            print("\n=== Creative Works ===")
            for work in works:
                print(f"\nID: {work['id']}")
                print(f"Title: {work['title']}")
                print(f"Category: {work['category']}")
                print(f"Has parts: {'Yes' if work['has_parts'] else 'No'}")
                print(f"Created: {work['date_created']}")
                if work["preview"]:
                    print(f"Preview: {work['preview']}")
    elif args.command == "view":
        init_db()  # Ensure database exists

        if args.id:
            work = get_work(work_id=args.id)
        elif args.title:
            work = get_work(title=args.title)
        else:
            print("Error: Either --id or --title must be provided")
            return

        if not work:
            print("Work not found")
        else:
            print("\n=== Work Details ===")
            print(f"ID: {work['id']}")
            print(f"Title: {work['title']}")
            print(f"Category: {work['category']}")
            print(f"Created: {work['date_created']}")

            for part in work["parts"]:
                if len(work["parts"]) > 1:
                    print(f"\n--- Part {part['part_number']} ---")
                print(part["content"])
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
