from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings

PROMPT = PromptTemplate.from_template(
    "Job query: {query}\n"
    "Students skills: {skills}\n"
    "Write 1-2 sentences explaining why this student is a good match. Be concise."
)

class ExplanationEngine:
    def __init__(self):
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=settings.groq_api_key,
            temperature=0.3,
        )
        if getattr(settings, "groq_api_key_2", ""):
            f_llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                api_key=settings.groq_api_key_2,
                temperature=0.3,
            )
            llm = llm.with_fallbacks([f_llm])
        self.chain=PROMPT | llm | StrOutputParser()

    async def explain(self, query: str, skills: list[str]) -> str:
        try:
            result = await self.chain.ainvoke({
                "query": query,
                "skills": ", ".join(skills) if skills else "not specified",
            })
            return result.strip()
        except Exception as e:
            print(f"[ExplanationEngine] Error: {e}")
            return ""