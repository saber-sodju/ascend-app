from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class UserBase(BaseModel):
    email: str
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    theme: Optional[str] = None
    target_weight: Optional[str] = None
    language: Optional[str] = None


class UserResponse(UserBase):
    id: uuid.UUID
    is_active: bool
    is_admin: bool
    theme: str
    language: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    new_password: Optional[str] = None


class AdminPasswordReset(BaseModel):
    new_password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
