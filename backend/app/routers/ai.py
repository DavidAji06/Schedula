from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.deps import get_current_user
from app.models.user import User
from datetime import datetime
import httpx
import os

router = APIRouter(prefix="/ai", tags=["ai"])

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent"

class ParseRequest(BaseModel):
    text: str

@router.post("/parse-event")
async def parse_event(
    body: ParseRequest,
    current_user: User = Depends(get_current_user)
):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    today = datetime.now().strftime("%Y-%m-%d")
    day_of_week = datetime.now().strftime("%A")

    prompt = f"""You are a scheduling assistant. Today is {day_of_week}, {today}.

Extract event details from the user's input and return ONLY a JSON object with these fields:
- title (string)
- category (one of: "lecture", "assignment", "society", "personal")
- start (ISO 8601 datetime string, e.g. "2025-06-17T18:00:00")
- end (ISO 8601 datetime string)
- location (string, empty string if not mentioned)
- repeat (one of: "none", "daily", "weekly", "monthly")
- repeat_until (date string "YYYY-MM-DD" if repeat is not "none" and a duration is implied, else empty string)

Rules:
- If a specific date is not mentioned, assume the next upcoming occurrence of that day.
- If no end time is mentioned, assume 1 hour duration.
- If no category can be inferred, use "personal".
- Return ONLY the JSON object, no explanation, no markdown.

User input: "{body.text}"
"""

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{GEMINI_URL}?key={api_key}",
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.1}
            },
            timeout=15.0
        )

    if response.status_code != 200:
        print("Gemini error:", response.status_code, response.text)
        raise HTTPException(status_code=502, detail="Gemini API returned an error")

    try:
        raw = response.json()
        text = raw["candidates"][0]["content"]["parts"][0]["text"]
        # Strip markdown fences if Gemini adds them anyway
        text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        import json
        parsed = json.loads(text)
        return parsed
    except Exception:
        raise HTTPException(status_code=422, detail="Could not parse Gemini response")