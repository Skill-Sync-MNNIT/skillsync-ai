import json
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings

MODERATION_PROMPT = PromptTemplate.from_template(
    "You are a job posting moderator for a university platform.\n"
    "Review this job posting and check for policy violations.\n"
    "Title: {title}\n"
    "Description: {description}\n\n"
    "Violations to check : spam, fake job, illegal content, discrimnation"
    "misleading salary, adult content.\n\n"
    "Respond ONLY with valid JSON in this exact format:\n"
    "{{\"passed\":true/false,\"violation_type\":\"string or null\", \"confidence\":0.0-1.0}}"
)

class ModerationService:
    def __init__(self):
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=settings.groq_api_key,
            temperature=0.1,
        )
        if getattr(settings, "groq_api_key_2", ""):
            f_llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                api_key=settings.groq_api_key_2,
                temperature=0.1,
            )
            llm = llm.with_fallbacks([f_llm])
        self.chain = MODERATION_PROMPT | llm | StrOutputParser()

    async def moderate(self, title: str, description: str) -> dict:
        raw = await self.chain.ainvoke({
            "title": title,
            "description": description,
        })
        
        clean = raw.strip().removeprefix("```json").removesuffix("```").strip()

        try:
            result = json.loads(clean)
            return {
                "passed": bool(result.get("passed",False)),
                "violation_type": result.get("violation_type"),
                "confidence": float(result.get("confidence",0.0)),
            }
        except (json.JSONDecodeError, KeyError):
            return {"passed": False,"violation_type": "parse error","confidence": 0.0}

