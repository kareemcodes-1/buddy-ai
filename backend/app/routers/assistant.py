from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime

from ..models.assistant import (
    AssistantCreate,
    AssistantUpdate,
    AssistantResponse,
)
from ..core.db import db

router = APIRouter(prefix="/assistants", tags=["Assistants"])


# ➡️ Create assistant (already done)
@router.post("/", response_model=AssistantResponse)
async def create_assistant(payload: AssistantCreate):
    user = await db.users.find_one({"_id": ObjectId(str(payload.user_id))})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = await db.assistants.find_one({
        "user_id": ObjectId(str(payload.user_id)),
        "name": payload.name
    })
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Assistant '{payload.name}' already exists for this user"
        )

    data = {
        "name": payload.name,
        "user_id": ObjectId(str(payload.user_id)),
        "role": payload.role,
        "description": payload.description,
        "instructions": payload.instructions,
        "created_at": datetime.utcnow(),
    }
    result = await db.assistants.insert_one(data)

    return AssistantResponse(
        id=str(result.inserted_id),
        user_id=str(payload.user_id),
        name=payload.name,
        role=payload.role,
        description=payload.description,
        instructions=payload.instructions,
        created_at=data["created_at"],
    )


# ➡️ Get ALL assistants
@router.get("/", response_model=list[AssistantResponse])
async def list_assistants():
    assistants = await db.assistants.find().to_list(None)
    for a in assistants:
        a["_id"] = str(a["_id"])
        a["user_id"] = str(a["user_id"])
    return assistants


# ➡️ Get ONE assistant
@router.get("/assistant/{assistant_id}", response_model=AssistantResponse)
async def get_assistant(assistant_id: str):
    assistant = await db.assistants.find_one({"_id": ObjectId(assistant_id)})
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    assistant["_id"] = str(assistant["_id"])
    assistant["user_id"] = str(assistant["user_id"])
    return assistant


# ➡️ UPDATE assistant
@router.put("/assistant/{assistant_id}", response_model=AssistantResponse)
async def update_assistant(assistant_id: str, data: AssistantUpdate):
    updates = data.dict(exclude_unset=True)
    result = await db.assistants.find_one_and_update(
        {"_id": ObjectId(assistant_id)},
        {"$set": updates},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Assistant not found")
    result["_id"] = str(result["_id"])
    result["user_id"] = str(result["user_id"])
    return result


# ➡️ DELETE assistant
@router.delete("/assistant/{assistant_id}", response_model=dict)
async def delete_assistant(assistant_id: str):
    res = await db.assistants.delete_one({"_id": ObjectId(assistant_id)})
    if not res.deleted_count:
        raise HTTPException(status_code=404, detail="Assistant not found")
    return {"status": "deleted"}

