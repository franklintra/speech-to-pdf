#!/usr/bin/env python3
"""
Initialize database with default admin user
Run this script after setting up the backend to create the admin account
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app.models import User
from app.auth import get_password_hash

def init_database():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        
        if existing_admin:
            print("Admin user already exists!")
            return
        
        # Create default admin user with unlimited credits (-1)
        admin_user = User(
            email="admin@example.com",
            username="admin",
            hashed_password=get_password_hash("admin"),
            is_active=True,
            is_admin=True,
            credits=-1.0  # Admin has unlimited credits
        )
        
        db.add(admin_user)
        db.commit()
        
        print("✅ Database initialized successfully!")
        print("📝 Default admin credentials:")
        print("   Username: admin")
        print("   Password: admin")
        print("⚠️  Please change the admin password after first login!")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()