
import os
from datetime import datetime
from typing import Literal, Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from bson import ObjectId

from google import genai
from google.genai import types

from ..core.db import db
from ..models.chat import Chat

router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    assistant_id: str
    message: str
    model: Literal["gemini-2.5-flash-lite", "gemini-2.0-pro"] = "gemini-2.5-flash-lite"


def _to_objectid(maybe_id: str) -> Any:
    """
    Convert a string id to ObjectId when possible, otherwise return original.
    This keeps compatibility with DBs that may store assistant_id as ObjectId.
    """
    if ObjectId.is_valid(maybe_id):
        return ObjectId(maybe_id)
    return maybe_id


def _extract_text_from_genai_result(result) -> str:
    """
    Try a few ways to pull text out of a genai response object (robust).
    """
    # direct property
    text = getattr(result, "text", None)
    if text:
        return text

    # newer/other shapes
    try:
        # genai might return .candidates -> each candidate has .content -> parts -> .text
        candidates = getattr(result, "candidates", None)
        if candidates and len(candidates) > 0:
            candidate = candidates[0]
            # candidate.content could be a list of Content (with parts)
            if getattr(candidate, "content", None):
                parts = candidate.content[0].parts
                return "".join(p.text for p in parts if getattr(p, "text", None))
    except Exception:
        pass

    try:
        outputs = getattr(result, "outputs", None)
        if outputs and len(outputs) > 0 and getattr(outputs[0], "content", None):
            parts = outputs[0].content[0].parts
            return "".join(p.text for p in parts if getattr(p, "text", None))
    except Exception:
        pass

    # fallback to stringifying result
    return str(result)


@router.post("", response_model=Chat)
async def chat_with_ai(payload: ChatRequest):
    """
    Send a user message to an assistant (fetched from DB by id), call Gemini,
    persist both the user message and assistant response to `chats` collection,
    and return the assistant message as a ChatSchema.
    """
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    assistant_lookup_id = _to_objectid(payload.assistant_id)
    assistant = await db["assistants"].find_one({"_id": assistant_lookup_id})
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")

    instructions = assistant.get("instructions", "You are a helpful AI.")
    prompt = f"{instructions}\n\nUser: {payload.message}"

    # Gemini client
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set")

    client = genai.Client(api_key=api_key)

    contents = [
        types.Content(role="user", parts=[types.Part.from_text(text=prompt)])
    ]
    cfg = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=0)
    )

    try:
        result = client.models.generate_content(
            model=payload.model, contents=contents, config=cfg
        )
        answer = _extract_text_from_genai_result(result) or "No response."
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {e}")

    now = datetime.utcnow()

    # Persist user message
    try:
        await db["chats"].insert_one(
            {
                "assistant_id": assistant_lookup_id,
                "role": "user",
                "content": payload.message,
                "created_at": now,
            }
        )
    except Exception:
        # don't block the main flow if the user message fails to persist;
        # but log/raise if you prefer stricter behavior
        pass

    # Persist assistant message and return it
    insert_res = await db["chats"].insert_one(
        {
            "assistant_id": assistant_lookup_id,
            "role": "assistant",
            "content": answer,
            "created_at": now,
        }
    )

    chat_doc = {
        "assistant_id": str(payload.assistant_id),
        "role": "assistant",
        "content": answer,
        "id": str(insert_res.inserted_id),
        "created_at": now,
    }

    return chat_doc


@router.get("/history/{assistant_id}", response_model=list[Chat])
async def get_chat_history(
    assistant_id: str, limit: int = Query(200, ge=1, le=1000)
):
    """
    Retrieve chat history for a given assistant (most recent first).
    """
    lookup_id = _to_objectid(assistant_id)

    cursor = db["chats"].find({"assistant_id": lookup_id}).sort("created_at", 1).limit(limit)
    docs = await cursor.to_list(length=limit)

    out = []
    for d in docs:
        out.append(
            {
                "assistant_id": str(d.get("assistant_id")) if d.get("assistant_id") else "",
                "role": d.get("role"),
                "content": d.get("content"),
                "id": str(d.get("_id")),
                "created_at": d.get("created_at"),
            }
        )

    return out
