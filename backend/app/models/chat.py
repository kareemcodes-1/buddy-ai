# app/schemas/chat.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal

class ChatBase(BaseModel):
    assistant_id: str
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1)

class ChatCreate(ChatBase):
    pass

class Chat(ChatBase):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True

