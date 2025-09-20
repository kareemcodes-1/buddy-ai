from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from ..core.objectid import PyObjectId

class User(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")
    name: str
    email: EmailStr
    hashed_password: str
    created_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {PyObjectId: str}


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None 
    password: str | None = None
    
class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    email: EmailStr
    created_at: datetime

    class Config:
        populate_by_name = True

