from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
from dotenv import load_dotenv
import pickle
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import numpy as np
from pathlib import Path
import os
import requests
from dotenv import load_dotenv
import re

load_dotenv() 

app = FastAPI()


FRONTEND_URL = os.getenv("FRONTEND_URL")
FRONTEND_PATH = os.getenv("FRONTEND_PATH")

origins = [
    FRONTEND_URL,
    FRONTEND_PATH
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

NOTION_API_KEY = os.getenv("NOTION_API_KEY")
NOTION_PAGE_ID = os.getenv("NOTION_PAGE_ID")
NOTION_API_URL = f"https://api.notion.com/v1/blocks/{NOTION_PAGE_ID}/children"

NOTION_HEADERS = {
    "Authorization": f"Bearer {NOTION_API_KEY}",
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28"
}

class TodoPayload(BaseModel):
    content: str
    section: str

@app.post("/api/notion/create")
def create_todo(payload: TodoPayload):
    import re

    def extract_task_text(full_text: str) -> str:
        text = full_text.strip()
        pattern = r"""^
            (create|add|put|remind\sme)      # verbs/phrases
            (\s+a)?                         # optional ' a'
            \s+to[\s-]?do                  # 'to do', 'to-do', 'todo' with optional space or hyphen
            (\s+for\sme)?                  # optional ' for me'
            (\s+(today|tomorrow))?         # optional ' today' or ' tomorrow'
            (\s+to)?                      # optional trailing ' to'
            \s*                           # trailing spaces
        """

        cleaned_text = re.sub(pattern, "", text, flags=re.IGNORECASE | re.VERBOSE).strip()
        return cleaned_text

    def fetch_children(block_id):
        url = f"https://api.notion.com/v1/blocks/{block_id}/children"
        res = requests.get(url, headers=NOTION_HEADERS)
        if res.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Could not fetch children for block {block_id}")
        return res.json().get("results", [])

    def find_toggle_heading(block_id, heading_text):
        children = fetch_children(block_id)
        for block in children:
            block_type = block["type"]
            if block_type in ["heading_1", "heading_2", "heading_3"]:
                heading_data = block[block_type]
                text_content = "".join(
                    t["plain_text"] for t in heading_data["rich_text"]
                ).strip().upper()
                if text_content == heading_text.upper() and heading_data.get("is_toggleable"):
                    return block["id"]
            if block.get("has_children"):
                found = find_toggle_heading(block["id"], heading_text)
                if found:
                    return found
        return None

    section_text = "TODAY" if payload.section.lower() == "today" else "TOMORROW"
    heading_id = find_toggle_heading(NOTION_PAGE_ID, section_text)
    if not heading_id:
        raise HTTPException(status_code=404, detail=f"{section_text} toggle heading not found")

    # Clean the todo content here before sending to Notion
    clean_content = extract_task_text(payload.content).capitalize()

    body = {
        "children": [
            {
                "object": "block",
                "type": "to_do",
                "to_do": {
                    "rich_text": [
                        {"type": "text", "text": {"content": clean_content}}
                    ],
                    "checked": False,
                },
            }
        ]
    }

    append_url = f"https://api.notion.com/v1/blocks/{heading_id}/children"
    response = requests.patch(append_url, headers=NOTION_HEADERS, json=body)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Could not append inside toggle heading {heading_id}")

    return {"success": True, "response": response.json()}


# ===== TensorFlow Intent Model Config =====
MODEL_FILE = Path("app/model/intent_model.keras")
TOKENIZER_FILE = Path("app/model/tokenizer.pickle")
META_FILE = Path("app/model/meta.pickle")

# Load model + tokenizer + meta
model = tf.keras.models.load_model(MODEL_FILE)
with open(TOKENIZER_FILE, "rb") as f:
    tokenizer = pickle.load(f)
with open(META_FILE, "rb") as f:
    meta = pickle.load(f)

maxlen = meta["maxlen"]
label_index = meta["label_index"]
index_label = {v: k for k, v in label_index.items()}

class TextPayload(BaseModel):
    text: str


@app.post("/predict")
def predict_intent(payload: TextPayload):
    def extract_task_text(full_text: str) -> str:
        text = full_text.strip()
        pattern = r"""^
            (create|add|put|remind\sme)      # verbs/phrases
            (\s+a)?                         # optional ' a'
            \s+to[\s-]?do                  # 'to do', 'to-do', 'todo' with optional space or hyphen
            (\s+for\sme)?                  # optional ' for me'
            (\s+(today|tomorrow))?         # optional ' today' or ' tomorrow'
            (\s+to)?                      # optional trailing ' to'
            \s*                           # trailing spaces
        """
        return re.sub(pattern, "", text, flags=re.IGNORECASE | re.VERBOSE).strip()

    def read_todos(section: str):
        def fetch_children(block_id):
            url = f"https://api.notion.com/v1/blocks/{block_id}/children"
            res = requests.get(url, headers=NOTION_HEADERS)
            if res.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Could not fetch children for block {block_id}")
            return res.json().get("results", [])

        def find_toggle_heading(block_id, heading_text):
            children = fetch_children(block_id)
            for block in children:
                block_type = block["type"]
                if block_type in ["heading_1", "heading_2", "heading_3"]:
                    heading_data = block[block_type]
                    text_content = "".join(
                        t["plain_text"] for t in heading_data["rich_text"]
                    ).strip().upper()
                    if text_content == heading_text.upper() and heading_data.get("is_toggleable"):
                        return block["id"]
                if block.get("has_children"):
                    found = find_toggle_heading(block["id"], heading_text)
                    if found:
                        return found
            return None

        section_text = "TODAY" if section.lower() == "today" else "TOMORROW"
        heading_id = find_toggle_heading(NOTION_PAGE_ID, section_text)
        if not heading_id:
            raise HTTPException(status_code=404, detail=f"{section_text} toggle heading not found")

        todos = []
        for child in fetch_children(heading_id):
            if child["type"] == "to_do":
                rich_text = child["to_do"]["rich_text"]
                if rich_text:
                    todos.append(rich_text[0]["plain_text"])
        return todos
    
    

    # Intent prediction
    seq = tokenizer.texts_to_sequences([payload.text])
    padded = pad_sequences(seq, maxlen=maxlen, padding="post")
    preds = model.predict(padded)
    idx = int(np.argmax(preds))
    confidence = float(preds[0][idx])
    intent = index_label[idx]

    if confidence < 0.85:
        return {
            "intent": "none",
            "target": None,
            "confidence": confidence,
            "task_text": ""
        }

    target = None
    if intent == "create_todo_today":
       target = "TODAY"
       intent = "create_todo"
    elif intent == "create_todo_tomorrow":
       target = "TOMORROW"
       intent = "create_todo"
    else:
        text_lower = payload.text.lower()
        if "today" in text_lower:
            target = "TODAY"
        elif "tomorrow" in text_lower:
            target = "TOMORROW"

    task_text = payload.text
    if intent == "create_todo":
        task_text = extract_task_text(payload.text)

    response = ""
    if intent == "about":
        response = "I am Luna, an AI agent for Kareem. I help manage his Notion tasks."
    elif intent == "greeting":
        response = "Hi! How are you doing today?"
    elif intent == "create_todo" and target:
        response = f"Got it. I've added that to your {target} to-do list."
    elif intent == "read_todos_today":
        todos = read_todos("today")
        response = f"You have {len(todos)} tasks for today: {', '.join(todos)}" if todos else "You have no tasks for today."
    elif intent == "read_todos_tomorrow":
        todos = read_todos("tomorrow")
        response = f"You have {len(todos)} tasks for tomorrow: {', '.join(todos)}" if todos else "You have no tasks for tomorrow."

    return {
        "intent": intent,
        "target": target,
        "confidence": confidence,
        "task_text": task_text,
        "response": response,
    }
