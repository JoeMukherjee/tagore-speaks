import sqlite3
import os
import sys

# Define the database path - same as in your manage_creations.py
DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "tagore-data"))
DB_PATH = os.path.join(DB_DIR, "creations.db")


def cleanup_categories():
    """
    Clean up categories in the database:
    1. Delete the "short story" category (ID 2) and all works in that category
    2. Change "short-stories" ID to 2
    3. Keep essay as ID 3 and non-fiction as ID 4
    """
    print(f"Connecting to database at {DB_PATH}")

    if not os.path.exists(DB_PATH):
        print("Database file does not exist.")
        return

    conn = sqlite3.connect(DB_PATH)

    # First, let's check what we're working with
    cursor = conn.cursor()

    cursor.execute("SELECT id, name FROM categories ORDER BY id")
    categories = cursor.fetchall()

    print("\nCurrent categories:")
    for cat_id, name in categories:
        cursor.execute("SELECT COUNT(*) FROM works WHERE category_id = ?", (cat_id,))
        count = cursor.fetchone()[0]
        print(f"ID {cat_id}: {name} ({count} works)")

    # Check if short story (ID 2) exists
    cursor.execute("SELECT id FROM categories WHERE name = 'short story'")
    short_story_cat = cursor.fetchone()

    if not short_story_cat:
        print("\nThe 'short story' category doesn't exist.")
        conn.close()
        return

    short_story_id = short_story_cat[0]

    # Check if short-stories exists
    cursor.execute("SELECT id FROM categories WHERE name = 'short-stories'")
    short_stories_cat = cursor.fetchone()

    if not short_stories_cat:
        print("\nThe 'short-stories' category doesn't exist.")
        conn.close()
        return

    short_stories_id = short_stories_cat[0]

    print("\nStarting cleanup...")

    try:
        # Start a transaction
        conn.execute("BEGIN TRANSACTION")

        # Temporarily disable foreign key constraints
        cursor.execute("PRAGMA foreign_keys = OFF")
        print("Foreign key constraints temporarily disabled")

        # Step 1: Delete any works in the 'short story' category
        cursor.execute(
            "SELECT COUNT(*) FROM works WHERE category_id = ?", (short_story_id,)
        )
        work_count = cursor.fetchone()[0]
        print(f"Will delete {work_count} works from 'short story' category")

        cursor.execute(
            "SELECT id, title FROM works WHERE category_id = ?", (short_story_id,)
        )
        works_to_delete = cursor.fetchall()

        for work_id, title in works_to_delete:
            print(f"  - Deleting work: {title} (ID: {work_id})")

            # Delete work parts first
            cursor.execute("DELETE FROM work_parts WHERE work_id = ?", (work_id,))

            # Then delete the work
            cursor.execute("DELETE FROM works WHERE id = ?", (work_id,))

        # Step 2: Delete the 'short story' category
        cursor.execute("DELETE FROM categories WHERE id = ?", (short_story_id,))
        print(f"Deleted 'short story' category (ID: {short_story_id})")

        # Step 3: Update all works with category ID 5 to use category ID 2
        cursor.execute(
            "UPDATE works SET category_id = ? WHERE category_id = ?",
            (short_story_id, short_stories_id),
        )
        works_updated = cursor.rowcount
        print(
            f"Updated {works_updated} works from category ID {short_stories_id} to category ID {short_story_id}"
        )

        # Step 4: Save the name of the category for reuse
        short_stories_name = "short-stories"

        # Step 5: Delete the old 'short-stories' category with ID 5
        cursor.execute("DELETE FROM categories WHERE id = ?", (short_stories_id,))
        print(f"Deleted old 'short-stories' category with ID {short_stories_id}")

        # Step 6: Create a new category with ID 2 and name 'short-stories'
        cursor.execute(
            "INSERT INTO categories (id, name) VALUES (?, ?)",
            (short_story_id, short_stories_name),
        )
        print(f"Created new 'short-stories' category with ID {short_story_id}")

        # Re-enable foreign key constraints
        cursor.execute("PRAGMA foreign_keys = ON")

        # Step 7: Verify database integrity
        cursor.execute("PRAGMA integrity_check")
        integrity_result = cursor.fetchone()[0]

        if integrity_result != "ok":
            print(f"Database integrity check failed: {integrity_result}")
            raise ValueError("Database integrity check failed")
        else:
            print("Database integrity check passed")

        # Step 8: Verify the changes
        cursor.execute("SELECT id, name FROM categories ORDER BY id")
        new_categories = cursor.fetchall()

        print("\nNew category structure:")
        for cat_id, name in new_categories:
            cursor.execute(
                "SELECT COUNT(*) FROM works WHERE category_id = ?", (cat_id,)
            )
            count = cursor.fetchone()[0]
            print(f"ID {cat_id}: {name} ({count} works)")

        # Commit the transaction
        conn.commit()
        print("\nCleanup completed successfully.")

    except Exception as e:
        # If anything goes wrong, roll back the transaction
        conn.rollback()
        print(f"\nError occurred: {str(e)}")
        print("No changes were made to the database.")
    finally:
        conn.close()


if __name__ == "__main__":
    # Ask for confirmation
    print("WARNING: This script will reorganize your categories.")
    print("Make sure you have a backup of your database before proceeding.")

    confirm = input("\nDo you want to continue? (yes/no): ")

    if confirm.lower() == "yes":
        cleanup_categories()
    else:
        print("Operation cancelled.")
