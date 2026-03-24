import asyncio
from langchain_google_genai import ChatGoogleGenerativeAI
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
        llm = ChatGoogleGenerativeAI(
            model=settings.llm_model,
            google_api_key=settings.gemini_api_key,
            temperature=0.3,
        )
        self.chain=PROMPT | llm | StrOutputParser()

    async def explain(self, query:str,skills: list[str]) -> str:
        try:
            result = await asyncio.wait_for(
                self.chain.ainvoke({
                    "query": query,
                    "skills" : ",".join(skills) if skills else "not specified",
                }),
                timeout=2.0,
            )
            return result.strip()
        except (asyncio.TimeoutError,Exception):
            return ""