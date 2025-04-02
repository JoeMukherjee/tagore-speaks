import sqlite3
import os
from collections import defaultdict

def print_database_schema_tree(db_path):
    """
    Print the schema tree of all tables in a SQLite database
    
    Args:
        db_path: Path to the SQLite database file
    """
    # Check if file exists
    if not os.path.isfile(db_path):
        print(f"Error: Database file '{db_path}' not found.")
        return
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # List all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        if not tables:
            print("No tables found in the database.")
            conn.close()
            return
        
        print("\n📁 DATABASE SCHEMA TREE")
        print("====================")
        
        # Get foreign key information
        fk_relationships = defaultdict(list)
        for table in tables:
            table_name = table[0]
            cursor.execute(f"PRAGMA foreign_key_list({table_name})")
            foreign_keys = cursor.fetchall()
            for fk in foreign_keys:
                from_col = fk[3]
                to_table = fk[2]
                to_col = fk[4]
                fk_relationships[table_name].append((from_col, to_table, to_col))
        
        # Process all tables
        for table in tables:
            table_name = table[0]
            
            # Get table schema
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            
            # Get primary keys
            primary_keys = [col[1] for col in columns if col[5] == 1]  # col[5] is pk flag
            
            # Print table name
            print(f"\n📋 TABLE: {table_name}")
            
            # Print primary keys
            if primary_keys:
                print(f"  🔑 PRIMARY KEY(S): {', '.join(primary_keys)}")
            
            # Print columns
            print("  📊 COLUMNS:")
            for col in columns:
                col_name = col[1]
                col_type = col[2]
                not_null = "NOT NULL" if col[3] == 1 else "NULL"
                default = f"DEFAULT {col[4]}" if col[4] is not None else ""
                print(f"    • {col_name} ({col_type}) {not_null} {default}")
            
            # Print foreign keys
            if table_name in fk_relationships:
                print("  🔗 FOREIGN KEYS:")
                for from_col, to_table, to_col in fk_relationships[table_name]:
                    print(f"    • {from_col} → {to_table}({to_col})")
        
        # Get indexes
        print("\n📑 INDEXES:")
        cursor.execute("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%';")
        indexes = cursor.fetchall()
        
        for index in indexes:
            index_name, table_name, sql = index
            print(f"  • {index_name} on {table_name}: {sql}")
        
        conn.close()
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    db_path = r"tagore-data\tagore-data\creations.db"
    print_database_schema_tree(db_path)