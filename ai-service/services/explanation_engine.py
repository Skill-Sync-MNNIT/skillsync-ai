from langchain_google_genai import ChatGoogleGenerativeAI
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
        try:
            llm = ChatGoogleGenerativeAI(
                model=settings.llm_model_primary,
                google_api_key=settings.gemini_api_key,
                temperature=0.3,
            )
        except Exception:
            llm = ChatGroq(
                model="groq/compound-mini",
                api_key=settings.groq_api_key or "mock_key",
                temperature=0.3,
            )
        self.chain = PROMPT | llm | StrOutputParser()

    async def explain(self, query: str, skills: list[str]) -> str:
        try:
            result = await self.chain.ainvoke({
                "query": query,
                "skills": ", ".join(skills) if skills else "not specified",
            })
            if result and result.strip():
                return result.strip()
        except Exception as e:
            print(f"[ExplanationEngine] Error generating explanation: {e}")
        
        # Fallback explanation if LLM generation fails or key is unconfigured
        skills_str = ", ".join(skills[:5]) if skills else "matching academic profile"
        return f"Strong candidate for '{query}' with background in {skills_str}."