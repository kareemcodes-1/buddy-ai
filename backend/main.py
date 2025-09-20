from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
from dotenv import load_dotenv

# Routers
from app.routers import user
from app.routers import assistant
from app.routers import chat

load_dotenv()

app = FastAPI()

# ✅ list of origins that can call the API
origins = [
    os.getenv("FRONTEND_URL"),  # your React dev server
    os.getenv("FRONTEND_PATH"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # or ["*"] to allow all (not recommended in prod)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include your routers
app.include_router(assistant.router)
app.include_router(user.router)
app.include_router(chat.router)


# ---------------------------
# ▶️ Start the server directly
# ---------------------------
if __name__ == "__main__":
    import uvicorn

    # "main:app" = (file name without .py):(FastAPI instance)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
