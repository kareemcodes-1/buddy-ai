from pydantic import BaseModel, Field
from datetime import datetime
from ..core.objectid import PyObjectId

class AssistantBase(BaseModel):
    name: str
    role: str
    description: str | None = None
    instructions: str

class AssistantCreate(AssistantBase):
    user_id: PyObjectId

class AssistantUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    description: str | None = None
    instructions: str | None = None

class AssistantResponse(AssistantBase):
    id: str = Field(..., alias="_id")
    user_id: str
    created_at: datetime

    class Config:
        populate_by_name = True


