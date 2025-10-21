"""
User administration routes
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from database.connection import get_db
from database.models.user import User, UserStatus

router = APIRouter()


# Pydantic models for request/response
class UserUpdate(BaseModel):
    discord_username: Optional[str] = None
    server_nickname: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    discord_id: str
    discord_username: str
    server_nickname: Optional[str]
    email: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime

    class Config:
        from_attributes = True


# User administration endpoints
@router.get("/", response_model=List[UserResponse])
async def get_all_users(db: Session = Depends(get_db)):
    """Get all users"""
    users = db.query(User).all()
    # Convert UserStatus enum to string for response
    result = []
    for user in users:
        user_dict = {
            "id": user.id,
            "discord_id": user.discord_id,
            "discord_username": user.discord_username,
            "server_nickname": user.server_nickname,
            "email": user.email,
            "status": user.status.value,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "last_login_at": user.last_login_at,
        }
        result.append(user_dict)
    return result


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get a specific user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "discord_id": user.discord_id,
        "discord_username": user.discord_username,
        "server_nickname": user.server_nickname,
        "email": user.email,
        "status": user.status.value,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "last_login_at": user.last_login_at,
    }


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    """Update an existing user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_data.discord_username is not None:
        user.discord_username = user_data.discord_username
    
    if user_data.server_nickname is not None:
        user.server_nickname = user_data.server_nickname
    
    if user_data.email is not None:
        user.email = user_data.email
    
    if user_data.status is not None:
        try:
            user.status = UserStatus(user_data.status)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join([s.value for s in UserStatus])}"
            )
    
    db.commit()
    db.refresh(user)
    
    return {
        "id": user.id,
        "discord_id": user.discord_id,
        "discord_username": user.discord_username,
        "server_nickname": user.server_nickname,
        "email": user.email,
        "status": user.status.value,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "last_login_at": user.last_login_at,
    }


@router.delete("/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"success": True, "message": f"User {user_id} deleted successfully"}
