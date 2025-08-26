from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/users", response_model=schemas.UserListResponse)
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_admin: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """List all users (admin only)"""
    query = db.query(models.User)
    total = query.count()
    users = query.offset(skip).limit(limit).all()
    return schemas.UserListResponse(users=users, total=total)

@router.post("/users", response_model=schemas.User)
async def create_user(
    user: schemas.UserCreate,
    current_admin: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new user (admin only)"""
    # Check if user already exists
    db_user = auth.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = auth.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        is_admin=user.is_admin,
        created_by=current_admin.id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/users/{user_id}", response_model=schemas.User)
async def get_user(
    user_id: int,
    current_admin: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Get a specific user (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/users/{user_id}", response_model=schemas.User)
async def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    current_admin: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Update a user (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admin from removing their own admin status
    if user_id == current_admin.id and user_update.is_admin == False:
        raise HTTPException(
            status_code=400, 
            detail="Cannot remove your own admin privileges"
        )
    
    # Update fields if provided
    if user_update.email is not None:
        # Check if email is already taken
        existing = auth.get_user_by_email(db, email=user_update.email)
        if existing and existing.id != user_id:
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = user_update.email
    
    if user_update.username is not None:
        # Check if username is already taken
        existing = auth.get_user_by_username(db, username=user_update.username)
        if existing and existing.id != user_id:
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = user_update.username
    
    if user_update.password is not None:
        user.hashed_password = auth.get_password_hash(user_update.password)
    
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    
    if user_update.is_admin is not None:
        user.is_admin = user_update.is_admin
    
    if user_update.credits is not None:
        user.credits = user_update.credits
    
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_admin: models.User = Depends(auth.get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a user (admin only)"""
    # Prevent admin from deleting themselves
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete your own account"
        )
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deleting the last admin
    if user.is_admin:
        admin_count = db.query(models.User).filter(models.User.is_admin == True).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete the last admin user"
            )
    
    db.delete(user)
    db.commit()
    
    return {"detail": "User deleted successfully"}

@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change own password (any authenticated user)"""
    # Verify current password
    if not auth.verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Incorrect current password"
        )
    
    # Update password
    current_user.hashed_password = auth.get_password_hash(new_password)
    db.commit()
    
    return {"detail": "Password changed successfully"}