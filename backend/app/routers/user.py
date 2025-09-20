from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from ..models.user import (
    User,           # your DB model (ODM / BaseModel)
    UserCreate,     # Pydantic model for creating a user
    UserUpdate,     # Pydantic model for updating a user
    UserResponse,   # Pydantic model for returning a user
    LoginRequest,   # Pydantic model for login payload
)
from ..core.db import db
from ..core.security import hash_password, verify_password, create_access_token


router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register", response_model=dict)
async def register(payload: UserCreate):
    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(payload.password)
    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hashed,
        created_at=datetime.utcnow().isoformat(),
    )
    result = await db.users.insert_one(user.dict(by_alias=True))

    # create JWT token
    token = create_access_token({"sub": str(result.inserted_id)})

    return {
        "id": str(result.inserted_id),
        "name": user.name,
        "email": user.email,
        "access_token": token,
        "token_type": "bearer",
    }



@router.post("/login", response_model=dict)
async def login(payload: LoginRequest):
    user = await db.users.find_one({"email": payload.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid password")

    token_expires = timedelta(minutes=60)
    token = create_access_token({"sub": str(user["_id"])}, expires_delta=token_expires)

    return {
        "access_token": token,
        "token_type": "bearer",
        "email": user["email"],
        "user_id": str(user["_id"]),
    }


@router.get("/", response_model=list[UserResponse])
async def list_users():
    users = await db.users.find().to_list(None)
    for u in users:
        u["_id"] = str(u["_id"])
    return users

# ➡ Read (one)
@router.get("/user/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(404, "User not found")
    user["_id"] = str(user["_id"])
    return user

# ➡ Update
@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, data: UserUpdate):
    updates = data.dict(exclude_unset=True)
    if "password" in updates:
        updates["hashed_password"] = hash_password(updates.pop("password"))
    result = await db.users.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": updates},
        return_document=True,
    )
    if not result:
        raise HTTPException(404, "User not found")
    result["_id"] = str(result["_id"])
    return result

# ➡ Delete
@router.delete("/users/{user_id}", response_model=dict)
async def delete_user(user_id: str):
    res = await db.users.delete_one({"_id": ObjectId(user_id)})
    if not res.deleted_count:
        raise HTTPException(404, "User not found")
    return {"status": "deleted"}
