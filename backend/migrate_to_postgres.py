import os
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

# Get the Postgres connection string from Fly.io
# Run: fly ssh console -a speech-to-pdf-api -C "printenv DATABASE_URL"
# Then set it here or as an environment variable
POSTGRES_URL = input("Paste the DATABASE_URL from Fly.io: ").strip()

# Local SQLite database
SQLITE_DB = "app.db"

def migrate_data():
    # Connect to SQLite
    sqlite_conn = sqlite3.connect(SQLITE_DB)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()
    
    # Connect to PostgreSQL
    pg_conn = psycopg2.connect(POSTGRES_URL)
    pg_cursor = pg_conn.cursor()
    
    try:
        # Migrate users
        print("Migrating users...")
        sqlite_cursor.execute("SELECT * FROM users")
        users = sqlite_cursor.fetchall()
        
        for user in users:
            pg_cursor.execute("""
                INSERT INTO users (id, email, username, hashed_password, is_active, is_admin, credits, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    email = EXCLUDED.email,
                    username = EXCLUDED.username,
                    hashed_password = EXCLUDED.hashed_password,
                    is_active = EXCLUDED.is_active,
                    is_admin = EXCLUDED.is_admin,
                    credits = EXCLUDED.credits,
                    created_at = EXCLUDED.created_at
            """, (
                user['id'],
                user['email'],
                user['username'],
                user['hashed_password'],
                bool(user['is_active']),
                bool(user['is_admin']),
                user['credits'],
                user['created_at'] or datetime.now().isoformat()
            ))
        print(f"  Migrated {len(users)} users")
        
        # Migrate conversions
        print("Migrating conversions...")
        sqlite_cursor.execute("SELECT * FROM conversions")
        conversions = sqlite_cursor.fetchall()
        
        for conv in conversions:
            pg_cursor.execute("""
                INSERT INTO conversions (
                    id, user_id, original_filename, display_name, unique_filename,
                    transcription, created_at, status, language, duration_seconds
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    user_id = EXCLUDED.user_id,
                    original_filename = EXCLUDED.original_filename,
                    display_name = EXCLUDED.display_name,
                    unique_filename = EXCLUDED.unique_filename,
                    transcription = EXCLUDED.transcription,
                    created_at = EXCLUDED.created_at,
                    status = EXCLUDED.status,
                    language = EXCLUDED.language,
                    duration_seconds = EXCLUDED.duration_seconds
            """, (
                conv['id'],
                conv['user_id'],
                conv['original_filename'],
                conv['display_name'],
                conv['unique_filename'],
                conv['transcription'],
                conv['created_at'] or datetime.now().isoformat(),
                conv['status'],
                conv['language'],
                conv['duration_seconds']
            ))
        print(f"  Migrated {len(conversions)} conversions")
        
        # Reset sequences for PostgreSQL
        pg_cursor.execute("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))")
        pg_cursor.execute("SELECT setval('conversions_id_seq', (SELECT MAX(id) FROM conversions))")
        
        # Commit changes
        pg_conn.commit()
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        pg_conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        sqlite_conn.close()
        pg_conn.close()

if __name__ == "__main__":
    print("This script will migrate your local SQLite database to the Fly.io Postgres database.")
    print("\nFirst, get the DATABASE_URL from Fly.io by running:")
    print("  fly ssh console -a speech-to-pdf-api -C 'printenv DATABASE_URL'\n")
    migrate_data()